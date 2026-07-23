import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WalletState } from '@/types'
import { getSorobanSDK } from '@/lib/soroban/sdk'

interface WalletStore extends WalletState {
  setWallet: (wallet: Partial<WalletState>) => void
  disconnect: () => void
  switchNetwork: (network: 'mainnet' | 'testnet' | 'futurenet' | 'standalone') => void
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      isConnected: false,
      address: null,
      publicKey: null,
      network: 'testnet',
      balance: '0',
      setWallet: (wallet) => set((state) => ({ ...state, ...wallet })),
      disconnect: () =>
        set({
          isConnected: false,
          address: null,
          publicKey: null,
          balance: '0',
        }),
      switchNetwork: (network) => set({ network }),
    }),
    {
      name: 'wallet-storage',
      // Previously, if a user last used mainnet, the store would rehydrate
      // with network: 'mainnet' while the old sorobanSDK singleton stayed
      // permanently bound to 'testnet' from module import — desyncing the
      // store and the SDK on every reload after a switch. Pre-warming the
      // SDK cache for the persisted network here closes that gap.
      onRehydrateStorage: () => (state) => {
        if (state) {
          getSorobanSDK(state.network)
        }
      },
    }
  )
)
