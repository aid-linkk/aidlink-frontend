import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PersistStorage } from 'zustand/middleware'
import type { WalletState } from '@/types'
import { encryptedStorage } from '@/lib/store/encrypted-storage'

const SESSION_TTL_MS = 28_800_000

interface WalletStore extends WalletState {
  connectedAt: number | null
  sessionTtlMs: number
  setWallet: (wallet: Partial<WalletState>) => void
  disconnect: () => void
  switchNetwork: (network: 'mainnet' | 'testnet' | 'futurenet' | 'standalone') => void
}

type WalletPersistedState = Pick<
  WalletStore,
  'isConnected' | 'address' | 'network' | 'connectedAt'
>

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      isConnected: false,
      address: null,
      publicKey: null,
      network: 'testnet',
      balance: '0',
      connectedAt: null,
      sessionTtlMs: SESSION_TTL_MS,
      setWallet: (wallet) =>
        set((state) => ({
          ...state,
          ...wallet,
          ...(wallet.isConnected ? { connectedAt: Date.now() } : {}),
        })),
      disconnect: () =>
        set({
          isConnected: false,
          address: null,
          publicKey: null,
          balance: '0',
          connectedAt: null,
        }),
      switchNetwork: (network) => set({ network }),
    }),
    {
      name: 'wallet-storage',
      storage: encryptedStorage as PersistStorage<WalletPersistedState>,
      partialize: (state): WalletPersistedState => ({
        isConnected: state.isConnected,
        address: state.address,
        network: state.network,
        connectedAt: state.connectedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return

        if (state.isConnected && state.connectedAt != null) {
          if (Date.now() - state.connectedAt > SESSION_TTL_MS) {
            useWalletStore.getState().disconnect()
            return
          }
        }

        if (state.isConnected && state.address && !state.publicKey) {
          useWalletStore.setState({ publicKey: state.address })
        }
      },
    }
  )
)
