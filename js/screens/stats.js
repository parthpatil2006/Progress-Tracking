async function renderStats() {
  const container = document.getElementById('screen-stats');
  
  const habits = await getActiveHabits();
  const allHabits = await getAllHabits();
  const stats = await getUserStats();
  const today = todayStr();
  const logsToday = await getLogsForDate(today);
  
  const activeToday = logsToday.filter(l => l.completed).length;
  
  // Need to compute overall completion = total completed / total possible
  // For simplicity, we fetch all logs and count.
  const allLogsArray = await db.HabitLog.toArray();
  const totalCompleted = allLogsArray.filter(l => l.completed).length;
  const totalPossible = allLogsArray.length;
  const overallPct = totalPossible ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  // Calculate real week data for mini chart & growth curve
  const weekData = [];
  for(let i=6; i>=0; i--) {
    let d = new Date(); d.setDate(d.getDate() - i);
    let dStr = d.toISOString().split('T')[0];
    let dLogs = allLogsArray.filter(l => l.date === dStr);
    let pdone = dLogs.filter(l => l.completed).length;
    let ptot = dLogs.length;
    let p = ptot ? (pdone/ptot)*100 : 0;
    weekData.push(p);
  }

  let html = `
    <div class="top-bar">
      <div class="top-bar-title">Statistics</div>
    </div>
    
    <!-- Summary Row -->
    <div class="row gap-8" style="padding:16px">
      <div class="card" style="flex:1;margin:0;padding:12px;text-align:center">
        <div style="font-size:10px;font-weight:700;color:var(--text-sub);text-transform:uppercase;margin-bottom:4px">HABITS</div>
        <div style="font-size:22px;font-weight:700">${habits.length}</div>
      </div>
      <div class="card" style="flex:1;margin:0;padding:12px;text-align:center">
        <div style="font-size:10px;font-weight:700;color:var(--text-sub);text-transform:uppercase;margin-bottom:4px">TODAY</div>
        <div style="font-size:22px;font-weight:700;color:var(--success)">${activeToday}</div>
      </div>
      <div class="card" style="flex:1;margin:0;padding:12px;text-align:center">
        <div style="font-size:10px;font-weight:700;color:var(--text-sub);text-transform:uppercase;margin-bottom:4px">RATE</div>
        <div style="font-size:22px;font-weight:700;color:var(--primary)">${overallPct}%</div>
      </div>
    </div>
    
    <!-- Streak Stats Row -->
    <div class="row gap-8" style="padding:0 16px 16px">
      <div class="card" style="flex:1;margin:0;padding:12px;text-align:center">
        <div style="font-size:10px;font-weight:700;color:var(--text-sub);text-transform:uppercase;margin-bottom:4px">STREAK</div>
        <div style="font-size:22px;font-weight:700;color:var(--accent)">${stats.city_days}</div>
      </div>
      <div class="card" style="flex:1;margin:0;padding:12px;text-align:center">
        <div style="font-size:10px;font-weight:700;color:var(--text-sub);text-transform:uppercase;margin-bottom:4px">TOTAL XP</div>
        <div style="font-size:22px;font-weight:700">${stats.total_xp}</div>
      </div>
    </div>
  `;

  // Draw Pie Chart SVG (Simplified)
  const catDone = {}; const catTotal = {};
  ['Core', 'Wellness', 'Learning', 'Productivity'].forEach(c => { catDone[c]=0; catTotal[c]=0; });
  
  allLogsArray.forEach(l => {
    const h = allHabits.find(hx => hx.id == l.habit_id);
    if(h && catTotal.hasOwnProperty(h.category)) {
      catTotal[h.category]++;
      if(l.completed) catDone[h.category]++;
    }
  });

  html += `
    <div class="card" style="padding:12px">
      <div style="font-size:10px;font-weight:700;color:var(--text-sub);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Category Balance</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${['Core', 'Wellness', 'Learning', 'Productivity'].map(cat => {
          const pct = catTotal[cat] ? Math.round((catDone[cat]/catTotal[cat])*100) : 0;
          return `
            <div style="width:100%">
              <div class="row space-between" style="font-size:11px;margin-bottom:4px">
                <span style="font-weight:600">${cat}</span>
                <span style="color:var(--text-sub)">${pct}%</span>
              </div>
              <div style="width:100%;height:4px;background:var(--card-alt);border-radius:2px;overflow:hidden">
                <div style="width:${pct}%;height:100%;background:var(--cat-${cat.toLowerCase()})"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Weekly Progress
  let weekHtml = '';
  for(let i=6; i>=0; i--) {
    let d = new Date(); d.setDate(d.getDate() - i);
    let dStr = d.toISOString().split('T')[0];
    let dLabel = d.toLocaleDateString('en-US', { weekday: 'short' })[0];
    let logs = allLogsArray.filter(l => l.date === dStr);
    let pdone = logs.filter(l=>l.completed).length;
    let ptot = logs.length;
    let p = ptot ? (pdone/ptot)*100 : 0;
    let isToday = i===0;
    
    weekHtml += `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;height:80px;justify-content:flex-end">
        <div style="font-size:9px;color:var(--text-muted);margin-bottom:4px">${Math.round(p)}%</div>
        <div style="width:100%;background:var(--card-alt);border-radius:4px 4px 0 0;height:100%;position:relative;overflow:hidden">
          <div style="position:absolute;bottom:0;left:0;right:0;background:${isToday ? 'var(--success)' : 'var(--primary)'};height:${p}%;border-radius:2px 2px 0 0"></div>
        </div>
        <div style="font-size:10px;font-weight:600;color:${isToday ? 'var(--text)' : 'var(--text-muted)'};margin-top:4px">${dLabel}</div>
      </div>
    `;
  }

  // Precise Line Chart Calculation
  let points = '';
  for(let i=0; i<7; i++) {
    let x = (i * 15.5) + 5; // 0 to 100 range
    let y = 50 - (weekData[i] * 0.4); // 0 to 50 range, inverted
    points += `${x},${y} `;
  }

  html += `
    <div class="card graph-zoom" style="padding:12px">
      <div style="font-size:10px;font-weight:700;color:var(--text-sub);text-transform:uppercase;letter-spacing:1px;margin-bottom:16px">Growth Curve</div>
      <div style="height:60px;width:100%;background:var(--card-alt);border-radius:8px;position:relative;padding:10px 5px">
        <svg viewBox="0 0 100 50" style="width:100%;height:100%">
          <polyline points="${points}" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          ${weekData.map((p, i) => `<circle cx="${(i * 15.5) + 5}" cy="${50 - (p * 0.4)}" r="2" fill="var(--primary)" />`).join('')}
        </svg>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:8px">
        <div style="font-size:9px;color:var(--text-muted)">7 DAYS AGO</div>
        <div style="font-size:9px;color:var(--accent);font-weight:700">TODAY</div>
      </div>
    </div>
  `;

  html += `
    <div class="card graph-zoom" style="padding:12px">
      <div style="font-size:10px;font-weight:700;color:var(--text-sub);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Weekly Trend (Bars)</div>
      <div style="display:flex;gap:6px;align-items:flex-end">${weekHtml}</div>
    </div>
  `;

  // Completed / Total Counter
  html += `
    <div class="card row" style="padding:16px 12px">
      <div style="flex:1;text-align:center">
        <div style="font-size:24px;font-weight:700;color:var(--success);display:flex;align-items:center;justify-content:center;gap:4px">
          ${totalCompleted} <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style="font-size:9px;font-weight:700;color:var(--text-muted);margin-top:4px;letter-spacing:1px;text-transform:uppercase">Completed</div>
      </div>
      <div style="width:1px;height:30px;background:var(--border)"></div>
      <div style="flex:1;text-align:center">
        <div style="font-size:24px;font-weight:700;color:var(--text)">${totalPossible}</div>
        <div style="font-size:9px;font-weight:700;color:var(--text-muted);margin-top:4px;letter-spacing:1px;text-transform:uppercase">Total Possible</div>
      </div>
    </div>
  `;

  // Habits Details
  html += `<div style="padding:16px 16px 8px;font-size:10px;font-weight:700;color:var(--text-sub);text-transform:uppercase;letter-spacing:1px">Habit Insights</div>`;
  
  for (let h of habits) {
    const hLogs = allLogsArray.filter(l => l.habit_id == h.id);
    const hDone = hLogs.filter(l => l.completed).length;
    const hPct = hLogs.length ? Math.round((hDone/hLogs.length)*100) : 0;
    const hStreak = await calculateStreak(h.id);

    html += `
      <div class="card card-hover" style="margin-bottom:8px;padding:12px">
        <div class="row space-between" style="margin-bottom:8px">
          <div class="row gap-8">
            <div style="width:6px;height:6px;border-radius:3px;background:var(--cat-${h.category.toLowerCase()})"></div>
            <div style="font-size:14px;font-weight:600;color:var(--text)">${h.name}</div>
          </div>
          <div style="font-size:12px;font-weight:700;color:var(--accent)">${hStreak} 🔥</div>
        </div>
        <div class="row space-between" style="padding-top:8px;border-top:1px solid var(--border)">
          <div style="font-size:10px;color:var(--text-muted)">SUCCESSRATE</div>
          <div style="font-size:11px;font-weight:700;color:var(--success)">${hPct}%</div>
        </div>
        <div class="row space-between" style="margin-top:4px">
          <div style="font-size:10px;color:var(--text-muted)">LOGGED DAYS</div>
          <div style="font-size:11px;font-weight:700;color:var(--text)">${hLogs.length}</div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}
