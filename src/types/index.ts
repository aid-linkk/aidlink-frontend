export interface WalletState {
  isConnected: boolean
  address: string | null
  publicKey: string | null
  network: 'mainnet' | 'testnet' | 'futurenet' | 'standalone'
  balance: string
}

export interface Campaign {
  id: string
  title: string
  description: string
  targetAmount: number
  raisedAmount: number
  currency: string
  status: 'active' | 'completed' | 'paused' | 'pending'
  ngoId: string
  ngoName: string
  createdAt: string
  endDate: string
  category: 'emergency' | 'healthcare' | 'education' | 'food' | 'shelter' | 'other'
  imageUrl?: string
  beneficiaries: Beneficiary[]
}

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'

export interface ProofObject {
  type: 'on-chain' | 'signed'
  identifier?: string
  transactionHash?: string
  fileName?: string
  submittedBy?: string
}

export interface Beneficiary {
  id: string
  name: string
  walletAddress: string
  status: 'verified' | 'pending' | 'suspended'
  verificationStatus: VerificationStatus
  verificationProof?: string | ProofObject
  verificationReason?: string
  verificationSubmittedAt?: string
  verificationRejectedAt?: string
  campaignId: string
  allocatedAmount: number
  claimedAmount: number
  verificationDocuments?: string[]
  location: {
    country: string
    region: string
    city: string
  }
  createdAt: string
}

export interface Transaction {
  id: string
  type: 'donation' | 'distribution' | 'claim' | 'refund'
  from: string
  to: string
  amount: number
  currency: string
  campaignId?: string
  beneficiaryId?: string
  status: 'pending' | 'completed' | 'failed'
  timestamp: string
  txHash?: string
}

export interface User {
  id: string
  walletAddress: string
  role: 'donor' | 'ngo' | 'beneficiary' | 'admin'
  name: string
  email?: string
  createdAt: string
  kycStatus?: 'pending' | 'verified' | 'rejected'
}

export interface Analytics {
  totalDonations: number
  totalCampaigns: number
  totalBeneficiaries: number
  activeCampaigns: number
  distributionRate: number
  monthlyDonations: { month: string; amount: number }[]
  categoryDistribution: { category: string; amount: number }[]
}
