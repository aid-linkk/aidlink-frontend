import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CreateCampaignPage from '../page'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock wallet service
jest.mock('@/lib/wallet/wallet-service', () => ({
  walletService: {
    signTransaction: jest.fn().mockResolvedValue('mockSignedXdr'),
  },
}))

// Mock wallet store
const mockWallet = {
  isConnected: true,
  publicKey: 'GB5XWAMU7QNOZBU4K7L5KGK46XB5HQDJC7W3COSKZQD5NVD4M7Y4Q2K7',
}
jest.mock('@/store/wallet-store', () => ({
  useWalletStore: () => mockWallet,
}))

// Mock constants
jest.mock('@/config/constants', () => ({
  CONTRACT_IDS: {
    CAMPAIGN_MANAGER: 'C1234567890ABCDEF',
  },
  SOROBAN_NETWORKS: {
    TESTNET: { rpcUrl: 'https://soroban-testnet.stellar.org' },
    FUTURENET: { rpcUrl: 'https://rpc-futurenet.stellar.org' },
    STANDALONE: { rpcUrl: 'http://localhost:8000/soroban/rpc' },
  },
}))

// Mock Soroban SDK & CampaignManagerClient
const mockSimulateCreateCampaign = jest.fn()
const mockCreateCampaign = jest.fn()

jest.mock('@/lib/soroban/campaign-manager', () => {
  return {
    CampaignManagerClient: jest.fn().mockImplementation(() => ({
      simulateCreateCampaign: mockSimulateCreateCampaign,
      createCampaign: mockCreateCampaign,
    })),
    SorobanTimeoutError: class SorobanTimeoutError extends Error {
      constructor() {
        super('SorobanTimeoutError')
        this.name = 'SorobanTimeoutError'
      }
    },
  }
})

describe('CreateCampaignPage UI & Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('targetAmount with 8 decimal places shows error "Amount must have at most 7 decimal places"', async () => {
    render(<CreateCampaignPage />)

    fireEvent.change(screen.getByLabelText(/Campaign Title/i), {
      target: { value: 'Valid Campaign Title' },
    })
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'Valid Description' },
    })
    fireEvent.change(screen.getByLabelText(/Target Amount/i), {
      target: { value: '1.12345678' }, // 8 decimal places
    })

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 5)
    fireEvent.change(screen.getByLabelText(/End Date/i), {
      target: { value: tomorrow.toISOString().split('T')[0] },
    })
    fireEvent.change(screen.getByLabelText(/Location/i), {
      target: { value: 'Test City' },
    })

    const submitBtn = screen.getByRole('button', { name: /Create Campaign/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Amount must have at most 7 decimal places')).toBeInTheDocument()
    })
  })

  test('endDate set to yesterday shows error "End date must be at least 24 hours in the future"', async () => {
    render(<CreateCampaignPage />)

    fireEvent.change(screen.getByLabelText(/Campaign Title/i), {
      target: { value: 'Valid Campaign Title' },
    })
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'Valid Description' },
    })
    fireEvent.change(screen.getByLabelText(/Target Amount/i), {
      target: { value: '100' },
    })

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    fireEvent.change(screen.getByLabelText(/End Date/i), {
      target: { value: yesterday.toISOString().split('T')[0] },
    })
    fireEvent.change(screen.getByLabelText(/Location/i), {
      target: { value: 'Test City' },
    })

    const submitBtn = screen.getByRole('button', { name: /Create Campaign/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('End date must be at least 24 hours in the future')).toBeInTheDocument()
    })
  })

  test('title >256 bytes UTF-8 shows title byte length error', async () => {
    render(<CreateCampaignPage />)

    const longTitle = 'a'.repeat(257)
    fireEvent.change(screen.getByLabelText(/Campaign Title/i), {
      target: { value: longTitle },
    })
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'Valid Description' },
    })
    fireEvent.change(screen.getByLabelText(/Target Amount/i), {
      target: { value: '100' },
    })

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 5)
    fireEvent.change(screen.getByLabelText(/End Date/i), {
      target: { value: tomorrow.toISOString().split('T')[0] },
    })
    fireEvent.change(screen.getByLabelText(/Location/i), {
      target: { value: 'Test City' },
    })

    const submitBtn = screen.getByRole('button', { name: /Create Campaign/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Title must be at most 256 bytes')).toBeInTheDocument()
    })
  })

  test('clicking Create Campaign without confirming fee dialog does not submit transaction', async () => {
    mockSimulateCreateCampaign.mockResolvedValueOnce({
      estimatedFeeLumens: 0.005,
    })

    render(<CreateCampaignPage />)

    fireEvent.change(screen.getByLabelText(/Campaign Title/i), {
      target: { value: 'Valid Campaign' },
    })
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'Valid Description' },
    })
    fireEvent.change(screen.getByLabelText(/Target Amount/i), {
      target: { value: '500' },
    })

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 5)
    fireEvent.change(screen.getByLabelText(/End Date/i), {
      target: { value: tomorrow.toISOString().split('T')[0] },
    })
    fireEvent.change(screen.getByLabelText(/Location/i), {
      target: { value: 'Test City' },
    })

    const submitBtn = screen.getByRole('button', { name: /Create Campaign/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Confirm Campaign Creation')).toBeInTheDocument()
    })

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i })
    fireEvent.click(cancelBtn)

    await waitFor(() => {
      expect(screen.queryByText('Confirm Campaign Creation')).not.toBeInTheDocument()
    })

    expect(mockCreateCampaign).not.toHaveBeenCalled()
  })

  test('transaction failure (error code 1) restores form and displays error message', async () => {
    mockSimulateCreateCampaign.mockResolvedValueOnce({
      estimatedFeeLumens: 0.005,
    })

    mockCreateCampaign.mockRejectedValueOnce(
      new Error('Campaign title already exists on-chain')
    )

    render(<CreateCampaignPage />)

    fireEvent.change(screen.getByLabelText(/Campaign Title/i), {
      target: { value: 'Duplicate Campaign' },
    })
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'Valid Description' },
    })
    fireEvent.change(screen.getByLabelText(/Target Amount/i), {
      target: { value: '500' },
    })

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 5)
    fireEvent.change(screen.getByLabelText(/End Date/i), {
      target: { value: tomorrow.toISOString().split('T')[0] },
    })
    fireEvent.change(screen.getByLabelText(/Location/i), {
      target: { value: 'Test City' },
    })

    const submitBtn = screen.getByRole('button', { name: /Create Campaign/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Confirm Campaign Creation')).toBeInTheDocument()
    })

    const approveBtn = screen.getByRole('button', { name: /Approve & Sign/i })
    fireEvent.click(approveBtn)

    await waitFor(() => {
      expect(screen.getByText('Campaign title already exists on-chain')).toBeInTheDocument()
    })

    // Form inputs remain intact and restored
    expect((screen.getByLabelText(/Campaign Title/i) as HTMLInputElement).value).toBe('Duplicate Campaign')
  })
})
