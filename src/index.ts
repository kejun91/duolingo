import { renderDashboard, renderUserHistory } from "./renderHtml";

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API: Add user
    if (path === "/api/add-user" && request.method === "POST") {
      try {
        const body = await request.json() as { userId: string };
        const { userId } = body;
        if (!userId || isNaN(Number(userId))) {
          return new Response(JSON.stringify({ error: "Invalid user ID" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

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

        // Insert new user with is_tracked = 1
        await env.DB.prepare("INSERT INTO users (id, is_tracked) VALUES (?, 1)")
          .bind(userId)
          .run();

        return new Response(JSON.stringify({ success: true, userId }), {
          headers: { "content-type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
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

      return new Response(renderUserHistory(results, userId), {
        headers: { "content-type": "text/html" },
      });
    }

    // API: Get rankings
    if (path === "/api/rankings" && request.method === "GET") {
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");

      if (!startDate || !endDate) {
        return new Response(JSON.stringify({ error: "Missing date parameters" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      // Get snapshots for start and end dates
      const rankings = await calculateRankings(env.DB, startDate, endDate);

      return new Response(JSON.stringify(rankings), {
        headers: { "content-type": "application/json" },
      });
    }

    // Main dashboard
    const startDate = url.searchParams.get("startDate") || getDateDaysAgo(7);
    const endDate = url.searchParams.get("endDate") || getDateDaysAgo(0);

    const rankings = await calculateRankings(env.DB, startDate, endDate);
    const { results: trackedUsers } = await env.DB.prepare(
      "SELECT id FROM users WHERE is_tracked = 1 ORDER BY id"
    ).all();
    const { results: untrackedUsers } = await env.DB.prepare(
      "SELECT id FROM users WHERE is_tracked = 0 ORDER BY id"
    ).all();

    return new Response(renderDashboard(rankings, trackedUsers, untrackedUsers, startDate, endDate), {
      headers: { "content-type": "text/html" },
    });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log("Daily snapshot task running at 00:00 UTC...");

    const now = new Date();
    const snapshotDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const snapshotTimestamp = Math.floor(now.getTime() / 1000); // Unix timestamp in seconds

    // Get all tracked users
    const { results: users } = await env.DB.prepare(
      "SELECT id FROM users WHERE is_tracked = 1"
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

        console.log(`Successfully updated user ${userId} (${data.username ?? 'unknown'})`);

      } catch (err) {
        console.error(`Error updating user ${userId}:`, err);
      }
    }

    console.log(`Snapshot complete for ${users.length} users on ${snapshotDate}`);
  },
};

// Helper: Calculate rankings between two dates
async function calculateRankings(db: D1Database, startDate: string, endDate: string) {
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

      rankings.push({
        userId,
        username: end.username ?? start.username ?? `User ${userId}`,
        name: end.name ?? start.name ?? "",
        startXp,
        endXp,
        increase,
        dailyAverage,
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
