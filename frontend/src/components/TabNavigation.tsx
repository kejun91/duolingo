import { ReactNode } from 'react'
import Tabs from '@cloudscape-design/components/tabs'

interface TabNavigationProps {
  activeTab: 'rankings' | 'users'
  onTabChange: (tab: 'rankings' | 'users') => void
  children: ReactNode
}

export default function TabNavigation({ activeTab, onTabChange, children }: TabNavigationProps) {
  return (
    <Tabs
      activeTabId={activeTab}
      onChange={({ detail }) => onTabChange(detail.activeTabId as 'rankings' | 'users')}
      tabs={[
        { id: 'rankings', label: '📊 Rankings', content: activeTab === 'rankings' ? children : null },
        { id: 'users', label: '👥 Manage Users', content: activeTab === 'users' ? children : null },
      ]}
    />
  )
}
