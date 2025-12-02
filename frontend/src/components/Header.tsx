import './Header.css'

export default function Header() {
  const handleHomeClick = () => {
    window.location.href = '/'
  }

  return (
    <header className="header">
      <h1 onClick={handleHomeClick} style={{ cursor: 'pointer' }}>
        🦉 Duolingo Progress Tracker
      </h1>
      <p className="subtitle">Track XP progress and rankings over time</p>
    </header>
  )
}
