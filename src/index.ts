export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Serve static files from public directory
    if (!path.startsWith('/api')) {
      try {
        // Try to fetch from assets first (Vite build output)
        let assetPath = path === '/' ? '/index.html' : path;
        const assetUrl = new URL(assetPath, request.url);
        
        // @ts-ignore - ASSETS is bound in wrangler.toml
        const asset = await env.ASSETS.fetch(assetUrl);
        
        if (asset.status === 200) {
          return asset;
        }
        
        // If not found and not a file extension, serve index.html for SPA routing
        if (!path.includes('.')) {
          const indexUrl = new URL('/index.html', request.url);
          // @ts-ignore
          return env.ASSETS.fetch(indexUrl);
        }
        
        return asset;
      } catch (e) {
        // Fall through to API routes if asset serving fails
      }
    }

    // API: Add user
    if (path === "/api/add-user" && request.method === "POST") {
      try {
        const body = await request.json() as { username: string };
        const { username } = body;
        if (!username || username.trim() === "") {
          return new Response(JSON.stringify({ error: "Invalid username" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        // Fetch user data from Duolingo API using username
        const duolingoRes = await fetch(`https://www.duolingo.com/2017-06-30/users?username=${encodeURIComponent(username)}`);
        if (!duolingoRes.ok) {
          return new Response(JSON.stringify({ error: `User "${username}" not found on Duolingo. Please check the username and try again.` }), {
            status: 404,
            headers: { "content-type": "application/json" },
          });
        }

        const duolingoData: any = await duolingoRes.json();
        const userData = duolingoData?.users?.[0];
        
        if (!userData || !userData.id) {
          return new Response(JSON.stringify({ error: `User "${username}" not found on Duolingo. Please check the username and try again.` }), {
            status: 404,
            headers: { "content-type": "application/json" },
          });
        }

        const userId = userData.id;
        const fetchedUsername = userData.username || null;
        const name = userData.name || fetchedUsername || null; // Fallback to username if name not available

        // Check if user already exists
        const existing = await env.DB.prepare("SELECT id FROM users WHERE id = ?")
          .bind(userId)
          .first();

        if (existing) {
          return new Response(JSON.stringify({ error: "User already exists" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        // Insert new user with fetched data
        await env.DB.prepare("INSERT INTO users (id, username, name, is_tracked) VALUES (?, ?, ?, 1)")
          .bind(userId, fetchedUsername, name)
          .run();

        return new Response(JSON.stringify({ success: true, userId, username: fetchedUsername, name }), {
          headers: { "content-type": "application/json" },
        });
      } catch (err) {
        console.error('Error adding user:', err);
        return new Response(JSON.stringify({ error: "Failed to add user. Please try again." }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }

    // API: Untrack user (soft delete)
    if (path === "/api/untrack-user" && request.method === "POST") {
      try {
        const body = await request.json() as { userId: string };
        const { userId } = body;
        if (!userId) {
          return new Response(JSON.stringify({ error: "Invalid user ID" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        await env.DB.prepare("UPDATE users SET is_tracked = 0 WHERE id = ?")
          .bind(userId)
          .run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { "content-type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }

    // API: Retrack user
    if (path === "/api/retrack-user" && request.method === "POST") {
      try {
        const body = await request.json() as { userId: string };
        const { userId } = body;
        if (!userId) {
          return new Response(JSON.stringify({ error: "Invalid user ID" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        await env.DB.prepare("UPDATE users SET is_tracked = 1 WHERE id = ?")
          .bind(userId)
          .run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { "content-type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }

    // API: Get users
    if (path === "/api/users" && request.method === "GET") {
      const tracked = url.searchParams.get("tracked");
      const query = tracked !== null
        ? "SELECT id, username, name FROM users WHERE is_tracked = ? ORDER BY id"
        : "SELECT id, username, name FROM users ORDER BY id";
      
      const { results } = tracked !== null
        ? await env.DB.prepare(query).bind(tracked).all()
        : await env.DB.prepare(query).all();

      return new Response(JSON.stringify(results), {
        headers: { "content-type": "application/json" },
      });
    }

    // API: Get last collection time
    if (path === "/api/last-collection-time" && request.method === "GET") {
      const result = await env.DB.prepare(`
        SELECT MAX(snapshot_timestamp) as last_timestamp
        FROM user_daily_snapshots
      `).first();

      return new Response(JSON.stringify({ 
        lastCollectionTime: result?.last_timestamp || null 
      }), {
        headers: { "content-type": "application/json" },
      });
    }

    // API: Get user history
    if (path === "/api/user-history" && request.method === "GET") {
      const userId = url.searchParams.get("userId");
      if (!userId) {
        return new Response(JSON.stringify({ error: "Missing userId" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      const { results } = await env.DB.prepare(`
        SELECT snapshot_date, userInfo
        FROM user_daily_snapshots
        WHERE user_id = ?
        ORDER BY snapshot_date DESC
        LIMIT 100
      `).bind(userId).all();

      // Parse userInfo JSON for each snapshot
      const snapshots = results.map((row: any) => ({
        date: row.snapshot_date,
        data: row.userInfo ? JSON.parse(row.userInfo) : {}
      }));

      return new Response(JSON.stringify(snapshots), {
        headers: { "content-type": "application/json" },
      });
    }

    // API: Get rankings
    if (path === "/api/rankings" && request.method === "GET") {
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");
      const streakMin = Number(url.searchParams.get("streakMin") || "0");

      if (!startDate || !endDate) {
        return new Response(JSON.stringify({ error: "Missing date parameters" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      // Get snapshots for start and end dates (with optional streak filter)
      const allRankings = await calculateRankings(env.DB, startDate, endDate, streakMin);
      
      // Filter to only show tracked users
      const { results: trackedUsersList } = await env.DB.prepare(
        "SELECT id FROM users WHERE is_tracked = 1"
      ).all();
      const trackedUserIds = new Set(trackedUsersList.map((u: any) => u.id));
      const rankings = allRankings.filter(r => trackedUserIds.has(r.userId));

      return new Response(JSON.stringify(rankings), {
        headers: { "content-type": "application/json" },
      });
    }

    // If no API route matched, return 404
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log("Daily snapshot task running at 00:00 UTC...");

  const now = new Date();
    const snapshotDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const snapshotTimestamp = Math.floor(now.getTime() / 1000); // Unix timestamp in seconds

    // Get all users (regardless of is_tracked status - we fetch data for everyone)
    const { results: users } = await env.DB.prepare(
      "SELECT id FROM users"
    ).all();

    for (const user of users) {
      const userId = user.id as number;
      try {
        // Fetch user data from Duolingo
        const res = await fetch(`https://www.duolingo.com/2017-06-30/users/${userId}`);
        if (!res.ok) {
          console.warn(`Failed to fetch user ${userId}: ${res.status}`);
          continue;
        }

        const data: any = await res.json();
        const userInfoJson = JSON.stringify(data);

        // Insert into daily snapshots (idempotent - UNIQUE constraint prevents duplicates)
        await env.DB.prepare(`
          INSERT OR REPLACE INTO user_daily_snapshots 
          (user_id, userInfo, snapshot_date, snapshot_timestamp)
          VALUES (?, ?, ?, ?)
        `)
          .bind(userId, userInfoJson, snapshotDate, snapshotTimestamp)
          .run();

        // Also backfill/update users.username and users.name based on latest fetch
        const username = data?.username ?? null;
        const name = data?.name ?? null;
        if (username || name) {
          await env.DB.prepare("UPDATE users SET username = COALESCE(?, username), name = COALESCE(?, name) WHERE id = ?")
            .bind(username, name, userId)
            .run();
        }

        console.log(`Successfully updated user ${userId} (${data.username ?? 'unknown'})`);

      } catch (err) {
        console.error(`Error updating user ${userId}:`, err);
      }
    }

    console.log(`Snapshot complete for ${users.length} users on ${snapshotDate}`);
  },
};

// Helper: Calculate rankings between two dates
async function calculateRankings(db: D1Database, startDate: string, endDate: string, streakMin = 0) {
  const { results: startSnapshots } = await db.prepare(`
    SELECT user_id, userInfo
    FROM user_daily_snapshots
    WHERE snapshot_date = ?
  `).bind(startDate).all();

  const { results: endSnapshots } = await db.prepare(`
    SELECT user_id, userInfo
    FROM user_daily_snapshots
    WHERE snapshot_date = ?
  `).bind(endDate).all();

  // Create maps for easy lookup
  const startMap = new Map(startSnapshots.map((s: any) => {
    const userInfo = s.userInfo ? JSON.parse(s.userInfo) : {};
    return [s.user_id, userInfo];
  }));
  
  const endMap = new Map(endSnapshots.map((s: any) => {
    const userInfo = s.userInfo ? JSON.parse(s.userInfo) : {};
    return [s.user_id, userInfo];
  }));

  // Calculate increases for all users that have data in both snapshots
  const rankings: any[] = [];
  const allUserIds = new Set([...startMap.keys(), ...endMap.keys()]);

  for (const userId of allUserIds) {
    const start = startMap.get(userId);
    const end = endMap.get(userId);

    if (start && end) {
      const startXp = start.totalXp ?? 0;
      const endXp = end.totalXp ?? 0;
      const increase = endXp - startXp;
      const daysDiff = Math.max(1, getDaysDifference(startDate, endDate));
      const dailyAverage = Math.round(increase / daysDiff);

  // Optional streak filter (Duolingo uses `streak`)
  const endStreak = (end.streak ?? 0) as number;
      if (streakMin && endStreak < streakMin) {
        continue;
      }

      rankings.push({
        userId,
        username: end.username ?? start.username ?? `User ${userId}`,
        name: end.name ?? start.name ?? "",
        startXp,
        endXp,
        increase,
        dailyAverage,
        streak: endStreak,
      });
    }
  }

  // Sort by increase (descending)
  rankings.sort((a, b) => b.increase - a.increase);

  return rankings;
}

// Helper: Get date N days ago in YYYY-MM-DD format
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

// Helper: Calculate days between two dates
function getDaysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper: First day of current month (YYYY-MM-DD)
function getMonthStart(): string {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return first.toISOString().split('T')[0];
}
