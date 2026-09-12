// city.js — City skyline growth, GitHub-style contribution graph, and milestone badges

window.renderCity = async function() {
  const container = document.getElementById('screen-city');
  if (!container) return;

  const [stats, logs, streaks] = await Promise.all([
    getUserStats(),
    db.HabitLog.toArray(),
    calculateAllStreaks()
  ]);
  
  // Group logs by date to count completions per day
  const dailyCompletions = {};
  logs.forEach(l => {
    if (l.completed === 1) {
      dailyCompletions[l.date] = (dailyCompletions[l.date] || 0) + 1;
    }
  });

  // Generate 365 days of contribution graph
  const gridCells = [];
  const start = new Date();
  start.setDate(start.getDate() - 364);
  
  for (let i = 0; i < 365; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dStr = d.toISOString().split('T')[0];
    const count = dailyCompletions[dStr] || 0;
    
    let color = 'var(--border)';
    if (count > 0) color = 'rgba(217, 130, 43, 0.30)';
    if (count > 3) color = 'rgba(217, 130, 43, 0.65)';
    if (count > 7) color = 'var(--primary)';
    
    gridCells.push(`<div style="width:10px; height:10px; background:${color}; border-radius:2px;" title="${dStr}: ${count} habits completed"></div>`);
  }

  // Skyline Milestones
  const milestones = [
    { days: 1, label: 'First Hut', desc: '1 perfect day' },
    { days: 3, label: 'Pathway', desc: '3 perfect days' },
    { days: 7, label: 'Town Shop', desc: '7 perfect days' },
    { days: 10, label: 'Apartment Block', desc: '10 perfect days' },
    { days: 20, label: 'Commercial Tower', desc: '20 perfect days' },
    { days: 50, label: 'Skyscraper', desc: '50 perfect days' },
    { days: 100, label: 'Metropolis Landmark', desc: '100 perfect days' }
  ];

  let html = `
    <div class="top-bar">
      <div class="top-bar-title">Habit Skyline</div>
      <div style="display:flex; gap:8px;">
          <div style="background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); padding:4px 12px; color:var(--text-secondary); font-size:11px; font-weight:600;">
            Day ${stats.city_days}
          </div>
          <div style="background:var(--primary-subtle); border:1px solid var(--primary-border); border-radius:var(--radius-sm); padding:4px 12px; color:var(--primary); font-size:11px; font-weight:700;">
            Level ${stats.current_level}
          </div>
        </div>
    </div>
    
    <div style="padding:16px 16px 60px;">
      <!-- Skyline Canvas Container -->
      <div style="border-radius:var(--radius-lg); overflow:hidden; border:1px solid var(--border); background:var(--bg); margin-bottom:16px; box-shadow:var(--shadow-md);">
        ${getCitySVG(stats.city_days)}
      </div>

      <!-- Quick Metrics Grid -->
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:16px;">
        <div class="card" style="margin:0; padding:12px; text-align:center;">
          <div style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Buildings</div>
          <div style="font-size:22px; font-weight:800; color:var(--text-primary); margin-top:2px;">${stats.city_days}</div>
        </div>
        <div class="card" style="margin:0; padding:12px; text-align:center;">
          <div style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Best Streak</div>
          <div style="font-size:22px; font-weight:800; color:var(--text-primary); margin-top:2px;">${streaks.overallBest}d</div>
        </div>
        <div class="card" style="margin:0; padding:12px; text-align:center;">
          <div style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Total XP</div>
          <div style="font-size:22px; font-weight:800; color:var(--primary); margin-top:2px;">${stats.total_xp}</div>
        </div>
      </div>

      <!-- Year Contribution Graph -->
      <div class="card" style="margin:0 0 16px; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="font-size:13px; font-weight:700; color:var(--text-primary);">365-Day Consistency Heatmap</div>
          <div style="font-size:11px; color:var(--text-secondary);">${logs.filter(l => l.completed === 1).length} total completions</div>
        </div>
        <div style="display:grid; grid-template-columns: repeat(52, 1fr); gap:3px; overflow-x:auto; padding-bottom:6px;">
          ${gridCells.join('')}
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:10px; color:var(--text-secondary);">
          <span>1 year ago</span>
          <span>Today</span>
        </div>
      </div>

      <!-- Skyline Architecture Milestones -->
      <div class="card" style="margin:0; padding:16px;">
        <div style="font-size:13px; font-weight:700; color:var(--text-primary); margin-bottom:12px;">Skyline Milestones</div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${milestones.map(m => {
            const unlocked = stats.city_days >= m.days;
            return `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border);">
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:28px; height:28px; border-radius:14px; background:${unlocked ? 'rgba(16,185,129,0.15)' : 'var(--card-alt)'}; border:1px solid ${unlocked ? 'var(--success)' : 'var(--border)'}; display:flex; align-items:center; justify-content:center; font-size:12px;">
                    ${unlocked ? '✓' : '🔒'}
                  </div>
                  <div>
                    <div style="font-size:13px; font-weight:700; color:${unlocked ? 'var(--text-primary)' : 'var(--text-secondary)'};">${m.label}</div>
                    <div style="font-size:11px; color:var(--text-secondary);">${m.desc}</div>
                  </div>
                </div>
                <div style="font-size:11px; font-weight:700; color:${unlocked ? 'var(--success)' : 'var(--text-secondary)'};">
                  ${unlocked ? 'Unlocked' : `${m.days - stats.city_days} days left`}
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
