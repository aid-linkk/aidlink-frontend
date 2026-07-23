import { xdr, TransactionBuilder } from '@stellar/stellar-sdk'
import { SorobanSDK } from './sdk'

export interface CreateCampaignParams {
  title: string           // max 256 bytes UTF-8
  description: string     // max 4096 bytes UTF-8
  targetAmountXlm: number // will be converted to stroops (×10^7)
  endDateUnix: number     // Unix timestamp seconds
  category: string        // max 64 bytes
}

export interface CreateCampaignResult {
  campaignId: string  // decoded from return value XDR
  txHash: string
}

export class SorobanTimeoutError extends Error {
  constructor(message = 'Transaction timed out while confirming') {
    super(message)
    this.name = 'SorobanTimeoutError'
  }
}

export class CampaignManagerClient {
  constructor(private sdk: SorobanSDK, private contractId: string) {}

  private encodeParams(params: CreateCampaignParams): xdr.ScVal[] {
    // XLM amount encoding uses BigInt stroops to avoid IEEE 754 floating-point drift
    // (e.g. multiplying floats directly like 1.1234567 * 10_000_000 can result in non-integer precision drift).
    // Math.round ensures an exact integer stroop representation before BigInt conversion.
    const stroopsBigInt = BigInt(Math.round(params.targetAmountXlm * 10_000_000))
    const u128Parts = new xdr.Int128Parts({
      hi: xdr.Uint64.fromString('0'),
      lo: xdr.Uint64.fromString(stroopsBigInt.toString()),
    })

    return [
      xdr.ScVal.scvBytes(Buffer.from(params.title, 'utf-8')),
      xdr.ScVal.scvBytes(Buffer.from(params.description, 'utf-8')),
      xdr.ScVal.scvU128(u128Parts),
      xdr.ScVal.scvU64(xdr.Uint64.fromString(params.endDateUnix.toString())),
      xdr.ScVal.scvBytes(Buffer.from(params.category, 'utf-8')),
    ]
  }

  async simulateCreateCampaign(
    params: CreateCampaignParams,
    sourcePublicKey: string
  ): Promise<{ estimatedFeeLumens: number; footprint?: xdr.LedgerFootprint }> {
    const args = this.encodeParams(params)
    const result = await this.sdk.simulateOnly(this.contractId, 'create_campaign', args, sourcePublicKey)
    return {
      estimatedFeeLumens: result.estimatedFeeLumens,
      footprint: result.footprint,
    }
  }

  async createCampaign(
    params: CreateCampaignParams,
    sourcePublicKey: string,
    signer: (xdrString: string) => Promise<string>,
    onProgress?: (attempt: number) => void
  ): Promise<CreateCampaignResult> {
    const args = this.encodeParams(params)
    const simulation = await this.sdk.simulateOnly(this.contractId, 'create_campaign', args, sourcePublicKey)

    const transaction = simulation.transaction
    if (!transaction) {
      throw new Error('Failed to assemble transaction for campaign creation')
    }

    const unsignedXdr = typeof transaction.toXDR === 'function'
      ? transaction.toXDR()
      : (transaction as any).toXdr().toString('base64')
    const signedXdr = await signer(unsignedXdr)
    
    const signedTx = TransactionBuilder.fromXDR(signedXdr, this.sdk.getNetworkPassphrase()) as any
    const txHash = await this.sdk.submitTransaction(signedTx)

    // Poll for status
    let attempts = 0
    const maxAttempts = 15
    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 1000))
      attempts++
      if (onProgress) {
        onProgress(attempts)
      }
      try {
        const txStatus = await this.sdk.getTransactionStatus(txHash)
        if (txStatus.status === 'SUCCESS') {
          let campaignId = txHash
          
          if (txStatus.resultMetaXdr) {
            try {
              const meta = txStatus.resultMetaXdr
              const sorobanMeta = meta.v3().sorobanMeta()
              if (sorobanMeta) {
                const returnVal = sorobanMeta.returnValue()
                campaignId = this.decodeScVal(returnVal)
              }
            } catch (e) {
              console.warn('Could not decode ScVal from sorobanMeta return value:', e)
            }
          }
          return { campaignId, txHash }
        }

        if (txStatus.status === 'FAILED') {
          const errorCode = this.extractErrorCode(txStatus)
          const errorMsg = this.mapErrorCodeToMessage(errorCode)
          throw new Error(errorMsg)
        }
      } catch (err: any) {
        if (err.name === 'SorobanTimeoutError' || err.message?.includes('already exists') || err.message?.includes('failed') || err.message?.includes('Failed')) {
          throw err
        }
      }
    }

    throw new SorobanTimeoutError()
  }

  public decodeScVal(scVal: xdr.ScVal): string {
    const typeName = typeof (scVal as any).arm === 'function' ? (scVal as any).arm() : scVal.switch().name
    switch (typeName) {
      case 'u64':
      case 'scvU64':
        return scVal.u64().toString()
      case 'u128':
      case 'scvU128':
        return scVal.u128().lo().toString()
      case 'bytes':
      case 'scvBytes':
        return scVal.bytes().toString('utf-8')
      case 'str':
      case 'scvString':
        return scVal.str().toString()
      case 'sym':
      case 'scvSymbol':
        return scVal.sym().toString()
      case 'i128':
      case 'scvI128':
        return scVal.i128().lo().toString()
      case 'u32':
      case 'scvU32':
        return scVal.u32().toString()
      case 'i32':
      case 'scvI32':
        return scVal.i32().toString()
      case 'i64':
      case 'scvI64':
        return scVal.i64().toString()
      default:
        return String(typeof scVal.value === 'function' ? scVal.value() : scVal)
    }
  }

  private extractErrorCode(txStatus: any): number {
    try {
      if (txStatus.resultXdr) {
        const result = txStatus.resultXdr.result()
        const firstResult = result.results()[0]
        if (firstResult) {
          const tr = firstResult.tr()
          const hostResult = tr.invokeHostFunctionResult()
          if (hostResult && hostResult.code() !== 0) {
            return hostResult.code()
          }
        }
      }
    } catch {
      // Fallback
    }
    return 1
  }

  private mapErrorCodeToMessage(code: number): string {
    const errorMap: Record<number, string> = {
      1: 'Campaign title already exists on-chain',
      2: 'Invalid campaign target amount',
      3: 'End date must be in the future',
      4: 'Unauthorized campaign creator',
      5: 'Insufficient funds for campaign setup',
    }
    return errorMap[code] || `Contract execution failed with code ${code}`
  }
}
