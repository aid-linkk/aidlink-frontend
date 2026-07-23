import { useMutation, useQuery } from '@tanstack/react-query'
import { useWalletStore } from '@/store/wallet-store'
import { toast } from 'sonner'

export function useConnectWallet() {
  const setWallet = useWalletStore((state) => state.setWallet)

  return useMutation({
    mutationFn: async () => {
      // Simulate wallet connection
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      // In production, integrate with Stellar Wallet Kit
      const mockAddress = 'GB5XWAMU7QNOZBU4K7L5KGK46XB5HQDJC7W3COSKZQD5NVD4M7Y4Q2K7'
      
      return {
        address: mockAddress,
        publicKey: mockAddress,
        network: 'testnet',
        balance: '1000',
      }
    },
    onSuccess: (wallet) => {
      setWallet({
        isConnected: true,
        ...wallet,
      })
      toast.success('Wallet connected successfully')
    },
    onError: (error) => {
      toast.error('Failed to connect wallet', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  })
}

export function useDisconnectWallet() {
  const disconnect = useWalletStore((state) => state.disconnect)

  return useMutation({
    mutationFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return true
    },
    onSuccess: () => {
      disconnect()
      toast.success('Wallet disconnected')
    },
  })
}

/**
 * @deprecated This mutation only updates `walletStore.network` after a fake
 * delay — it does not verify Freighter's actual network, does not recreate
 * the SorobanSDK for the new network, and does not invalidate React Query
 * caches. Switching networks this way leaves the SDK/signing layer frozen
 * on the previous network (issue #105). Use `useWalletEnhanced().switchNetwork`
 * instead, which performs the full atomic switch.
 */
export function useSwitchNetwork() {
  const switchNetwork = useWalletStore((state) => state.switchNetwork)

  return useMutation({
    mutationFn: async (network: 'mainnet' | 'testnet' | 'futurenet' | 'standalone') => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return network
    },
    onSuccess: (network) => {
      switchNetwork(network)
      toast.success(`Switched to ${network}`)
    },
  })
}
