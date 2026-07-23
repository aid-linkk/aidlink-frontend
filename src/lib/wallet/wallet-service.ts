import freighterApi from '@stellar/freighter-api'
import { 
  WalletAdapter, 
  FreighterAdapter, 
  WalletKitAdapter, 
  StellarNetwork,
  WalletInfo 
} from './adapters'
import { NoActiveWalletError } from './errors'

export type { WalletInfo, StellarNetwork }

export type WalletId = 'freighter' | 'rabet' | 'xbull'

export class WalletService {
  private _activeAdapter: WalletAdapter | null = null
  private _adapterCache: Map<string, WalletAdapter> = new Map()
  private _networkChangeUnsubscribe: (() => void) | null = null

  /**
   * Connect to a wallet and set it as the active adapter
   * @param walletId - The wallet to connect to ('freighter' | 'rabet' | 'xbull')
   * @param network - The Stellar network to use
   * @returns WalletInfo containing publicKey, address, and network
   */
  async connect(walletId: WalletId, network: StellarNetwork): Promise<WalletInfo> {
    // Create adapter key for caching
    const adapterKey = `${walletId}-${network}`

    // Get or create adapter
    let adapter: WalletAdapter
    if (this._adapterCache.has(adapterKey)) {
      adapter = this._adapterCache.get(adapterKey)!
    } else {
      adapter = this._createAdapter(walletId, network)
      this._adapterCache.set(adapterKey, adapter)
    }

    // Connect the adapter
    const walletInfo = await adapter.connect()

    // Set as active adapter (replaces any previous adapter)
    this._activeAdapter = adapter

    // Subscribe to Freighter network changes if connecting to Freighter
    if (walletId === 'freighter') {
      await this._subscribeToFreighterNetworkChange()
    }

    return walletInfo
  }

  /**
   * Sign a transaction with the active wallet adapter
   * @param xdr - The transaction XDR to sign
   * @returns Signed transaction XDR
   * @throws NoActiveWalletError if no wallet is connected
   */
  async sign(xdr: string): Promise<string> {
    if (!this._activeAdapter) {
      throw new NoActiveWalletError('No wallet is connected. Call connect() first.')
    }

    const currentNetwork = this.getCurrentNetwork()
    return await this._activeAdapter.sign(xdr, currentNetwork)
  }

  /**
   * Disconnect the active wallet
   */
  async disconnect(): Promise<void> {
    if (this._activeAdapter) {
      await this._activeAdapter.disconnect()
      this._activeAdapter = null
    }

    // Unsubscribe from network changes
    if (this._networkChangeUnsubscribe) {
      this._networkChangeUnsubscribe()
      this._networkChangeUnsubscribe = null
    }
  }

  /**
   * Get the current network from WalletStore (single source of truth)
   * @returns The current network
   */
  getCurrentNetwork(): StellarNetwork {
    // Import dynamically to avoid circular dependency
    if (typeof window !== 'undefined') {
      try {
        const { useWalletStore } = require('@/store/wallet-store')
        const state = useWalletStore.getState()
        return state.network as StellarNetwork
      } catch (error) {
        console.warn('Failed to get network from WalletStore', error)
        // Propagate the error — callers should not proceed without a known network
        throw new Error('Unable to determine current network from WalletStore')
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
