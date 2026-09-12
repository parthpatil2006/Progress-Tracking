// analytics.js — Deep behavioral analytics, day-of-week breakdown, and productivity metrics

window.renderAnalytics = async function() {
  const container = document.getElementById('screen-analytics');
  if (!container) return;

  const [logs, habits, stats] = await Promise.all([
    db.HabitLog.toArray(),
    getActiveHabits(),
    getUserStats()
  ]);
  
  // Calculate completion by day of week
  const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];

  logs.forEach(l => {
    const d = new Date(l.date);
    const dayIdx = d.getDay();
    dayTotals[dayIdx]++;
    if (l.completed === 1) {
      dayCounts[dayIdx]++;
    }
  });

  const max = Math.max(...dayCounts, 1);
  const totalCompletions = logs.filter(l => l.completed === 1).length;
  const overallSuccessRate = logs.length > 0 ? Math.round((totalCompletions / logs.length) * 100) : 0;

  // Best day of week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayAbbreviations = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let bestDayIdx = 0;
  let highestCount = -1;
  dayCounts.forEach((c, idx) => {
    if (c > highestCount) {
      highestCount = c;
      bestDayIdx = idx;
    }
  });

  // Calculate category distribution
  const catDistribution = {};
  habits.forEach(h => {
    catDistribution[h.category] = (catDistribution[h.category] || 0) + 1;
  });

  let html = `
    <div class="top-bar">
      <div style="display:flex; align-items:center; gap:12px;">
        <button onclick="popScreen()" style="padding:4px;" aria-label="Go Back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="top-bar-title" style="font-size:18px;">Productivity Analytics</div>
      </div>
    </div>
    
    <div style="padding:16px 16px 60px;">
      <!-- Key Stats Overview -->
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:16px;">
        <div class="card" style="margin:0; padding:12px; text-align:center;">
          <div style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Total XP</div>
          <div style="font-size:20px; font-weight:800; color:var(--primary); margin-top:2px;">${stats.total_xp}</div>
        </div>
        <div class="card" style="margin:0; padding:12px; text-align:center;">
          <div style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Success Rate</div>
          <div style="font-size:20px; font-weight:800; color:var(--success); margin-top:2px;">${overallSuccessRate}%</div>
        </div>
        <div class="card" style="margin:0; padding:12px; text-align:center;">
          <div style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Best Day</div>
          <div style="font-size:16px; font-weight:800; color:var(--primary); margin-top:5px;">${dayAbbreviations[bestDayIdx]}</div>
        </div>
      </div>

      <!-- Habit Success by Day of Week -->
      <div class="card" style="margin:0 0 16px; padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div>
            <div style="font-size:14px; font-weight:700; color:var(--text-primary);">Completion by Day</div>
            <div style="font-size:11px; color:var(--text-secondary);">Your most productive weekday is ${dayNames[bestDayIdx]}</div>
          </div>
        </div>
        
        <div style="height:130px; display:flex; align-items:flex-end; gap:8px; padding-bottom:8px; border-bottom:1px solid var(--border);">
          ${dayCounts.map((count, i) => {
            const pctHeight = Math.max((count / max) * 100, 6);
            const isBest = i === bestDayIdx && count > 0;
            return `
              <div style="flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end;" title="${dayNames[i]}: ${count} completions">
                <span style="font-size:10px; font-weight:700; color:${isBest ? 'var(--primary)' : 'var(--text-secondary)'}; margin-bottom:4px;">${count}</span>
                <div style="width:100%; height:${pctHeight}%; background:${isBest ? 'var(--primary)' : 'var(--card-alt)'}; border:1px solid ${isBest ? 'var(--primary-border)' : 'var(--border)'}; border-radius:3px 3px 0 0; transition: height 0.5s ease;"></div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:11px; font-weight:600; color:var(--text-secondary);">
          ${dayAbbreviations.map((abbr, i) => `
            <span style="flex:1; text-align:center; color:${i === bestDayIdx ? 'var(--text-primary)' : 'var(--text-secondary)'};">${abbr}</span>
          `).join('')}
        </div>
      </div>

      <!-- Active Habits Category Mix -->
      <div class="card" style="margin:0 0 16px; padding:16px;">
        <div style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:12px;">Active Habit Distribution</div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${Object.entries(catDistribution).map(([cat, count]) => {
            const catColors = { Core: 'var(--primary)', Wellness: '#10B981', Learning: '#64748B', Productivity: 'var(--text-secondary)' };
            const color = catColors[cat] || 'var(--primary)';
            const pct = Math.round((count / habits.length) * 100);
            return `
              <div>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                  <span style="font-weight:600; color:var(--text-primary);">${escapeHtml(cat)}</span>
                  <span style="color:var(--text-secondary);">${count} habits (${pct}%)</span>
                </div>
                <div style="height:6px; background:var(--bg); border-radius:3px; overflow:hidden;">
                  <div style="height:100%; width:${pct}%; background:${color}; border-radius:3px;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Architecture Insights -->
      <div class="card" style="margin:0; padding:16px;">
        <div style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:8px;">System Metrics</div>
        <div style="font-size:13px; color:var(--text-secondary); line-height:1.6;">
          • Total habits in database: <b style="color:var(--text-primary)">${habits.length}</b><br>
          • Total check-ins logged: <b style="color:var(--text-primary)">${totalCompletions}</b><br>
          • Skyline building blocks: <b style="color:var(--text-primary)">${stats.city_days} days</b><br>
          • Storage: <b style="color:var(--success)">IndexedDB Offline Storage</b> (0ms Network Latency)
        </div>
      </div>
    </div>
  `;
  container.innerHTML = html;
};
