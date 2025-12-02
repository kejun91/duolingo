export function renderDashboard(
  rankings: any[],
  trackedUsers: any[],
  untrackedUsers: any[],
  startDate: string,
  endDate: string,
  streakMin: number = 30
) {
  const totalXpGained = rankings.reduce((sum, r) => sum + r.increase, 0);
  const avgXpGained = rankings.length > 0 ? Math.round(totalXpGained / rankings.length) : 0;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Duolingo Progress Tracker</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
          }
          
          .container { max-width: 1400px; margin: 0 auto; }
          
          header {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          
          h1 {
            color: #1cb0f6;
            font-size: 2.5em;
            margin-bottom: 10px;
          }
          
          .subtitle {
            color: #666;
            font-size: 1.1em;
          }
          
          .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
          }
          
          .tab {
            background: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1em;
            font-weight: 600;
            transition: all 0.3s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .tab:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          }
          
          .tab.active {
            background: #1cb0f6;
            color: white;
          }
          
          .tab-content { display: none; }
          .tab-content.active { display: block; }
          
          .card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          
          .ranking-table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .ranking-table th {
            background: #f7f7f7;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            color: #333;
            border-bottom: 2px solid #e0e0e0;
            position: sticky;
            top: 0;
          }
          
          .ranking-table td {
            padding: 15px;
            border-bottom: 1px solid #f0f0f0;
          }
          
          .ranking-table tr:hover {
            background: #f9f9f9;
          }
          
          .rank {
            font-size: 1.5em;
            font-weight: bold;
            color: #999;
            width: 60px;
          }
          
          .rank.gold { color: #ffd700; }
          .rank.silver { color: #c0c0c0; }
          .rank.bronze { color: #cd7f32; }
          
          .username {
            font-weight: 600;
            color: #333;
          }
          
          .xp-badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9em;
          }
          
          .xp-positive {
            background: #58cc02;
            color: white;
          }
          
          .xp-negative {
            background: #ea2b2b;
            color: white;
          }
          
          .xp-neutral {
            background: #e5e5e5;
            color: #666;
          }
          
          .user-form {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
          }
          
          .user-form input {
            flex: 1;
            min-width: 200px;
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 1em;
          }
          
          .user-form input:focus {
            outline: none;
            border-color: #1cb0f6;
          }
          
          .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          }
          
          .btn-primary {
            background: #58cc02;
            color: white;
          }
          
          .btn-primary:hover {
            background: #4db002;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(88, 204, 2, 0.3);
          }
          .btn-primary.loading {
            opacity: 0.8;
            cursor: wait;
          }
          .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 3px solid #fff;
            border-top-color: rgba(255,255,255,0.4);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-right: 8px;
            vertical-align: middle;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          
          .btn-danger {
            background: #ea2b2b;
            color: white;
            padding: 8px 16px;
            font-size: 0.9em;
          }
          
          .btn-danger:hover {
            background: #d12020;
          }
          
          .btn-secondary {
            background: #1cb0f6;
            color: white;
            padding: 8px 16px;
            font-size: 0.9em;
          }
          
          .btn-secondary:hover {
            background: #17a1e6;
          }
          
          .message {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          
          .message.error {
            background: #fee;
            color: #c00;
            border: 1px solid #fcc;
          }
          
          .message.success {
            background: #efe;
            color: #0a0;
            border: 1px solid #cfc;
          }
          
          .user-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
          }
          
          .user-card {
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .user-info h3 {
            color: #333;
            margin-bottom: 5px;
          }
          
          .user-info p {
            color: #666;
            font-size: 0.9em;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }
          
          .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
          }
          
          .stat-value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .stat-label {
            font-size: 0.9em;
            opacity: 0.9;
          }
          
          .date-selector-box {
            background: #f7f7f7;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
          }
          
          .date-selector-box h3 {
            margin-bottom: 15px;
            color: #333;
            font-size: 1.1em;
          }
          
          .quick-buttons {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 15px;
          }
          
          .quick-btn {
            background: #e0e0e0;
            color: #333;
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9em;
            font-weight: 500;
            transition: all 0.2s;
          }
          
          .quick-btn:hover {
            background: #d0d0d0;
            transform: translateY(-1px);
          }
          
          .date-inputs {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 15px;
          }
          
          .date-input-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #666;
          }
          
          .date-input-group input {
            width: 100%;
            padding: 10px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 1em;
          }
          
          .date-input-group input:focus {
            outline: none;
            border-color: #1cb0f6;
          }
          .date-input-group select {
            width: 100%;
            padding: 10px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 1em;
            background: #fff;
          }
          .date-input-group select:focus {
            outline: none;
            border-color: #1cb0f6;
          }
          
          .current-range {
            color: #666;
            font-size: 0.9em;
            margin-top: 10px;
          }
          
          a {
            color: #1cb0f6;
            text-decoration: none;
            font-weight: 500;
          }
          
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1>🦉 Duolingo Progress Tracker</h1>
            <p class="subtitle">Track XP progress and rankings over time</p>
          </header>

          <div class="tabs">
            <button class="tab active" onclick="switchTab('rankings')">📊 Rankings</button>
            <button class="tab" onclick="switchTab('users')">👥 Manage Users</button>
          </div>

          <!-- Rankings Tab -->
          <div id="rankings" class="tab-content active">
            <div class="card">
              <h2 style="margin-bottom: 20px; color: #333;">🏆 Leaderboard</h2>
              
              <!-- Date Range Selector -->
              <div class="date-selector-box">
                <h3>📅 Select Date Range</h3>
                
                <div style="margin-bottom: 15px;">
                  <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #666;">Quick Select:</label>
                  <div class="quick-buttons">
                    <button class="quick-btn" onclick="setDateRange('today')">Today</button>
                    <button class="quick-btn" onclick="setDateRange('yesterday')">Yesterday</button>
                    <button class="quick-btn" onclick="setDateRange('week')">This Week</button>
                    <button class="quick-btn" onclick="setDateRange('lastWeek')">Last Week</button>
                    <button class="quick-btn" onclick="setDateRange('month')">This Month</button>
                    <button class="quick-btn" onclick="setDateRange('last30')">Last 30 Days</button>
                    <button class="quick-btn" onclick="setDateRange('last90')">Last 90 Days</button>
                    <button class="quick-btn" onclick="setDateRange('all')">All Time</button>
                  </div>
                </div>
                
                <div class="date-inputs">
                  <div class="date-input-group">
                    <label>From Date:</label>
                    <input type="date" id="fromDate" value="${startDate}" />
                  </div>
                  
                  <div class="date-input-group">
                    <label>To Date:</label>
                    <input type="date" id="toDate" value="${endDate}" />
                  </div>
                  
                  <div class="date-input-group">
                    <label>Streak Filter:</label>
                    <select id="streakMin">
                      <option value="0" ${streakMin === 0 ? 'selected' : ''}>All streaks</option>
                      <option value="7" ${streakMin === 7 ? 'selected' : ''}>Streak ≥ 7</option>
                      <option value="30" ${streakMin === 30 ? 'selected' : ''}>Streak ≥ 30</option>
                      <option value="60" ${streakMin === 60 ? 'selected' : ''}>Streak ≥ 60</option>
                      <option value="100" ${streakMin === 100 ? 'selected' : ''}>Streak ≥ 100</option>
                    </select>
                  </div>
                  
                  <div class="date-input-group" style="display: flex; align-items: flex-end;">
                    <button id="updateBtn" class="btn btn-primary" onclick="updateRankings()" style="width: 100%; padding: 10px 20px;">
                      <span class="btn-text">🔍 Update Rankings</span>
                    </button>
                  </div>
                </div>
                
                <div class="current-range">
                  <strong>Current Range:</strong> ${startDate} to ${endDate}
                </div>
              </div>
              
              <!-- Stats Grid -->
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value" id="stat-active-users">${rankings.length}</div>
                  <div class="stat-label">Active Users</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value" id="stat-total-xp">${totalXpGained.toLocaleString()}</div>
                  <div class="stat-label">Total XP Gained</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value" id="stat-avg-xp">${avgXpGained.toLocaleString()}</div>
                  <div class="stat-label">Average XP per User</div>
                </div>
              </div>
              
              <!-- Rankings Table -->
              <div style="overflow-x: auto;">
                <table class="ranking-table">
                  <thead>
                    <tr>
                      <th style="width: 60px;">Rank</th>
                      <th>User</th>
                      <th>Start XP</th>
                      <th>End XP</th>
                      <th>XP Gained</th>
                      <th>Daily Average</th>
                      <th>Streak</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="rankings-body">
                    ${rankings.length === 0 ? `
                      <tr>
                        <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                          No data available for the selected date range. 
                          ${trackedUsers.length === 0 ? 'Add users in the "Manage Users" tab to get started.' : 'Run the snapshot collection to gather data.'}
                        </td>
                      </tr>
                    ` : ''}
                    ${rankings.map((r, index) => {
                      let rankClass = '';
                      if (index === 0) rankClass = 'gold';
                      else if (index === 1) rankClass = 'silver';
                      else if (index === 2) rankClass = 'bronze';
                      
                      let xpClass = 'xp-neutral';
                      if (r.increase > 0) xpClass = 'xp-positive';
                      else if (r.increase < 0) xpClass = 'xp-negative';
                      
                      return `
                        <tr>
                          <td class="rank ${rankClass}">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index + 1)}</td>
                          <td>
                            <div class="username">${escapeHtml(r.username)}</div>
                            ${r.name ? `<div style="font-size: 0.85em; color: #666;">${escapeHtml(r.name)}</div>` : ''}
                          </td>
                          <td>${r.startXp.toLocaleString()}</td>
                          <td style="font-weight: 600;">${r.endXp.toLocaleString()}</td>
                          <td><span class="xp-badge ${xpClass}">${r.increase >= 0 ? '+' : ''}${r.increase.toLocaleString()} XP</span></td>
              <td>${r.dailyAverage >= 0 ? '+' : ''}${r.dailyAverage.toLocaleString()}/day</td>
              <td>${(r.streak ?? 0).toLocaleString()}</td>
                          <td><a href="/api/user-history?userId=${r.userId}">📈 View History</a></td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Users Tab -->
          <div id="users" class="tab-content">
            <div class="card">
              <h2 style="margin-bottom: 20px; color: #333;">👥 Manage Users</h2>
              
              <div id="message"></div>

              <h3 style="margin-top: 20px; margin-bottom: 15px; color: #333;">➕ Add New User</h3>
              <div class="user-form">
                <input type="text" id="newUserId" placeholder="Enter Duolingo User ID (e.g., 1234567890)" />
                <button class="btn btn-primary" onclick="addUser()">Add User</button>
              </div>

              <h3 style="margin-top: 30px; margin-bottom: 15px; color: #333;">✅ Tracked Users (${trackedUsers.length})</h3>
              ${trackedUsers.length === 0 ? `
                <div style="padding: 30px; text-align: center; color: #999; background: #f7f7f7; border-radius: 8px;">
                  No tracked users yet. Add a user above to start tracking!
                </div>
              ` : `
                <div class="user-list">
                  ${trackedUsers.map(u => {
                    const uname = u.username ? escapeHtml(u.username) : `User ${u.id}`;
                    const realName = u.name ? `<div style=\"font-size:0.8em;color:#555;\">${escapeHtml(u.name)}</div>` : '';
                    const profile = u.username ? `<a href=\"https://www.duolingo.com/profile/${encodeURIComponent(u.username)}\" target=\"_blank\" style=\"font-size:0.7em;color:#1cb0f6;\">Profile ↗</a>` : '';
                    return `
                      <div class=\"user-card\">
                        <div class=\"user-info\">
                          <h3>${uname}</h3>
                          <p style=\"font-size:0.75em;color:#777;\">ID: ${u.id}</p>
                          ${realName}
                          ${profile}
                        </div>
                        <button class=\"btn btn-danger\" onclick=\"untrackUser(${u.id})\">Untrack</button>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}

              ${untrackedUsers.length > 0 ? `
                <h3 style="margin-top: 30px; margin-bottom: 15px; color: #333;">⏸️ Untracked Users (${untrackedUsers.length})</h3>
                <div class="user-list">
                  ${untrackedUsers.map(u => {
                    const uname = u.username ? escapeHtml(u.username) : `User ${u.id}`;
                    const realName = u.name ? `<div style=\"font-size:0.8em;color:#555;\">${escapeHtml(u.name)}</div>` : '';
                    const profile = u.username ? `<a href=\"https://www.duolingo.com/profile/${encodeURIComponent(u.username)}\" target=\"_blank\" style=\"font-size:0.7em;color:#1cb0f6;\">Profile ↗</a>` : '';
                    return `
                      <div class=\"user-card\" style=\"opacity:0.7;\">
                        <div class=\"user-info\">
                          <h3>${uname}</h3>
                          <p style=\"font-size:0.75em;color:#777;\">ID: ${u.id}</p>
                          ${realName}
                          ${profile}
                        </div>
                        <button class=\"btn btn-secondary\" onclick=\"retrackUser(${u.id})\">Retrack</button>
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <script>
          function switchTab(tabName) {
            // Update tab buttons
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            
            // Update tab content
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
          }

          async function updateRankings() {
            const fromDate = document.getElementById('fromDate').value;
            const toDate = document.getElementById('toDate').value;
            const streakMin = document.getElementById('streakMin').value;
            const params = new URLSearchParams({ startDate: fromDate, endDate: toDate, streakMin: streakMin });
            const btn = document.getElementById('updateBtn');
            if (btn) {
              btn.classList.add('loading');
              btn.setAttribute('disabled','true');
              const txt = btn.querySelector('.btn-text');
              if (txt) txt.innerHTML = '<span class="spinner"></span>Loading';
            }
            try {
              const res = await fetch('/api/rankings?' + params.toString());
              const data = await res.json();
              renderRankingsTable(data);
              updateStats(data);
              history.replaceState(null, '', '/?' + params.toString());
            } catch (e) {
              showMessage('❌ Failed to load rankings: ' + e, 'error');
            } finally {
              if (btn) {
                btn.classList.remove('loading');
                btn.removeAttribute('disabled');
                const txt = btn.querySelector('.btn-text');
                if (txt) txt.textContent = '🔍 Update Rankings';
              }
            }
          }
          function rankEmoji(i){ return i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1); }
          function renderRankingsTable(rankings){
            const tbody = document.getElementById('rankings-body');
            if (!tbody) return;
            if (!Array.isArray(rankings) || rankings.length === 0){
              tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#999;">No data available for the selected range.</td></tr>';
              return;
            }
            let rows = '';
            for (let i=0;i<rankings.length;i++) {
              const r = rankings[i];
              const rankClass = i===0?'gold':i===1?'silver':i===2?'bronze':'';
              const xpClass = r.increase>0?'xp-positive':(r.increase<0?'xp-negative':'xp-neutral');
              const username = r.username || ('User ' + r.userId);
              const nameHtml = r.name ? '<div style="font-size:0.85em;color:#666;">'+escapeHtml(r.name)+'</div>' : '';
              rows += '<tr>'+
                '<td class="rank '+rankClass+'">'+rankEmoji(i)+'</td>'+
                '<td><div class="username">'+escapeHtml(username)+'</div>'+nameHtml+'</td>'+
                '<td>'+Number(r.startXp||0).toLocaleString()+'</td>'+
                '<td style="font-weight:600;">'+Number(r.endXp||0).toLocaleString()+'</td>'+
                '<td><span class="xp-badge '+xpClass+'">'+(r.increase>=0?'+':'')+Number(r.increase||0).toLocaleString()+' XP</span></td>'+
                '<td>'+(r.dailyAverage>=0?'+':'')+Number(r.dailyAverage||0).toLocaleString()+'/day</td>'+
                '<td>'+Number(r.streak||0).toLocaleString()+'</td>'+
                '<td><a href="/api/user-history?userId='+r.userId+'">📈 View History</a></td>'+
              '</tr>';
            }
            tbody.innerHTML = rows;
          }
          function updateStats(rankings){
            if (!Array.isArray(rankings)) return;
            let totalXp=0; for (const r of rankings) totalXp += (r.increase||0);
            const avgXp = rankings.length? Math.round(totalXp / rankings.length) : 0;
            const activeUsersEl = document.getElementById('stat-active-users');
            const totalXpEl = document.getElementById('stat-total-xp');
            const avgXpEl = document.getElementById('stat-avg-xp');
            if (activeUsersEl) activeUsersEl.textContent = rankings.length.toString();
            if (totalXpEl) totalXpEl.textContent = totalXp.toLocaleString();
            if (avgXpEl) avgXpEl.textContent = avgXp.toLocaleString();
          }

          // Initialize streak filter from current URL
          (function initFiltersFromUrl(){
            const params = new URLSearchParams(window.location.search);
            const streakMin = params.get('streakMin') || '30';
            const el = document.getElementById('streakMin');
            if (el) el.value = streakMin;
          })();

          function setDateRange(type) {
            const today = new Date();
            let fromDate, toDate = today;
            
            switch(type) {
              case 'today':
                fromDate = new Date(today);
                break;
              case 'yesterday':
                fromDate = new Date(today);
                fromDate.setDate(today.getDate() - 1);
                toDate = new Date(today);
                toDate.setDate(today.getDate() - 1);
                break;
              case 'week':
                fromDate = new Date(today);
                const dayOfWeek = today.getDay();
                fromDate.setDate(today.getDate() - dayOfWeek);
                break;
              case 'lastWeek':
                const lastWeekEnd = new Date(today);
                lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
                toDate = lastWeekEnd;
                fromDate = new Date(lastWeekEnd);
                fromDate.setDate(lastWeekEnd.getDate() - 6);
                break;
              case 'month':
                fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
              case 'last30':
                fromDate = new Date(today);
                fromDate.setDate(today.getDate() - 30);
                break;
              case 'last90':
                fromDate = new Date(today);
                fromDate.setDate(today.getDate() - 90);
                break;
              case 'all':
                fromDate = new Date('2024-01-01');
                break;
              default:
                fromDate = new Date(today);
                fromDate.setDate(today.getDate() - 7);
            }
            
            document.getElementById('fromDate').value = fromDate.toISOString().split('T')[0];
            document.getElementById('toDate').value = toDate.toISOString().split('T')[0];
            updateRankings();
          }

          async function addUser() {
            const userId = document.getElementById('newUserId').value.trim();
            if (!userId) {
              showMessage('Please enter a user ID', 'error');
              return;
            }

            try {
              const res = await fetch('/api/add-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
              });
              const data = await res.json();
              
              if (res.ok) {
                showMessage('✅ User added successfully!', 'success');
                document.getElementById('newUserId').value = '';
                setTimeout(() => location.reload(), 1000);
              } else {
                showMessage('❌ ' + (data.error || 'Failed to add user'), 'error');
              }
            } catch (err) {
              showMessage('❌ Error: ' + err, 'error');
            }
          }

          async function untrackUser(userId) {
            if (!confirm('Are you sure you want to untrack this user? Historical data will be preserved.')) return;

            try {
              const res = await fetch('/api/untrack-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
              });
              
              if (res.ok) {
                showMessage('✅ User untracked successfully!', 'success');
                setTimeout(() => location.reload(), 1000);
              } else {
                const data = await res.json();
                showMessage('❌ ' + (data.error || 'Failed to untrack user'), 'error');
              }
            } catch (err) {
              showMessage('❌ Error: ' + err, 'error');
            }
          }

          async function retrackUser(userId) {
            try {
              const res = await fetch('/api/retrack-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
              });
              
              if (res.ok) {
                showMessage('✅ User retracked successfully!', 'success');
                setTimeout(() => location.reload(), 1000);
              } else {
                const data = await res.json();
                showMessage('❌ ' + (data.error || 'Failed to retrack user'), 'error');
              }
            } catch (err) {
              showMessage('❌ Error: ' + err, 'error');
            }
          }

          function showMessage(text, type) {
            const msgDiv = document.getElementById('message');
            msgDiv.innerHTML = \`<div class="message \${type}">\${text}</div>\`;
            setTimeout(() => msgDiv.innerHTML = '', 5000);
          }
        </script>
      </body>
    </html>
  `;
}

export function renderUserHistory(snapshots: any[], userId: string) {
  // Parse the first snapshot to get username
  const firstSnapshot = snapshots.length > 0 && snapshots[0].userInfo 
    ? JSON.parse(snapshots[0].userInfo) 
    : null;
  const username = firstSnapshot?.username || userId;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>User History - ${userId}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: #f5f5f5; padding: 20px; }
          .container { max-width: 1000px; margin: 0 auto; }
          header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          h1 { color: #1cb0f6; font-size: 24px; margin-bottom: 10px; }
          .back-link { display: inline-block; margin-bottom: 10px; color: #1cb0f6; text-decoration: none; }
          .back-link:hover { text-decoration: underline; }
          .section { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          table { width: 100%; border-collapse: collapse; }
          th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
          th { background: #f7f7f7; font-weight: 600; color: #555; }
          tr:hover { background: #f9f9f9; }
          .increase { color: #58cc02; font-weight: 600; }
          .increase.negative { color: #ff4b4b; }
        </style>
      </head>
      <body>
        <div class="container">
          <a href="/" class="back-link">← Back to Dashboard</a>
          <header>
            <h1>📊 User History: ${escapeHtml(username)}</h1>
            <p style="color: #777; font-size: 14px;">User ID: ${userId}</p>
          </header>

          <div class="section">
            <h2 style="margin-bottom: 15px;">Daily Snapshots</h2>
            <div style="overflow-x: auto;">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total XP</th>
                    <th>Daily Change</th>
                    <th>Username</th>
                  </tr>
                </thead>
                <tbody>
                  ${snapshots.length === 0 ? '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #999;">No snapshots available</td></tr>' : ''}
                  ${snapshots.map((s, index) => {
                    const userInfo = s.userInfo ? JSON.parse(s.userInfo) : {};
                    const totalXp = userInfo.totalXp ?? 0;
                    const username = userInfo.username || 'Unknown';
                    
                    let prevXp = totalXp;
                    let change = 0;
                    if (index < snapshots.length - 1) {
                      const prevUserInfo = snapshots[index + 1].userInfo ? JSON.parse(snapshots[index + 1].userInfo) : {};
                      prevXp = prevUserInfo.totalXp ?? 0;
                      change = totalXp - prevXp;
                    }
                    
                    return `
                      <tr>
                        <td>${s.snapshot_date}</td>
                        <td>${totalXp.toLocaleString()}</td>
                        <td class="increase ${change < 0 ? 'negative' : ''}">${index < snapshots.length - 1 ? (change >= 0 ? '+' : '') + change.toLocaleString() : '-'}</td>
                        <td>${escapeHtml(username)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
