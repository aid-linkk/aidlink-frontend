import { SorobanRpc, xdr, TransactionBuilder, Networks, BASE_FEE, Keypair } from '@stellar/stellar-sdk'
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
      const balance = account.balances.find((b) => b.asset_type === 'native')
      return balance ? balance.balance : '0'
    } catch (error) {
      console.error('Error fetching balance:', error)
      throw error
    }
  }

  async invokeContract(
    contractId: string,
    method: string,
    args: xdr.ScVal[] = []
  ): Promise<xdr.ScVal> {
    try {
      const result = await this.rpc.simulateTransaction(
        new TransactionBuilder(accountId, this.networkPassphrase)
          .addOperation(
            xdr.Operation.invokeContract({
              contractAddress: contractId,
              functionName: method,
              args: args,
            })
          )
          .build()
      )

      if (result.results && result.results[0]) {
        return result.results[0].xdr
      }
      throw new Error('No result from contract invocation')
    } catch (error) {
      console.error('Error invoking contract:', error)
      throw error
    }
  }

  async submitTransaction(transaction: xdr.Transaction): Promise<string> {
    try {
      const result = await this.rpc.sendTransaction(transaction)
      if (result.errorResultXdr) {
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
