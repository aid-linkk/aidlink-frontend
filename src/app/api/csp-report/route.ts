import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * CSP Report validation schema
 * Browser sends violation reports in this format
 * All fields are attacker-controlled and must be validated
 */
const CSPReportSchema = z.object({
  'csp-report': z.object({
    'document-uri': z.string().optional(),
    'referrer': z.string().optional(),
    'violated-directive': z.string().optional(),
    'effective-directive': z.string().optional(),
    'original-policy': z.string().optional(),
    'blocked-uri': z.string().optional(),
    'status-code': z.number().optional(),
    'source-file': z.string().optional(),
    'line-number': z.number().optional(),
    'column-number': z.number().optional(),
    'disposition': z.string().optional(),
  })
})

/**
 * Rate limiting state
 * In-memory sliding window counter per IP address
 * Note: This is not distributed-safe but sufficient for basic DoS protection
 * in serverless functions where the module is cached for the function lifetime
 */
const ipWindows = new Map<string, { count: number; windowStart: number }>()

const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REPORTS = 100

/**
 * Check if IP has exceeded rate limit
 * Implements sliding window counter
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const window = ipWindows.get(ip)

  if (!window) {
    // First request from this IP
    ipWindows.set(ip, { count: 1, windowStart: now })
    return false
  }

  // Check if window has expired
  if (now - window.windowStart > RATE_LIMIT_WINDOW_MS) {
    // Reset window
    ipWindows.set(ip, { count: 1, windowStart: now })
    return false
  }

  // Increment counter
  window.count += 1

  if (window.count > RATE_LIMIT_MAX_REPORTS) {
    return true
  }

  return false
}

/**
 * Clean up old rate limit entries periodically
 * Prevents memory leak in long-running serverless function instances
 */
function cleanupRateLimitState() {
  const now = Date.now()
  const entries = Array.from(ipWindows.entries())
  for (const [ip, window] of entries) {
    if (now - window.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      ipWindows.delete(ip)
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimitState, 5 * 60 * 1000)

/**
 * GET handler - return 405 Method Not Allowed
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { 'Allow': 'POST' } }
  )
}

/**
 * POST handler for CSP violation reports
 * Validates report structure, enforces rate limiting, and logs violations
 */
export async function POST(request: NextRequest) {
  // Extract client IP for rate limiting
  // Check various headers for IP (accounting for proxies/load balancers)
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown'

  // Enforce rate limit to prevent violation-report flooding as DoS vector
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many reports' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  // Validate Content-Type
  const contentType = request.headers.get('content-type')
  if (!contentType?.includes('application/csp-report') && !contentType?.includes('application/json')) {
    return NextResponse.json(
      { error: 'Invalid Content-Type. Expected application/csp-report or application/json' },
      { status: 400 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  // Validate report structure with Zod (all fields are attacker-controlled)
  const parseResult = CSPReportSchema.safeParse(body)
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid CSP report format', details: parseResult.error.format() },
      { status: 400 }
    )
  }

  const report = parseResult.data['csp-report']

  // Log the violation to structured logs
  // Next.js captures console.error in its runtime logs
  // In production, these can be ingested by monitoring systems
  console.error(
    JSON.stringify({
      type: 'csp-violation',
      timestamp: new Date().toISOString(),
      ip,
      report: {
        documentUri: report['document-uri'],
        referrer: report['referrer'],
        violatedDirective: report['violated-directive'],
        effectiveDirective: report['effective-directive'],
        blockedUri: report['blocked-uri'],
        statusCode: report['status-code'],
        sourceFile: report['source-file'],
        lineNumber: report['line-number'],
        columnNumber: report['column-number'],
        disposition: report['disposition'],
      },
    })
  )

  // Return 204 No Content - successful receipt, no response body needed
  return new NextResponse(null, { status: 204 })
}
