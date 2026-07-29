import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { verificationContent } from '@/lib/beneficiary/verification'
import type { VerificationStatus } from '@/types'

interface VerificationBadgeProps {
  status: VerificationStatus
}

const statusClassName: Record<VerificationStatus, string> = {
  unverified:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
  pending: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200',
  verified:
    'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-200',
  rejected: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200',
}

export function VerificationBadge({ status }: VerificationBadgeProps) {
  return (
    <Badge variant="outline" className={cn('capitalize', statusClassName[status])}>
      {verificationContent[status].label}
    </Badge>
  )
}
