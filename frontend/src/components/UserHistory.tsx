import { useEffect, useState } from 'react'
import './UserHistory.css'

interface Snapshot {
  date: string
  data: {
    username?: string
    name?: string
    totalXp?: number
    streak?: number
    [key: string]: any
  }
}

interface UserHistoryProps {
  userId: string
  onBack: () => void
}

export default function UserHistory({ userId, onBack }: UserHistoryProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setError('No user ID provided')
      setLoading(false)
      return
    }

    loadHistory()
  }, [userId])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/user-history?userId=${userId}`)
      
      if (!res.ok) {
        throw new Error('Failed to load user history')
      }
      
      const data = await res.json()
      setSnapshots(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  const calculateChange = (current: number, previous: number) => {
    const change = current - previous
    return {
      value: change,
      className: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'
    }
  }

  if (loading) {
    return (
      <div className="user-history">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <span className="spinner" style={{ borderColor: '#1cb0f6', borderTopColor: 'rgba(28, 176, 246, 0.3)' }}></span>
            <p style={{ marginTop: '20px', color: '#666' }}>Loading history...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="user-history">
        <div className="card">
          <div className="message error">{error}</div>
          <button className="btn btn-primary" onClick={onBack}>
            ← Go Back
          </button>
        </div>
      </div>
    )
  }

  const userInfo = snapshots[0]?.data || {}
  const username = userInfo.username || `User ${userId}`
  const name = userInfo.name

  return (
    <div className="user-history">
      <div className="card">
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#333', marginBottom: '5px' }}>📊 {name || username}'s History</h2>
            {name && username && <p style={{ color: '#666', fontSize: '0.9em' }}>@{username}</p>}
          </div>
          <button className="btn btn-secondary" onClick={onBack}>
            ← Back
          </button>
        </div>

        {snapshots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            No history data available for this user.
          </div>
        ) : (
          <>
            <div className="stats-summary">
              <div className="stat-item">
                <div className="stat-label">Current XP</div>
                <div className="stat-value">{snapshots[0].data.totalXp?.toLocaleString() || 0}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Current Streak</div>
                <div className="stat-value">🔥 {snapshots[0].data.streak || 0}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Days Tracked</div>
                <div className="stat-value">{snapshots.length}</div>
              </div>
            </div>

            <div style={{ overflowX: 'auto', marginTop: '30px' }}>
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total XP</th>
                    <th>XP Change</th>
                    <th>Streak</th>
                    <th>Streak Change</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((snapshot, index) => {
                    const previousSnapshot = snapshots[index + 1]
                    const xpChange = previousSnapshot
                      ? calculateChange(
                          snapshot.data.totalXp || 0,
                          previousSnapshot.data.totalXp || 0
                        )
                      : null
                    const streakChange = previousSnapshot
                      ? calculateChange(
                          snapshot.data.streak || 0,
                          previousSnapshot.data.streak || 0
                        )
                      : null

                    return (
                      <tr key={snapshot.date}>
                        <td>{snapshot.date}</td>
                        <td>{(snapshot.data.totalXp || 0).toLocaleString()}</td>
                        <td>
                          {xpChange ? (
                            <span className={`change-badge ${xpChange.className}`}>
                              {xpChange.value > 0 ? '+' : ''}{xpChange.value.toLocaleString()}
                            </span>
                          ) : (
                            <span style={{ color: '#999' }}>—</span>
                          )}
                        </td>
                        <td>🔥 {snapshot.data.streak || 0}</td>
                        <td>
                          {streakChange ? (
                            <span className={`change-badge ${streakChange.className}`}>
                              {streakChange.value > 0 ? '+' : ''}{streakChange.value}
                            </span>
                          ) : (
                            <span style={{ color: '#999' }}>—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
