import Table from '@cloudscape-design/components/table'
import Box from '@cloudscape-design/components/box'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Button from '@cloudscape-design/components/button'
import Link from '@cloudscape-design/components/link'
import Badge from '@cloudscape-design/components/badge'
import StatusIndicator from '@cloudscape-design/components/status-indicator'
import Popover from '@cloudscape-design/components/popover'
import { Ranking } from '../App'

interface RankingsTableProps {
  rankings: Ranking[]
  loading: boolean
  onShowHistory: (userId: number) => void
}

export default function RankingsTable({ rankings, loading, onShowHistory }: RankingsTableProps) {
  const getRankDisplay = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `#${index + 1}`
  }

  return (
    <Table
      loading={loading}
      loadingText="Loading rankings..."
      items={rankings}
      empty={
        <Box textAlign="center" color="inherit" padding="l">
          <SpaceBetween size="m">
            <b>No data available</b>
            <Box variant="p" color="inherit">
              No data available for the selected date range.
            </Box>
          </SpaceBetween>
        </Box>
      }
      columnDefinitions={[
        {
          id: 'rank',
          header: 'Rank',
          width: 80,
          cell: (item: Ranking) => {
            const index = rankings.indexOf(item)
            return (
              <Box fontSize="heading-m" fontWeight="bold">
                {getRankDisplay(index)}
              </Box>
            )
          },
        },
        {
          id: 'user',
          header: 'User',
          cell: (item) => (
            <SpaceBetween size="xxxs">
              <SpaceBetween size="xs" direction="horizontal" alignItems="center">
                <Box fontWeight="bold">
                  {item.name || item.username || `User ${item.userId}`}
                </Box>
                <Link
                  href={`https://www.duolingo.com/profile/${item.username || item.userId}`}
                  external
                  variant="primary"
                  fontSize="body-s"
                >
                  Profile
                </Link>
                {item.usedEarlierDate && (
                  <Popover
                    content={`No data on requested start date. Using earliest available date: ${item.actualStartDate}`}
                    dismissButton={false}
                    position="top"
                    size="small"
                    triggerType="custom"
                  >
                    <StatusIndicator type="info">Info</StatusIndicator>
                  </Popover>
                )}
              </SpaceBetween>
              {item.name && item.username && (
                <Box color="text-status-inactive" fontSize="body-s">@{item.username}</Box>
              )}
            </SpaceBetween>
          ),
        },
        {
          id: 'startXp',
          header: 'Start XP',
          cell: (item) => item.startXp.toLocaleString(),
        },
        {
          id: 'endXp',
          header: 'End XP',
          cell: (item) => item.endXp.toLocaleString(),
        },
        {
          id: 'xpGained',
          header: 'XP Gained',
          cell: (item) => (
            <Badge color={item.increase > 0 ? 'green' : item.increase < 0 ? 'red' : 'grey'}>
              {item.increase > 0 ? '+' : ''}{item.increase.toLocaleString()}
            </Badge>
          ),
        },
        {
          id: 'dailyAvg',
          header: 'Daily Average',
          cell: (item) => `${item.dailyAverage.toLocaleString()} XP/day`,
        },
        {
          id: 'streak',
          header: 'Streak',
          cell: (item) => `🔥 ${item.streak}`,
        },
        {
          id: 'actions',
          header: 'Actions',
          cell: (item) => (
            <Button variant="inline-link" onClick={() => onShowHistory(item.userId)}>
              📊 History
            </Button>
          ),
        },
      ]}
      variant="full-page"
      stickyHeader
      stripedRows
    />
  )
}
