let currentWRDate = new Date(); // Start at today

async function renderWeeklyReview() {
  const container = document.getElementById('screen-weekly-review');
  const allHabits = await getAllHabits();
  const allLogsArray = await db.HabitLog.toArray();
  const allMoods = await db.MoodLog.toArray();
  
  // Calculate week range (Mon-Sun)
  const d = new Date(currentWRDate);
  const day = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - day + 1); // Monday
  const weekStart = new Date(d);
  d.setDate(d.getDate() + 6); // Sunday
  const weekEnd = new Date(d);
  
  const label = `${weekStart.toLocaleDateString('en-US',{month:'short',day:'numeric'})} - ${weekEnd.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
  
  // Stats for the week
  let weekXP = 0;
  let dayScores = [];
  let habitCounts = {}; // { habit_id: completed_count }
  let moodSum = 0; let moodCount = 0;
  
  for (let i=0; i<7; i++) {
    const cur = new Date(weekStart);
    cur.setDate(cur.getDate() + i);
    const dStr = cur.toISOString().split('T')[0];
    
    const dLogs = allLogsArray.filter(l => l.date === dStr);
    const dDone = dLogs.filter(l => l.completed);
    
    // Add XP
    dDone.forEach(l => {
      weekXP += l.xp_earned;
      habitCounts[l.habit_id] = (habitCounts[l.habit_id] || 0) + 1;
    });
    
    const pct = dLogs.length > 0 ? dDone.length / dLogs.length : 0;
    
    const mood = allMoods.find(m => m.date === dStr);
    if (mood) {
      moodSum += mood.mood_level;
      moodCount++;
    }
    
    dayScores.push({
      date: cur,
      dateStr: dStr,
      label: ['M','T','W','T','F','S','S'][i],
      pct: pct,
      mood: mood ? mood.mood_level : null
    });
  }
  
  const activeDays = dayScores.filter(ds => ds.pct > 0 || ds.mood).length;
  const avgPct = dayScores.reduce((acc, ds) => acc + ds.pct, 0) / (activeDays || 1);
  const score = Math.round(avgPct * 100);
  
  let grade = 'D'; let gColor = 'var(--danger)';
  if (score >= 90) { grade = 'A+'; gColor = 'var(--success)'; }
  else if (score >= 75) { grade = 'A'; gColor = 'var(--primary)'; }
  else if (score >= 60) { grade = 'B'; gColor = 'var(--accent)'; }
  else if (score >= 40) { grade = 'C'; gColor = 'var(--warning)'; }
  
  // Best / Worst Habit
  let bestHabitId = null; let bestHabitCount = -1;
  let worstHabitId = null; let worstHabitCount = 999;
  
  Object.keys(habitCounts).forEach(id => {
    const c = habitCounts[id];
    if (c > bestHabitCount) { bestHabitCount = c; bestHabitId = parseInt(id); }
    if (c < worstHabitCount) { worstHabitCount = c; worstHabitId = parseInt(id); }
  });
  // If no worst, find an active habit with 0
  if (worstHabitCount === 999) worstHabitCount = 0;
  
  const bestH = allHabits.find(h => h.id == bestHabitId);
  const worstH = allHabits.find(h => h.id == worstHabitId);
  
  const avgMood = moodCount > 0 ? Math.round(moodSum / moodCount) : 0;
  const moodLabels = {1:'Terrible', 2:'Bad', 3:'Neutral', 4:'Good', 5:'Excellent', 0:'No data'};

  let html = `
    <div class="top-bar">
      <button onclick="changeWRWeek(-1)" style="padding:8px;color:var(--text)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
      <div class="top-bar-title small" style="flex:1;text-align:center">${label}</div>
      <button onclick="changeWRWeek(1)" style="padding:8px;color:var(--text)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>
      <div class="sheet-close" style="position:relative;right:0;top:0;margin-left:8px" onclick="App.closePushScreen('screen-weekly-review')">&times;</div>
    </div>
    
    <div style="padding:16px">
      <!-- Score Card -->
      <div class="card" style="margin:0 0 16px;text-align:center;padding:24px 16px">
        <div style="font-size:28px;font-weight:700;color:${gColor};margin-bottom:8px">${grade}</div>
        <div style="font-size:40px;font-weight:700;color:var(--text);margin-bottom:8px">${score}%</div>
        <div style="font-size:13px;color:var(--text-sub)">Great week! You earned ${weekXP} XP over 7 days.</div>
      </div>
      
      <!-- Daily Breakdown -->
      <div class="card" style="margin:0 0 16px;padding:12px 16px">
        <div style="font-size:15px;font-weight:600;margin-bottom:12px">Daily Breakdown</div>
        ${dayScores.map(ds => `
          <div class="row" style="margin-bottom:10px;font-size:13px">
            <div style="width:30px;color:var(--text-sub)">${ds.label}</div>
            <div style="flex:1;height:6px;background:var(--border);border-radius:3px;margin-right:12px;overflow:hidden">
              <div style="height:100%;width:${ds.pct*100}%;background:var(--primary);border-radius:3px"></div>
            </div>
            <div style="width:40px;text-align:right;margin-right:12px">${Math.round(ds.pct*100)}%</div>
            <div style="width:12px;height:12px;border-radius:6px;background:${ds.mood ? `var(--mood-${ds.mood})` : 'var(--border)'}"></div>
          </div>
        `).join('')}
      </div>
      
      <!-- Best / Worst -->
      <div class="row gap-8" style="margin-bottom:16px">
        <div class="card" style="flex:1;margin:0;padding:12px;border-left:3px solid var(--success)">
          <div style="font-size:12px;font-weight:600;color:var(--text-sub);margin-bottom:4px">Your Best Habit</div>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px">${bestH ? bestH.name : '-'}</div>
          <div style="font-size:12px;color:var(--success)">${bestHabitCount}/7 days</div>
        </div>
        <div class="card" style="flex:1;margin:0;padding:12px;border-left:3px solid var(--warning)">
          <div style="font-size:12px;font-weight:600;color:var(--text-sub);margin-bottom:4px">Could Do Better</div>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px">${worstH ? worstH.name : '-'}</div>
          <div style="font-size:12px;color:var(--warning)">${worstHabitCount}/7 days</div>
        </div>
      </div>
      
      <!-- Mood & XP -->
      <div class="row gap-8">
        <div class="card" style="flex:1;margin:0;padding:12px;text-align:center">
          <div style="font-size:12px;font-weight:600;color:var(--text-sub);margin-bottom:8px">Week Mood</div>
          <div class="row" style="justify-content:center;gap:6px;margin-bottom:4px">
            <div style="width:12px;height:12px;border-radius:6px;background:${avgMood ? `var(--mood-${avgMood})` : 'var(--border)'}"></div>
            <div style="font-size:14px;font-weight:600">${moodLabels[avgMood]}</div>
          </div>
        </div>
        <div class="card" style="flex:1;margin:0;padding:12px;text-align:center">
          <div style="font-size:12px;font-weight:600;color:var(--text-sub);margin-bottom:8px">XP Earned</div>
          <div style="font-size:20px;font-weight:700;color:var(--accent)">+${weekXP}</div>
        </div>
      </div>
    </div>
  `;
  container.innerHTML = html;
}

function changeWRWeek(offset) {
  currentWRDate.setDate(currentWRDate.getDate() + (offset * 7));
  renderWeeklyReview();
}
