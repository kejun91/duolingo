import Box from '@cloudscape-design/components/box'
import ColumnLayout from '@cloudscape-design/components/column-layout'
import Container from '@cloudscape-design/components/container'

interface StatsGridProps {
  activeUsers: number
  totalXp: number
  avgXp: number
}

export default function StatsGrid({ activeUsers, totalXp, avgXp }: StatsGridProps) {
  return (
    <ColumnLayout columns={3} variant="text-grid">
      <Container>
        <Box variant="awsui-key-label">Active Users</Box>
        <Box variant="awsui-value-large">{activeUsers}</Box>
      </Container>
      <Container>
        <Box variant="awsui-key-label">Total XP Gained</Box>
        <Box variant="awsui-value-large">{totalXp.toLocaleString()}</Box>
      </Container>
      <Container>
        <Box variant="awsui-key-label">Average XP per User</Box>
        <Box variant="awsui-value-large">{avgXp.toLocaleString()}</Box>
      </Container>
    </ColumnLayout>
  )
}
