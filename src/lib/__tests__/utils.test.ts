import { calculateCampaignProgress, getCampaignFundingStatus } from '../utils'

describe('calculateCampaignProgress', () => {
  it('returns 0 when target and raised are both 0', () => {
    expect(calculateCampaignProgress(0, 0)).toBe(0)
  })

  it('returns 100 when target is 0 and raised > 0', () => {
    expect(calculateCampaignProgress(100, 0)).toBe(100)
  })

  it('returns 0 when raised is 0 and target > 0', () => {
    expect(calculateCampaignProgress(0, 50000)).toBe(0)
  })

  it('returns correct percentage for partial funding', () => {
    expect(calculateCampaignProgress(35000, 50000)).toBe(70)
  })

  it('returns 100 when raised equals target', () => {
    expect(calculateCampaignProgress(50000, 50000)).toBe(100)
  })

  it('clamps to 100 when raised exceeds target', () => {
    expect(calculateCampaignProgress(60000, 50000)).toBe(100)
  })

  it('handles negative raised amounts', () => {
    expect(calculateCampaignProgress(-100, 50000)).toBe(0)
  })

  it('handles negative target amounts', () => {
    expect(calculateCampaignProgress(100, -100)).toBe(100)
  })

  it('handles string numbers', () => {
    expect(calculateCampaignProgress(Number('35000'), Number('50000'))).toBe(70)
  })
})

describe('getCampaignFundingStatus', () => {
  it('returns no contributions state for zero raised', () => {
    const status = getCampaignFundingStatus(0, 50000)
    expect(status.label).toBe('0% funded')
    expect(status.description).toBe('No contributions yet')
  })

  it('returns fully funded state when raised equals target', () => {
    const status = getCampaignFundingStatus(50000, 50000)
    expect(status.label).toBe('100% funded')
    expect(status.description).toBe('Campaign fully funded')
  })

  it('returns fully funded state when raised exceeds target', () => {
    const status = getCampaignFundingStatus(60000, 50000)
    expect(status.label).toBe('100% funded')
    expect(status.description).toBe('Campaign fully funded')
  })

  it('returns partial funding status with remaining amount', () => {
    const status = getCampaignFundingStatus(35000, 50000)
    expect(status.label).toBe('70% funded')
    expect(status.description).toContain('XLM remaining')
  })

  it('handles zero target with zero raised', () => {
    const status = getCampaignFundingStatus(0, 0)
    expect(status.label).toBe('0% funded')
    expect(status.description).toBe('No contributions yet')
  })

  it('handles zero target with positive raised', () => {
    const status = getCampaignFundingStatus(100, 0)
    expect(status.label).toBe('100% funded')
    expect(status.description).toBe('Campaign fully funded')
  })
})
