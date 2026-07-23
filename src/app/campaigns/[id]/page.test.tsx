jest.mock('@/components/layout/navigation', () => ({
  Navigation: () => null,
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: () => ({ id: 'campaign-1' }),
}))

// Mock the wallet store so the page can render without a real wallet
jest.mock('@/store/wallet-store', () => ({
  useWalletStore: () => ({
    isConnected: false,
    address: null,
    publicKey: null,
    network: 'testnet',
    balance: '0',
  }),
}))

// Mock useDonation so the page renders without a Stellar RPC
jest.mock('@/hooks/use-donation', () => ({
  useDonation: () => ({
    state: {
      status: 'idle',
      estimatedFee: null,
      txHash: null,
      error: null,
      isDuplicate: false,
    },
    donate: jest.fn(),
    reset: jest.fn(),
    feeConfirmed: jest.fn(),
    feeDismissed: jest.fn(),
  }),
  WalletNotConnectedError: class WalletNotConnectedError extends Error {
    constructor() {
      super('Wallet is not connected')
    }
  },
}))

import { act, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CampaignDetailPage from './page'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe('CampaignDetailPage', () => {
  it('shows loading placeholders and then campaign content', () => {
    jest.useFakeTimers()

    const { container } = renderWithProviders(<CampaignDetailPage />)

    expect(container.querySelector('.animate-pulse')).toBeTruthy()
    expect(screen.queryByText('Emergency Relief for Flood Victims')).toBeNull()

    act(() => {
      jest.advanceTimersByTime(600)
    })

    expect(screen.queryByText('Emergency Relief for Flood Victims')).not.toBeNull()
    expect(container.querySelector('.animate-pulse')).toBeNull()

    jest.useRealTimers()
  })
})
