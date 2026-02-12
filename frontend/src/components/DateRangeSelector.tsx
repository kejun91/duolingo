import { useState, useEffect } from 'react'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import SpaceBetween from '@cloudscape-design/components/space-between'
import FormField from '@cloudscape-design/components/form-field'
import DateRangePicker, { DateRangePickerProps } from '@cloudscape-design/components/date-range-picker'
import Select, { SelectProps } from '@cloudscape-design/components/select'
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

const relativeOptions: DateRangePickerProps.RelativeOption[] = [
  { key: 'today', amount: 0, unit: 'day', type: 'relative' },
  { key: 'last-7', amount: 7, unit: 'day', type: 'relative' },
  { key: 'last-30', amount: 30, unit: 'day', type: 'relative' },
  { key: 'last-90', amount: 90, unit: 'day', type: 'relative' },
]

const HARD_LIMIT = '2025-12-01'

export default function DateRangeSelector({ filters, onFiltersChange, loading = false }: DateRangeSelectorProps) {
  const [rangeValue, setRangeValue] = useState<DateRangePickerProps.Value | null>({
    type: 'absolute',
    startDate: filters.startDate,
    endDate: filters.endDate,
  })
  const [streakMin, setStreakMin] = useState(filters.streakMin)
  const [isUpdating, setIsUpdating] = useState(false)

  // Sync streak changes with debounce
  useEffect(() => {
    setIsUpdating(true)
    const timer = setTimeout(() => {
      onFiltersChange({ startDate: filters.startDate, endDate: filters.endDate, streakMin })
      setIsUpdating(false)
    }, 300)
    return () => { clearTimeout(timer); setIsUpdating(false) }
  }, [streakMin])

  const isDisabled = loading || isUpdating

  const formatUTCDate = (date: Date) => {
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const resolveRange = (value: DateRangePickerProps.Value): { startDate: string; endDate: string } => {
    if (value.type === 'absolute') {
      let start = value.startDate
      if (start < HARD_LIMIT) start = HARD_LIMIT
      return { startDate: start, endDate: value.endDate }
    }

    // Relative → compute absolute dates
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const endDate = formatUTCDate(today)

    if (value.amount === 0) {
      return { startDate: endDate, endDate }
    }

    const from = new Date(today)
    switch (value.unit) {
      case 'day':
        from.setUTCDate(from.getUTCDate() - value.amount)
        break
      case 'week':
        from.setUTCDate(from.getUTCDate() - value.amount * 7)
        break
      case 'month':
        from.setUTCMonth(from.getUTCMonth() - value.amount)
        break
      case 'year':
        from.setUTCFullYear(from.getUTCFullYear() - value.amount)
        break
    }

    const hardLimit = new Date(HARD_LIMIT)
    const startDate = from < hardLimit ? HARD_LIMIT : formatUTCDate(from)
    return { startDate, endDate }
  }

  const handleRangeChange: DateRangePickerProps['onChange'] = ({ detail }) => {
    const newValue = detail.value
    setRangeValue(newValue)

    if (newValue) {
      const resolved = resolveRange(newValue)
      onFiltersChange({ ...resolved, streakMin })
    }
  }

  const isValidRange: DateRangePickerProps.ValidationFunction = (value) => {
    if (!value) return { valid: false, errorMessage: 'Select a date range' }

    if (value.type === 'absolute') {
      if (!value.startDate || !value.endDate) {
        return { valid: false, errorMessage: 'Provide both start and end dates' }
      }
      if (value.startDate > value.endDate) {
        return { valid: false, errorMessage: 'Start date must be before end date' }
      }
      if (value.startDate < HARD_LIMIT) {
        return { valid: false, errorMessage: `Earliest available date is ${HARD_LIMIT}` }
      }
    }

    if (value.type === 'relative' && value.amount < 0) {
      return { valid: false, errorMessage: 'Duration must be positive' }
    }

    return { valid: true }
  }

  const selectedStreakOption = streakOptions.find(o => o.value === String(streakMin)) || streakOptions[0]

  return (
    <Container
      header={
        <Header variant="h2" description="All dates are in UTC timezone">
          Date Range
        </Header>
      }
    >
      <SpaceBetween size="m">
        <ColumnLayout columns={2}>
          <FormField label="Date range">
            <DateRangePicker
              value={rangeValue}
              onChange={handleRangeChange}
              isValidRange={isValidRange}
              relativeOptions={relativeOptions}
              rangeSelectorMode="default"
              dateOnly
              disabled={isDisabled}
              placeholder="Select a date range"
              i18nStrings={{
                todayAriaLabel: 'Today',
                nextMonthAriaLabel: 'Next month',
                previousMonthAriaLabel: 'Previous month',
                relativeModeTitle: 'Relative',
                absoluteModeTitle: 'Absolute',
                relativeRangeSelectionHeading: 'Choose a range',
                cancelButtonLabel: 'Cancel',
                clearButtonLabel: 'Clear',
                applyButtonLabel: 'Apply',
                customRelativeRangeDurationLabel: 'Duration',
                customRelativeRangeDurationPlaceholder: 'Enter duration',
                customRelativeRangeOptionLabel: 'Custom range',
                customRelativeRangeOptionDescription: 'Set a custom range in the past',
                customRelativeRangeUnitLabel: 'Unit of time',
                formatRelativeRange: (value) => {
                  if (value.amount === 0) return 'Today'
                  const unit = value.amount === 1 ? value.unit : `${value.unit}s`
                  return `Last ${value.amount} ${unit}`
                },
                formatUnit: (unit, value) => {
                  const plural = value !== 1 ? 's' : ''
                  return `${unit}${plural}`
                },
                startDateLabel: 'Start date',
                endDateLabel: 'End date',
                dateConstraintText: `Range starts from ${HARD_LIMIT}`,
                errorIconAriaLabel: 'Error',
              }}
            />
          </FormField>

          <FormField label="Streak filter">
            <Select
              selectedOption={selectedStreakOption}
              onChange={({ detail }) => setStreakMin(Number(detail.selectedOption.value))}
              options={streakOptions}
              disabled={isDisabled}
            />
          </FormField>
        </ColumnLayout>

        {isDisabled && (
          <Box color="text-status-info" fontSize="body-s">
            <Spinner size="normal" /> Updating...
          </Box>
        )}
      </SpaceBetween>
    </Container>
  )
}
