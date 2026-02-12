-- Migration number: 0001 	 2024-12-27T22:04:18.794Z
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY NOT NULL,
    is_tracked INTEGER DEFAULT 1,
    username TEXT,
    name TEXT
);
