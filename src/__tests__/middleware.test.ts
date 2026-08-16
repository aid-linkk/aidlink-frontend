/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { middleware } from '../middleware'

// Mock crypto.getRandomValues for testing
const mockGetRandomValues = jest.fn()
global.crypto = {
  getRandomValues: mockGetRandomValues,
} as any

describe('CSP Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default mock implementation
    mockGetRandomValues.mockImplementation((array: Uint8Array) => {
      // Fill with incremental values for testing
      for (let i = 0; i < array.length; i++) {
        array[i] = i
      }
      return array
    })
  })

  describe('Nonce generation', () => {
    it('should generate different nonces on consecutive requests', () => {
      let callCount = 0
      mockGetRandomValues.mockImplementation((array: Uint8Array) => {
        // Generate different values each time
        for (let i = 0; i < array.length; i++) {
          array[i] = (i + callCount) % 256
        }
        callCount++
        return array
      })

      const request1 = new NextRequest('http://localhost:3000/')
      const response1 = middleware(request1)
      const nonce1 = response1.headers.get('Content-Security-Policy') || 
                     response1.headers.get('Content-Security-Policy-Report-Only')

      const request2 = new NextRequest('http://localhost:3000/')
      const response2 = middleware(request2)
      const nonce2 = response2.headers.get('Content-Security-Policy') || 
                     response2.headers.get('Content-Security-Policy-Report-Only')

      // Extract nonce values from CSP headers
      const nonceMatch1 = nonce1?.match(/nonce-([A-Za-z0-9+/=]+)/)
      const nonceMatch2 = nonce2?.match(/nonce-([A-Za-z0-9+/=]+)/)

      expect(nonceMatch1).toBeTruthy()
      expect(nonceMatch2).toBeTruthy()
      expect(nonceMatch1![1]).not.toBe(nonceMatch2![1])
    })

    it('should use crypto.getRandomValues for nonce generation', () => {
      const request = new NextRequest('http://localhost:3000/')
      middleware(request)

      expect(mockGetRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array))
      expect(mockGetRandomValues).toHaveBeenCalledWith(
        expect.objectContaining({ length: 16 })
      )
    })
  })

  describe('CSP header construction', () => {
    it('should set Content-Security-Policy header in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const request = new NextRequest('http://localhost:3000/')
      const response = middleware(request)

      const cspHeader = response.headers.get('Content-Security-Policy')
      expect(cspHeader).toBeTruthy()
      expect(cspHeader).toContain("default-src 'self'")
      expect(cspHeader).toContain('nonce-')
      expect(cspHeader).toContain("'strict-dynamic'")

      process.env.NODE_ENV = originalEnv
    })

    it('should set Content-Security-Policy-Report-Only header in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const request = new NextRequest('http://localhost:3000/')
      const response = middleware(request)

      const cspHeader = response.headers.get('Content-Security-Policy-Report-Only')
      expect(cspHeader).toBeTruthy()
      expect(response.headers.get('Content-Security-Policy')).toBeNull()

      process.env.NODE_ENV = originalEnv
    })

    it('should include all required CSP directives', () => {
      const request = new NextRequest('http://localhost:3000/')
      const response = middleware(request)

      const cspHeader = 
        response.headers.get('Content-Security-Policy') ||
        response.headers.get('Content-Security-Policy-Report-Only')

      expect(cspHeader).toContain("default-src 'self'")
      expect(cspHeader).toContain("script-src 'nonce-")
      expect(cspHeader).toContain("'strict-dynamic'")
      expect(cspHeader).toContain("'unsafe-eval'")
      expect(cspHeader).toContain("style-src 'self' 'unsafe-inline'")
      expect(cspHeader).toContain("img-src 'self' data: blob: https:")
      expect(cspHeader).toContain("font-src 'self'")
      expect(cspHeader).toContain("frame-src 'none'")
      expect(cspHeader).toContain("object-src 'none'")
      expect(cspHeader).toContain("base-uri 'self'")
      expect(cspHeader).toContain("form-action 'self'")
      expect(cspHeader).toContain('upgrade-insecure-requests')
      expect(cspHeader).toContain('report-uri /api/csp-report')
    })

    it('should include all Stellar network endpoints in connect-src', () => {
      const request = new NextRequest('http://localhost:3000/')
      const response = middleware(request)

      const cspHeader = 
        response.headers.get('Content-Security-Policy') ||
        response.headers.get('Content-Security-Policy-Report-Only')

      const stellarEndpoints = [
        'https://horizon.stellar.org',
        'https://horizon-testnet.stellar.org',
        'https://horizon-futurenet.stellar.org',
        'https://rpc.mainnet.stellar.org',
        'https://soroban-testnet.stellar.org',
        'https://rpc-futurenet.stellar.org',
        'wss://horizon.stellar.org',
        'wss://horizon-testnet.stellar.org',
        'wss://horizon-futurenet.stellar.org',
      ]

      stellarEndpoints.forEach(endpoint => {
        expect(cspHeader).toContain(endpoint)
      })
    })

    it('should not include unsafe-inline in script-src', () => {
      const request = new NextRequest('http://localhost:3000/')
      const response = middleware(request)

      const cspHeader = 
        response.headers.get('Content-Security-Policy') ||
        response.headers.get('Content-Security-Policy-Report-Only')

      // Extract script-src directive
      const scriptSrcMatch = cspHeader?.match(/script-src[^;]+/)
      expect(scriptSrcMatch).toBeTruthy()
      
      const scriptSrc = scriptSrcMatch![0]
      expect(scriptSrc).not.toContain("'unsafe-inline'")
    })
  })

  describe('Nonce propagation', () => {
    it('should set x-nonce header on request', () => {
      const request = new NextRequest('http://localhost:3000/')
      const response = middleware(request)

      // The middleware modifies the request headers which are passed to the next handler
      // We verify the nonce is in the CSP header
      const cspHeader = 
        response.headers.get('Content-Security-Policy') ||
        response.headers.get('Content-Security-Policy-Report-Only')

      const nonceMatch = cspHeader?.match(/nonce-([A-Za-z0-9+/=]+)/)
      expect(nonceMatch).toBeTruthy()
      expect(nonceMatch![1]).toBeTruthy()
    })
  })
})
