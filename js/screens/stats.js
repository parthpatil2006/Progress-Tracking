// stats.js — Aggregated habit statistics, category performance, and success rate

window.renderStats = async function() {
  const container = document.getElementById('screen-stats');
  if (!container) return;

  const [stats, habits, allLogs, streakData] = await Promise.all([
    getUserStats(),
    getActiveHabits(),
    db.HabitLog.toArray(),
    calculateAllStreaks()
  ]);
  
  const today = todayStr();
  const totalHabits = habits.length;
  const completedToday = allLogs.filter(l => l.date === today && l.completed === 1).length;
  const totalLogs = allLogs.length;
  const totalDone = allLogs.filter(l => l.completed === 1).length;
  const overallPct = totalLogs > 0 ? Math.round((totalDone / totalLogs) * 100) : 0;
  
  const circ = 2 * Math.PI * 28;
  const off = circ * (1 - overallPct / 100);

  // Group by category
  const categories = ['Core', 'Wellness', 'Learning', 'Productivity'];
  const catStats = categories.map(cat => {
    const catHabits = habits.filter(h => h.category === cat);
    const catHabitIds = new Set(catHabits.map(h => h.id));
    const catLogs = allLogs.filter(l => catHabitIds.has(l.habit_id));
    const pct = catLogs.length > 0 ? Math.round((catLogs.filter(l => l.completed === 1).length / catLogs.length) * 100) : 0;
    return { cat, pct, count: catHabits.length };
  });

  let html = `
    <div class="top-bar">
      <div class="top-bar-title">Deep Statistics</div>
    </div>
    
    <div style="padding:16px 16px 60px;">
      <!-- Stat Cards -->
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:16px;">
        <div class="card" style="margin:0; padding:14px 10px; text-align:center;">
          <div style="font-size:20px; font-weight:800; color:var(--primary);">${totalHabits}</div>
          <div style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-top:2px;">Active Habits</div>
        </div>
        <div class="card" style="margin:0; padding:14px 10px; text-align:center;">
          <div style="font-size:20px; font-weight:800; color:var(--success);">${completedToday} / ${totalHabits}</div>
          <div style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-top:2px;">Today's Done</div>
        </div>
        <div class="card" style="margin:0; padding:14px 10px; text-align:center;">
          <div style="font-size:20px; font-weight:800; color:var(--text-primary);">${streakData.overallStreak}d</div>
          <div style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-top:2px;">All-Done Streak</div>
        </div>
      </div>

      <!-- Overall Success Radial Meter -->
      <div class="card" style="margin:0 0 16px; padding:24px; text-align:center;">
        <div style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:16px;">Lifetime Execution Rate</div>
        <div style="position:relative; width:130px; height:130px; margin:0 auto;">
           <svg viewBox="0 0 64 64" width="130" height="130">
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border)" stroke-width="6"></circle>
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--success)" stroke-width="6" 
                      stroke-dasharray="${circ.toFixed(2)}" 
                      stroke-dashoffset="${off.toFixed(2)}" 
                      stroke-linecap="round"
                      style="transform:rotate(-90deg); transform-origin:center; transition: stroke-dashoffset 1s ease;"></circle>
           </svg>
           <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
              <div style="font-size:26px; font-weight:800; color:var(--text-primary);">${overallPct}%</div>
              <div style="font-size:10px; font-weight:600; color:var(--text-secondary);">Consistency</div>
           </div>
        </div>
        <div style="font-size:12px; color:var(--text-secondary); margin-top:14px;">
          ${totalDone} completed check-ins out of ${totalLogs} total records
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="card" style="margin:0 0 16px; padding:16px;">
        <div style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:16px;">Consistency by Category</div>
        <div style="display:flex; flex-direction:column; gap:14px;">
          ${catStats.map(s => {
            const catColors = { Core: 'var(--primary)', Wellness: '#10B981', Learning: '#64748B', Productivity: 'var(--text-secondary)' };
            const color = catColors[s.cat] || 'var(--primary)';
            return `
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; margin-bottom:6px;">
                  <span style="font-weight:600; color:var(--text-primary);">${escapeHtml(s.cat)} (${s.count})</span>
                  <span style="font-weight:700; color:${color};">${s.pct}%</span>
                </div>
                <div style="height:8px; background:var(--bg); border-radius:4px; overflow:hidden;">
                  <div style="height:100%; width:${s.pct}%; background:${color}; border-radius:4px; transition: width 0.8s ease;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
  container.innerHTML = html;
};
