import { useState, useEffect } from 'react'
import './DateRangeSelector.css'

interface DateRangeSelectorProps {
  filters: {
    startDate: string
    endDate: string
    streakMin: number
  }
  onFiltersChange: (filters: { startDate: string; endDate: string; streakMin: number }) => void
  loading?: boolean
}

export default function DateRangeSelector({ filters, onFiltersChange, loading = false }: DateRangeSelectorProps) {
  const [startDate, setStartDate] = useState(filters.startDate)
  const [endDate, setEndDate] = useState(filters.endDate)
  const [streakMin, setStreakMin] = useState(filters.streakMin)
  const [isUpdating, setIsUpdating] = useState(false)

  // Auto-update when any filter changes
  useEffect(() => {
    setIsUpdating(true)
    const timer = setTimeout(() => {
      onFiltersChange({ startDate, endDate, streakMin })
      setIsUpdating(false)
    }, 300) // 300ms debounce to avoid too many requests while typing

    return () => {
      clearTimeout(timer)
      setIsUpdating(false)
    }
  }, [startDate, endDate, streakMin])

  // Combined loading state: either API is loading or local debounce is active
  const isDisabled = loading || isUpdating

  const setDateRange = (type: string) => {
    const today = new Date()
    const hardLimit = new Date('2025-12-01')
    let fromDate: Date
    let toDate = today

    switch (type) {
      case 'today':
        fromDate = new Date(today)
        break
      case 'week':
        fromDate = new Date(today)
        fromDate.setDate(today.getDate() - today.getDay())
        break
      case 'month':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1)
        // Reset to start of day to avoid timezone issues
        fromDate.setHours(0, 0, 0, 0)
        break
      case 'lastMonth':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        toDate = new Date(today.getFullYear(), today.getMonth(), 0) // Last day of previous month
        fromDate.setHours(0, 0, 0, 0)
        toDate.setHours(0, 0, 0, 0)
        break
      case 'last30':
        fromDate = new Date(today)
        fromDate.setDate(today.getDate() - 30)
        break
      case 'last90':
        fromDate = new Date(today)
        fromDate.setDate(today.getDate() - 90)
        break
      case 'all':
        fromDate = new Date('2025-12-01')
        break
      default:
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1)
    }

    // Apply hard limit: don't allow dates before 2025-12-01
    if (fromDate < hardLimit) {
      fromDate = hardLimit
    }

    // Format dates in local timezone (YYYY-MM-DD)
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const fromStr = formatLocalDate(fromDate)
    const toStr = formatLocalDate(toDate)
    
    setStartDate(fromStr)
    setEndDate(toStr)
  }

  return (
    <div className="date-selector-box">
      <h3>📅 Select Date Range</h3>
      <p style={{ fontSize: '0.85em', color: '#999', marginTop: '-8px', marginBottom: '12px', fontStyle: 'italic' }}>
        All dates are in UTC timezone
      </p>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#666' }}>
          Quick Select:
        </label>
        <div className="quick-buttons">
          <button className="quick-btn" onClick={() => setDateRange('today')} disabled={isDisabled}>Today</button>
          <button className="quick-btn" onClick={() => setDateRange('week')} disabled={isDisabled}>This Week</button>
          <button className="quick-btn" onClick={() => setDateRange('month')} disabled={isDisabled}>This Month</button>
          <button className="quick-btn" onClick={() => setDateRange('lastMonth')} disabled={isDisabled}>Last Month</button>
          <button className="quick-btn" onClick={() => setDateRange('last30')} disabled={isDisabled}>Last 30 Days</button>
          <button className="quick-btn" onClick={() => setDateRange('last90')} disabled={isDisabled}>Last 90 Days</button>
          <button className="quick-btn" onClick={() => setDateRange('all')} disabled={isDisabled}>All Time</button>
        </div>
      </div>

      <div className="date-inputs">
        <div className="date-input-group">
          <label>From Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isDisabled}
          />
        </div>

        <div className="date-input-group">
          <label>To Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isDisabled}
          />
        </div>

        <div className="date-input-group">
          <label>Streak Filter:</label>
          <select value={streakMin} onChange={(e) => setStreakMin(Number(e.target.value))} disabled={isDisabled}>
            <option value="0">All streaks</option>
            <option value="7">Streak ≥ 7</option>
            <option value="30">Streak ≥ 30</option>
            <option value="60">Streak ≥ 60</option>
            <option value="100">Streak ≥ 100</option>
          </select>
        </div>
      </div>

      <div className="current-range">
        <strong>Current Range:</strong> {filters.startDate} to {filters.endDate}
        {isDisabled && (
          <span style={{ marginLeft: '10px', color: '#1cb0f6' }}>
            <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
            Updating...
          </span>
        )}
      </div>
    </div>
  )
}
