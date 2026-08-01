import { fireEvent, render, screen } from '@testing-library/react'
import { CampaignComparison } from './campaign-comparison'

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

describe('CampaignComparison', () => {
  const campaigns = [
    {
      id: '1',
      title: 'Emergency Relief Drive',
      description: 'Support emergency aid',
      targetAmount: 100000,
      raisedAmount: 70000,
      category: 'emergency',
      ngoName: 'Global Relief',
      endDate: '2026-12-31',
    },
    {
      id: '2',
      title: 'Clean Water Initiative',
      description: 'Bring water to communities',
      targetAmount: 120000,
      raisedAmount: 80000,
      category: 'healthcare',
      ngoName: 'Water for All',
      endDate: '2026-11-30',
    },
  ]

  it('renders campaign options as accessible selection buttons', () => {
    render(<CampaignComparison campaigns={campaigns} />)

    fireEvent.click(screen.getByRole('button', { name: /compare campaigns/i }))

    const optionButton = screen.getByRole('button', {
      name: /select campaign emergency relief drive/i,
    })

    expect(optionButton).toHaveAttribute('aria-pressed', 'false')
  })
})
