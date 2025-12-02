# Duolingo Progress Tracker - Agentic Documentation

## 📋 Project Overview

**Project Name:** Duolingo Progress Tracker  
**Type:** Cloudflare Worker + D1 Database Application  
**Purpose:** Track and visualize Duolingo learning progress for multiple users over time  
**Tech Stack:** TypeScript, Cloudflare Workers, D1 (SQLite), Cron Triggers

## 🎯 Original Prompt (Reconstructed)

Based on the codebase analysis, the original prompt was likely:

> *"Create a Cloudflare Worker application with D1 database that tracks Duolingo user progress over time. The app should:*
> - *Automatically fetch daily snapshots of user XP data from Duolingo's public API*
> - *Store historical data and calculate XP increases between any two dates*
> - *Display a leaderboard/ranking dashboard showing progress*
> - *Allow adding/removing users to track*
> - *Run daily via cron job to capture snapshots at midnight UTC*
> - *Support filtering by streak length*
> - *Show individual user history*
> - *Have a clean, modern UI with tabs for different views"*

## 🏗️ Architecture

### High-Level Flow
```
┌─────────────────────────────────────────────────────────────┐
│                     Cloudflare Worker                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐     ┌────────────┐ │
│  │   HTTP API   │      │  Cron Job    │     │  D1 DB     │ │
│  │  Endpoints   │◄────►│  (Daily)     │◄───►│  Storage   │ │
│  └──────────────┘      └──────────────┘     └────────────┘ │
│         │                      │                            │
│         ▼                      ▼                            │
│  ┌──────────────────────────────────────┐                  │
│  │      Duolingo Public API             │                  │
│  │  (https://www.duolingo.com/...)      │                  │
│  └──────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

#### Table: `users`
Stores tracked Duolingo users and their metadata.

| Column      | Type    | Description                                    |
|-------------|---------|------------------------------------------------|
| id          | INTEGER | Duolingo user ID (PRIMARY KEY)                 |
| is_tracked  | INTEGER | 1 = show in leaderboard, 0 = hide from leaderboard (still fetched daily) |
| username    | TEXT    | Duolingo username                              |
| name        | TEXT    | Display name                                   |

#### Table: `user_daily_snapshots`
Stores daily snapshots of user data from Duolingo API.

| Column             | Type    | Description                              |
|--------------------|---------|------------------------------------------|
| id                 | INTEGER | Auto-increment primary key               |
| user_id            | INTEGER | FK to users.id                           |
| userInfo           | TEXT    | JSON blob of full Duolingo user data     |
| snapshot_date      | TEXT    | Date in YYYY-MM-DD format                |
| snapshot_timestamp | INTEGER | Unix timestamp                           |
| created_at         | INTEGER | Record creation timestamp                |

**Unique Constraint:** `(user_id, snapshot_date)` - Ensures one snapshot per user per day.

**Indexes:**
- `idx_user_daily_snapshots_user_id` - Fast user lookup
- `idx_user_daily_snapshots_date` - Fast date range queries

## 🔧 Core Components

### 1. **Main Worker (`src/index.ts`)**

#### HTTP Endpoints

##### `POST /api/add-user`
**Purpose:** Add a new user to tracking  
**Input:**
```json
{
  "userId": "123456789"
}
```
**Logic:**
1. Validate user ID is numeric
2. Check if user already exists (reject if exists)
3. Insert user with `is_tracked = 1`
4. Fetch profile from Duolingo API to populate username/name
5. Update user record with profile data

**Returns:** `{ success: true, userId: "..." }`

---

##### `POST /api/untrack-user`
**Purpose:** Hide user from leaderboard (but continue fetching daily data)  
**Input:**
```json
{
  "userId": "123456789"
}
```
**Logic:** Sets `is_tracked = 0` for the user (removes from leaderboard display only)

**Returns:** `{ success: true }`

---

##### `POST /api/retrack-user`
**Purpose:** Re-add user to leaderboard display  
**Input:**
```json
{
  "userId": "123456789"
}
```
**Logic:** Sets `is_tracked = 1` for the user (shows in leaderboard again)

**Returns:** `{ success: true }`

---

##### `GET /api/user-history?userId=123456789`
**Purpose:** View historical snapshots for a specific user  
**Query Params:**
- `userId` (required): Duolingo user ID

**Logic:** Returns last 100 daily snapshots for the user, ordered by date descending

**Returns:** HTML page with user's XP history chart/table

---

##### `GET /api/rankings?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&streakMin=30`
**Purpose:** Get XP increase rankings between two dates  
**Query Params:**
- `startDate` (required): Start date in YYYY-MM-DD format
- `endDate` (required): End date in YYYY-MM-DD format
- `streakMin` (optional): Minimum streak filter (default: 0)

**Logic:**
1. Fetch snapshots for start and end dates
2. Calculate XP increase for each user
3. Filter by minimum streak if specified
4. Sort by XP increase (descending)
5. Calculate daily average: `increase / daysDifference`

**Returns:** JSON array of rankings

---

##### `GET /` (Root/Dashboard)
**Purpose:** Main dashboard UI  
**Query Params:**
- `startDate` (optional): Defaults to first day of current month
- `endDate` (optional): Defaults to today
- `streakMin` (optional): Defaults to 30

**Logic:**
1. Calculate rankings between date range
2. Fetch tracked and untracked users
3. Render HTML dashboard with tabs:
   - **Rankings:** Leaderboard sorted by XP gained
   - **Manage Users:** Add/remove users from tracking
   - **Untracked Users:** View and re-enable tracking

**Returns:** HTML dashboard page

---

#### Scheduled Task (Cron)

##### `async scheduled(event, env, ctx)`
**Trigger:** Every minute (`* * * * *`) - configured in `wrangler.json`  
**Runs at:** 00:00 UTC daily (based on implementation logic)

**Process:**
1. Get current date as `YYYY-MM-DD`
2. Fetch **ALL users** in the database (regardless of `is_tracked` status)
3. For each user:
   - Fetch user data from `https://www.duolingo.com/2017-06-30/users/{userId}`
   - Store complete JSON response in `user_daily_snapshots`
   - Update `users.username` and `users.name` if available
4. Uses `INSERT OR REPLACE` for idempotency (handles reruns gracefully)
5. Log success/failure for each user

**Note:** Daily snapshots are collected for ALL users in the database. The `is_tracked` flag only controls leaderboard visibility, not data collection.

**Data Captured from Duolingo API:**
- `totalXp`: Total experience points
- `streak`: Current day streak
- `username`: User's Duolingo username
- `name`: Display name
- Plus full user profile (stored as JSON blob)

---

### 2. **Rendering Module (`src/renderHtml.ts`)**

Contains two main rendering functions:

#### `renderDashboard(rankings, trackedUsers, untrackedUsers, startDate, endDate)`
Generates the main dashboard HTML with:
- **Header:** Title and date range
- **Statistics:** Total and average XP gained
- **Three tabs:**
  1. **📊 Rankings** - Leaderboard table with medals (🥇🥈🥉)
  2. **👥 Manage Users** - Form to add new users, list of tracked users
  3. **💤 Untracked Users** - Previously tracked users (soft deleted)

**Features:**
- Responsive design with gradient background
- Medal icons for top 3 performers
- Color-coded XP badges (green/red/gray)
- Date range picker
- Streak filter slider
- User history modal viewer
- Loading states with spinners

#### `renderUserHistory(results, userId)`
Generates an HTML page showing:
- User's XP progression over time
- Table of daily snapshots
- XP changes day-over-day
- Chart visualization potential (data ready)

---

### 3. **Helper Functions**

#### `calculateRankings(db, startDate, endDate, streakMin)`
**Purpose:** Core algorithm to compute XP increases

**Algorithm:**
1. Fetch start date snapshots → Map by user_id
2. Fetch end date snapshots → Map by user_id
3. For each user in both maps:
   - Calculate: `increase = endXp - startXp`
   - Calculate: `dailyAverage = increase / daysDifference`
   - Filter: Skip if `streak < streakMin`
4. Sort by `increase` descending
5. Return ranked array

**Returns:**
```typescript
[
  {
    userId: number,
    username: string,
    name: string,
    startXp: number,
    endXp: number,
    increase: number,
    dailyAverage: number,
    streak: number
  },
  ...
]
```

#### `getDateDaysAgo(days: number): string`
Returns date N days ago in `YYYY-MM-DD` format.

#### `getDaysDifference(date1: string, date2: string): number`
Calculates days between two dates.

#### `getMonthStart(): string`
Returns first day of current month in `YYYY-MM-DD` format.

---

## 🗄️ Data Flow Examples

### Example 1: Daily Snapshot Collection
```
12:00 AM UTC (Cron Trigger)
  ↓
Fetch ALL users from database (regardless of is_tracked status)
  ↓
For User 123456789 (even if is_tracked = 0):
  ↓
GET https://www.duolingo.com/2017-06-30/users/123456789
  ↓
Response: { totalXp: 5420, streak: 45, username: "john_doe", ... }
  ↓
INSERT OR REPLACE INTO user_daily_snapshots
  (user_id, userInfo, snapshot_date, snapshot_timestamp)
VALUES
  (123456789, '{...}', '2025-12-02', 1733097600)
  ↓
UPDATE users SET username='john_doe' WHERE id=123456789
  ↓
Note: is_tracked flag only affects leaderboard display, NOT data collection
```

### Example 2: Ranking Calculation
```
User visits: /?startDate=2025-12-01&endDate=2025-12-02&streakMin=30
  ↓
Query snapshots for 2025-12-01 → { user_id: 123, totalXp: 5000, streak: 45 }
Query snapshots for 2025-12-02 → { user_id: 123, totalXp: 5420, streak: 46 }
  ↓
Calculate: increase = 5420 - 5000 = 420 XP
Calculate: dailyAverage = 420 / 1 = 420 XP/day
Check: streak (46) >= streakMin (30) ✓
  ↓
Rankings: [{ userId: 123, increase: 420, dailyAverage: 420, ... }]
  ↓
Sort by increase DESC
  ↓
Render dashboard with rankings
```

---

## 🎨 UI/UX Features

### Design Elements
- **Color Scheme:** Purple gradient background (#667eea → #764ba2)
- **Duolingo Brand:** Uses #1cb0f6 (Duolingo blue), #58cc02 (green)
- **Typography:** System fonts (-apple-system, Segoe UI, Roboto)
- **Responsive:** Mobile-friendly card-based layout

### Interactive Features
- **Tab Navigation:** Switch between Rankings/Manage/Untracked
- **Date Range Picker:** Select custom start/end dates
- **Streak Filter:** Slider to set minimum streak requirement
- **Add User Form:** Input validation with loading states
- **User Actions:**
  - 🗑️ Untrack button (hide from leaderboard, still collects data)
  - 🔄 Retrack button (show in leaderboard again)
  - 📊 View History (modal/new page)
- **Loading Indicators:** Spinners during API calls

### Data Presentation
- **Medals:** 🥇 Gold (1st), 🥈 Silver (2nd), 🥉 Bronze (3rd)
- **XP Badges:**
  - Green: Positive increase
  - Red: Negative change
  - Gray: No change
- **Statistics Summary:**
  - Total participants
  - Total XP gained
  - Average XP per person

---

## 🚀 Deployment & Configuration

### Configuration File: `wrangler.json`
```json
{
  "compatibility_date": "2025-04-01",
  "main": "src/index.ts",
  "name": "duolingo",
  "d1_databases": [
    {
      "binding": "DB",
      "database_id": "ad1556dc-665c-479b-90a3-b75dec84eb11",
      "database_name": "duolingo-db"
    }
  ],
  "triggers": {
    "crons": ["* * * * *"]  // Every minute (actual logic runs daily)
  }
}
```

### Environment Variables
- `env.DB`: D1 Database binding (auto-injected by Cloudflare)

### Deployment Steps
1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create D1 database:**
   ```bash
   npx wrangler d1 create duolingo-db
   ```
   Update `database_id` in `wrangler.json` with output

3. **Run migrations:**
   ```bash
   npx wrangler d1 migrations apply duolingo-db --remote
   ```

4. **Deploy to Cloudflare:**
   ```bash
   npx wrangler deploy
   ```

### Local Development
```bash
# Seed local D1 database
npm run seedLocalD1

# Start development server
npm run dev
```

---

## 📊 Data Models

### Duolingo API Response Structure
```typescript
{
  id: number,
  username: string,
  name: string,
  totalXp: number,
  streak: number,
  // ... many other fields (all stored in userInfo JSON)
}
```

### Ranking Object
```typescript
interface Ranking {
  userId: number,
  username: string,
  name: string,
  startXp: number,
  endXp: number,
  increase: number,        // XP gained in period
  dailyAverage: number,    // increase / days
  streak: number           // Current streak at end date
}
```

---

## 🔐 Security & Error Handling

### Input Validation
- User IDs must be numeric
- Dates must be in YYYY-MM-DD format
- Prevents duplicate user additions

### Error Handling
- API calls to Duolingo wrapped in try-catch
- Non-fatal errors logged but don't block operations
- User-friendly error messages in API responses
- Graceful degradation if Duolingo API fails

### Data Integrity
- UNIQUE constraint prevents duplicate daily snapshots
- `INSERT OR REPLACE` ensures idempotency
- "Untracking" only hides from leaderboard - all data continues to be collected
- NULL-safe operations with COALESCE
- Historical data always preserved for all users

---

## 🔍 Key Business Logic

### Streak Filtering
**Purpose:** Focus on committed learners  
**Implementation:** Filter users below minimum streak threshold  
**Use Case:** See only users with 30+ day streaks

### Daily Average Calculation
**Formula:** `(endXp - startXp) / daysBetween`  
**Purpose:** Normalize progress across different time periods  
**Benefit:** Fair comparison of short vs long periods

### Idempotent Snapshots
**Strategy:** `INSERT OR REPLACE` with UNIQUE constraint  
**Benefit:** Safe to rerun cron jobs without duplicates  
**Use Case:** Recovery from failures or manual reruns

### Untracking vs Data Collection
**Important:** "Untracking" a user (setting `is_tracked = 0`) only removes them from the leaderboard display. Their daily snapshots are still collected via the cron job. This allows:
- Hiding users temporarily without losing historical continuity
- Re-adding users to leaderboard without data gaps
- Maintaining complete historical records for all users ever added

---

## 📈 Potential Enhancements

1. **Charts & Visualizations:** Add Chart.js for XP trend graphs
2. **Email Notifications:** Weekly digest of rankings
3. **Achievements:** Badges for milestones (100-day streak, etc.)
4. **Team Challenges:** Group competitions with team totals
5. **Export Data:** CSV download of historical data
6. **API Keys:** Secure API with authentication
7. **Leaderboard History:** Track past month winners
8. **Mobile App:** Native iOS/Android companion
9. **Language Filters:** Filter by learning language
10. **Social Features:** Share progress on social media

---

## 🐛 Known Limitations

1. **Cron Frequency:** Set to `* * * * *` (every minute) but logic should run daily
   - Consider changing to: `"0 0 * * *"` (midnight UTC)
2. **API Rate Limits:** No rate limiting on Duolingo API calls
3. **No Authentication:** Dashboard is public (anyone can add/remove users)
4. **Timezone:** All dates in UTC (no user timezone support)
5. **Pagination:** User history limited to 100 snapshots
6. **No Retry Logic:** Failed API calls not retried

---

## 📚 External Dependencies

### Cloudflare Services
- **Workers:** Serverless compute platform
- **D1:** SQLite database at the edge
- **Cron Triggers:** Scheduled task execution

### Duolingo Public API
- **Endpoint:** `https://www.duolingo.com/2017-06-30/users/{userId}`
- **Authentication:** None required (public data)
- **Rate Limits:** Unknown (no official documentation)

---

## 🧪 Testing Scenarios

### Manual Testing Checklist
- [ ] Add valid Duolingo user ID
- [ ] Add invalid/non-numeric user ID
- [ ] Add duplicate user ID
- [ ] Untrack a user (verify disappears from rankings but data still collected)
- [ ] Retrack a user (verify reappears in rankings with no data gaps)
- [ ] View user history for both tracked and untracked users
- [ ] Change date range
- [ ] Adjust streak filter
- [ ] Verify cron job runs at midnight
- [ ] Check rankings calculation accuracy
- [ ] Verify untracked users still have daily snapshots created

### Data Scenarios
- **User with no start snapshot:** Should not appear in rankings
- **User with no end snapshot:** Should not appear in rankings
- **User below streak minimum:** Should be filtered out
- **Negative XP gain:** Should display red badge
- **Zero XP gain:** Should display gray badge

---

### Best Practices Implemented

1. **Separation of Concerns:** Logic (index.ts) separate from presentation (renderHtml.ts)
2. **Database Migrations:** Version-controlled schema changes
3. **Idempotency:** Safe to rerun without side effects
4. **Continuous Data Collection:** Untracking only affects display, not data gathering
5. **Historical Data Preservation:** All user data always preserved and collected
6. **Error Logging:** Console logs for debugging
7. **Responsive Design:** Mobile-first CSS
8. **Type Safety:** TypeScript for compile-time checks
9. **Semantic HTML:** Proper structure and accessibility

---

## 📞 Support & Maintenance

### Monitoring
- Check Cloudflare Workers dashboard for:
  - Cron job execution logs
  - API error rates
  - Database query performance

### Common Issues

**Issue:** Users not updating daily  
**Solution:** Check cron trigger configuration and logs

**Issue:** Rankings show old data  
**Solution:** Verify snapshots exist for selected dates

**Issue:** User not found in Duolingo API  
**Solution:** Ensure user ID is correct and account is public

**Issue:** Untracked user stopped getting daily updates  
**Solution:** This is incorrect behavior - untracked users should still be fetched. Check cron job queries all users, not just `is_tracked = 1`

---

## 🏁 Summary

This Duolingo Progress Tracker is a **production-ready Cloudflare Worker application** that:

✅ Automatically tracks Duolingo user progress daily  
✅ Stores historical snapshots in D1 database  
✅ Calculates and displays XP increase rankings  
✅ Provides intuitive web dashboard for management  
✅ Supports filtering by date range and streak length  
✅ Implements soft deletes for data preservation  
✅ Uses modern, responsive UI design  

**Primary Use Case:** Monitor language learning progress for a group (family, friends, classroom, team) with friendly competition and accountability.

---

*Documentation generated by AI based on codebase analysis - December 2, 2025*
