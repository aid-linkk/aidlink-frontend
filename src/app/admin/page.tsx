'use client'

import { Navigation } from '@/components/layout/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Users,
  ShieldCheck,
  Ban,
  Search,
  TrendingUp,
  AlertCircle,
  Clock,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { formatAddress, formatDate } from '@/lib/utils'
import { usePendingVerifications, pendingVerificationsKeys } from '@/hooks/use-pending-verifications'
import { useAdminRegistry } from '@/hooks/use-admin-registry'
import { beneficiaryStatusKeys } from '@/hooks/use-beneficiary-status'
import { verifyBeneficiary, rejectBeneficiary } from '@/lib/beneficiary/contract'
import { validateRejectionReason, reasonByteLength, MAX_REASON_BYTES } from '@/lib/beneficiary/crypto'
import { useWalletStore } from '@/store/wallet-store'

// ---------------------------------------------------------------------------
// Reject dialog
// ---------------------------------------------------------------------------

interface RejectDialogProps {
  open: boolean
  beneficiaryAddress: string
  onConfirm: (reason: string) => Promise<void>
  onCancel: () => void
}

function RejectDialog({ open, beneficiaryAddress, onConfirm, onCancel }: RejectDialogProps) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const byteLength = reasonByteLength(reason)
  const validation = validateRejectionReason(reason)
  const canConfirm = validation.valid && !isSubmitting

  const handleConfirm = async () => {
    if (!canConfirm) return
    setIsSubmitting(true)
    try {
      await onConfirm(reason)
    } finally {
      setIsSubmitting(false)
      setReason('')
    }
  }

  const handleCancel = () => {
    setReason('')
    onCancel()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Reject Beneficiary
          </DialogTitle>
          <DialogDescription>
            Provide a rejection reason for{' '}
            <span className="font-mono text-xs">{formatAddress(beneficiaryAddress)}</span>.
            This reason will be stored on-chain and shown to the beneficiary.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="rejection-reason">Rejection reason</Label>
            <textarea
              id="rejection-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why this proof was rejected…"
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between text-xs">
              <span
                className={byteLength > MAX_REASON_BYTES ? 'text-destructive' : 'text-muted-foreground'}
              >
                {byteLength} / {MAX_REASON_BYTES} bytes
              </span>
              {!validation.valid && reason.trim().length > 0 && (
                <span className="text-destructive">{validation.error}</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canConfirm}
            aria-disabled={!canConfirm}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting…
              </>
            ) : (
              'Confirm Reject'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Admin page
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const { address: walletAddress, network, isConnected } = useWalletStore()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  // ------------------------------------------------------------------
  // Reject dialog state
  // ------------------------------------------------------------------
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)

  // ------------------------------------------------------------------
  // On-chain data
  // ------------------------------------------------------------------
  const {
    entries: pendingBeneficiaries,
    isLoading: pendingLoading,
    isFetching: pendingFetching,
    error: pendingError,
    contractNotConfigured,
    hasMore,
    loadMore,
    refresh,
  } = usePendingVerifications()

  const {
    isAdmin,
    isLoading: adminLoading,
    registryUnavailable,
  } = useAdminRegistry()

  // ------------------------------------------------------------------
  // Static data (campaigns & flagged users — out of scope for this issue)
  // ------------------------------------------------------------------
  const campaigns = [
    {
      id: '1',
      title: 'Emergency Relief for Flood Victims',
      organizer: 'Red Cross International',
      raisedAmount: 35000,
      targetAmount: 50000,
      status: 'active',
      createdAt: new Date(Date.now() - 604800000).toISOString(),
    },
    {
      id: '2',
      title: 'Medical Supplies for Children',
      organizer: 'Doctors Without Borders',
      raisedAmount: 22000,
      targetAmount: 25000,
      status: 'active',
      createdAt: new Date(Date.now() - 1209600000).toISOString(),
    },
  ]

  const flaggedUsers = [
    {
      id: '1',
      name: 'Suspicious User',
      walletAddress: 'GB5XWAMU7QNOZBU4K7L5KGK46XB5HQDJC7W3COSKZQD5NVD4M7Y4Q2K9',
      flagReason: 'Multiple claim attempts',
      flaggedAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ]

  const stats = [
    { label: 'Pending Verifications', value: String(pendingBeneficiaries.length), icon: Clock, change: '' },
    { label: 'Active Campaigns', value: '12', icon: TrendingUp, change: '+2' },
    { label: 'Flagged Users', value: '3', icon: AlertCircle, change: '-1' },
    { label: 'Total Beneficiaries', value: '1,234', icon: Users, change: '+12%' },
  ]

  const handleVerify = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Beneficiary verified successfully')
    } catch (error) {
      toast.error('Failed to verify beneficiary')
    }
  }

  const handleSuspend = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('User suspended successfully')
    } catch (error) {
      toast.error('Failed to suspend user')
    }
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Reject dialog */}
      {rejectTarget && (
        <RejectDialog
          open={!!rejectTarget}
          beneficiaryAddress={rejectTarget}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      <main className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Portal</h1>
            <p className="text-muted-foreground">
              Manage beneficiaries, campaigns, and platform moderation
            </p>
          </div>

          {/* Admin status indicator */}
          {isConnected && !adminLoading && (
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <Badge className="bg-green-600 text-white">Admin</Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Read-only
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Admin registry unavailable warning */}
        {registryUnavailable && (
          <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm">
                <AlertCircle className="h-4 w-4" />
                Admin registry not available — verify/reject actions are disabled.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contract not configured warning */}
        {contractNotConfigured && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
                <AlertCircle className="h-4 w-4" />
                Contract not configured — set NEXT_PUBLIC_BENEFICIARY_REGISTRY_CONTRACT in your
                environment.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change && (
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">{stat.change}</span> from last month
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="beneficiaries" className="space-y-4">
          <TabsList>
            <TabsTrigger value="beneficiaries">Beneficiaries</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="flagged">Flagged Users</TabsTrigger>
          </TabsList>

          {/* ---------------------------------------------------------------- */}
          {/* Pending Verifications tab — data from contract                   */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="beneficiaries" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Pending Verifications</h2>
                {pendingFetching && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refresh}
                  disabled={pendingFetching}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search beneficiaries…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Wallet Address</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingBeneficiaries.map((beneficiary) => (
                    <TableRow key={beneficiary.id}>
                      <TableCell className="font-medium">{beneficiary.name}</TableCell>
                      <TableCell>{formatAddress(beneficiary.walletAddress)}</TableCell>
                      <TableCell>{beneficiary.location}</TableCell>
                      <TableCell>{beneficiary.documents}</TableCell>
                      <TableCell>{formatDate(beneficiary.submittedAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleVerify()}
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Verify
                          </Button>
                          <Button size="sm" variant="outline">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          {/* Campaigns tab                                                    */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="campaigns" className="space-y-4">
            <h2 className="text-xl font-semibold">Campaign Moderation</h2>
            <div className="grid gap-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold mb-1">{campaign.title}</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          By {campaign.organizer}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>
                            {campaign.raisedAmount.toLocaleString()} /{' '}
                            {campaign.targetAmount.toLocaleString()} XLM
                          </span>
                          <Badge variant="secondary">{campaign.status}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          {/* Flagged users tab                                                */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="flagged" className="space-y-4">
            <h2 className="text-xl font-semibold">Flagged Users</h2>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Wallet Address</TableHead>
                    <TableHead>Flag Reason</TableHead>
                    <TableHead>Flagged Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flaggedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{formatAddress(user.walletAddress)}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{user.flagReason}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.flaggedAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleSuspend()}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Suspend
                          </Button>
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
