import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Generate a cryptographically secure random nonce for CSP
 * Uses Web Crypto API to ensure unpredictability
 */
function generateNonce(): string {
  const buffer = new Uint8Array(16)
  crypto.getRandomValues(buffer)
  return Buffer.from(buffer).toString('base64')
}

/**
 * Build Content-Security-Policy header with the given nonce
 * 
 * Directive justifications:
 * - default-src 'self': Only allow resources from same origin by default
 * - script-src 'nonce-{nonce}' 'strict-dynamic' 'unsafe-eval':
 *   - nonce: Required for Next.js hydration scripts and our app code
 *   - strict-dynamic: Allows nonce'd scripts to load other scripts (bundled chunks)
 *   - unsafe-eval: Required by Stellar SDK which uses Function() constructor for parsing
 *     and dynamic code execution in some RPC response handling paths
 * - style-src 'self' 'unsafe-inline': 
 *   - unsafe-inline: Required for Recharts inline SVG styles and Framer Motion inline styles
 *   - This is acceptable because inline styles cannot execute JavaScript
 * - img-src 'self' data: blob: https:: Allow images from various sources including data URIs
 * - font-src 'self': Only load fonts from same origin
 * - connect-src: Allowlist for all Stellar network endpoints:
 *   - Horizon API (mainnet, testnet, futurenet) - HTTP and WebSocket
 *   - Soroban RPC (mainnet, testnet, futurenet)
 *   - 'self' for our own API routes
 * - frame-src 'none': No iframes allowed (defense against clickjacking)
 * - object-src 'none': No plugins (Flash, Java, etc.)
 * - base-uri 'self': Prevent base tag hijacking
 * - form-action 'self': Forms can only submit to same origin
 * - upgrade-insecure-requests: Force HTTP requests to HTTPS
 * - report-uri: Send violation reports to our endpoint for monitoring
 */
function buildCSP(nonce: string, isDevelopment: boolean): string {
  const directives = [
    "default-src 'self'",
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    "connect-src 'self' https://horizon.stellar.org https://horizon-testnet.stellar.org https://horizon-futurenet.stellar.org https://rpc.mainnet.stellar.org https://soroban-testnet.stellar.org https://rpc-futurenet.stellar.org wss://horizon.stellar.org wss://horizon-testnet.stellar.org wss://horizon-futurenet.stellar.org",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
    "report-uri /api/csp-report"
  ]

  const policy = directives.join('; ')
  
  // In development, use report-only mode to avoid breaking HMR, webpack dev server,
  // and React Fast Refresh which inject inline scripts and eval
  // In production, enforce the policy
  return isDevelopment 
    ? `Content-Security-Policy-Report-Only: ${policy}`
    : `Content-Security-Policy: ${policy}`
}

export function middleware(request: NextRequest) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Generate a unique nonce for this request
  const nonce = generateNonce()
  
  // Clone the request headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  
  // Create response with modified request headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  
  // Build and set CSP header
  const cspHeader = buildCSP(nonce, isDevelopment)
  const [headerName, headerValue] = cspHeader.split(': ', 2)
  response.headers.set(headerName, headerValue)
  
  return response
}

// Apply middleware to all routes except static assets and Next.js internal routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
