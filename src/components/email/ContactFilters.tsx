import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Filter } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

interface ContactFiltersProps {
  onFilterChange: (filters: any) => void
  className?: string
}

export default function ContactFilters({ onFilterChange, className }: ContactFiltersProps) {
  const [filters, setFilters] = useState({
    title: '',
    company: '',
    industry: '',
    email: ''
  })
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const applyFilter = (key: string, value: string) => {
    if (value) {
      const newFilters = { ...filters, [key]: value }
      setFilters(newFilters)
      setActiveFilters([...new Set([...activeFilters, key])])
      onFilterChange(newFilters)
    }
  }

  const removeFilter = (key: string) => {
    const newFilters = { ...filters, [key]: '' }
    setFilters(newFilters)
    setActiveFilters(activeFilters.filter(f => f !== key))
    onFilterChange(newFilters)
  }

  const clearAll = () => {
    setFilters({
      title: '',
      company: '',
      industry: '',
      email: ''
    })
    setActiveFilters([])
    onFilterChange({})
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter Contacts
              {activeFilters.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title-filter">Title contains</Label>
                <Input
                  id="title-filter"
                  placeholder="e.g., VP, Director"
                  value={filters.title}
                  onChange={(e) => applyFilter('title', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="company-filter">Company contains</Label>
                <Input
                  id="company-filter"
                  placeholder="e.g., Tech, Inc"
                  value={filters.company}
                  onChange={(e) => applyFilter('company', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="industry-filter">Industry</Label>
                <Input
                  id="industry-filter"
                  placeholder="e.g., SaaS, Healthcare"
                  value={filters.industry}
                  onChange={(e) => applyFilter('industry', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email-filter">Email domain</Label>
                <Input
                  id="email-filter"
                  placeholder="e.g., gmail.com"
                  value={filters.email}
                  onChange={(e) => applyFilter('email', e.target.value)}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {activeFilters.length > 0 && (
          <>
            <div className="flex gap-1">
              {activeFilters.map(filter => (
                <Badge key={filter} variant="secondary" className="gap-1">
                  {filter}: {filters[filter as keyof typeof filters]}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeFilter(filter)}
                  />
                </Badge>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
            >
              Clear all
            </Button>
          </>
        )}
      </div>
    </div>
  )
}