import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import TabNavigation from './components/TabNavigation'
import RankingsTab from './components/RankingsTab'
import ManageUsersTab from './components/ManageUsersTab'
import UserHistory from './components/UserHistory'

export interface Ranking {
  userId: number
  username: string
  name: string
  startXp: number
  endXp: number
  increase: number
  dailyAverage: number
  streak: number
}

export interface User {
  id: number
  username: string | null
  name: string | null
}

function App() {
  const [currentView, setCurrentView] = useState<'main' | 'history'>('main')
  const [historyUserId, setHistoryUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'rankings' | 'users'>('rankings')
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [trackedUsers, setTrackedUsers] = useState<User[]>([])
  const [untrackedUsers, setUntrackedUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Get initial date range from URL or defaults
  const getInitialDates = () => {
    const params = new URLSearchParams(window.location.search)
    const startDate = params.get('startDate') || getMonthStart()
    const endDate = params.get('endDate') || getToday()
    const streakMin = Number(params.get('streakMin') || '30')
    return { startDate, endDate, streakMin }
  }

  const [filters, setFilters] = useState(getInitialDates())

  // Check URL on mount to see if we should show history
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const userId = params.get('userId')
    if (userId) {
      setHistoryUserId(userId)
      setCurrentView('history')
    }

    // Handle browser back/forward buttons
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const userId = params.get('userId')
      if (userId) {
        setHistoryUserId(userId)
        setCurrentView('history')
      } else {
        setCurrentView('main')
        setHistoryUserId(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (currentView === 'main') {
      loadData()
    }
  }, [currentView])

  const loadData = async () => {
    try {
      setLoading(true)
      const { startDate, endDate, streakMin } = filters
      
      // Fetch rankings
      const rankingsRes = await fetch(`/api/rankings?startDate=${startDate}&endDate=${endDate}&streakMin=${streakMin}`)
      const rankingsData = await rankingsRes.json()
      setRankings(rankingsData)

      // Fetch users (could be optimized to a single endpoint)
      const trackedRes = await fetch('/api/users?tracked=1')
      const untrackedRes = await fetch('/api/users?tracked=0')
      
      if (trackedRes.ok) {
        const trackedData = await trackedRes.json()
        setTrackedUsers(trackedData)
      }
      
      if (untrackedRes.ok) {
        const untrackedData = await untrackedRes.json()
        setUntrackedUsers(untrackedData)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateFilters = async (newFilters: typeof filters) => {
    setFilters(newFilters)
    
    // Update URL
    const params = new URLSearchParams({
      startDate: newFilters.startDate,
      endDate: newFilters.endDate,
      streakMin: String(newFilters.streakMin)
    })
    window.history.replaceState(null, '', '?' + params.toString())

    // Fetch new rankings
    try {
      const res = await fetch(`/api/rankings?${params.toString()}`)
      const data = await res.json()
      setRankings(data)
    } catch (error) {
      console.error('Failed to update rankings:', error)
    }
  }

  const refreshUsers = async () => {
    try {
      const trackedRes = await fetch('/api/users?tracked=1')
      const untrackedRes = await fetch('/api/users?tracked=0')
      
      if (trackedRes.ok) {
        const trackedData = await trackedRes.json()
        setTrackedUsers(trackedData)
      }
      
      if (untrackedRes.ok) {
        const untrackedData = await untrackedRes.json()
        setUntrackedUsers(untrackedData)
      }
      
      // Also refresh rankings to reflect changes
      await updateFilters(filters)
    } catch (error) {
      console.error('Failed to refresh users:', error)
    }
  }

  const showUserHistory = (userId: number) => {
    setHistoryUserId(String(userId))
    setCurrentView('history')
    window.history.pushState(null, '', `?userId=${userId}`)
  }

  const showMainView = () => {
    setCurrentView('main')
    setHistoryUserId(null)
    window.history.pushState(null, '', '/')
  }

  // Show user history if on history route
  if (currentView === 'history' && historyUserId) {
    return (
      <>
        <Header />
        <UserHistory userId={historyUserId} onBack={showMainView} />
      </>
    )
  }

  return (
    <>
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === 'rankings' ? (
        <RankingsTab 
          rankings={rankings}
          filters={filters}
          onFiltersChange={updateFilters}
          loading={loading}
          onShowHistory={showUserHistory}
        />
      ) : (
        <ManageUsersTab
          trackedUsers={trackedUsers}
          untrackedUsers={untrackedUsers}
          onRefresh={refreshUsers}
        />
      )}
    </>
  )
}

// Helper functions
function getToday(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMonthStart(): string {
  const now = new Date()
  const date = new Date(now.getFullYear(), now.getMonth(), 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default App
