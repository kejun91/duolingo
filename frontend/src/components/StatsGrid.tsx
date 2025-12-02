import './StatsGrid.css'

interface StatsGridProps {
  activeUsers: number
  totalXp: number
  avgXp: number
}

export default function StatsGrid({ activeUsers, totalXp, avgXp }: StatsGridProps) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-value">{activeUsers}</div>
        <div className="stat-label">Active Users</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{totalXp.toLocaleString()}</div>
        <div className="stat-label">Total XP Gained</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{avgXp.toLocaleString()}</div>
        <div className="stat-label">Average XP per User</div>
      </div>
    </div>
  )
}
