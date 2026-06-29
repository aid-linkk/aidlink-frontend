import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { verificationContent } from '@/lib/beneficiary/verification'
import { AlertCircle, CheckCircle2, Clock, ShieldAlert } from 'lucide-react'
import type { VerificationStatus } from '@/types'
import { VerificationBadge } from './VerificationBadge'

interface VerificationBannerProps {
  status: VerificationStatus
  rejectionReason?: string
}

const bannerClassName: Record<VerificationStatus, string> = {
  unverified: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20',
  pending: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20',
  verified: 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20',
  rejected: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20',
}

const iconClassName: Record<VerificationStatus, string> = {
  unverified: 'text-amber-700 dark:text-amber-300',
  pending: 'text-blue-700 dark:text-blue-300',
  verified: 'text-green-700 dark:text-green-300',
  rejected: 'text-red-700 dark:text-red-300',
}

const statusIcon = {
  unverified: ShieldAlert,
  pending: Clock,
  verified: CheckCircle2,
  rejected: AlertCircle,
}

export function VerificationBanner({ status, rejectionReason }: VerificationBannerProps) {
  const content = verificationContent[status]
  const Icon = statusIcon[status]

  return (
    <Card className={cn('mb-6', bannerClassName[status])}>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Icon className={cn('h-5 w-5 shrink-0 sm:mt-0.5', iconClassName[status])} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <VerificationBadge status={status} />
              <p className="font-medium">{content.message}</p>
            </div>
            {status === 'rejected' && (
              <p className="text-sm text-muted-foreground">
                Reason: {rejectionReason || 'No rejection reason was provided.'}
              </p>
            )}
            <p className="text-sm text-muted-foreground">{content.nextAction}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
