'use client'

import { ProofSubmissionForm, ProofSubmissionPayload } from '@/components/beneficiary/ProofSubmissionForm'
import { VerificationDetails } from '@/components/beneficiary/VerificationDetails'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import type { Beneficiary } from '@/types'

interface VerificationWorkflowProps {
  beneficiary: Beneficiary
  onSubmitProof: (payload: ProofSubmissionPayload) => Promise<void>
}

export function VerificationWorkflow({ beneficiary, onSubmitProof }: VerificationWorkflowProps) {
  if (beneficiary.verificationStatus === 'verified') {
    return (
      <VerificationDetails
        proof={beneficiary.verificationProof}
        submittedAt={beneficiary.verificationSubmittedAt}
        rejectionReason={beneficiary.verificationReason}
      />
    )
  }

  if (beneficiary.verificationStatus === 'pending') {
    return (
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-blue-600" />
              Review in Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Your submitted proof is being reviewed by the verification team.</p>
            <p>Claim actions will appear automatically after your identity is approved.</p>
          </CardContent>
        </Card>
        <VerificationDetails
          proof={beneficiary.verificationProof}
          submittedAt={beneficiary.verificationSubmittedAt}
          rejectionReason={beneficiary.verificationReason}
        />
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <VerificationDetails
        proof={beneficiary.verificationProof}
        submittedAt={beneficiary.verificationSubmittedAt}
        rejectionReason={beneficiary.verificationReason}
      />
      <ProofSubmissionForm isRetry={beneficiary.verificationStatus === 'rejected'} onSubmit={onSubmitProof} />
    </div>
  )
}
