import * as freighterApi from '@stellar/freighter-api'
import { WalletKit } from '@stellar/wallet-sdk'
import { getSorobanSDK, type NetworkName } from '../soroban/sdk'
import { useWalletStore } from '@/store/wallet-store'

export interface WalletInfo {
  publicKey: string
  address: string
  network: string
}

/**
 * Freighter's own short network names, as returned by getNetwork()/
 * getNetworkDetails() in @stellar/freighter-api. Freighter has no concept
 * of 'standalone' — that carve-out is handled separately wherever this map
 * is consulted (see NetworkGuard and useWalletEnhanced.switchNetwork).
 */
export type FreighterNetwork = 'TESTNET' | 'PUBLIC' | 'FUTURENET' | 'STANDALONE'

export const FREIGHTER_NETWORK_MAP: Record<NetworkName, FreighterNetwork> = {
  testnet: 'TESTNET',
  mainnet: 'PUBLIC',
  futurenet: 'FUTURENET',
  standalone: 'STANDALONE',
}

const FREIGHTER_TO_APP_NETWORK: Record<string, NetworkName> = {
  TESTNET: 'testnet',
  PUBLIC: 'mainnet',
  FUTURENET: 'futurenet',
}

export class WalletService {
  private walletKit: WalletKit

  constructor() {
    this.walletKit = new WalletKit({
      network: 'testnet',
    })
  }

  async isFreighterConnected(): Promise<boolean> {
    try {
      const { isConnected, error } = await freighterApi.isConnected()
      if (error) return false
      return isConnected
    } catch (error) {
      console.error('Error checking Freighter connection:', error)
      return false
    }
  }

  async connectFreighter(): Promise<WalletInfo> {
    try {
      const { address, error } = await freighterApi.getAddress()
      if (error || !address) {
        throw new Error(error ? String(error) : 'No address returned by Freighter')
      }

      const freighterNetwork = await this.getNetwork()
      const network = FREIGHTER_TO_APP_NETWORK[freighterNetwork] ?? 'testnet'

      return {
        publicKey: address,
        address,
        network,
      }
    } catch (error) {
      console.error('Error connecting Freighter:', error)
      throw new Error('Failed to connect Freighter wallet')
    }
  }

  async connectWalletKit(): Promise<WalletInfo> {
    try {
      const { publicKey } = await this.walletKit.getAddress()
      const address = publicKey

      return {
        publicKey,
        address,
        network: 'testnet',
      }
    } catch (error) {
      console.error('Error connecting WalletKit:', error)
      throw new Error('Failed to connect wallet')
    }
  }

  /**
   * Signs a transaction against the currently active network.
   *
   * Previously this hardcoded 'testnet' as the (nonexistent, positional)
   * second argument to Freighter's signTransaction. That was already wrong
   * against the real @stellar/freighter-api@6.0.1 surface, which takes an
   * options object keyed by `networkPassphrase` — Freighter validates the
   * transaction's embedded network passphrase against this value, not a
   * short network code. We resolve the passphrase from the active network
   * (read from the wallet store at call time, or an explicit override) via
   * the SorobanSDK factory, so it is never stale.
   */
  async signTransaction(xdr: string, network?: NetworkName): Promise<string> {
    try {
      const activeNetwork = network ?? useWalletStore.getState().network
      const networkPassphrase = getSorobanSDK(activeNetwork).networkPassphrase

      const { signedTxXdr, error } = await freighterApi.signTransaction(xdr, {
        networkPassphrase,
      })
      if (error) {
        throw new Error(String(error))
      }
      return signedTxXdr
    } catch (error) {
      console.error('Error signing transaction:', error)
      throw new Error('Failed to sign transaction')
    }
  }

  /**
   * Returns Freighter's current short network name (e.g. 'TESTNET',
   * 'PUBLIC', 'FUTURENET'). Freighter has no 'STANDALONE' concept; callers
   * comparing against a store network of 'standalone' should skip this
   * check entirely rather than expect a match here.
   */
  async getNetwork(): Promise<FreighterNetwork> {
    try {
      const { network, error } = await freighterApi.getNetwork()
      if (error || !network) {
        return 'TESTNET'
      }
      return network as FreighterNetwork
    } catch (error) {
      console.error('Error getting network:', error)
      return 'TESTNET'
    }
  }

  async disconnect(): Promise<void> {
    // Freighter doesn't have a disconnect method, but we can clear local state
    // WalletKit may have disconnect functionality
    try {
      // Clear any session data if needed
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }
}

export const walletService = new WalletService()
