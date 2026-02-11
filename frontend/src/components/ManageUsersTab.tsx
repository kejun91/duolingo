import { useState } from 'react'
import { User } from '../App'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Button from '@cloudscape-design/components/button'
import Input from '@cloudscape-design/components/input'
import FormField from '@cloudscape-design/components/form-field'
import Box from '@cloudscape-design/components/box'
import Cards from '@cloudscape-design/components/cards'
import Link from '@cloudscape-design/components/link'
import Flashbar, { FlashbarProps } from '@cloudscape-design/components/flashbar'
import Form from '@cloudscape-design/components/form'

interface ManageUsersTabProps {
  trackedUsers: User[]
  untrackedUsers: User[]
  onRefresh: () => void
}

export default function ManageUsersTab({ trackedUsers, untrackedUsers, onRefresh }: ManageUsersTabProps) {
  const [newUsername, setNewUsername] = useState('')
  const [flashItems, setFlashItems] = useState<FlashbarProps.MessageDefinition[]>([])
  const [loading, setLoading] = useState(false)

  const showMessage = (content: string, type: FlashbarProps.Type) => {
    const id = String(Date.now())
    setFlashItems(prev => [...prev, {
      id,
      type,
      content,
      dismissible: true,
      onDismiss: () => setFlashItems(prev => prev.filter(item => item.id !== id)),
    }])
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
        showMessage(`User ${data.username || newUsername} added successfully!`, 'success')
        setNewUsername('')
        onRefresh()
      } else {
        showMessage(data.error, 'error')
      }
    } catch (error) {
      showMessage(`Failed to add user: ${error}`, 'error')
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
        showMessage('User untracked successfully', 'success')
        onRefresh()
      } else {
        const data = await res.json()
        showMessage(data.error, 'error')
      }
    } catch (error) {
      showMessage(`Failed to untrack user: ${error}`, 'error')
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
        showMessage('User retracked successfully', 'success')
        onRefresh()
      } else {
        const data = await res.json()
        showMessage(data.error, 'error')
      }
    } catch (error) {
      showMessage(`Failed to retrack user: ${error}`, 'error')
    }
  }

  return (
    <SpaceBetween size="l">
      <Flashbar items={flashItems} />

      <Container
        header={<Header variant="h2">➕ Add User</Header>}
      >
        <form onSubmit={addUser}>
          <Form
            actions={
              <Button variant="primary" formAction="submit" loading={loading}>
                Add User
              </Button>
            }
          >
            <FormField
              label="Duolingo Username"
              description="Enter the Duolingo username (e.g., john_doe123)"
            >
              <Input
                value={newUsername}
                onChange={({ detail }) => setNewUsername(detail.value)}
                placeholder="Enter Duolingo Username"
                disabled={loading}
              />
            </FormField>
          </Form>
        </form>
      </Container>

      <Cards
        header={
          <Header variant="h2" counter={`(${trackedUsers.length})`}>
            📊 Tracked Users
          </Header>
        }
        cardDefinition={{
          header: (item) => (
            <SpaceBetween size="xs" direction="horizontal" alignItems="center">
              <span>{item.name || item.username || `User ${item.id}`}</span>
              <Link
                href={`https://www.duolingo.com/profile/${item.username || item.id}`}
                external
                fontSize="body-s"
              >
                Profile
              </Link>
            </SpaceBetween>
          ),
          sections: [
            {
              id: 'username',
              content: (item) => item.name && item.username ? (
                <Box color="text-status-inactive">@{item.username}</Box>
              ) : null,
            },
            {
              id: 'id',
              header: 'User ID',
              content: (item) => item.id,
            },
            {
              id: 'actions',
              content: (item) => (
                <Button variant="normal" onClick={() => untrackUser(item.id)}>
                  Untrack
                </Button>
              ),
            },
          ],
        }}
        items={trackedUsers}
        empty={
          <Box textAlign="center" color="inherit" padding="l">
            <SpaceBetween size="m">
              <b>No tracked users</b>
              <Box variant="p" color="inherit">
                Add some users above to get started!
              </Box>
            </SpaceBetween>
          </Box>
        }
      />

      {untrackedUsers.length > 0 && (
        <Cards
          header={
            <Header variant="h2" counter={`(${untrackedUsers.length})`}>
              💤 Untracked Users
            </Header>
          }
          cardDefinition={{
            header: (item) => (
              <SpaceBetween size="xs" direction="horizontal" alignItems="center">
                <span>{item.name || item.username || `User ${item.id}`}</span>
                <Link
                  href={`https://www.duolingo.com/profile/${item.username || item.id}`}
                  external
                  fontSize="body-s"
                >
                  Profile
                </Link>
              </SpaceBetween>
            ),
            sections: [
              {
                id: 'username',
                content: (item) => item.name && item.username ? (
                  <Box color="text-status-inactive">@{item.username}</Box>
                ) : null,
              },
              {
                id: 'id',
                header: 'User ID',
                content: (item) => item.id,
              },
              {
                id: 'actions',
                content: (item) => (
                  <Button variant="normal" onClick={() => retrackUser(item.id)}>
                    🔄 Retrack
                  </Button>
                ),
              },
            ],
          }}
          items={untrackedUsers}
        />
      )}
    </SpaceBetween>
  )
}
