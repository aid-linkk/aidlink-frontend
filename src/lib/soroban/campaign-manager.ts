import { xdr, Address, TransactionBuilder } from '@stellar/stellar-sdk'
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
    signer: (xdrString: string) => Promise<string>
  ): Promise<CreateCampaignResult> {
    const args = this.encodeParams(params)
    const simulation = await this.sdk.simulateOnly(this.contractId, 'create_campaign', args, sourcePublicKey)

    const transaction = simulation.transaction
    if (!transaction) {
      throw new Error('Failed to assemble transaction for campaign creation')
    }

    const unsignedXdr = transaction.toXdr().toString('base64')
    const signedXdr = await signer(unsignedXdr)
    
    const signedTx = TransactionBuilder.fromXDR(signedXdr, this.sdk.getNetworkPassphrase()) as any
    const txHash = await this.sdk.submitTransaction(signedTx)

    // Poll for status
    let attempts = 0
    const maxAttempts = 15
    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 1000))
      attempts++
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
    switch (scVal.arm()) {
      case 'u64':
        return scVal.u64().toString()
      case 'u128':
        return scVal.u128().lo().toString()
      case 'bytes':
        return scVal.bytes().toString('utf-8')
      case 'str':
        return scVal.str().toString()
      case 'sym':
        return scVal.sym().toString()
      case 'i128':
        return scVal.i128().lo().toString()
      case 'u32':
        return scVal.u32().toString()
      case 'i32':
        return scVal.i32().toString()
      case 'i64':
        return scVal.i64().toString()
      default:
        return String(scVal.value())
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
