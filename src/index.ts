import { renderHtml } from "./renderHtml";

export default {
  // async fetch(request, env) {
  //   const stmt = env.DB.prepare("SELECT * FROM comments LIMIT 3");
  //   const { results } = await stmt.all();

  //   return new Response(renderHtml(JSON.stringify(results, null, 2)), {
  //     headers: {
  //       "content-type": "text/html",
  //     },
  //   });
  // },

  // This is the required 'scheduled' function name
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log("Hourly task running...");

    // Get the current date and time
    const now = new Date();

    // Set the minutes, seconds, and milliseconds to 0 to get the start of the current hour
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);

    // Get the timestamp (in milliseconds) of the first second of the current hour
    const timestamp = now.getTime();

    // Step 1: Get all user IDs
    const { results: users } = await env.DB.prepare("SELECT id FROM users WHERE snapshotDate < " + timestamp + " LIMIT 50").all();

    for (const { id } of users) {
      try {
        // Step 2: Fetch user data from Duolingo
        const res = await fetch(`https://www.duolingo.com/2017-06-30/users/${id}`);
        if (!res.ok) {
          console.warn(`Failed to fetch user ${id}: ${res.status}`);
          continue;
        }

        const data:any = await res.json();

        // Step 3: Extract relevant fields
        const totalXp = data.totalXp ?? null;
        const creationDate = data.creationDate ?? null;
        const username = data.username ?? null;
        const name = data.name ?? null;
        const snapshotDate = timestamp;

        // Step 4: Update the user row
        await env.DB.prepare(`
          UPDATE users SET
            totalXp = ?,
            creationDate = ?,
            username = ?,
            name = ?,
            snapshotDate = ?
          WHERE id = ?
        `)
        .bind(totalXp, creationDate, username, name, snapshotDate, id)
        .run();

      } catch (err) {
        console.error(`Error updating user ${id}:`, err);
      }
    }
  },
};
