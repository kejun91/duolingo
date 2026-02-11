import { useEffect, useState } from 'react'
import Table from '@cloudscape-design/components/table'
import ContentLayout from '@cloudscape-design/components/content-layout'
import Header from '@cloudscape-design/components/header'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Button from '@cloudscape-design/components/button'
import Box from '@cloudscape-design/components/box'
import ColumnLayout from '@cloudscape-design/components/column-layout'
import Container from '@cloudscape-design/components/container'
import Badge from '@cloudscape-design/components/badge'
import Spinner from '@cloudscape-design/components/spinner'
import Alert from '@cloudscape-design/components/alert'

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
      color: (change > 0 ? 'green' : change < 0 ? 'red' : 'grey') as 'green' | 'red' | 'grey',
    }
  }

  if (loading) {
    return (
      <Box textAlign="center" padding="l">
        <SpaceBetween size="m" alignItems="center">
          <Spinner size="large" />
          <Box>Loading history...</Box>
        </SpaceBetween>
      </Box>
    )
  }

  if (error) {
    return (
      <SpaceBetween size="m">
        <Alert type="error">{error}</Alert>
        <Button onClick={onBack} iconName="arrow-left">Go Back</Button>
      </SpaceBetween>
    )
  }

  const userInfo = snapshots[0]?.data || {}
  const username = userInfo.username || `User ${userId}`
  const name = userInfo.name

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          actions={<Button onClick={onBack} iconName="arrow-left">Back to Rankings</Button>}
          description={name && username ? `@${username}` : undefined}
        >
          {name || username}'s History
        </Header>
      }
    >
      {snapshots.length === 0 ? (
        <Box textAlign="center" color="inherit" padding="l">
          No history data available for this user.
        </Box>
      ) : (
        <SpaceBetween size="l">
          <Container header={<Header variant="h2">Overview</Header>}>
            <ColumnLayout columns={3} variant="text-grid">
              <div>
                <Box variant="awsui-key-label">Current XP</Box>
                <Box variant="awsui-value-large">{snapshots[0].data.totalXp?.toLocaleString() || 0}</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Current Streak</Box>
                <Box variant="awsui-value-large">🔥 {snapshots[0].data.streak || 0}</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Days Tracked</Box>
                <Box variant="awsui-value-large">{snapshots.length}</Box>
              </div>
            </ColumnLayout>
          </Container>

          <Table
            header={<Header variant="h2" counter={`(${snapshots.length})`}>Daily Snapshots</Header>}
            items={snapshots}
            stripedRows
            stickyHeader
            variant="container"
            columnDefinitions={[
                {
                  id: 'date',
                  header: 'Date',
                  cell: (item) => item.date,
                  sortingField: 'date',
                },
                {
                  id: 'totalXp',
                  header: 'Total XP',
                  cell: (item) => (item.data.totalXp || 0).toLocaleString(),
                },
                {
                  id: 'xpChange',
                  header: 'XP Change',
                  cell: (item) => {
                    const idx = snapshots.indexOf(item)
                    const prev = snapshots[idx + 1]
                    if (!prev) return <Box color="text-status-inactive">—</Box>
                    const change = calculateChange(item.data.totalXp || 0, prev.data.totalXp || 0)
                    return (
                      <Badge color={change.color}>
                        {change.value > 0 ? '+' : ''}{change.value.toLocaleString()}
                      </Badge>
                    )
                  },
                },
                {
                  id: 'streak',
                  header: 'Streak',
                  cell: (item) => `🔥 ${item.data.streak || 0}`,
                },
                {
                  id: 'streakChange',
                  header: 'Streak Change',
                  cell: (item) => {
                    const idx = snapshots.indexOf(item)
                    const prev = snapshots[idx + 1]
                    if (!prev) return <Box color="text-status-inactive">—</Box>
                    const change = calculateChange(item.data.streak || 0, prev.data.streak || 0)
                    return (
                      <Badge color={change.color}>
                        {change.value > 0 ? '+' : ''}{change.value}
                      </Badge>
                    )
                  },
                },
              ]}
              empty={
                <Box textAlign="center" color="inherit" padding="l">
                  No history data available.
                </Box>
              }
            />
        </SpaceBetween>
      )}
    </ContentLayout>
  )
}