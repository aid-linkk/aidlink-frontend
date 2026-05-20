'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Filter, X } from 'lucide-react'

export interface CampaignFilters {
  sortBy: 'newest' | 'oldest' | 'mostFunded' | 'leastFunded' | 'endingSoon'
  minProgress: number
  maxProgress: number
  endDate: 'all' | 'week' | 'month' | 'quarter'
  selectedNGOs: string[]
}

interface CampaignFiltersProps {
  filters: CampaignFilters
  onFiltersChange: (filters: CampaignFilters) => void
  availableNGOs: string[]
}

export function CampaignFilters({ filters, onFiltersChange, availableNGOs }: CampaignFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSortChange = (sortBy: CampaignFilters['sortBy']) => {
    onFiltersChange({ ...filters, sortBy })
  }

  const handleProgressChange = (value: number[]) => {
    onFiltersChange({ ...filters, minProgress: value[0], maxProgress: value[1] })
  }

  const handleEndDateChange = (endDate: CampaignFilters['endDate']) => {
    onFiltersChange({ ...filters, endDate })
  }

  const toggleNGO = (ngo: string) => {
    const newNGOs = filters.selectedNGOs.includes(ngo)
      ? filters.selectedNGOs.filter((n) => n !== ngo)
      : [...filters.selectedNGOs, ngo]
    onFiltersChange({ ...filters, selectedNGOs: newNGOs })
  }

  const clearFilters = () => {
    onFiltersChange({
      sortBy: 'newest',
      minProgress: 0,
      maxProgress: 100,
      endDate: 'all',
      selectedNGOs: [],
    })
  }

  const hasActiveFilters =
    filters.sortBy !== 'newest' ||
    filters.minProgress !== 0 ||
    filters.maxProgress !== 100 ||
    filters.endDate !== 'all' ||
    filters.selectedNGOs.length > 0

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {[
                  filters.sortBy !== 'newest' ? 1 : 0,
                  filters.minProgress !== 0 || filters.maxProgress !== 100 ? 1 : 0,
                  filters.endDate !== 'all' ? 1 : 0,
                  filters.selectedNGOs.length > 0 ? 1 : 0,
                ].reduce((a, b) => a + b, 0)}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
            <DialogDescription>
              Customize your campaign search with advanced filters
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Sort By */}
            <div className="space-y-3">
              <Label>Sort By</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'newest', label: 'Newest' },
                  { value: 'oldest', label: 'Oldest' },
                  { value: 'mostFunded', label: 'Most Funded' },
                  { value: 'leastFunded', label: 'Least Funded' },
                  { value: 'endingSoon', label: 'Ending Soon' },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={filters.sortBy === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSortChange(option.value as CampaignFilters['sortBy'])}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Funding Progress */}
            <div className="space-y-3">
              <Label>Funding Progress ({filters.minProgress}% - {filters.maxProgress}%)</Label>
              <Slider
                value={[filters.minProgress, filters.maxProgress]}
                onValueChange={handleProgressChange}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* End Date */}
            <div className="space-y-3">
              <Label>End Date</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All Time' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                  { value: 'quarter', label: 'This Quarter' },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={filters.endDate === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleEndDateChange(option.value as CampaignFilters['endDate'])}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* NGOs */}
            <div className="space-y-3">
              <Label>NGOs</Label>
              <div className="flex flex-wrap gap-2">
                {availableNGOs.map((ngo) => (
                  <Button
                    key={ngo}
                    variant={filters.selectedNGOs.includes(ngo) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleNGO(ngo)}
                  >
                    {filters.selectedNGOs.includes(ngo) && <X className="mr-1 h-3 w-3" />}
                    {ngo}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="ghost" onClick={clearFilters}>
              Clear All
            </Button>
            <Button onClick={() => setIsOpen(false)}>Apply Filters</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
