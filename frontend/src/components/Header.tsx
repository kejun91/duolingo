import { useState, useEffect } from 'react'
import './Header.css'

export default function Header() {
  const [lastCollectionTime, setLastCollectionTime] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/last-collection-time')
      .then(res => res.json())
      .then(data => setLastCollectionTime(data.lastCollectionTime))
      .catch(err => console.error('Failed to fetch last collection time:', err))
  }, [])

  const handleHomeClick = () => {
    window.location.href = '/'
  }

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp * 1000) // Convert seconds to milliseconds
    return date.toUTCString()
  }

  return (
    <header className="header">
      <h1 onClick={handleHomeClick} style={{ cursor: 'pointer' }}>
        🦉 Duolingo Progress Tracker
      </h1>
      <p className="subtitle">Track XP progress and rankings over time</p>
      <p className="last-collection">
        Last updated: {formatTimestamp(lastCollectionTime)} (UTC)
      </p>
    </header>
  )
}
