import { useState } from 'react'
import './DateRangeSelector.css'

interface DateRangeSelectorProps {
  filters: {
    startDate: string
    endDate: string
    streakMin: number
  }
  onFiltersChange: (filters: { startDate: string; endDate: string; streakMin: number }) => void
}

export default function DateRangeSelector({ filters, onFiltersChange }: DateRangeSelectorProps) {
  const [startDate, setStartDate] = useState(filters.startDate)
  const [endDate, setEndDate] = useState(filters.endDate)
  const [streakMin, setStreakMin] = useState(filters.streakMin)
  const [loading, setLoading] = useState(false)

  const handleUpdate = async () => {
    setLoading(true)
    await onFiltersChange({ startDate, endDate, streakMin })
    setLoading(false)
  }

  const setDateRange = (type: string) => {
    const today = new Date()
    let fromDate: Date
    let toDate = today

    switch (type) {
      case 'today':
        fromDate = new Date(today)
        break
      case 'yesterday':
        fromDate = new Date(today)
        fromDate.setDate(today.getDate() - 1)
        toDate = new Date(fromDate)
        break
      case 'week':
        fromDate = new Date(today)
        fromDate.setDate(today.getDate() - today.getDay())
        break
      case 'lastWeek':
        fromDate = new Date(today)
        fromDate.setDate(today.getDate() - today.getDay() - 7)
        toDate = new Date(fromDate)
        toDate.setDate(fromDate.getDate() + 6)
        break
      case 'month':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1)
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
        fromDate = new Date('2024-01-01')
        break
      default:
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1)
    }

    const fromStr = fromDate.toISOString().split('T')[0]
    const toStr = toDate.toISOString().split('T')[0]
    
    setStartDate(fromStr)
    setEndDate(toStr)
  }

  return (
    <div className="date-selector-box">
      <h3>📅 Select Date Range</h3>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#666' }}>
          Quick Select:
        </label>
        <div className="quick-buttons">
          <button className="quick-btn" onClick={() => setDateRange('today')}>Today</button>
          <button className="quick-btn" onClick={() => setDateRange('yesterday')}>Yesterday</button>
          <button className="quick-btn" onClick={() => setDateRange('week')}>This Week</button>
          <button className="quick-btn" onClick={() => setDateRange('lastWeek')}>Last Week</button>
          <button className="quick-btn" onClick={() => setDateRange('month')}>This Month</button>
          <button className="quick-btn" onClick={() => setDateRange('last30')}>Last 30 Days</button>
          <button className="quick-btn" onClick={() => setDateRange('last90')}>Last 90 Days</button>
          <button className="quick-btn" onClick={() => setDateRange('all')}>All Time</button>
        </div>
      </div>

      <div className="date-inputs">
        <div className="date-input-group">
          <label>From Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="date-input-group">
          <label>To Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="date-input-group">
          <label>Streak Filter:</label>
          <select value={streakMin} onChange={(e) => setStreakMin(Number(e.target.value))}>
            <option value="0">All streaks</option>
            <option value="7">Streak ≥ 7</option>
            <option value="30">Streak ≥ 30</option>
            <option value="60">Streak ≥ 60</option>
            <option value="100">Streak ≥ 100</option>
          </select>
        </div>

        <div className="date-input-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            className="btn btn-primary"
            onClick={handleUpdate}
            disabled={loading}
            style={{ width: '100%', padding: '10px 20px' }}
          >
            {loading ? (
              <>
                <span className="spinner"></span>Loading
              </>
            ) : (
              '🔍 Update Rankings'
            )}
          </button>
        </div>
      </div>

      <div className="current-range">
        <strong>Current Range:</strong> {filters.startDate} to {filters.endDate}
      </div>
    </div>
  )
}
