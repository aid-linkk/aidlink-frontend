import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from '@/components/ui/toaster'
import { MobileNavigation } from '@/components/layout/mobile-navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AidLink - Decentralized Humanitarian Aid Platform',
  description: 'Transparent, efficient, and secure humanitarian aid distribution powered by Stellar blockchain',
  keywords: ['humanitarian aid', 'blockchain', 'Stellar', 'Soroban', 'charity', 'donations'],
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Read the nonce from request headers set by middleware
  // This nonce is used for CSP to allow Next.js hydration scripts
  const headersList = await headers()
  const nonce = headersList.get('x-nonce') || ''

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <QueryProvider>
            {children}
            <MobileNavigation />
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
