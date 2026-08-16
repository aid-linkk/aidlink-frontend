# Content Security Policy (CSP) Implementation

## Overview

This document describes the implementation of production-grade Content Security Policy (CSP) with per-request nonces for the AidLink platform, addressing issue #93.

## Implementation Details

### 1. Middleware (`src/middleware.ts`)

The middleware generates a cryptographically secure nonce for each request and injects it into the CSP header.

**Key Features:**
- **Nonce Generation**: Uses `crypto.getRandomValues()` with 16 random bytes, encoded as base64
- **CSP Construction**: Builds CSP with all required directives
- **Environment Awareness**: Uses `Content-Security-Policy-Report-Only` in development, enforcing in production
- **Request Threading**: Sets `x-nonce` header for downstream consumption

**CSP Directives:**

| Directive | Value | Justification |
|-----------|-------|---------------|
| `default-src` | `'self'` | Only allow same-origin resources by default |
| `script-src` | `'nonce-{nonce}' 'strict-dynamic' 'unsafe-eval'` | Nonce for Next.js hydration; strict-dynamic for bundled chunks; unsafe-eval required by Stellar SDK |
| `style-src` | `'self' 'unsafe-inline'` | unsafe-inline required for Recharts and Framer Motion inline styles (safe as styles can't execute JS) |
| `img-src` | `'self' data: blob: https:` | Allow images from various sources |
| `font-src` | `'self'` | Only same-origin fonts |
| `connect-src` | See below | Allowlist for Stellar network endpoints |
| `frame-src` | `'none'` | No iframes (clickjacking defense) |
| `object-src` | `'none'` | No plugins |
| `base-uri` | `'self'` | Prevent base tag hijacking |
| `form-action` | `'self'` | Forms only submit to same origin |
| `upgrade-insecure-requests` | - | Force HTTPS |
| `report-uri` | `/api/csp-report` | Violation reporting endpoint |

**Stellar Network Endpoints in `connect-src`:**
- `https://horizon.stellar.org` (Mainnet)
- `https://horizon-testnet.stellar.org`
- `https://horizon-futurenet.stellar.org`
- `https://rpc.mainnet.stellar.org` (Soroban Mainnet)
- `https://soroban-testnet.stellar.org`
- `https://rpc-futurenet.stellar.org`
- `wss://horizon.stellar.org` (WebSocket)
- `wss://horizon-testnet.stellar.org`
- `wss://horizon-futurenet.stellar.org`

### 2. Layout Integration (`src/app/layout.tsx`)

Updated to read the nonce from request headers:
```typescript
const headersList = await headers()
const nonce = headersList.get('x-nonce') || ''
```

The nonce is available server-side during SSR for any components that need it.

### 3. CSP Violation Reporting Endpoint (`src/app/api/csp-report/route.ts`)

**Features:**
- **Validation**: Uses Zod schema to validate incoming CSP reports (all fields are attacker-controlled)
- **Rate Limiting**: In-memory sliding window counter (100 reports/minute per IP)
- **Structured Logging**: Logs violations as JSON to console.error (captured by Next.js runtime)
- **IP Extraction**: Handles `x-forwarded-for`, `x-real-ip`, and direct IP
- **Content-Type Validation**: Accepts `application/csp-report` and `application/json`
- **Automatic Cleanup**: Periodic cleanup of rate limit state to prevent memory leaks

**Response Codes:**
- `204 No Content`: Valid report accepted
- `400 Bad Request`: Invalid JSON or report structure
- `405 Method Not Allowed`: Non-POST request
- `429 Too Many Requests`: Rate limit exceeded

### 4. Test Coverage

#### Middleware Tests (`src/__tests__/middleware.test.ts`)
- Nonce generation uniqueness
- Crypto API usage verification
- CSP header construction (production vs development)
- All required directives present
- Stellar endpoints included
- No `unsafe-inline` in `script-src`

#### API Route Tests (`src/app/api/csp-report/__tests__/route.test.ts`)
- Valid report acceptance (204)
- Content-Type validation
- Invalid JSON rejection (400)
- Malformed report structure rejection (400)
- Rate limiting (101st request returns 429)
- Multiple IP handling
- IP extraction from various headers
- GET method rejection (405)

## Security Considerations

### Why `'unsafe-eval'` in script-src?
The Stellar SDK uses `eval()` or `Function()` constructor in some code paths for parsing and dynamic code execution. This is required for RPC response handling. Without it, the app would throw `EvalError` when interacting with Soroban contracts.

### Why `'unsafe-inline'` in style-src?
Both Recharts (for charts) and Framer Motion (for animations) inject inline styles via the `style` attribute. This is safe because:
1. Inline styles cannot execute JavaScript
2. The alternative (extracting all styles to external files) is impractical with these libraries
3. CSS injection attacks are significantly less severe than XSS

### Development vs Production
- **Development**: Uses `Content-Security-Policy-Report-Only` to avoid breaking HMR, webpack dev server, and React Fast Refresh
- **Production**: Enforces CSP with `Content-Security-Policy` header

**Important**: Never deploy with `NODE_ENV=development` to production as this would enable report-only mode, creating a false sense of security.

### Rate Limiting
The in-memory rate limiter is sufficient for basic DoS protection but is not distributed-safe. In a multi-instance deployment, consider:
- Redis-based rate limiting
- CDN-level rate limiting
- Web Application Firewall (WAF)

## Verification

### Manual Testing

1. **Build the app:**
   ```bash
   npm run build
   npm run start
   ```

2. **Check CSP header:**
   ```bash
   curl -I http://localhost:3000
   ```
   Should include `Content-Security-Policy` header with all directives.

3. **Verify nonce changes:**
   ```bash
   curl -I http://localhost:3000 | grep nonce
   curl -I http://localhost:3000 | grep nonce
   ```
   The nonce value should be different each time.

4. **Test violation reporting:**
   ```bash
   curl -X POST http://localhost:3000/api/csp-report \
     -H "Content-Type: application/csp-report" \
     -d '{"csp-report":{"violated-directive":"script-src"}}'
   ```
   Should return 204 No Content.

5. **Test rate limiting:**
   ```bash
   for i in {1..101}; do
     curl -X POST http://localhost:3000/api/csp-report \
       -H "Content-Type: application/csp-report" \
       -H "X-Forwarded-For: 192.168.1.1" \
       -d '{"csp-report":{}}' -w "%{http_code}\n" -s -o /dev/null
   done
   ```
   First 100 should return 204, 101st should return 429.

### Automated Testing

```bash
npm run test
```

All tests should pass, including:
- Middleware nonce generation tests
- CSP header construction tests
- API route validation tests
- Rate limiting tests

### Browser Testing

1. Open the app in a browser with DevTools
2. Check the Console for any CSP violations
3. In production mode, there should be NO violations for legitimate first-party code
4. In development mode, violations may appear for HMR/Fast Refresh (expected)

## Monitoring CSP Violations

CSP violations are logged to `console.error` as structured JSON:

```json
{
  "type": "csp-violation",
  "timestamp": "2024-07-21T10:30:00.000Z",
  "ip": "192.168.1.1",
  "report": {
    "documentUri": "https://aidlink.org/",
    "violatedDirective": "script-src",
    "blockedUri": "https://evil.com/malicious.js",
    ...
  }
}
```

In production, these logs can be:
- Ingested by log aggregation services (DataDog, Splunk, CloudWatch)
- Sent to SIEM systems for security monitoring
- Analyzed for attack patterns

## Existing Headers Preserved

The four existing security headers remain unchanged:
- `X-DNS-Prefetch-Control: on`
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

CSP is additive and complements these headers.

## Out of Scope (Future Work)

- Subresource Integrity (SRI) for third-party scripts
- Trusted Types policy for DOM XSS prevention
- CORS configuration
- Permissions Policy header
- Distributed rate limiting with Redis
- External violation reporting service integration

## References

- [Next.js CSP Documentation](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [CSP Level 3 Specification](https://w3c.github.io/webappsec-csp/)
- [strict-dynamic Usage](https://w3c.github.io/webappsec-csp/#strict-dynamic-usage)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
