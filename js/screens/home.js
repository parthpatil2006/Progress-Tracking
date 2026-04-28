async function renderHome() {
  const container = document.getElementById('screen-home');
  const today = todayStr();
  const activeHabits = await getActiveHabits();
  const allLogs = await getLogsForDate(today);
  const stats = await getUserStats();
  
  const total = activeHabits.length;
  let doneCount = 0;
  
  const habitsWithData = [];
  for (let h of activeHabits) {
    const log = allLogs.find(l => l.habit_id == h.id);
    const streak = await calculateStreak(h.id);
    habitsWithData.push({ ...h, log, streak });
    if (log && log.completed) doneCount++;
  }
  
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  const incomplete = habitsWithData.filter(h => !h.log || !h.log.completed);
  const complete = habitsWithData.filter(h => h.log && h.log.completed);
  
  // Greeting
  const hour = new Date().getHours();
  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

  // Streak (overall consecutive 100% days) - simple approximation: we just use city_days as streak proxy here or compute
  // Let's compute overall streak by going back days where completed == active. For now, use a placeholder or city_days.
  const streak = stats.city_days;

  let html = `
    <div class="top-bar">
      <div class="row gap-8">
        <div style="width:24px;height:24px;border-radius:12px;background:var(--card-alt);display:flex;align-items:center;justify-content:center;font-size:10px">PT</div>
        <div class="top-bar-title small">Progress Tracker</div>
      </div>
      <div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
      </div>
    </div>
    
    <div style="padding:4px 16px 12px; display:flex; justify-content:space-between; align-items:center">
      <div>
        <div class="greeting-text">${greeting}, Builder</div>
        <div class="greeting-date">${formatDate(today)}</div>
      </div>
      <div class="streak-badge">🔥 ${streak} day streak</div>
    </div>

    <!-- Ring Card -->
    <div class="card ring-card card-hover" onclick="App.switchTab('stats')">
      <div class="ring-wrap">
        <svg viewBox="0 0 36 36">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border)" stroke-width="3"></path>
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${getRingColor(pct)}" stroke-width="3" stroke-dasharray="${pct}, 100" class="ring-fill"></path>
        </svg>
        <div class="ring-text">${pct}%</div>
      </div>
      <div class="ring-info">
        <div style="font-size:15px;font-weight:600">${doneCount} of ${total} done</div>
        <div style="font-size:13px;color:var(--text-sub)">${total - doneCount} remaining</div>
        ${pct === 100 && total > 0 ? `<div style="font-size:14px;font-weight:600;color:var(--success);margin-top:2px">Perfect Day!</div>` : ''}
        <div style="font-size:11px;color:var(--primary);margin-top:4px">View Stats →</div>
      </div>
    </div>
  `;

  // Categories
  const catCounts = { Core: [0,0], Wellness: [0,0], Learning: [0,0], Productivity: [0,0] };
  activeHabits.forEach(h => {
    if(!catCounts[h.category]) catCounts[h.category] = [0,0];
    catCounts[h.category][1]++;
    const log = allLogs.find(l => l.habit_id == h.id);
    if(log && log.completed) catCounts[h.category][0]++;
  });

  html += `<div style="display:flex;gap:8px;padding:0 16px 12px;overflow-x:auto">`;
  ['Core', 'Wellness', 'Learning', 'Productivity'].forEach(c => {
    const [d, t] = catCounts[c];
    if (t > 0) {
      html += `
        <div style="background:var(--card);border-radius:14px;padding:8px 12px;border:1px solid var(--border);min-width:70px;flex-shrink:0">
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">
            <div style="width:6px;height:6px;border-radius:3px;background:var(--cat-${c.toLowerCase()})"></div>
            <div style="font-size:12px;font-weight:600">${c[0]}</div>
          </div>
          <div style="font-size:13px;color:var(--text-sub)">${d}/${t}</div>
        </div>
      `;
    }
  });
  html += `</div>`;

  // Habits
  html += `
    <div style="padding:0 16px 12px; display:flex; justify-content:space-between; align-items:center">
      <div style="font-size:16px;font-weight:600">Today's Habits</div>
    </div>
  `;

  if (activeHabits.length === 0) {
    html += `
      <div class="card" style="text-align:center;padding:32px 16px">
        <div style="font-size:14px;color:var(--text-sub)">No habits yet. Tap + to get started.</div>
      </div>
    `;
  } else {
    incomplete.forEach(h => html += renderHabitCard(h));
    if (complete.length > 0 && incomplete.length > 0) {
      html += `<div style="height:1px;background:var(--border);margin:12px 16px"></div>`;
    }
    complete.forEach(h => html += renderHabitCard(h));
  }

  // Calculate real week data for mini chart
  const weekData = [];
  const allLogsArray = await db.HabitLog.toArray();
  for(let i=6; i>=0; i--) {
    let d = new Date(); d.setDate(d.getDate() - i);
    let dStr = d.toISOString().split('T')[0];
    let dLogs = allLogsArray.filter(l => l.date === dStr);
    let pdone = dLogs.filter(l => l.completed).length;
    let ptot = dLogs.length;
    let p = ptot ? (pdone/ptot)*100 : 0;
    weekData.push(p);
  }

  // Mini Chart & City Preview
  html += `
    <div class="row gap-8" style="padding:16px">
      <div class="card card-hover graph-zoom" style="flex:1;margin:0;cursor:pointer;padding:12px" onclick="App.switchTab('stats')">
        <div style="font-size:10px;font-weight:700;color:var(--text-sub);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Activity Trend</div>
        <div style="display:flex;align-items:flex-end;gap:4px;height:54px;padding-top:14px">
          ${weekData.map((h, i) => `
            <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%">
              <span style="font-size:9px;color:var(--text-sub);font-weight:600;margin-bottom:2px">${h > 0 ? Math.round(h) + '%' : ''}</span>
              <div style="width:100%;background:${i===6?'var(--success)':'var(--primary)'};height:${h || 5}%;border-radius:2px 2px 0 0;min-height:2px"></div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="card card-hover graph-zoom" style="flex:1;margin:0;cursor:pointer;padding:12px" onclick="App.switchTab('city')">
        <div style="font-size:10px;font-weight:700;color:var(--text-sub);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Your City</div>
        <div style="height:54px;background:var(--card-alt);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;color:var(--primary);font-weight:700;gap:4px">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>
          EXPLORE
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

async function setHomeView(view) {
  localStorage.setItem('pt_home_view', view);
  await renderHome();
}

function getRingColor(pct) {
  if (pct < 34) return 'var(--danger)';
  if (pct < 67) return 'var(--accent)';
  if (pct < 100) return 'var(--primary)';
  return 'var(--success)';
}

function renderHabitCard(h) {
  const isDone = h.log && h.log.completed === 1;
  const xp = h.difficulty * 10;
  
  if (isDone) {
    return `
      <div class="card habit-card completed card-hover" style="margin-bottom:8px;padding:8px 12px;display:flex;align-items:center;border-radius:20px">
        <div class="habit-cb-wrap" onclick="toggleHabit(${h.id}, 1)" style="margin-right:12px">
          <div class="habit-cb checked" style="width:20px;height:20px;border-radius:10px">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
        <div style="flex:1;display:flex;align-items:center;gap:8px">
          <div style="width:6px;height:6px;border-radius:3px;background:var(--cat-${h.category.toLowerCase()})"></div>
          <div style="font-size:14px;font-weight:600;color:var(--text);opacity:0.7">${h.name}</div>
        </div>
        <div style="font-size:12px;font-weight:700;color:var(--accent)">${h.streak} 🔥</div>
      </div>
    `;
  }

  return `
    <div class="card habit-card card-hover" style="margin-bottom:10px">
      <div class="habit-cb-wrap" onclick="toggleHabit(${h.id}, 0)">
        <div class="habit-cb">
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
      </div>
      <div style="flex:1">
        <div class="row gap-8" style="margin-bottom:4px">
          <div style="width:6px;height:6px;border-radius:3px;background:var(--cat-${h.category.toLowerCase()})"></div>
          <div style="font-size:15px;font-weight:600;color:var(--text)">${h.name}</div>
        </div>
        <div class="row gap-8">
          ${h.reminder_time ? `<div style="font-size:12px;color:var(--text-sub)">🕒 ${h.reminder_time}</div>` : ''}
          <div style="background:var(--cat-${h.category.toLowerCase()});color:#fff;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:600">+${xp} XP</div>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:14px;font-weight:700;color:var(--accent)">${h.streak} <svg style="display:inline;width:12px;height:12px" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c0 0-4 4-4 10a6 6 0 1 0 12 0c0-6-4-10-4-10z"/></svg></div>
        <div style="font-size:11px;color:var(--text-sub);margin-top:4px" onclick="openNoteSheet(${h.id}, '${h.name}')">→ Note</div>
      </div>
    </div>
  `;
}

async function toggleHabit(habitId, currentlyDone) {
  const habit = await db.Habit.get(habitId);
  const today = todayStr();
  const xp = habit.difficulty * 10;
  
  if (currentlyDone) {
    // Uncomplete
    await upsertLog(habitId, today, 0, 0);
    const stats = await getUserStats();
    await updateUserStats({ total_xp: Math.max(0, stats.total_xp - xp) });
  } else {
    // Complete
    await upsertLog(habitId, today, 1, xp);
    const stats = await getUserStats();
    await updateUserStats({ total_xp: stats.total_xp + xp });
    
    // Level calc
    const newStats = await getUserStats();
    const newLevel = calculateLevel(newStats.total_xp);
    if (newLevel.level !== newStats.current_level) {
      await updateUserStats({ current_level: newLevel.level });
    }
  }
  
  await checkAllComplete();
  await renderHome();
}
