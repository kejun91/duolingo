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
    <div id="top-nav" style={{ position: 'sticky', top: 0, zIndex: 1002 }}>
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
            type: 'button',
            ariaLabel: darkMode ? 'Switch to light mode' : 'Switch to dark mode',
            iconSvg: darkMode
              ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )
              : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ),
            onClick: toggleDarkMode,
          },
          {
            type: 'button',
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
