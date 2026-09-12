// weekly-review.js — Weekly productivity report, performance grades, and analytics

let currentWRDate = new Date();

window.renderWeeklyReview = async function() {
  const container = document.getElementById('screen-weekly-review');
  if (!container) return;

  const [allHabits, allLogsArray, allMoods] = await Promise.all([
    getAllHabits(),
    db.HabitLog.toArray(),
    db.MoodLog.toArray()
  ]);
  
  // Calculate week range (Mon-Sun)
  const d = new Date(currentWRDate);
  const day = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - day + 1); // Monday
  const weekStart = new Date(d);
  d.setDate(d.getDate() + 6); // Sunday
  const weekEnd = new Date(d);
  
  const label = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  
  // Stats for the week
  let weekXP = 0;
  let dayScores = [];
  let habitCounts = {};
  let moodSum = 0;
  let moodCount = 0;
  
  for (let i = 0; i < 7; i++) {
    const cur = new Date(weekStart);
    cur.setDate(cur.getDate() + i);
    const dStr = cur.toISOString().split('T')[0];
    
    const dLogs = allLogsArray.filter(l => l.date === dStr);
    const dDone = dLogs.filter(l => l.completed === 1);
    
    // Sum XP
    dDone.forEach(l => {
      weekXP += (l.xp_earned || 0);
      habitCounts[l.habit_id] = (habitCounts[l.habit_id] || 0) + 1;
    });
    
    const pct = dLogs.length > 0 ? (dDone.length / dLogs.length) : 0;
    
    const mood = allMoods.find(m => m.date === dStr);
    if (mood) {
      moodSum += mood.mood_level;
      moodCount++;
    }
    
    dayScores.push({
      date: cur,
      dateStr: dStr,
      label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      pct: pct,
      mood: mood ? mood.mood_level : null
    });
  }
  
  const activeDays = dayScores.filter(ds => ds.pct > 0 || ds.mood).length;
  const avgPct = dayScores.reduce((acc, ds) => acc + ds.pct, 0) / 7;
  const score = Math.round(avgPct * 100);
  
  let grade = 'D';
  let gColor = 'var(--danger)';
  if (score >= 90) { grade = 'A+'; gColor = 'var(--success)'; }
  else if (score >= 75) { grade = 'A'; gColor = 'var(--primary)'; }
  else if (score >= 60) { grade = 'B'; gColor = 'var(--warning)'; }
  else if (score >= 40) { grade = 'C'; gColor = 'var(--text-secondary)'; }
  
  // Best / Worst Habit
  let bestHabitId = null;
  let bestHabitCount = -1;
  let worstHabitId = null;
  let worstHabitCount = 999;
  
  Object.keys(habitCounts).forEach(id => {
    const c = habitCounts[id];
    if (c > bestHabitCount) { bestHabitCount = c; bestHabitId = parseInt(id, 10); }
    if (c < worstHabitCount) { worstHabitCount = c; worstHabitId = parseInt(id, 10); }
  });
  
  if (worstHabitCount === 999) worstHabitCount = 0;
  
  const bestH = allHabits.find(h => h.id == bestHabitId);
  const worstH = allHabits.find(h => h.id == worstHabitId);
  
  const avgMood = moodCount > 0 ? Math.round(moodSum / moodCount) : 0;
  const moodLabels = { 1: 'Awful', 2: 'Bad', 3: 'Okay', 4: 'Good', 5: 'Great', 0: 'No Check-ins' };

  let html = `
    <div class="top-bar">
      <div style="display:flex; align-items:center; gap:12px;">
        <button onclick="popScreen()" style="padding:4px;" aria-label="Go Back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="top-bar-title" style="font-size:18px;">Weekly Review</div>
      </div>
      <div style="display:flex; gap:4px; align-items:center;">
        <button onclick="changeWRWeek(-1)" style="padding:6px 10px; background:var(--card); border:1px solid var(--border); border-radius:8px;" aria-label="Previous Week">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button onclick="changeWRWeek(1)" style="padding:6px 10px; background:var(--card); border:1px solid var(--border); border-radius:8px;" aria-label="Next Week">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
    
    <div style="padding:16px;">
      <!-- Week Range Subtitle -->
      <div style="text-align:center; font-size:13px; font-weight:600; color:var(--text-secondary); margin-bottom:16px;">
        ${label}
      </div>

      <!-- Score & Grade Card -->
      <div class="card" style="margin:0 0 16px; text-align:center; padding:24px 16px;">
        <div style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Consistency Grade</div>
        <div style="font-size:44px; font-weight:800; color:${gColor}; line-height:1; margin-bottom:8px;">${grade}</div>
        <div style="font-size:24px; font-weight:700; color:var(--text-primary); margin-bottom:6px;">${score}% Score</div>
        <div style="font-size:13px; color:var(--text-secondary);">
          ${weekXP > 0 ? `Earned <b style="color:var(--primary)">+${weekXP} XP</b> across ${activeDays} active days.` : 'No habit check-ins recorded for this week.'}
        </div>
      </div>
      
      <!-- Daily Breakdown -->
      <div class="card" style="margin:0 0 16px; padding:16px;">
        <div style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:14px;">Daily Execution</div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${dayScores.map(ds => `
            <div style="display:flex; align-items:center; font-size:13px; gap:8px;">
              <div style="width:36px; font-weight:600; color:var(--text-secondary);">${ds.label}</div>
              <div style="flex:1; height:8px; background:var(--bg); border-radius:4px; overflow:hidden;">
                <div style="height:100%; width:${Math.round(ds.pct * 100)}%; background:var(--primary); border-radius:4px; transition:width 0.4s ease;"></div>
              </div>
              <div style="width:40px; text-align:right; font-weight:600; color:var(--text-primary); font-size:12px;">${Math.round(ds.pct * 100)}%</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Best & Needs Attention -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
        <div class="card" style="margin:0; padding:14px; border-top:3px solid var(--success);">
          <div style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:4px;">Top Performer</div>
          <div style="font-size:14px; font-weight:700; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px;">
            ${escapeHtml(bestH ? bestH.name : '—')}
          </div>
          <div style="font-size:12px; font-weight:600; color:var(--success);">${bestHabitCount > 0 ? `${bestHabitCount} / 7 days` : '0 days'}</div>
        </div>

        <div class="card" style="margin:0; padding:14px; border-top:3px solid var(--warning);">
          <div style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:4px;">Needs Focus</div>
          <div style="font-size:14px; font-weight:700; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px;">
            ${escapeHtml(worstH ? worstH.name : '—')}
          </div>
          <div style="font-size:12px; font-weight:600; color:var(--warning);">${worstHabitCount < 999 ? `${worstHabitCount} / 7 days` : '0 days'}</div>
        </div>
      </div>
      
      <!-- Mood & XP Highlights -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div class="card" style="margin:0; padding:14px; text-align:center;">
          <div style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:6px;">Average Mood</div>
          <div style="font-size:15px; font-weight:700; color:var(--text-primary);">${moodLabels[avgMood]}</div>
        </div>
        <div class="card" style="margin:0; padding:14px; text-align:center;">
          <div style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:6px;">Total Week XP</div>
          <div style="font-size:18px; font-weight:800; color:var(--primary);">+${weekXP}</div>
        </div>
      </div>
    </div>
  `;
  container.innerHTML = html;
};

window.changeWRWeek = function(offset) {
  currentWRDate.setDate(currentWRDate.getDate() + (offset * 7));
  window.renderWeeklyReview();
};
