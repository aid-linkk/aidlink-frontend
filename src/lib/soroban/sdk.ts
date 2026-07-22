import { SorobanRpc, xdr, TransactionBuilder, Networks, Address, Transaction } from '@stellar/stellar-sdk'
import { SOROBAN_NETWORKS } from '@/config/constants'

export interface NetworkConfig {
  networkPassphrase: string
  rpcUrl: string
}

export const NETWORKS: Record<string, NetworkConfig> = {
  testnet: {
    networkPassphrase: Networks.TESTNET,
    rpcUrl: SOROBAN_NETWORKS.TESTNET.rpcUrl,
  },
  futurenet: {
    networkPassphrase: Networks.FUTURENET,
    rpcUrl: SOROBAN_NETWORKS.FUTURENET.rpcUrl,
  },
  standalone: {
    networkPassphrase: Networks.STANDALONE,
    rpcUrl: SOROBAN_NETWORKS.STANDALONE.rpcUrl,
  },
}

export interface SimulateOnlyResult {
  estimatedFeeLumens: number
  footprint?: xdr.LedgerFootprint
  transaction?: Transaction
  rawResponse: SorobanRpc.Api.SimulateTransactionResponse
}

export class SorobanSDK {
  private rpc: SorobanRpc.Server
  private networkPassphrase: string

  constructor(network: keyof typeof NETWORKS = 'testnet') {
    const config = NETWORKS[network]
    this.rpc = new SorobanRpc.Server(config.rpcUrl, {
      allowHttp: network === 'standalone',
    })
    this.networkPassphrase = config.networkPassphrase
  }

  async getAccount(accountId: string) {
    try {
      const account = await this.rpc.getAccount(accountId)
      return account
    } catch (error) {
      console.error('Error fetching account:', error)
      throw error
    }
  }

  async getBalance(accountId: string): Promise<string> {
    try {
      const account = await this.getAccount(accountId)
      const nativeBalance = account.balances.find((b: { asset_type: string; balance: string }) => b.asset_type === 'native')
      return nativeBalance ? nativeBalance.balance : '0'
    } catch (error) {
      console.error('Error fetching balance:', error)
      throw error
    }
  }

  async simulateOnly(
    contractId: string,
    method: string,
    args: xdr.ScVal[] = [],
    sourcePublicKey: string
  ): Promise<SimulateOnlyResult> {
    try {
      const account = await this.getAccount(sourcePublicKey)
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          xdr.Operation.invokeContract({
            contractAddress: Address.fromString(contractId).toScAddress(),
            functionName: method,
            args: args,
          })
        )
        .setTimeout(30)
        .build()

      const result = await this.rpc.simulateTransaction(tx)
      
      if (SorobanRpc.Api.isSimulationError(result)) {
        throw new Error(`Simulation failed: ${result.error}`)
      }

      let estimatedFeeLumens = 0.00001
      if (result.minResourceFee) {
        estimatedFeeLumens = parseFloat(result.minResourceFee) / 10_000_000
      }

      let footprint: xdr.LedgerFootprint | undefined
      let assembledTx: Transaction | undefined

      if (SorobanRpc.Api.isSimulationSuccess(result)) {
        assembledTx = SorobanRpc.assembleTransaction(tx, result).build()
        const sorobanTxData = assembledTx.txData()
        if (sorobanTxData) {
          footprint = sorobanTxData.resources().footprint()
        }
      }

      return {
        estimatedFeeLumens,
        footprint,
        transaction: assembledTx || tx,
        rawResponse: result,
      }
    } catch (error) {
      console.error('Error simulating contract:', error)
      throw error
    }
  }

  async invokeContract(
    contractId: string,
    method: string,
    args: xdr.ScVal[] = [],
    sourcePublicKey?: string
  ): Promise<xdr.ScVal> {
    try {
      const dummySource = sourcePublicKey || 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'
      const simulation = await this.simulateOnly(contractId, method, args, dummySource)
      
      if (SorobanRpc.Api.isSimulationSuccess(simulation.rawResponse) && simulation.rawResponse.result) {
        return simulation.rawResponse.result.retval
      }
      throw new Error('No result from contract invocation')
    } catch (error) {
      console.error('Error invoking contract:', error)
      throw error
    }
  }

  async submitTransaction(transaction: Transaction): Promise<string> {
    try {
      const result = await this.rpc.sendTransaction(transaction)
      if (result.status === 'ERROR' || result.errorResult) {
        throw new Error('Transaction failed')
      }
      return result.hash
    } catch (error) {
      console.error('Error submitting transaction:', error)
      throw error
    }
  }

  async getTransactionStatus(txHash: string) {
    try {
      const result = await this.rpc.getTransaction(txHash)
      return result
    } catch (error) {
      console.error('Error fetching transaction status:', error)
      throw error
    }
  }

  getNetworkPassphrase(): string {
    return this.networkPassphrase
  }
}

export const sorobanSDK = new SorobanSDK('testnet')
