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

    const currentNetwork = this.getCurrentNetwork()
    return await this._activeAdapter.sign(xdr, currentNetwork)
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
    }
    // Server-side: WalletStore is not available. Throw so callers handle the case.
    throw new Error('WalletStore is not available in this environment')
  }

  /**
   * Get the active wallet ID
   * @returns The wallet ID or null if no wallet is connected
   */
  getActiveWalletId(): WalletId | null {
    if (!this._activeAdapter) {
      return null
    }
    return this._activeAdapter.walletId as WalletId
  }

  /**
   * Check if a wallet is currently connected
   */
  isConnected(): boolean {
    return this._activeAdapter !== null
  }

  /**
   * Create an adapter instance for the given wallet ID and network
   */
  private _createAdapter(walletId: WalletId, network: StellarNetwork): WalletAdapter {
    if (walletId === 'freighter') {
      return new FreighterAdapter()
    } else if (walletId === 'rabet' || walletId === 'xbull') {
      return new WalletKitAdapter(walletId, network)
    } else {
      throw new Error(`Unsupported wallet: ${walletId}`)
    }
  }

  /**
   * Subscribe to Freighter's network change events (if available)
   * and sync with WalletStore
   */
  private async _subscribeToFreighterNetworkChange(): Promise<void> {
    try {
      // Check if Freighter supports network change events
      // The functional API may support event listeners via WatchWalletChanges
      // This is a best-effort approach and may not be available in all versions
      if (typeof (freighterApi as any).on === 'function') {
        const handler = (network: string) => {
          // Sync network change to WalletStore
          if (typeof window !== 'undefined') {
            try {
              const { useWalletStore } = require('@/store/wallet-store')
              useWalletStore.getState().switchNetwork(network as StellarNetwork)
            } catch (error) {
              console.error('Failed to sync network change to WalletStore', error)
            }
          }
        }

        (freighterApi as any).on('networkChanged', handler)

        // Store unsubscribe function
        this._networkChangeUnsubscribe = () => {
          if (typeof (freighterApi as any).off === 'function') {
            (freighterApi as any).off('networkChanged', handler)
          }
        }
      }
    } catch (error) {
      // Network change subscription is optional; don't fail if unsupported
      console.warn('Freighter network change subscription not available', error)
    }
  }
}

export const walletService = new WalletService()
