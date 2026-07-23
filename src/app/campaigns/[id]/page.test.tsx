jest.mock('@/components/layout/navigation', () => ({
  Navigation: () => null,
}))

import { act, render, screen } from '@testing-library/react'
import CampaignDetailPage from './page'

describe('CampaignDetailPage', () => {
  it('shows loading placeholders and then campaign content', () => {
    jest.useFakeTimers()

    const { container } = render(<CampaignDetailPage params={Promise.resolve({ id: 'campaign-1' })} />)

    expect(container.querySelector('.animate-pulse')).toBeTruthy()
    expect(screen.queryByText('Emergency Relief for Flood Victims')).toBeNull()

    act(() => {
      jest.advanceTimersByTime(600)
    })

    expect(screen.queryByText('Emergency Relief for Flood Victims')).not.toBeNull()
    expect(container.querySelector('.animate-pulse')).toBeNull()

    jest.useRealTimers()
  })
})
