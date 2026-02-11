import { useState, useEffect } from 'react'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import SpaceBetween from '@cloudscape-design/components/space-between'
import FormField from '@cloudscape-design/components/form-field'
import DatePicker from '@cloudscape-design/components/date-picker'
import Select, { SelectProps } from '@cloudscape-design/components/select'
import Button from '@cloudscape-design/components/button'
import Box from '@cloudscape-design/components/box'
import ColumnLayout from '@cloudscape-design/components/column-layout'
import Spinner from '@cloudscape-design/components/spinner'

interface DateRangeSelectorProps {
  filters: {
    startDate: string
    endDate: string
    streakMin: number
  }
  onFiltersChange: (filters: { startDate: string; endDate: string; streakMin: number }) => void
  loading?: boolean
}

const streakOptions: SelectProps.Option[] = [
  { value: '0', label: 'All streaks' },
  { value: '7', label: 'Streak ≥ 7' },
  { value: '30', label: 'Streak ≥ 30' },
  { value: '60', label: 'Streak ≥ 60' },
  { value: '100', label: 'Streak ≥ 100' },
]

export default function DateRangeSelector({ filters, onFiltersChange, loading = false }: DateRangeSelectorProps) {
  const [startDate, setStartDate] = useState(filters.startDate)
  const [endDate, setEndDate] = useState(filters.endDate)
  const [streakMin, setStreakMin] = useState(filters.streakMin)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    setIsUpdating(true)
    const timer = setTimeout(() => {
      onFiltersChange({ startDate, endDate, streakMin })
      setIsUpdating(false)
    }, 300)

    return () => {
      clearTimeout(timer)
      setIsUpdating(false)
    }
  }, [startDate, endDate, streakMin])

  const isDisabled = loading || isUpdating

  const applyQuickFilter = (type: string) => {
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const hardLimit = new Date('2025-12-01')
    let fromDate: Date
    let toDate = today

    switch (type) {
      case 'today':
        fromDate = new Date(today)
        break
      case 'week':
        fromDate = new Date(today)
        fromDate.setUTCDate(today.getUTCDate() - today.getUTCDay())
        break
      case 'month':
        fromDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
        break
      case 'lastMonth':
        fromDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1))
        toDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0))
        break
      case 'last30':
        fromDate = new Date(today)
        fromDate.setUTCDate(today.getUTCDate() - 30)
        break
      case 'last90':
        fromDate = new Date(today)
        fromDate.setUTCDate(today.getUTCDate() - 90)
        break
      case 'all':
        fromDate = new Date('2025-12-01')
        break
      default:
        fromDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
    }

    if (fromDate < hardLimit) {
      fromDate = hardLimit
    }

    const formatUTCDate = (date: Date) => {
      const year = date.getUTCFullYear()
      const month = String(date.getUTCMonth() + 1).padStart(2, '0')
      const day = String(date.getUTCDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    setStartDate(formatUTCDate(fromDate))
    setEndDate(formatUTCDate(toDate))
  }

  const selectedStreakOption = streakOptions.find(o => o.value === String(streakMin)) || streakOptions[0]

  return (
    <Container
      header={
        <Header
          variant="h3"
          description="All dates are in UTC timezone"
        >
          📅 Date Range
        </Header>
      }
    >
      <SpaceBetween size="m">
        <SpaceBetween size="xs" direction="horizontal">
          <Button onClick={() => applyQuickFilter('today')} disabled={isDisabled} variant="normal">Today</Button>
          <Button onClick={() => applyQuickFilter('week')} disabled={isDisabled} variant="normal">This Week</Button>
          <Button onClick={() => applyQuickFilter('month')} disabled={isDisabled} variant="normal">This Month</Button>
          <Button onClick={() => applyQuickFilter('lastMonth')} disabled={isDisabled} variant="normal">Last Month</Button>
          <Button onClick={() => applyQuickFilter('last30')} disabled={isDisabled} variant="normal">Last 30 Days</Button>
          <Button onClick={() => applyQuickFilter('last90')} disabled={isDisabled} variant="normal">Last 90 Days</Button>
          <Button onClick={() => applyQuickFilter('all')} disabled={isDisabled} variant="normal">All Time</Button>
        </SpaceBetween>

        <ColumnLayout columns={3}>
          <FormField label="From Date">
            <DatePicker
              value={startDate}
              onChange={({ detail }) => setStartDate(detail.value)}
              disabled={isDisabled}
              placeholder="YYYY-MM-DD"
            />
          </FormField>

          <FormField label="To Date">
            <DatePicker
              value={endDate}
              onChange={({ detail }) => setEndDate(detail.value)}
              disabled={isDisabled}
              placeholder="YYYY-MM-DD"
            />
          </FormField>

          <FormField label="Streak Filter">
            <Select
              selectedOption={selectedStreakOption}
              onChange={({ detail }) => setStreakMin(Number(detail.selectedOption.value))}
              options={streakOptions}
              disabled={isDisabled}
            />
          </FormField>
        </ColumnLayout>

        <Box color="text-status-info" fontSize="body-s">
          <strong>Current Range:</strong> {filters.startDate} to {filters.endDate}
          {isDisabled && (
            <Box variant="span" margin={{ left: 's' }}>
              <Spinner size="normal" /> Updating...
            </Box>
          )}
        </Box>
      </SpaceBetween>
    </Container>
  )
}
