function env(key: string, fallback: string): string {
  try {
    return (
      (typeof process !== 'undefined' &&
        (process.env as Record<string, string | undefined>)?.[key]) ||
      fallback
    )
  } catch {
    return fallback
  }
}

export const NETWORKS = {
  MAINNET: env('NEXT_PUBLIC_HORIZON_MAINNET', 'https://horizon.stellar.org'),
  TESTNET: env('NEXT_PUBLIC_HORIZON_TESTNET', 'https://horizon-testnet.stellar.org'),
  FUTURENET: env('NEXT_PUBLIC_HORIZON_FUTURENET', 'https://horizon-futurenet.stellar.org'),
  STANDALONE: env('NEXT_PUBLIC_HORIZON_STANDALONE', 'http://localhost:8000'),
} as const

export const SOROBAN_NETWORKS = {
  MAINNET: {
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
    rpcUrl: env('NEXT_PUBLIC_SOROBAN_RPC_MAINNET', 'https://rpc.mainnet.stellar.org'),
  },
  TESTNET: {
    networkPassphrase: 'Test SDF Network ; September 2021',
    rpcUrl: env('NEXT_PUBLIC_SOROBAN_RPC_TESTNET', 'https://soroban-testnet.stellar.org'),
  },
  FUTURENET: {
    networkPassphrase: 'Test SDF Future Network ; October 2022',
    rpcUrl: env('NEXT_PUBLIC_SOROBAN_RPC_FUTURENET', 'https://rpc-futurenet.stellar.org'),
  },
  STANDALONE: {
    networkPassphrase: 'Standalone Network ; February 2017',
    rpcUrl: env('NEXT_PUBLIC_SOROBAN_RPC_STANDALONE', 'http://localhost:8000/soroban/rpc'),
  },
} as const

export const CONTRACT_IDS = {
  AID_TOKEN: env('NEXT_PUBLIC_AID_TOKEN_CONTRACT', ''),
  CAMPAIGN_MANAGER: env('NEXT_PUBLIC_CAMPAIGN_MANAGER_CONTRACT', ''),
  BENEFICIARY_REGISTRY: env('NEXT_PUBLIC_BENEFICIARY_REGISTRY_CONTRACT', ''),
} as const

export const APP_CONFIG = {
  NAME: 'AidLink',
  DESCRIPTION: 'Decentralized Humanitarian Aid Platform',
  VERSION: '1.0.0',
  SUPPORTED_NETWORKS: env('NEXT_PUBLIC_SUPPORTED_NETWORKS', 'testnet,futurenet').split(','),
  DEFAULT_NETWORK: env('NEXT_PUBLIC_DEFAULT_NETWORK', 'testnet'),
} as const

export const CATEGORIES = {
  EMERGENCY: 'emergency',
  HEALTHCARE: 'healthcare',
  EDUCATION: 'education',
  FOOD: 'food',
  SHELTER: 'shelter',
  OTHER: 'other',
} as const

export const STATUS_COLORS = {
  active: 'text-green-600 bg-green-50',
  completed: 'text-blue-600 bg-blue-50',
  paused: 'text-yellow-600 bg-yellow-50',
  pending: 'text-gray-600 bg-gray-50',
  suspended: 'text-red-600 bg-red-50',
  verified: 'text-green-600 bg-green-50',
  rejected: 'text-red-600 bg-red-50',
} as const
