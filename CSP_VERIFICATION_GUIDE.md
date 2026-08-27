# CSP Implementation Verification Guide

This guide provides step-by-step instructions for verifying the Content Security Policy (CSP) implementation for issue #93.

## Prerequisites

```bash
cd aidlink-frontend
npm install
```

## Acceptance Criteria Verification

### ✅ 1. Type Checking

```bash
npm run type-check
```

**Expected**: TypeScript compilation should succeed for the CSP implementation files:
- `src/middleware.ts`
- `src/app/api/csp-report/route.ts`
- `src/app/layout.tsx`

Note: There may be pre-existing type errors in other parts of the codebase. Focus on ensuring no NEW errors were introduced by the CSP implementation.

### ✅ 2. Build Success

```bash
npm run build
```

**Expected**: Next.js build completes successfully. The middleware and API routes are compiled.

### ✅ 3. Production CSP Header

```bash
npm run build
npm run start
# In another terminal:
curl -I http://localhost:3000
```

**Expected Output**:
```
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; script-src 'nonce-...' 'strict-dynamic' 'unsafe-eval'; ...
X-DNS-Prefetch-Control: on
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

**Verify**:
- ✅ `Content-Security-Policy` header is present (NOT Report-Only in production)
- ✅ All four existing headers are still present
- ✅ `script-src` contains `nonce-` and `'strict-dynamic'`
- ✅ `script-src` does NOT contain `'unsafe-inline'`

### ✅ 4. Stellar Endpoints in connect-src

```bash
curl -I http://localhost:3000 | grep Content-Security-Policy | grep -o 'connect-src[^;]*'
```

**Expected**: Should show all 6 Stellar HTTP endpoints + 3 WSS endpoints:
- `https://horizon.stellar.org`
- `https://horizon-testnet.stellar.org`
- `https://horizon-futurenet.stellar.org`
- `https://rpc.mainnet.stellar.org`
- `https://soroban-testnet.stellar.org`
- `https://rpc-futurenet.stellar.org`
- `wss://horizon.stellar.org`
- `wss://horizon-testnet.stellar.org`
- `wss://horizon-futurenet.stellar.org`

### ✅ 5. Unit Tests

```bash
npm test
```

**Expected**: All tests pass, including:

#### Middleware Tests:
- ✅ Nonce generation produces different values on consecutive requests
- ✅ Uses `crypto.getRandomValues` with 16-byte array
- ✅ Sets `Content-Security-Policy` in production
- ✅ Sets `Content-Security-Policy-Report-Only` in development
- ✅ Includes all required directives
- ✅ Includes all Stellar endpoints
- ✅ Does not include `'unsafe-inline'` in `script-src`

#### CSP Report API Tests:
- ✅ Valid report returns 204 No Content
- ✅ Accepts `application/json` content type
- ✅ Invalid Content-Type returns 400
- ✅ Invalid JSON returns 400
- ✅ Malformed report structure returns 400
- ✅ 101st request from same IP returns 429
- ✅ Different IPs are tracked separately
- ✅ IP extracted from `x-forwarded-for` header
- ✅ GET request returns 405

### ✅ 6. CSP Violation Reporting

```bash
# With app running (npm run start):
curl -X POST http://localhost:3000/api/csp-report \
  -H "Content-Type: application/csp-report" \
  -d '{
    "csp-report": {
      "document-uri": "http://localhost:3000/",
      "violated-directive": "script-src",
      "blocked-uri": "inline"
    }
  }'
```

**Expected**:
- ✅ Returns 204 No Content
- ✅ Server logs show structured JSON violation report

### ✅ 7. Rate Limiting

```bash
# Test rate limiting (requires 101 requests from same IP):
for i in {1..101}; do
  STATUS=$(curl -X POST http://localhost:3000/api/csp-report \
    -H "Content-Type: application/csp-report" \
    -H "X-Forwarded-For: 192.168.1.100" \
    -d '{"csp-report":{}}' \
    -w "%{http_code}" -s -o /dev/null)
  echo "Request $i: $STATUS"
  if [ "$i" -eq 101 ] && [ "$STATUS" -eq 429 ]; then
    echo "✅ Rate limiting working!"
  fi
done
```

**Expected**:
- ✅ First 100 requests return 204
- ✅ 101st request returns 429 Too Many Requests
- ✅ Response includes `Retry-After: 60` header

### ✅ 8. Development Mode (Report-Only)

```bash
npm run dev
# In another terminal:
curl -I http://localhost:3000
```

**Expected**:
- ✅ `Content-Security-Policy-Report-Only` header is present (NOT enforcing)
- ✅ No `Content-Security-Policy` header (enforcement disabled)
- ✅ Browser console shows no CSP errors for legitimate code

### ✅ 9. Production Mode (No CSP Violations)

```bash
npm run build
npm run start
# Open http://localhost:3000 in browser with DevTools
```

**Expected**:
- ✅ No CSP violations in browser console for legitimate first-party code
- ✅ Page renders correctly
- ✅ All functionality works (wallet connection, campaigns, etc.)

### ✅ 10. Nonce Uniqueness

```bash
# Verify nonces are different on each request:
for i in {1..5}; do
  curl -I http://localhost:3000 2>/dev/null | grep -o "nonce-[A-Za-z0-9+/=]*" | head -1
done
```

**Expected**: Each line should show a DIFFERENT nonce value.

## Additional Verification

### Browser DevTools Inspection

1. Open http://localhost:3000 in Chrome/Firefox
2. Open DevTools (F12)
3. Go to Network tab
4. Refresh page
5. Click on the document request
6. Check Response Headers

**Verify**:
- CSP header includes nonce
- All required directives present
- No console CSP violations for first-party resources

### Test Invalid Report Submission

```bash
# Test malformed report (missing csp-report key):
curl -X POST http://localhost:3000/api/csp-report \
  -H "Content-Type: application/csp-report" \
  -d '{"wrong-key": {}}' \
  -w "\nStatus: %{http_code}\n"
```

**Expected**: 400 Bad Request with error details

### Test GET Request Rejection

```bash
curl -X GET http://localhost:3000/api/csp-report -w "\nStatus: %{http_code}\n"
```

**Expected**: 405 Method Not Allowed with `Allow: POST` header

## Common Issues & Troubleshooting

### Issue: "Cannot find module 'next/server'"
**Solution**: Run `npm install` to install dependencies

### Issue: Build fails with TypeScript errors
**Solution**: Check if errors are pre-existing. Run `git diff` to see only new changes. Our implementation should not introduce new errors.

### Issue: CSP violations in browser console
**Solution**: 
- In development, this is expected for HMR/Fast Refresh
- In production, check if violations are from:
  - Browser extensions (ignore these)
  - Third-party scripts (may need to add to CSP)
  - Legitimate first-party code (bug - needs fixing)

### Issue: Rate limiting not working
**Solution**: Ensure requests come from the same IP. Use `X-Forwarded-For` header in tests.

### Issue: Tests fail
**Solution**: 
- Check Node.js version (should be 18+)
- Run `npm install` to ensure all dependencies are installed
- Check for module resolution issues

## Success Criteria Checklist

Before marking issue #93 as complete, verify:

- [ ] Type checking passes for CSP files
- [ ] Build succeeds
- [ ] Production uses `Content-Security-Policy` (enforcing)
- [ ] Development uses `Content-Security-Policy-Report-Only`
- [ ] All Stellar endpoints in `connect-src`
- [ ] No `'unsafe-inline'` in `script-src`
- [ ] CSP includes `'strict-dynamic'`
- [ ] Existing headers still present
- [ ] Violation endpoint accepts valid reports (204)
- [ ] Violation endpoint rejects invalid reports (400)
- [ ] Rate limiting works (429 on 101st request)
- [ ] Nonces are unique per request
- [ ] No CSP violations in production for legitimate code
- [ ] All unit tests pass
- [ ] Documentation complete

## Next Steps After Verification

Once all checks pass:

1. Commit changes: `git add . && git commit -m "feat: implement CSP with nonces (closes #93)"`
2. Push branch: `git push -u origin feat/implement-csp-with-nonces-93`
3. Create PR with detailed description
4. Tag issue #93 in PR description
5. Request review from maintainers

## References

- Implementation docs: `docs/CSP_IMPLEMENTATION.md`
- Issue #93: https://github.com/aid-linkk/aidlink-frontend/issues/93
- Next.js CSP docs: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
