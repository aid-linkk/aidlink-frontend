import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getProofIdentifier, getProofTypeLabel } from '@/lib/beneficiary/verification'
import { formatDate } from '@/lib/utils'
import type { ProofObject } from '@/types'

interface VerificationDetailsProps {
  proof?: string | ProofObject
  submittedAt?: string
  rejectionReason?: string
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="break-all text-sm font-semibold">{value || 'Unavailable'}</dd>
    </div>
  )
}

export function VerificationDetails({ proof, submittedAt, rejectionReason }: VerificationDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Proof Details</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          <DetailRow label="Proof type" value={getProofTypeLabel(proof)} />
          <DetailRow label="Proof identifier / transaction hash" value={getProofIdentifier(proof)} />
          <DetailRow label="Submission date" value={submittedAt ? formatDate(submittedAt) : undefined} />
          <DetailRow label="Rejection reason" value={rejectionReason} />
        </dl>
      </CardContent>
    </Card>
  )
}
