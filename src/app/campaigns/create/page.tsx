'use client'

import { Navigation } from '@/components/layout/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Upload, Calendar, MapPin, DollarSign, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CONTRACT_IDS } from '@/config/constants'
import { sorobanSDK } from '@/lib/soroban/sdk'
import { CampaignManagerClient, SorobanTimeoutError } from '@/lib/soroban/campaign-manager'
import { useWalletStore } from '@/store/wallet-store'
import { walletService } from '@/lib/wallet/wallet-service'

export type SubmitStatus =
  | 'idle'
  | 'simulating'
  | 'awaiting-signature'
  | 'submitting'
  | 'confirming'
  | 'confirmed'
  | 'error'

export default function CreateCampaignPage() {
  const router = useRouter()
  const wallet = useWalletStore()
  const cancelBtnRef = useRef<HTMLButtonElement>(null)

  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [confirmAttempt, setConfirmAttempt] = useState(1)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null)
  const [showFeeDialog, setShowFeeDialog] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    category: 'emergency',
    endDate: '',
    location: '',
    imageUrl: '',
  })

  const [errors, setErrors] = useState<{
    title?: string
    targetAmount?: string
    endDate?: string
  }>({})

  const isContractConfigured = Boolean(CONTRACT_IDS.CAMPAIGN_MANAGER && CONTRACT_IDS.CAMPAIGN_MANAGER.trim() !== '')

  const validateForm = (): boolean => {
    const newErrors: { title?: string; targetAmount?: string; endDate?: string } = {}

    // Title validation: title must be <= 256 bytes encoded as UTF-8
    const titleBytes = Buffer.byteLength(formData.title || '', 'utf-8')
    if (titleBytes > 256) {
      newErrors.title = 'Title must be at most 256 bytes'
    }

    // targetAmount validation: positive finite float with at most 7 decimal places
    const amountNum = parseFloat(formData.targetAmount)
    if (!formData.targetAmount || isNaN(amountNum) || amountNum <= 0 || !isFinite(amountNum)) {
      newErrors.targetAmount = 'Please enter a valid target amount'
    } else {
      const parts = formData.targetAmount.split('.')
      if (parts[1] && parts[1].length > 7) {
        newErrors.targetAmount = 'Amount must have at most 7 decimal places'
      }
    }

    // endDate validation: must be in future and at least 24 hours away
    if (!formData.endDate) {
      newErrors.endDate = 'Please select an end date'
    } else {
      const selectedDate = new Date(formData.endDate).getTime()
      const minFutureTime = Date.now() + 24 * 60 * 60 * 1000
      if (isNaN(selectedDate) || selectedDate < minFutureTime) {
        newErrors.endDate = 'End date must be at least 24 hours in the future'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!isContractConfigured) {
      toast.error('Contract not configured', {
        description: 'NEXT_PUBLIC_CAMPAIGN_MANAGER_CONTRACT is not set.',
      })
      return
    }

    if (!validateForm()) {
      return
    }

    if (!wallet.isConnected || !wallet.publicKey) {
      toast.error('Wallet not connected', {
        description: 'Please connect your Stellar wallet to create a campaign.',
      })
      return
    }

    try {
      setStatus('simulating')
      const client = new CampaignManagerClient(sorobanSDK, CONTRACT_IDS.CAMPAIGN_MANAGER)

      const endDateUnix = Math.floor(new Date(formData.endDate).getTime() / 1000)
      const params = {
        title: formData.title,
        description: formData.description,
        targetAmountXlm: parseFloat(formData.targetAmount),
        endDateUnix,
        category: formData.category,
      }

      const simulation = await client.simulateCreateCampaign(params, wallet.publicKey)
      setEstimatedFee(simulation.estimatedFeeLumens)
      setShowFeeDialog(true)
      setStatus('idle')
    } catch (err: any) {
      console.error('Simulation error:', err)
      setStatus('error')
      const msg = err?.message || 'Failed to simulate transaction on-chain'
      setErrorMessage(msg)
      toast.error('Simulation Failed', { description: msg })
    }
  }

  const handleConfirmAndSign = async () => {
    setShowFeeDialog(false)
    if (!wallet.publicKey) return

    const client = new CampaignManagerClient(sorobanSDK, CONTRACT_IDS.CAMPAIGN_MANAGER)
    const endDateUnix = Math.floor(new Date(formData.endDate).getTime() / 1000)
    const params = {
      title: formData.title,
      description: formData.description,
      targetAmountXlm: parseFloat(formData.targetAmount),
      endDateUnix,
      category: formData.category,
    }

    try {
      setStatus('awaiting-signature')

      const signer = async (unsignedXdr: string) => {
        setStatus('submitting')
        return await walletService.signTransaction(unsignedXdr)
      }

      // Intercept status changes during poll if needed
      setStatus('confirming')
      setConfirmAttempt(1)

      const result = await client.createCampaign(params, wallet.publicKey, signer)

      setStatus('confirmed')
      toast.success('Campaign created successfully!', {
        description: `Campaign ID: ${result.campaignId}`,
      })

      router.push(`/campaigns/${result.campaignId}`)
    } catch (err: any) {
      console.error('Campaign creation error:', err)
      if (err instanceof SorobanTimeoutError || err.name === 'SorobanTimeoutError') {
        setStatus('error')
        const msg = 'Transaction is taking longer than expected. Check your transaction history at Stellar Expert.'
        setErrorMessage(msg)
        toast.error('Transaction Timed Out', { description: msg })
      } else {
        setStatus('error')
        const msg = err?.message || 'Failed to create campaign on-chain'
        setErrorMessage(msg)
        toast.error('Campaign Creation Failed', { description: msg })
      }
    }
  }

  const categories = [
    { value: 'emergency', label: 'Emergency Relief' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'food', label: 'Food Security' },
    { value: 'shelter', label: 'Shelter' },
    { value: 'other', label: 'Other' },
  ]

  const isSubmittingState = status === 'simulating' || status === 'awaiting-signature' || status === 'submitting' || status === 'confirming'

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container py-8 max-w-4xl">
        <Link href="/campaigns" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Campaign</h1>
          <p className="text-muted-foreground">
            Start a new humanitarian aid campaign to help those in need
          </p>
        </div>

        {!isContractConfigured && (
          <div className="mb-6 rounded-md bg-destructive/15 p-4 text-destructive flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Contract not configured</p>
              <p className="text-sm">NEXT_PUBLIC_CAMPAIGN_MANAGER_CONTRACT is not set in configuration.</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-md bg-destructive/15 p-4 text-destructive flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Creation Error</p>
              <p className="text-sm">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Provide the essential details about your campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Campaign Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter a descriptive title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    disabled={isSubmittingState}
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-destructive">{errors.title}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                    placeholder="Describe your campaign, its goals, and who it will help"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    disabled={isSubmittingState}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    disabled={isSubmittingState}
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Funding Details */}
            <Card>
              <CardHeader>
                <CardTitle>Funding Details</CardTitle>
                <CardDescription>
                  Set your funding goals and timeline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="targetAmount">Target Amount (XLM)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="targetAmount"
                      type="number"
                      step="any"
                      placeholder="1000"
                      className="pl-10"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                      required
                      min="0.0000001"
                      disabled={isSubmittingState}
                    />
                  </div>
                  {errors.targetAmount && (
                    <p className="mt-1 text-xs text-destructive">{errors.targetAmount}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="endDate"
                      type="date"
                      className="pl-10"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      disabled={isSubmittingState}
                    />
                  </div>
                  {errors.endDate && (
                    <p className="mt-1 text-xs text-destructive">{errors.endDate}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
                <CardDescription>
                  Specify where the aid will be distributed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="City, Region, Country"
                      className="pl-10"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                      disabled={isSubmittingState}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Image</CardTitle>
                <CardDescription>
                  Add an image to make your campaign more engaging
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop an image here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG or GIF (max. 5MB)
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    disabled={isSubmittingState}
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block mt-4"
                  >
                    <Button type="button" variant="outline" size="sm" asChild disabled={isSubmittingState}>
                      <span>Choose File</span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Submit Overlay / Status Indicator */}
            {isSubmittingState && (
              <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm flex items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="font-medium text-sm">
                  {status === 'simulating' && 'Simulating transaction fee...'}
                  {status === 'awaiting-signature' && 'Waiting for wallet signature…'}
                  {status === 'submitting' && 'Submitting to blockchain…'}
                  {status === 'confirming' && `Confirming (attempt ${confirmAttempt}/15)…`}
                </span>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmittingState || !isContractConfigured}
                className="flex-1"
                size="lg"
              >
                {status === 'simulating'
                  ? 'Simulating...'
                  : status === 'awaiting-signature'
                  ? 'Awaiting Signature...'
                  : status === 'submitting'
                  ? 'Submitting...'
                  : status === 'confirming'
                  ? 'Confirming...'
                  : 'Create Campaign'}
              </Button>
              <Link href="/campaigns" className="flex-1">
                <Button type="button" variant="outline" size="lg" className="w-full" disabled={isSubmittingState}>
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </form>
      </main>

      {/* Fee Confirmation Dialog */}
      <Dialog open={showFeeDialog} onOpenChange={setShowFeeDialog}>
        <DialogContent initialFocus={cancelBtnRef}>
          <DialogHeader>
            <DialogTitle>Confirm Campaign Creation</DialogTitle>
            <DialogDescription>
              Review the details and estimated on-chain network transaction fee before signing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Title:</span>
              <span className="font-medium">{formData.title}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Target Amount:</span>
              <span className="font-medium">{formData.targetAmount} XLM</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">End Date:</span>
              <span className="font-medium">{formData.endDate}</span>
            </div>
            <div className="flex justify-between pt-2 text-base font-semibold text-primary">
              <span>Estimated Network Fee:</span>
              <span>~{estimatedFee !== null ? estimatedFee.toFixed(5) : '0.00000'} XLM</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              ref={cancelBtnRef}
              type="button"
              variant="outline"
              onClick={() => setShowFeeDialog(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmAndSign}>
              Approve & Sign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
