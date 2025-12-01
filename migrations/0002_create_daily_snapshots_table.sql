-- Migration number: 0002  2025-12-01T00:00:00.000Z
-- Create a table to store daily snapshots of user data
CREATE TABLE IF NOT EXISTS user_daily_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    userInfo TEXT,
    snapshot_date TEXT NOT NULL,
    snapshot_timestamp INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    UNIQUE(user_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_snapshots_user_id ON user_daily_snapshots(user_id);

CREATE INDEX IF NOT EXISTS idx_user_daily_snapshots_date ON user_daily_snapshots(snapshot_date);
