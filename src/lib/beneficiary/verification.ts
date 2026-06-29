import type { ProofObject, VerificationStatus } from '@/types'

export const verificationContent: Record<
  VerificationStatus,
  {
    label: string
    message: string
    nextAction: string
  }
> = {
  unverified: {
    label: 'Unverified',
    message: 'Submit verification proof before claiming aid.',
    nextAction: 'Upload a signed proof document or paste approved proof data.',
  },
  pending: {
    label: 'Pending',
    message: 'Verification is currently under review.',
    nextAction: 'Watch for an approval update before attempting to claim aid.',
  },
  verified: {
    label: 'Verified',
    message: 'Identity verified. You may now claim available aid.',
    nextAction: 'Review available claims and claim aid when ready.',
  },
  rejected: {
    label: 'Rejected',
    message: 'Verification failed.',
    nextAction: 'Review the rejection reason and submit a new proof.',
  },
}

export function getProofTypeLabel(proof?: string | ProofObject): string {
  if (!proof) return 'Unavailable'
  if (typeof proof === 'string') return 'Signed proof'

  return proof.type === 'on-chain' ? 'On-chain proof' : 'Signed proof'
}

export function getProofIdentifier(proof?: string | ProofObject): string {
  if (!proof) return 'Unavailable'
  if (typeof proof === 'string') return proof

  return proof.transactionHash || proof.identifier || proof.fileName || 'Unavailable'
}
