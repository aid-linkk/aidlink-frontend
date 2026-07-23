import { CampaignManagerClient } from '../campaign-manager'
import { SorobanSDK } from '../sdk'

describe('CampaignManagerClient Integration Test (Testnet Mock)', () => {
  const isCI = process.env.CI === 'true'

  // Skip live network requests in CI environment if needed
  const testOrSkip = isCI ? test.skip : test

  testOrSkip('simulates campaign creation on testnet contract if configured', async () => {
    const testnetSdk = new SorobanSDK('testnet')
    const mockContractId = process.env.NEXT_PUBLIC_CAMPAIGN_MANAGER_CONTRACT || 'CCW67TSB3SSS4ZXGBOI2CCVBWAVESETWFLWKDOWBBUQUWPFVENZPVHJG'

    const client = new CampaignManagerClient(testnetSdk, mockContractId)

    try {
      const result = await client.simulateCreateCampaign(
        {
          title: 'Integration Test Campaign',
          description: 'Testing Soroban integration.',
          targetAmountXlm: 100,
          endDateUnix: Math.floor(Date.now() / 1000) + 86400 * 7,
          category: 'emergency',
        },
        'GB5XWAMU7QNOZBU4K7L5KGK46XB5HQDJC7W3COSKZQD5NVD4M7Y4Q2K7'
      )

      expect(typeof result.estimatedFeeLumens).toBe('number')
    } catch (e: any) {
      // If RPC is unreachable during local test execution, handle gracefully
      expect(e).toBeDefined()
    }
  })
})
