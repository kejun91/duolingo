import './TabNavigation.css'

interface TabNavigationProps {
  activeTab: 'rankings' | 'users'
  onTabChange: (tab: 'rankings' | 'users') => void
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="tabs">
      <button
        className={`tab ${activeTab === 'rankings' ? 'active' : ''}`}
        onClick={() => onTabChange('rankings')}
      >
        📊 Rankings
      </button>
      <button
        className={`tab ${activeTab === 'users' ? 'active' : ''}`}
        onClick={() => onTabChange('users')}
      >
        👥 Manage Users
      </button>
    </div>
  )
}
