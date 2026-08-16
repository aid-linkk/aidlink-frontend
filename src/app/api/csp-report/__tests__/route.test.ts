/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

describe('CSP Report API', () => {
  // Mock console.error to avoid cluttering test output
  const originalConsoleError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })

  afterAll(() => {
    console.error = originalConsoleError
  })

  describe('GET /api/csp-report', () => {
    it('should return 405 Method Not Allowed', async () => {
      const response = await GET()
      expect(response.status).toBe(405)
      expect(response.headers.get('Allow')).toBe('POST')
      
      const body = await response.json()
      expect(body.error).toBe('Method not allowed')
    })
  })

  describe('POST /api/csp-report', () => {
    it('should accept valid CSP report and return 204', async () => {
      const validReport = {
        'csp-report': {
          'document-uri': 'http://localhost:3000/',
          'referrer': '',
          'violated-directive': 'script-src',
          'effective-directive': 'script-src',
          'original-policy': "default-src 'self'",
          'blocked-uri': 'inline',
          'status-code': 200,
          'source-file': 'http://localhost:3000/',
          'line-number': 1,
          'column-number': 1,
        }
      }

      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/csp-report',
        },
        body: JSON.stringify(validReport),
      })

      const response = await POST(request)
      expect(response.status).toBe(204)
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('csp-violation')
      )
    })

    it('should accept application/json content type', async () => {
      const validReport = {
        'csp-report': {
          'document-uri': 'http://localhost:3000/',
          'violated-directive': 'script-src',
        }
      }

      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validReport),
      })

      const response = await POST(request)
      expect(response.status).toBe(204)
    })

    it('should reject invalid Content-Type', async () => {
      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({ 'csp-report': {} }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const body = await response.json()
      expect(body.error).toContain('Invalid Content-Type')
    })

    it('should reject invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/csp-report',
        },
        body: 'not valid json',
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const body = await response.json()
      expect(body.error).toBe('Invalid JSON body')
    })

    it('should reject malformed CSP report structure', async () => {
      const invalidReport = {
        'wrong-key': {
          'document-uri': 'http://localhost:3000/',
        }
      }

      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/csp-report',
        },
        body: JSON.stringify(invalidReport),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const body = await response.json()
      expect(body.error).toBe('Invalid CSP report format')
      expect(body.details).toBeTruthy()
    })

    it('should accept report with minimal fields', async () => {
      const minimalReport = {
        'csp-report': {}
      }

      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/csp-report',
        },
        body: JSON.stringify(minimalReport),
      })

      const response = await POST(request)
      expect(response.status).toBe(204)
    })
  })

  describe('Rate limiting', () => {
    // Helper to create requests from the same IP
    const createRequest = (ip: string, report = { 'csp-report': {} }) => {
      return new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/csp-report',
          'x-forwarded-for': ip,
        },
        body: JSON.stringify(report),
      })
    }

    it('should rate limit after 100 requests from same IP', async () => {
      const testIp = '192.168.1.100'

      // Send 100 requests - all should succeed
      for (let i = 0; i < 100; i++) {
        const request = createRequest(testIp)
        const response = await POST(request)
        expect(response.status).toBe(204)
      }

      // 101st request should be rate limited
      const request101 = createRequest(testIp)
      const response101 = await POST(request101)
      expect(response101.status).toBe(429)
      expect(response101.headers.get('Retry-After')).toBe('60')
      
      const body = await response101.json()
      expect(body.error).toBe('Too many reports')
    }, 30000) // Increase timeout for this test

    it('should allow requests from different IPs', async () => {
      const ip1 = '192.168.1.101'
      const ip2 = '192.168.1.102'

      // Send 100 requests from IP1
      for (let i = 0; i < 100; i++) {
        const request = createRequest(ip1)
        const response = await POST(request)
        expect(response.status).toBe(204)
      }

      // Request from IP2 should still work
      const requestIp2 = createRequest(ip2)
      const responseIp2 = await POST(requestIp2)
      expect(responseIp2.status).toBe(204)
    }, 30000)

    it('should extract IP from x-forwarded-for header', async () => {
      const report = { 'csp-report': {} }
      
      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/csp-report',
          'x-forwarded-for': '192.168.1.200, 10.0.0.1',
        },
        body: JSON.stringify(report),
      })

      const response = await POST(request)
      expect(response.status).toBe(204)
    })

    it('should extract IP from x-real-ip header if x-forwarded-for not present', async () => {
      const report = { 'csp-report': {} }
      
      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/csp-report',
          'x-real-ip': '192.168.1.201',
        },
        body: JSON.stringify(report),
      })

      const response = await POST(request)
      expect(response.status).toBe(204)
    })
  })
})
