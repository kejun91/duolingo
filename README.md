# Duolingo Progress Tracker

A modern web application for tracking and visualizing Duolingo learning progress across multiple users. Built with React, TypeScript, and Cloudflare Workers + D1 Database.

![Tech Stack](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)
![D1 Database](https://img.shields.io/badge/D1-SQLite-green)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Setup](#setup)
- [Development](#development)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Component Structure](#component-structure)
- [Key Logic & Implementation Notes](#key-logic--implementation-notes)
- [Prompts Used to Build This](#prompts-used-to-build-this)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This application tracks Duolingo user progress over time by:
- **Automatically fetching** daily snapshots of user data from Duolingo's public API via cron jobs
- **Storing historical data** in a Cloudflare D1 (SQLite) database
- **Calculating XP increases** between any two dates with customizable date ranges
- **Displaying rankings** on a leaderboard dashboard with filtering options
- **Managing users** with add/untrack/retrack functionality
- **Showing individual user history** with detailed progress views

### Tech Stack

- **Frontend**: React 18.3.1 + TypeScript + Vite 5.4.21
- **Backend**: Cloudflare Workers (TypeScript)
- **Database**: Cloudflare D1 (SQLite)
- **UI Libraries**: react-date-range, date-fns
- **Deployment**: Cloudflare Workers with Assets serving
- **Automation**: Cloudflare Cron Triggers (daily at midnight UTC)

---

## ✨ Features

### Current Features

✅ **Automatic Daily Data Collection**
- Cron job runs daily at midnight UTC
- Fetches XP, streak, and profile data for all users
- Stores snapshots in D1 database with deduplication

✅ **Rankings Dashboard**
- View XP gains between any two dates
- Quick filters: Today, This Week, This Month, Last Month, Last 30 Days, Last 90 Days, All Time
- Visual calendar date range picker for custom date selection
- Streak filtering (≥7, ≥30, ≥60, ≥100 days)
- Color-coded XP badges (green for high, yellow for medium, gray for low)
- Top 3 rankings display medals (🥇🥈🥉)
- Shows daily average XP gained
- Export rankings to CSV

✅ **Smart Missing Data Handling**
- If a user has no data at the selected start date, the system automatically finds the earliest available date between start and end dates
- Only displays users who have data at the end date
- Shows tooltip indicators for users with adjusted start dates
- Calculates accurate daily averages based on actual date range

✅ **User Management**
- Add users by Duolingo username
- Untrack users (hide from leaderboard but continue collecting data)
- Retrack previously untracked users
- View user history with detailed progress charts
- Direct links to Duolingo profiles

✅ **Client-Side Routing**
- Full SPA (Single Page Application) experience
- State-based routing with browser history support
- Back/forward button navigation works correctly
- No page reloads when switching views

✅ **UTC Timezone Consistency**
- All dates use UTC to match data collection time
- Prevents missing data issues for users in timezones ahead of UTC
- Consistent date handling across frontend and backend

✅ **Responsive UI**
- Tab-based navigation (Rankings, Manage Users)
- Real-time loading states
- Success/error notifications
- Modern, clean design
- Last collection time display in header

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Cloudflare Edge Network                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐      ┌──────────────┐      ┌────────────┐  │
│  │  Static Assets │      │ Worker API   │      │  D1 DB     │  │
│  │  (React SPA)   │◄────►│  Endpoints   │◄────►│  SQLite    │  │
│  └────────────────┘      └──────────────┘      └────────────┘  │
│         │                        │                     │         │
│         │                        │                     │         │
│    Browser Requests         Cron Trigger          Data Storage  │
│                                  │                               │
│                                  ▼                               │
│                     ┌─────────────────────────┐                 │
│                     │  Duolingo Public API    │                 │
│                     │  (User Data Fetching)   │                 │
│                     └─────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **Static Assets**: Browser requests HTML/CSS/JS → Served from `public/` via ASSETS binding
2. **API Calls**: Frontend makes `/api/*` requests → Handled by Worker routes
3. **Data Fetching**: Worker queries D1 database → Returns JSON
4. **Duolingo Integration**: Worker calls Duolingo API → Stores in D1
5. **Cron Jobs**: Daily trigger → Fetches all user snapshots → Stores in D1

---

## 📦 Requirements

### Development Environment

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Cloudflare Account**: Free tier works
- **Wrangler CLI**: Installed via npm (included in dependencies)

### Cloudflare Resources

- D1 Database (free tier: 5GB storage, 5M reads/day, 100K writes/day)
- Workers (free tier: 100K requests/day)
- Cron Triggers (included with Workers)

---

## 🚀 Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd duolingo

# Install root dependencies
npm install

# Install frontend dependencies
npm run frontend:install
```

### 2. Create D1 Database

```bash
# Create the database
npx wrangler d1 create duolingo-d1

# Copy the database_id from output and update wrangler.json
```

Update `wrangler.json`:
```json
{
  "database_id": "your-database-id-here"
}
```

### 3. Run Migrations

```bash
# Apply migrations to remote D1 database
npx wrangler d1 migrations apply duolingo-d1 --remote

# Or for local development
npx wrangler d1 migrations apply duolingo-d1 --local
```

### 4. Build Frontend

```bash
npm run frontend:build
```

This creates the React build in `public/` directory.

---

## 💻 Development

### Running Locally

You need **two terminals** for development:

**Terminal 1 - React Frontend (with Hot Reload):**
```bash
cd frontend
npm run dev
```
- Runs at: `http://localhost:5173`
- Hot Module Replacement (HMR) enabled
- Auto-proxies `/api/*` requests to Worker

**Terminal 2 - Cloudflare Worker:**
```bash
npm run dev
```
- Runs at: `http://localhost:8787`
- Handles all API endpoints
- Uses local D1 database

### Development Workflow

1. Make changes to React components in `frontend/src/`
2. See changes instantly in browser (HMR)
3. Make changes to Worker API in `src/index.ts`
4. Restart Worker dev server to see changes
5. Test API endpoints via frontend or curl

### Useful Commands

```bash
# Install dependencies
npm install                    # Root dependencies
npm run frontend:install      # Frontend dependencies

# Development
npm run frontend:dev          # Start React dev server
npm run dev                   # Start Worker dev server

# Build
npm run frontend:build        # Build React → public/

# Database
npx wrangler d1 migrations apply duolingo-d1 --local   # Local DB
npx wrangler d1 migrations apply duolingo-d1 --remote  # Remote DB
npx wrangler d1 execute duolingo-d1 --local --command "SELECT * FROM users"

# Deployment
npm run deploy               # Deploy to Cloudflare
```

---

## 🌐 Deployment

### Deploy to Cloudflare

```bash
# 1. Build the frontend
npm run frontend:build

# 2. Deploy Worker + Assets
npm run deploy
```

### Configure Cron Trigger

The cron job is already configured in `wrangler.json`:

```json
{
  "triggers": {
    "crons": ["0 0 * * *"]  // Daily at midnight UTC
  }
}
```

To manually trigger the cron job:
```bash
npx wrangler dev --test-scheduled
```

### First Deployment Checklist

- [ ] D1 database created
- [ ] Database ID updated in `wrangler.json`
- [ ] Migrations applied to remote database
- [ ] Frontend built (`npm run frontend:build`)
- [ ] Worker deployed (`npm run deploy`)
- [ ] Cron trigger enabled (automatic on deploy)
- [ ] Test the deployed URL

---

## 📡 API Reference

### User Management

#### `POST /api/add-user`
Add a new user to track.

**Request:**
```json
{
  "username": "john_doe123"
}
```

**Response:**
```json
{
  "success": true,
  "username": "john_doe123",
  "userId": 123456789
}
```

**Logic:**
1. Validates username is not empty
2. Calls Duolingo API to fetch user data
3. Inserts user into database with `is_tracked = 1`
4. Fetches initial snapshot

---

#### `POST /api/untrack-user`
Hide user from leaderboard (continues data collection).

**Request:**
```json
{
  "userId": "123456789"
}
```

**Response:**
```json
{
  "success": true
}
```

**Logic:**
- Sets `is_tracked = 0` for the user
- User still appears in daily snapshots but not in rankings

---

#### `POST /api/retrack-user`
Show previously untracked user in leaderboard again.

**Request:**
```json
{
  "userId": "123456789"
}
```

**Response:**
```json
{
  "success": true
}
```

**Logic:**
- Sets `is_tracked = 1` for the user
- User appears in rankings again

---

#### `GET /api/users?tracked=<0|1>`
Get list of users.

**Query Params:**
- `tracked`: `1` for tracked users, `0` for untracked users

**Response:**
```json
{
  "users": [
    {
      "id": 123456789,
      "username": "john_doe",
      "name": "John Doe",
      "is_tracked": 1
    }
  ]
}
```

---

### Rankings & Data

#### `GET /api/rankings`
Get user rankings between two dates.

**Query Params:**
- `startDate`: YYYY-MM-DD (required)
- `endDate`: YYYY-MM-DD (required)
- `streakMin`: Minimum streak filter (optional, default 0)

**Response:**
```json
{
  "rankings": [
    {
      "userId": 123456789,
      "username": "john_doe",
      "name": "John Doe",
      "startXp": 10000,
      "endXp": 15000,
      "increase": 5000,
      "dailyAverage": 167,
      "streak": 45,
      "actualStartDate": "2025-12-01",
      "usedEarliestDate": false
    }
  ]
}
```

**Advanced Logic:**
- If user has no data at `startDate`, finds earliest available date between `startDate` and `endDate`
- Only shows users with data at `endDate`
- Calculates accurate `dailyAverage` based on actual date range used
- Sets `usedEarliestDate = true` if adjusted start date was used
- Sorts by `increase` descending (highest XP gain first)
- Filters by `streakMin` if provided

---

#### `GET /api/user-history?userId=<id>`
Get historical data for a specific user (Server-Side Rendered).

**Query Params:**
- `userId`: User ID (required)

**Response:**
Returns HTML page with user's historical data visualization.

---

#### `GET /api/last-collection-time`
Get timestamp of most recent data collection.

**Response:**
```json
{
  "timestamp": 1733270400,
  "date": "2025-12-04"
}
```

---

### Cron Job

#### `scheduled` Event
Runs daily at midnight UTC.

**Logic:**
1. Fetches all users from database (both tracked and untracked)
2. For each user:
   - Calls Duolingo API: `https://www.duolingo.com/2017-06-30/users?username=<username>`
   - Extracts: `totalXp`, `streak`, `username`, `name`, `id`
   - Stores snapshot in `user_daily_snapshots` with current UTC date
3. Uses `INSERT OR IGNORE` to prevent duplicate snapshots for same user/date
4. Logs success/failure for each user

---

## 🗄️ Database Schema

### Table: `users`

Stores Duolingo users being tracked.

| Column      | Type    | Constraints           | Description                                    |
|-------------|---------|-----------------------|------------------------------------------------|
| id          | INTEGER | PRIMARY KEY           | Duolingo user ID                               |
| is_tracked  | INTEGER | NOT NULL DEFAULT 1    | 1 = show in leaderboard, 0 = hidden            |
| username    | TEXT    |                       | Duolingo username                              |
| name        | TEXT    |                       | Display name from Duolingo profile             |

**Notes:**
- `id` is the actual Duolingo user ID from their API
- `is_tracked = 0` hides users from rankings but continues data collection
- Username and name are nullable (populated after first fetch)

---

### Table: `user_daily_snapshots`

Stores daily snapshots of user data.

| Column             | Type    | Constraints                    | Description                          |
|--------------------|---------|--------------------------------|--------------------------------------|
| id                 | INTEGER | PRIMARY KEY AUTOINCREMENT      | Internal row ID                      |
| user_id            | INTEGER | NOT NULL                       | FK to users.id                       |
| userInfo           | TEXT    | NOT NULL                       | JSON blob of full Duolingo API data  |
| snapshot_date      | TEXT    | NOT NULL                       | Date in YYYY-MM-DD format (UTC)      |
| snapshot_timestamp | INTEGER | NOT NULL                       | Unix timestamp of snapshot           |
| created_at         | INTEGER | DEFAULT (unixepoch())          | Record creation timestamp            |

**Unique Constraint:**
```sql
UNIQUE(user_id, snapshot_date)
```
Ensures one snapshot per user per day.

**Indexes:**
```sql
CREATE INDEX idx_user_daily_snapshots_user_id ON user_daily_snapshots(user_id);
CREATE INDEX idx_user_daily_snapshots_date ON user_daily_snapshots(snapshot_date);
```

**userInfo JSON Structure:**
```json
{
  "totalXp": 15000,
  "streak": 45,
  "username": "john_doe",
  "name": "John Doe",
  "id": 123456789
}
```

---

## 🧩 Component Structure

### Frontend Architecture

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.tsx                 # App header with last updated time
│   │   ├── Header.css
│   │   ├── TabNavigation.tsx          # Tab switcher (Rankings/Manage)
│   │   ├── TabNavigation.css
│   │   ├── RankingsTab.tsx            # Main rankings view container
│   │   ├── DateRangeSelector.tsx      # Date/streak filters + calendar picker
│   │   ├── DateRangeSelector.css
│   │   ├── StatsGrid.tsx              # Summary stats (users, total XP, avg)
│   │   ├── StatsGrid.css
│   │   ├── RankingsTable.tsx          # Leaderboard table
│   │   ├── RankingsTable.css
│   │   ├── ManageUsersTab.tsx         # User management interface
│   │   ├── ManageUsersTab.css
│   │   ├── UserHistory.tsx            # Individual user history view
│   │   ├── UserHistory.css
│   │   └── useSearchParams.ts         # URL param hook
│   ├── App.tsx                        # Main app with routing & state
│   ├── App.css
│   ├── main.tsx                       # React entry point
│   └── index.css                      # Global styles
├── index.html                         # HTML template
├── vite.config.ts                     # Vite build config
├── tsconfig.json                      # TypeScript config
└── package.json                       # Frontend dependencies
```

### Component Responsibilities

#### `App.tsx`
- **Purpose**: Main application container with state management and routing
- **State**:
  - `currentView`: 'main' | 'history' (client-side routing)
  - `activeTab`: 'rankings' | 'manage'
  - `rankings`: Array of ranking data
  - `trackedUsers` / `untrackedUsers`: User lists
  - `filters`: Date range and streak filters
  - `historyUserId`: ID for user history view
- **Logic**:
  - Fetches rankings on filter changes
  - Manages tab switching
  - Handles browser history (popstate events)
  - Provides navigation functions to child components

#### `Header.tsx`
- **Purpose**: Display app title and last collection time
- **Features**:
  - Fetches last collection time from API
  - Displays timestamp in local timezone format
  - Clickable title to reset to main view

#### `RankingsTab.tsx`
- **Purpose**: Container for rankings view
- **Composition**:
  - DateRangeSelector (filters)
  - StatsGrid (summary stats)
  - RankingsTable (leaderboard)
- **Logic**:
  - Calculates stats from rankings data
  - Passes callbacks to child components

#### `DateRangeSelector.tsx`
- **Purpose**: Date and streak filtering controls
- **Features**:
  - Quick filter buttons (Today, This Week, This Month, etc.)
  - Calendar date range picker (react-date-range)
  - Streak filter dropdown
  - 300ms debounce on filter changes
  - UTC date calculations
- **Logic**:
  - `applyQuickFilter()`: Calculates date ranges using UTC
  - `handleDateRangeChange()`: Updates dates from calendar picker
  - Hard limit: No dates before 2025-12-01

#### `RankingsTable.tsx`
- **Purpose**: Display leaderboard of users
- **Features**:
  - Rank column with medals for top 3 (🥇🥈🥉)
  - User info with Duolingo profile links
  - Start/End XP columns
  - XP Gained with color-coded badges
  - Daily Average calculation
  - Streak display
  - Tooltip for users with adjusted start dates
  - CSV export functionality
- **Logic**:
  - Color coding: Green (>500 XP), Yellow (100-500), Gray (<100)
  - Shows ⚠️ indicator if `usedEarliestDate === true`

#### `ManageUsersTab.tsx`
- **Purpose**: Add, untrack, and retrack users
- **Features**:
  - Add user form with username input
  - Tracked users list with Untrack button
  - Untracked users list with Retrack button
  - Success/error message notifications
  - Loading states during API calls
  - Direct links to Duolingo profiles
- **Logic**:
  - Form validation
  - API error handling
  - Auto-refresh after changes

#### `UserHistory.tsx`
- **Purpose**: Display individual user's historical progress
- **Props**:
  - `userId`: User ID to display
  - `onBack`: Callback to return to main view
- **Features**:
  - Shows all historical snapshots
  - Displays XP trends over time
  - Back button to return to rankings

---

## 🔍 Key Logic & Implementation Notes

### 1. Missing Start Date Handling

**Problem**: Users might not have data at the selected start date (e.g., new user joined after start date).

**Solution** (in `calculateRankings()` function):
```typescript
// If no start date value, find earliest available date
if (!start) {
  const { results: earliestSnapshots } = await db.prepare(`
    SELECT userInfo, snapshot_date
    FROM user_daily_snapshots
    WHERE user_id = ? AND snapshot_date >= ? AND snapshot_date <= ?
    ORDER BY snapshot_date ASC
    LIMIT 1
  `).bind(userId, startDate, endDate).all();

  if (earliestSnapshots && earliestSnapshots.length > 0) {
    const earliest: any = earliestSnapshots[0];
    start = earliest.userInfo ? JSON.parse(earliest.userInfo) : {};
    const actualStartDate = earliest.snapshot_date;
    
    // Calculate daily average based on actual date range
    const daysDiff = Math.max(1, getDaysDifference(actualStartDate, endDate));
    const dailyAverage = Math.round(increase / daysDiff);
    
    // Mark that we used earliest date
    rankings.push({
      ...data,
      actualStartDate,
      usedEarliestDate: true
    });
  }
}
```

**Benefits**:
- Shows new users in rankings even if they joined mid-period
- Accurate daily averages based on actual participation time
- Transparent to users via tooltip indicator

---

### 2. UTC Date Consistency

**Problem**: Local timezone ahead of UTC causes end date to have no data (e.g., local Dec 4 but UTC still Dec 3).

**Solution**: Use UTC methods everywhere dates are calculated.

**In `App.tsx`:**
```typescript
function getToday(): string {
  const date = new Date()
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
```

**In `DateRangeSelector.tsx`:**
```typescript
const applyQuickFilter = (type: string) => {
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  
  // All date calculations use UTC methods
  fromDate.setUTCDate(today.getUTCDate() - 30)
  
  const formatUTCDate = (date: Date) => {
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}
```

**Benefits**:
- Prevents "data not found" errors for users in ahead timezones
- Matches cron job collection time (midnight UTC)
- Consistent behavior globally

---

### 3. Client-Side Routing

**Problem**: Need SPA navigation without page reloads.

**Solution**: State-based routing with browser history support.

**In `App.tsx`:**
```typescript
const [currentView, setCurrentView] = useState<'main' | 'history'>('main')
const [historyUserId, setHistoryUserId] = useState<number | null>(null)

const showUserHistory = (userId: number) => {
  setCurrentView('history')
  setHistoryUserId(userId)
  window.history.pushState({ view: 'history', userId }, '', `/?view=history&userId=${userId}`)
}

const showMainView = () => {
  setCurrentView('main')
  setHistoryUserId(null)
  window.history.pushState({ view: 'main' }, '', '/')
}

// Handle browser back/forward buttons
useEffect(() => {
  const handlePopState = (event: PopStateEvent) => {
    if (event.state?.view === 'history' && event.state?.userId) {
      setCurrentView('history')
      setHistoryUserId(event.state.userId)
    } else {
      setCurrentView('main')
      setHistoryUserId(null)
    }
  }
  
  window.addEventListener('popstate', handlePopState)
  return () => window.removeEventListener('popstate', handlePopState)
}, [])
```

**Benefits**:
- Instant navigation (no page reloads)
- Browser back/forward buttons work correctly
- URL reflects current view
- State preserved during navigation

---

### 4. Debounced Filter Updates

**Problem**: Updating filters on every keystroke causes too many API requests.

**Solution**: 300ms debounce in DateRangeSelector.

```typescript
useEffect(() => {
  setIsUpdating(true)
  const timer = setTimeout(() => {
    onFiltersChange({ startDate, endDate, streakMin })
    setIsUpdating(false)
  }, 300) // Wait 300ms after last change

  return () => {
    clearTimeout(timer)
    setIsUpdating(false)
  }
}, [startDate, endDate, streakMin])
```

**Benefits**:
- Reduces API calls
- Smoother user experience
- Shows loading state during debounce

---

### 5. CSV Export Logic

**In `RankingsTable.tsx`:**
```typescript
const exportToCSV = () => {
  const headers = ['Rank', 'Name', 'Username', 'Start XP', 'End XP', 'XP Gained', 'Daily Avg', 'Streak']
  const rows = rankings.map((r, i) => [
    i + 1,
    r.name || r.username,
    r.username,
    r.startXp,
    r.endXp,
    r.increase,
    r.dailyAverage,
    r.streak
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `duolingo-rankings-${filters.startDate}-to-${filters.endDate}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
```

**Benefits**:
- Client-side export (no server processing)
- Filename includes date range
- Clean CSV format for Excel/Sheets

---

### 6. Cron Job Deduplication

**In cron scheduled event:**
```sql
INSERT OR IGNORE INTO user_daily_snapshots (user_id, userInfo, snapshot_date, snapshot_timestamp)
VALUES (?, ?, ?, ?)
```

**Logic**:
- `UNIQUE(user_id, snapshot_date)` constraint prevents duplicates
- `INSERT OR IGNORE` silently skips if record exists
- Idempotent: Running cron multiple times per day is safe

**Benefits**:
- No duplicate data
- Safe to manually trigger cron for testing
- Handles clock issues or manual reruns

---

## 📝 Prompts Used to Build This

This section documents the key prompts that could be used to recreate this application from scratch or implement similar features.

### Initial Project Setup

```
Create a Cloudflare Worker application with D1 database that tracks Duolingo user progress over time. 

Requirements:
- Use TypeScript for type safety
- Set up D1 database with tables for users and daily snapshots
- Create API endpoints for adding users, fetching rankings, and user history
- Implement a cron job that runs daily at midnight UTC to fetch data from Duolingo's public API
- Store daily snapshots of totalXp, streak, username, and name for each user
- Calculate XP increases between any two dates
- Support filtering by streak length
- Create a web interface with HTML/CSS
```

### React Migration

```
Refactor this server-side rendered Cloudflare Worker app to use React with Vite for the frontend.

Requirements:
- Keep all existing API endpoints unchanged
- Create a modern React SPA with TypeScript
- Use Vite for fast development and building
- Component-based architecture with separate files for each component
- Serve static files from the Worker using ASSETS binding
- Set up dev proxy in Vite to forward /api/* requests to Worker
- Preserve all existing functionality (rankings, user management, filters)
- Add proper TypeScript types for all API responses
```

### Feature Additions

```
Add a calendar-based date range picker to the date selector component.

Requirements:
- Use react-date-range library for visual calendar selection
- Show quick filter buttons (Today, This Week, etc.)
- Add a toggle button to show/hide the calendar picker
- Support 2-month horizontal view
- Respect minimum date constraint (2025-12-01)
- Integrate with existing date filter state
```

```
Improve the ranking logic to handle users who don't have data at the selected start date.

Requirements:
- If user has no data at start date, find the earliest date with data between start and end dates
- Only display users who have data at the end date
- Calculate accurate daily averages based on actual date range used
- Add a visual indicator (tooltip) showing which users used an adjusted start date
- Return actualStartDate and usedEarliestDate fields in API response
```

```
Fix date handling to use UTC timezone consistently throughout the application.

Requirements:
- Change all date calculations to use UTC methods instead of local timezone
- Update getToday() function to use getUTCFullYear(), getUTCMonth(), getUTCDate()
- Update DateRangeSelector quick filters to use UTC
- Ensure default end date is always UTC date to prevent missing data
- This prevents issues for users in timezones ahead of UTC
```

```
Add client-side routing to make it a true SPA without page reloads.

Requirements:
- Use state-based routing instead of URL pathname checking
- Support browser back/forward buttons with popstate events
- Update URL with window.history.pushState when navigating
- No page reloads when switching views or tabs
- Pass navigation callbacks via props instead of window.location.href
```

### UI/UX Improvements

```
Add the following UI improvements:
1. Display last data collection time in the header (fetch from new API endpoint)
2. Make the header title clickable to reset to main view
3. Remove the History button from the Manage Users tab
4. Show tooltips on rankings for users with adjusted start dates
5. Add a favicon to the application
6. Swap username and display name priority in user history (show name first)
```

### Code Quality

```
Consolidate all documentation files (DOCUMENTATION.md, MIGRATION_NOTES.md, QUICKSTART.md, REACT_README.md, README.md, REFACTOR_SUMMARY.md) into a single comprehensive README.md.

Requirements:
- Include project overview and features
- Document architecture with diagrams
- List all requirements and setup steps
- Provide API reference with examples
- Document database schema with table structures
- Explain component structure and responsibilities
- Add key logic and implementation notes sections
- Include the prompts used to build each feature
- Add troubleshooting section
- Reflect the current state of the codebase
```

---

## 🐛 Troubleshooting

### Common Issues

#### Build Errors

**Problem**: `npm run frontend:build` fails with TypeScript errors

**Solutions**:
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

**Problem**: Vite build warnings about npm audit vulnerabilities

**Solution**:
```bash
cd frontend
npm audit fix
# Or if breaking changes needed:
npm audit fix --force
```

---

#### Development Issues

**Problem**: Frontend can't connect to API (CORS errors)

**Solution**:
- Check that Worker dev server is running on port 8787
- Verify Vite proxy config in `frontend/vite.config.ts`:
```typescript
server: {
  proxy: {
    '/api': 'http://localhost:8787'
  }
}
```

---

**Problem**: Changes to Worker not reflected

**Solution**:
- Restart Worker dev server (no HMR for backend)
```bash
# Ctrl+C to stop, then:
npm run dev
```

---

#### Database Issues

**Problem**: "Table not found" errors

**Solution**:
```bash
# Apply migrations
npx wrangler d1 migrations apply duolingo-d1 --local
npx wrangler d1 migrations apply duolingo-d1 --remote
```

---

**Problem**: Duplicate snapshot errors (even with INSERT OR IGNORE)

**Solution**:
- Check UNIQUE constraint exists:
```bash
npx wrangler d1 execute duolingo-d1 --local --command "
  SELECT sql FROM sqlite_master 
  WHERE type='table' AND name='user_daily_snapshots'
"
```
- If constraint missing, recreate table or add constraint

---

#### Deployment Issues

**Problem**: Static files not served after deployment

**Solution**:
1. Verify frontend build succeeded:
```bash
npm run frontend:build
ls public/  # Should show index.html and assets/
```

2. Check `wrangler.json` has assets config:
```json
{
  "assets": {
    "directory": "./public",
    "binding": "ASSETS"
  }
}
```

3. Redeploy:
```bash
npm run deploy
```

---

**Problem**: Cron job not running

**Solution**:
1. Check triggers in `wrangler.json`:
```json
{
  "triggers": {
    "crons": ["0 0 * * *"]
  }
}
```

2. Verify deployment includes cron:
```bash
npx wrangler deployments list
```

3. Manually trigger for testing:
```bash
npx wrangler dev --test-scheduled
```

---

#### Data Issues

**Problem**: No data showing for today

**Solution**:
- Check if cron ran:
```bash
npx wrangler d1 execute duolingo-d1 --remote --command "
  SELECT MAX(snapshot_date) as latest FROM user_daily_snapshots
"
```

- Manually trigger snapshot collection:
```bash
# In Worker dev mode
npx wrangler dev --test-scheduled
```

---

**Problem**: User not appearing in rankings

**Solution**:
1. Check if user is tracked:
```bash
npx wrangler d1 execute duolingo-d1 --remote --command "
  SELECT id, username, is_tracked FROM users WHERE username = 'username_here'
"
```

2. Check if user has snapshots:
```bash
npx wrangler d1 execute duolingo-d1 --remote --command "
  SELECT snapshot_date, userInfo FROM user_daily_snapshots 
  WHERE user_id = 123456789 
  ORDER BY snapshot_date DESC LIMIT 5
"
```

3. Verify date range includes user's data

---

### Debug Mode

Enable debug logging in Worker:

```typescript
// In src/index.ts
console.log('Rankings query:', { startDate, endDate, streakMin })
console.log('Rankings result:', rankings)
```

View logs:
```bash
npx wrangler tail
```

---

### Performance Optimization

If rankings are slow with many users:

1. **Add more indexes**:
```sql
CREATE INDEX idx_snapshots_composite 
ON user_daily_snapshots(user_id, snapshot_date, snapshot_timestamp);
```

2. **Optimize queries**:
- Use `SELECT COUNT(*)` for stats instead of fetching all data
- Add pagination for large result sets

3. **Cache frequently accessed data**:
- Use Cloudflare KV for user lists
- Cache rankings for common date ranges

---

## 📄 License

MIT

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review Cloudflare Workers docs: https://developers.cloudflare.com/workers/

---

**Built with ❤️ using React, TypeScript, and Cloudflare Workers**
