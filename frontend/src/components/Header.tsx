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
    <div id="top-nav">
      <TopNavigation
        identity={{
          href: '/',
          title: 'Duolingo Progress Tracker',
        }}
        i18nStrings={{
          overflowMenuTriggerText: 'More',
          overflowMenuTitleText: 'All',
          overflowMenuBackIconAriaLabel: 'Back',
          overflowMenuDismissIconAriaLabel: 'Close menu',
        }}
        utilities={[
          {
            type: 'button',
            text: `Updated: ${formatTimestamp(lastCollectionTime)}`,
            ariaLabel: `Last data collection: ${formatTimestamp(lastCollectionTime)}`,
            disableUtilityCollapse: false,
          },
          {
            type: 'menu-dropdown',
            iconName: 'settings',
            ariaLabel: 'Settings',
            title: 'Settings',
            items: [
              {
                id: 'theme',
                text: darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
              },
            ],
            onItemClick: ({ detail }) => {
              if (detail.id === 'theme') toggleDarkMode()
            },
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
