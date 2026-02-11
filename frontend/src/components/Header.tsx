import { useState, useEffect } from 'react'
import TopNavigation from '@cloudscape-design/components/top-navigation'
import { useTheme } from '../ThemeContext'

export default function Header() {
  const [lastCollectionTime, setLastCollectionTime] = useState<number | null>(null)
  const { darkMode, toggleDarkMode } = useTheme()

  useEffect(() => {
    fetch('/api/last-collection-time')
      .then(res => res.json())
      .then(data => setLastCollectionTime(data.lastCollectionTime))
      .catch(err => console.error('Failed to fetch last collection time:', err))
  }, [])

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp * 1000)
    return date.toLocaleString()
  }

  return (
    <div id="header">
      <TopNavigation
        identity={{
          href: '/',
          title: '🦉 Duolingo Progress Tracker',
        }}
        utilities={[
          {
            type: 'button',
            text: `Last updated: ${formatTimestamp(lastCollectionTime)}`,
            ariaLabel: `Last updated: ${formatTimestamp(lastCollectionTime)}`,
          },
          {
            type: 'button',
            iconName: darkMode ? 'thumbs-up' : 'thumbs-down',
            text: darkMode ? 'Light Mode' : 'Dark Mode',
            onClick: toggleDarkMode,
          },
          {
            type: 'button',
            iconName: 'external',
            text: 'GitHub',
            href: 'https://github.com/kejun91/duolingo',
            external: true,
            externalIconAriaLabel: '(opens in a new tab)',
          },
        ]}
      />
    </div>
  )
}
