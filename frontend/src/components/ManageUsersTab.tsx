import { useState } from 'react'
import { User } from '../App'
import './ManageUsersTab.css'

interface ManageUsersTabProps {
  trackedUsers: User[]
  untrackedUsers: User[]
  onRefresh: () => void
}

export default function ManageUsersTab({ trackedUsers, untrackedUsers, onRefresh }: ManageUsersTabProps) {
  const [newUsername, setNewUsername] = useState('')
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(false)

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 5000)
  }

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUsername.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername.trim() })
      })
      const data = await res.json()
      
      if (res.ok) {
        showMessage(`✅ User ${data.username || newUsername} added successfully!`, 'success')
        setNewUsername('')
        onRefresh()
      } else {
        showMessage(`❌ ${data.error}`, 'error')
      }
    } catch (error) {
      showMessage(`❌ Failed to add user: ${error}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const untrackUser = async (userId: number) => {
    try {
      const res = await fetch('/api/untrack-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: String(userId) })
      })
      
      if (res.ok) {
        showMessage(`✅ User untracked successfully`, 'success')
        onRefresh()
      } else {
        const data = await res.json()
        showMessage(`❌ ${data.error}`, 'error')
      }
    } catch (error) {
      showMessage(`❌ Failed to untrack user: ${error}`, 'error')
    }
  }

  const retrackUser = async (userId: number) => {
    try {
      const res = await fetch('/api/retrack-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: String(userId) })
      })
      
      if (res.ok) {
        showMessage(`✅ User retracked successfully`, 'success')
        onRefresh()
      } else {
        const data = await res.json()
        showMessage(`❌ ${data.error}`, 'error')
      }
    } catch (error) {
      showMessage(`❌ Failed to retrack user: ${error}`, 'error')
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: '20px', color: '#333' }}>👥 Manage Users</h2>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={addUser} className="user-form">
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Enter Duolingo Username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <p style={{ fontSize: '0.85em', color: '#666', margin: '5px 0 0 0' }}>
            💡 Enter the Duolingo username (e.g., john_doe123)
          </p>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner"></span>Adding...
            </>
          ) : (
            '➕ Add User'
          )}
        </button>
      </form>

      <h3 style={{ marginTop: '30px', marginBottom: '15px', color: '#333' }}>
        📊 Tracked Users ({trackedUsers.length})
      </h3>
      <div className="user-list">
        {trackedUsers.map((user) => (
          <div key={user.id} className="user-card">
            <div className="user-info">
              <h3>
                {user.name || user.username || `User ${user.id}`}
                <a 
                  href={`https://www.duolingo.com/profile/${user.username || user.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-link"
                  title="View Duolingo Profile"
                >
                  🔗
                </a>
              </h3>
              {user.name && user.username && (
                <p>@{user.username}</p>
              )}
              <p style={{ fontSize: '0.85em', color: '#999', marginTop: '4px' }}>ID: {user.id}</p>
            </div>
            <button className="btn btn-danger" onClick={() => untrackUser(user.id)}>
              🗑️ Untrack
            </button>
          </div>
        ))}
        {trackedUsers.length === 0 && (
          <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
            No tracked users. Add some users above to get started!
          </p>
        )}
      </div>

      {untrackedUsers.length > 0 && (
        <>
          <h3 style={{ marginTop: '30px', marginBottom: '15px', color: '#333' }}>
            💤 Untracked Users ({untrackedUsers.length})
          </h3>
          <div className="user-list">
            {untrackedUsers.map((user) => (
              <div key={user.id} className="user-card" style={{ opacity: 0.7 }}>
                <div className="user-info">
                  <h3>
                    {user.name || user.username || `User ${user.id}`}
                    <a 
                      href={`https://www.duolingo.com/profile/${user.username || user.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="profile-link"
                      title="View Duolingo Profile"
                    >
                      🔗
                    </a>
                  </h3>
                  {user.name && user.username && (
                    <p>@{user.username}</p>
                  )}
                  <p style={{ fontSize: '0.85em', color: '#999', marginTop: '4px' }}>ID: {user.id}</p>
                </div>
                <button className="btn btn-secondary" onClick={() => retrackUser(user.id)}>
                  🔄 Retrack
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
