'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileUp, Loader2, RotateCcw, Send } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import type { ProofObject } from '@/types'

export interface ProofSubmissionPayload {
  proof: ProofObject
  submittedAt: string
}

interface ProofSubmissionFormProps {
  isRetry?: boolean
  onSubmit: (payload: ProofSubmissionPayload) => Promise<void>
}

type ProofMode = 'signed' | 'on-chain'

export function ProofSubmissionForm({ isRetry = false, onSubmit }: ProofSubmissionFormProps) {
  const [proofMode, setProofMode] = useState<ProofMode>('signed')
  const [proofData, setProofData] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    const trimmedProofData = proofData.trim()
    if (!proofFile && !trimmedProofData) {
      setError('Upload a signed proof document or paste proof data before submitting.')
      return
    }

    if (proofMode === 'on-chain' && !trimmedProofData) {
      setError('Paste the on-chain proof identifier or transaction hash.')
      return
    }

    const proof: ProofObject = {
      type: proofMode === 'on-chain' ? 'on-chain' : 'signed',
      identifier: trimmedProofData || undefined,
      transactionHash: proofMode === 'on-chain' ? trimmedProofData : undefined,
      fileName: proofFile?.name,
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        proof,
        submittedAt: new Date().toISOString(),
      })
      setProofData('')
      setProofFile(null)
      setSuccessMessage('Verification proof submitted. Review is now in progress.')
    } catch {
      setError('Verification proof could not be submitted. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{isRetry ? 'Retry Verification' : 'Submit Verification Proof'}</CardTitle>
        <CardDescription>
          Provide a signed proof document or paste proof data so your identity can be reviewed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant={proofMode === 'signed' ? 'default' : 'outline'}
              className="justify-start"
              onClick={() => setProofMode('signed')}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Signed Proof
            </Button>
            <Button
              type="button"
              variant={proofMode === 'on-chain' ? 'default' : 'outline'}
              className="justify-start"
              onClick={() => setProofMode('on-chain')}
            >
              <Send className="mr-2 h-4 w-4" />
              On-chain Proof
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proof-file">Signed proof document</Label>
            <Input
              id="proof-file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.json,.txt"
              onChange={(event) => setProofFile(event.target.files?.[0] || null)}
            />
            {proofFile && (
              <p className="text-sm text-muted-foreground">
                Selected file: <span className="font-medium">{proofFile.name}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="proof-data">Proof data or transaction hash</Label>
            <textarea
              id="proof-data"
              value={proofData}
              onChange={(event) => setProofData(event.target.value)}
              placeholder="Paste proof data, signed payload, or transaction hash"
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {successMessage && (
            <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {successMessage}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting
              </>
            ) : isRetry ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry Verification
              </>
            ) : (
              'Submit Proof'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
