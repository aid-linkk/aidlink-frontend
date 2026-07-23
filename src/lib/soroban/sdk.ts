import { SorobanRpc, xdr, TransactionBuilder, Networks, BASE_FEE, Keypair } from '@stellar/stellar-sdk'
import { SOROBAN_NETWORKS } from '@/config/constants'

export interface NetworkConfig {
  networkPassphrase: string
  rpcUrl: string
}

export type NetworkName = 'mainnet' | 'testnet' | 'futurenet' | 'standalone'

// NOTE: 'mainnet' was previously missing from this map entirely — any call
// to `new SorobanSDK('mainnet')` would throw when reading `NETWORKS.mainnet`.
export const NETWORKS: Record<NetworkName, NetworkConfig> = {
  mainnet: {
    networkPassphrase: Networks.PUBLIC,
    rpcUrl: SOROBAN_NETWORKS.MAINNET.rpcUrl,
  },
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
  /**
   * Public and readonly so callers (and tests) can read the passphrase a
   * given SDK instance is bound to without an extra getter call, e.g.
   * `getSorobanSDK('mainnet').networkPassphrase`.
   */
  readonly network: NetworkName
  readonly networkPassphrase: string

  constructor(network: NetworkName = 'testnet') {
    const config = NETWORKS[network]
    this.rpc = new SorobanRpc.Server(config.rpcUrl, {
      allowHttp: network === 'standalone',
    })
    this.network = network
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

// ---------------------------------------------------------------------------
// Factory / cache (see issue #105: network-switching architecture fix)
// ---------------------------------------------------------------------------
//
// Previously `sorobanSDK` was a single module-level instance created once at
// import time, permanently bound to whatever network it was constructed
// with. Switching networks in the UI never recreated it, so every RPC call
// silently kept hitting the original network regardless of the wallet
// store's current `network` value.
//
// getSorobanSDK()/invalidateSorobanSDK() replace that: callers ask for the
// SDK for a specific network, and get a cached instance per network,
// recreated on demand after invalidation (e.g. on network switch).

const sdkCache = new Map<NetworkName, SorobanSDK>()

/**
 * Returns a cached SorobanSDK instance for the given network, creating one
 * if it doesn't already exist. Synchronous by design — the SorobanSDK
 * constructor itself is synchronous, so this must not become async.
 */
export function getSorobanSDK(network: NetworkName = 'testnet'): SorobanSDK {
  if (!sdkCache.has(network)) {
    sdkCache.set(network, new SorobanSDK(network))
  }
  return sdkCache.get(network)!
}

/**
 * Drops the cached SDK instance for a network so the next call to
 * getSorobanSDK() for that network constructs a fresh instance.
 */
export function invalidateSorobanSDK(network: NetworkName): void {
  sdkCache.delete(network)
}

/** Test-only helper to reset cache state between test cases. */
export function __clearSorobanSDKCache(): void {
  sdkCache.clear()
}

/**
 * @deprecated Use `getSorobanSDK(network)` with the current network read
 * from the wallet store instead of this module-level singleton. This export
 * is kept only for backward compatibility with code that has not yet
 * migrated off the old singleton pattern. It always points at 'testnet' and
 * will NOT reflect the user's actual selected network — do not use it for
 * any network-sensitive operation (signing, balances, contract calls).
 */
export const sorobanSDK = getSorobanSDK('testnet')
