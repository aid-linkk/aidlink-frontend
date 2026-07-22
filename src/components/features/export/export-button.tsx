'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useWalletStore } from '@/store/wallet-store'
import { TransactionExporter } from '@/lib/export/transaction-exporter'
import type { StellarNetwork } from '@/lib/export/transaction-exporter'

interface ExportButtonProps {
  filename?: string
  /** Maximum transactions to fetch from Horizon (default: 5000) */
  maxTransactions?: number
}

/**
 * ExportButton
 *
 * Self-contained export control that reads the connected wallet from WalletStore,
 * fetches real transaction history from Horizon, and generates a provenance-authenticated
 * CSV or JSON file.
 *
 * No `transactions` prop — all data comes from the live Horizon payments endpoint.
 */
export function ExportButton({
  filename = 'aidlink-transactions',
  maxTransactions = 5000,
}: ExportButtonProps) {
  const { publicKey, network, isConnected } = useWalletStore()
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')

  const triggerDownload = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.${ext}`
    link.click()
    URL.revokeObjectURL(url)
  }

  const runExport = async (format: 'csv' | 'json') => {
    if (!isConnected || !publicKey) {
      toast.error('Connect your wallet before exporting')
      return
    }

    setIsExporting(true)
    setProgress(0)
    setStatusText('Fetching transactions from Horizon…')

    const exporter = new TransactionExporter()
    let lastCursor = ''

    try {
      const result = await exporter.export(
        publicKey,
        (network ?? 'testnet') as StellarNetwork,
        {
          maxTransactions,
          onProgress: (count) => {
            setProgress(Math.min(95, Math.round((count / maxTransactions) * 100)))
            setStatusText(`Fetching transactions from Horizon… (${count} fetched)`)
          },
        }
      )

      lastCursor = result.cursor
      setStatusText('Generating export file…')
      setProgress(98)

      if (format === 'csv') {
        const blob = await exporter.generateCsv(result, publicKey, (network ?? 'testnet') as StellarNetwork)
        triggerDownload(blob, 'csv')
      } else {
        const blob = await exporter.generateJson(result, publicKey, (network ?? 'testnet') as StellarNetwork)
        triggerDownload(blob, 'json')
      }

      setProgress(100)
      setStatusText('Done!')
      toast.success(
        `Exported ${result.totalFetched} transaction${result.totalFetched !== 1 ? 's' : ''} as ${format.toUpperCase()}`
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Export failed: ${message}${lastCursor ? ` — resume cursor: ${lastCursor}` : ''}`)
    } finally {
      setTimeout(() => {
        setIsExporting(false)
        setProgress(0)
        setStatusText('')
      }, 800)
    }
  }

  return (
    <>
      {/* Progress dialog */}
      <Dialog open={isExporting} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Exporting Transactions</DialogTitle>
            <DialogDescription>{statusText}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Progress value={progress} className="h-2" />
            <p className="mt-2 text-sm text-muted-foreground text-right">{progress}%</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trigger dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => runExport('csv')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => runExport('json')}>
            <FileText className="mr-2 h-4 w-4" />
            Export as JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
