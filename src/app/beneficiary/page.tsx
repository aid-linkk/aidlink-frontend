'use client'

import { Navigation } from '@/components/layout/navigation'
import { VerificationBanner } from '@/components/beneficiary/VerificationBanner'
import { VerificationWorkflow } from '@/components/beneficiary/VerificationWorkflow'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QRCodeSVG } from 'qrcode.react'
import { Wallet, QrCode, History, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { useWalletStore } from '@/store/wallet-store'
import { formatAddress, formatAmount, formatDate } from '@/lib/utils'
import type { ProofSubmissionPayload } from '@/components/beneficiary/ProofSubmissionForm'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useBeneficiaryStatus } from '@/hooks/use-beneficiary-status'
import { useSubmitProof } from '@/hooks/use-submit-proof'
import { CONTRACT_IDS } from '@/config/constants'

export default function BeneficiaryPage() {
  const { address, balance, isConnected } = useWalletStore()
  const [showQR, setShowQR] = useState(false)

  // ------------------------------------------------------------------
  // On-chain status — replaces hardcoded useState<Beneficiary> verificationStatus
  // ------------------------------------------------------------------
  const {
    verificationStatus,
    rejectionReason,
    isLoading: statusLoading,
    contractNotConfigured: statusContractMissing,
  } = useBeneficiaryStatus(address)

  // ------------------------------------------------------------------
  // Proof submission hook
  // ------------------------------------------------------------------
  const { state: submitState, submit, reset: resetSubmit } = useSubmitProof()

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Wallet Not Connected</h2>
          <p className="text-muted-foreground mb-4">
            Please connect your wallet to access the beneficiary portal
          </p>
        </div>
      </div>
    )
  }

  // Show a clear error if the contract is not deployed, rather than a generic failure
  if (statusContractMissing) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container py-8">
          <div className="flex items-center justify-center py-24">
            <div className="text-center max-w-md">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Contract Not Configured</h2>
              <p className="text-muted-foreground text-sm">
                The Beneficiary Registry contract address is not set.{' '}
                {CONTRACT_IDS.BENEFICIARY_REGISTRY
                  ? null
                  : 'Set NEXT_PUBLIC_BENEFICIARY_REGISTRY_CONTRACT in your environment and restart.'}
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const claims = [
    {
      id: '1',
      campaignTitle: 'Emergency Relief for Flood Victims',
      amount: 500,
      status: 'completed',
      claimedAt: new Date(Date.now() - 86400000).toISOString(),
      txHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    },
    {
      id: '2',
      campaignTitle: 'Medical Supplies for Children',
      amount: 250,
      status: 'pending',
      claimedAt: null,
      txHash: null,
    },
  ]

  const availableClaims = claims.filter((c) => c.status === 'pending')
  const completedClaims = claims.filter((c) => c.status === 'completed')

  const handleClaim = async (_claimId: string) => {
    try {
      // Claim flow is out of scope per issue spec — placeholder
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast.success('Aid claimed successfully!', {
        description: 'Your claim has been processed on the blockchain',
      })
    } catch {
      toast.error('Failed to claim aid', {
        description: 'Please try again later',
      })
    }
  }

  /**
   * handleSubmitProof — no setTimeout mock.
   *
   * Delegates entirely to useSubmitProof which:
   *   1. Computes SHA-256 of the file (or validates the tx hash)
   *   2. Calls BENEFICIARY_REGISTRY_CONTRACT submit_proof(address, proofCid)
   *   3. Polls with exponential backoff until the transaction lands
   *   4. Invalidates the beneficiary-status query so the banner updates
   */
  const handleSubmitProof = useCallback(
    async (payload: ProofSubmissionPayload) => {
      if (!address) return

      await submit(payload, address)

      if (submitState.status === 'success' || submitState.txHash) {
        toast.success('Verification proof submitted', {
          description: 'Your proof is now under review. Status will update automatically.',
        })
      } else if (submitState.status === 'error' && submitState.error) {
        toast.error('Proof submission failed', {
          description: submitState.error,
        })
        // Re-throw so ProofSubmissionForm can display its own error state
        throw new Error(submitState.error)
      }

      // Reset the submit hook state after a short delay so the next attempt starts fresh
      setTimeout(() => resetSubmit(), 3000)
    },
    [address, submit, submitState, resetSubmit],
  )

  const isVerified = verificationStatus === 'verified'

  // Build a minimal Beneficiary shape for VerificationWorkflow (only the fields it reads)
  const beneficiaryForWorkflow = {
    id: 'beneficiary-current',
    name: 'Current Beneficiary',
    walletAddress: address || '',
    status: 'pending' as const,
    verificationStatus,
    verificationReason: rejectionReason,
    campaignId: 'campaign-current',
    allocatedAmount: 750,
    claimedAmount: 500,
    location: { country: 'Nigeria', region: 'Lagos', city: 'Lagos' },
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Beneficiary Portal</h1>
          <p className="text-muted-foreground">
            Claim your allocated aid and track your claim history
          </p>
        </div>

        {/* Wallet Overview */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Address</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">{formatAddress(address || '')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(balance)} XLM</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableClaims.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Verification banner — shows on-chain status + rejection reason from contract */}
        {statusLoading ? (
          <Card className="mb-6 border-muted bg-muted/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading verification status from blockchain…
              </div>
            </CardContent>
          </Card>
        ) : (
          <VerificationBanner
            status={verificationStatus}
            rejectionReason={rejectionReason}
          />
        )}

        {/* Submit-in-progress indicator */}
        {(submitState.status === 'hashing' ||
          submitState.status === 'submitting' ||
          submitState.status === 'polling') && (
          <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {submitState.status === 'hashing' && 'Computing proof hash…'}
                {submitState.status === 'submitting' && 'Submitting proof to blockchain…'}
                {submitState.status === 'polling' && 'Waiting for on-chain confirmation…'}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Claims */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Available Claims</h2>
          {isVerified ? (
            availableClaims.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {availableClaims.map((claim) => (
                  <Card key={claim.id}>
                    <CardHeader>
                      <CardTitle>{claim.campaignTitle}</CardTitle>
                      <CardDescription>
                        {formatAmount(claim.amount)} XLM available to claim
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button onClick={() => handleClaim(claim.id)} className="w-full" size="lg">
                        Claim Aid
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowQR(!showQR)}
                        className="w-full"
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        {showQR ? 'Hide QR Code' : 'Show QR Code'}
                      </Button>
                      {showQR && (
                        <div className="flex justify-center rounded-lg bg-white p-4">
                          <QRCodeSVG value={address || ''} size={200} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Available Claims</h3>
                    <p className="text-muted-foreground">
                      New approved aid allocations will appear here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          ) : (
            <VerificationWorkflow
              beneficiary={beneficiaryForWorkflow}
              onSubmitProof={handleSubmitProof}
            />
          )}
        </div>

        {/* Claim History */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Claim History</h2>
          {completedClaims.length > 0 ? (
            <div className="space-y-4">
              {completedClaims.map((claim) => (
                <Card key={claim.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold mb-1">{claim.campaignTitle}</div>
                        <div className="text-sm text-muted-foreground">
                          Claimed {formatAmount(claim.amount)} XLM
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(claim.claimedAt || '')}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className="bg-green-600">Completed</Badge>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Claim History</h3>
                  <p className="text-muted-foreground">Your claimed aid will appear here</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
