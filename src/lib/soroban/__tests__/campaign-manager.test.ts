import { xdr } from '@stellar/stellar-sdk'
import { CampaignManagerClient } from '../campaign-manager'
import { SorobanSDK } from '../sdk'

describe('CampaignManagerClient', () => {
  let mockSdk: jest.Mocked<SorobanSDK>
  let client: CampaignManagerClient

  beforeEach(() => {
    mockSdk = {
      simulateOnly: jest.fn(),
      submitTransaction: jest.fn(),
      getTransactionStatus: jest.fn(),
      getNetworkPassphrase: jest.fn().mockReturnValue('Test SDF Network ; September 2021'),
    } as any

    client = new CampaignManagerClient(mockSdk, 'C1234567890ABCDEF')
  })

  test('simulateCreateCampaign calls sdk.simulateOnly and returns estimatedFeeLumens as a positive number', async () => {
    mockSdk.simulateOnly.mockResolvedValueOnce({
      estimatedFeeLumens: 0.0245,
      footprint: {} as any,
      rawResponse: { status: 'SUCCESS' } as any,
    })

    const result = await client.simulateCreateCampaign(
      {
        title: 'Emergency Flood Relief',
        description: 'Providing immediate food and shelter to flood victims.',
        targetAmountXlm: 1000,
        endDateUnix: Math.floor(Date.now() / 1000) + 86400 * 30,
        category: 'emergency',
      },
      'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'
    )

    expect(mockSdk.simulateOnly).toHaveBeenCalledWith(
      'C1234567890ABCDEF',
      'create_campaign',
      expect.any(Array),
      'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'
    )
    expect(result.estimatedFeeLumens).toBeGreaterThan(0)
    expect(result.estimatedFeeLumens).toBe(0.0245)
  })

  test('createCampaign returns campaignId decoded from scvU64 return value', async () => {
    const mockTx = {
      toXDR: () => 'mockUnsignedXdr',
      toXdr: () => ({ toString: () => 'mockUnsignedXdr' }),
    }

    mockSdk.simulateOnly.mockResolvedValueOnce({
      estimatedFeeLumens: 0.01,
      transaction: mockTx as any,
      rawResponse: { status: 'SUCCESS' } as any,
    })

    mockSdk.submitTransaction.mockResolvedValueOnce('mockTxHash123')

    const mockScValU64 = xdr.ScVal.scvU64(xdr.Uint64.fromString('42'))

    const mockResultMetaXdr = {
      v3: () => ({
        sorobanMeta: () => ({
          returnValue: () => mockScValU64,
        }),
      }),
    }

    mockSdk.getTransactionStatus.mockResolvedValueOnce({
      status: 'SUCCESS',
      resultMetaXdr: mockResultMetaXdr,
    } as any)

    const mockSigner = jest.fn().mockResolvedValue('mockSignedXdr')

    // Mock TransactionBuilder.fromXDR
    jest.spyOn(require('@stellar/stellar-sdk').TransactionBuilder, 'fromXDR').mockReturnValue({} as any)

    const result = await client.createCampaign(
      {
        title: 'Education for Children',
        description: 'Building schools and providing supplies.',
        targetAmountXlm: 500,
        endDateUnix: Math.floor(Date.now() / 1000) + 86400 * 10,
        category: 'education',
      },
      'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
      mockSigner
    )

    expect(mockSigner).toHaveBeenCalledWith('mockUnsignedXdr')
    expect(mockSdk.submitTransaction).toHaveBeenCalled()
    expect(result.campaignId).toBe('42')
    expect(result.txHash).toBe('mockTxHash123')
  })
})
