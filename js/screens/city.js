async function renderCity() {
  const container = document.getElementById('screen-city');
  const stats = await getUserStats();
  const logs = await db.HabitLog.toArray();
  const allHabits = await getAllHabits();
  
  const levelData = calculateLevel(stats.total_xp);

  let html = `
    <div class="top-bar">
      <div class="top-bar-title">Your City</div>
      <div class="row gap-8">
        <div style="background:var(--accent);color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600">Day ${stats.city_days}</div>
        <div style="background:var(--primary);color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600">Level ${stats.current_level}</div>
      </div>
    </div>
    
    <div class="row gap-8" style="padding:16px">
      <div class="card" style="flex:1;margin:0;padding:12px;text-align:center">
        <div style="font-size:18px;font-weight:700">${Math.floor(stats.city_days / 5)}</div>
        <div style="font-size:10px;color:var(--text-sub)">Buildings</div>
      </div>
      <div class="card" style="flex:1;margin:0;padding:12px;text-align:center">
        <div style="font-size:18px;font-weight:700">${stats.city_days}</div>
        <div style="font-size:10px;color:var(--text-sub)">Best Streak</div>
      </div>
      <div class="card" style="flex:1;margin:0;padding:12px;text-align:center">
        <div style="font-size:18px;font-weight:700;color:var(--accent)">${stats.total_xp}</div>
        <div style="font-size:10px;color:var(--text-sub)">Total XP</div>
      </div>
    </div>
    
    <!-- City SVG Container -->
    <div id="city-svg-wrapper" style="width:100%;height:200px;background:linear-gradient(180deg, #0F1117 0%, #131829 100%);position:relative;border-bottom:1px solid var(--border)">
      <!-- Rendered by city-svg.js -->
    </div>
    
    <!-- Combined Grid -->
    <div class="card" style="margin-top:16px;overflow-x:auto">
      <div style="display:flex;gap:3px">
        <div style="display:flex;flex-direction:column;gap:3px;margin-right:4px">
          ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div style="height:12px;font-size:9px;color:var(--text-sub);display:flex;align-items:center">${d}</div>`).join('')}
        </div>
        <div style="display:flex;gap:3px" id="city-grid-cols"></div>
      </div>
      <div class="row space-between" style="margin-top:12px;font-size:10px;color:var(--text-sub)">
        <div>Less</div>
        <div class="row" style="gap:2px">
          <div style="width:10px;height:10px;border-radius:2px;background:var(--grid-empty)"></div>
          <div style="width:10px;height:10px;border-radius:2px;background:var(--grid-l1)"></div>
          <div style="width:10px;height:10px;border-radius:2px;background:var(--grid-l2)"></div>
          <div style="width:10px;height:10px;border-radius:2px;background:var(--grid-l3)"></div>
          <div style="width:10px;height:10px;border-radius:2px;background:var(--grid-l4)"></div>
        </div>
        <div>More</div>
      </div>
    </div>
    
    <!-- Progress & Log -->
    <div class="card">
      <div style="font-size:14px;color:var(--text);margin-bottom:8px">Next Building — 5 more 100% days</div>
      <div style="height:6px;border-radius:3px;background:var(--border);overflow:hidden">
        <div style="height:100%;background:var(--primary);width:${(stats.city_days % 5) * 20}%"></div>
      </div>
    </div>
    
    <div style="padding:16px">
      <div style="font-size:15px;font-weight:600;margin-bottom:12px">Milestones</div>
      <div class="card" style="margin:0;padding:0">
        ${[100, 90, 75, 50, 40, 30, 20, 15, 10, 7, 5, 3, 1].filter(d => stats.city_days >= d).map(d => `
          <div class="row" style="padding:12px 16px;border-bottom:1px solid var(--border)">
            <div style="width:60px;font-size:12px;color:var(--text-sub)">Day ${d}</div>
            <div style="flex:1;font-size:14px">${getBuildingName(d)} built</div>
            <div style="color:var(--accent)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
          </div>
        `).join('')}
        ${stats.city_days === 0 ? `<div style="padding:16px;font-size:13px;color:var(--text-sub);text-align:center">Complete your first perfect day to start building!</div>` : ''}
      </div>
    </div>
  `;

  container.innerHTML = html;
  
  renderCitySVG(stats.city_days);
  renderCityGrid(logs, allHabits);
}

function getBuildingName(day) {
  if (day >= 100) return "Skyline Tower";
  if (day >= 90) return "Suspension Bridge";
  if (day >= 75) return "City Hall Dome";
  if (day >= 60) return "Second Skyscraper";
  if (day >= 50) return "Skyscraper";
  if (day >= 40) return "Park Fountain";
  if (day >= 30) return "Central Library";
  if (day >= 20) return "Office Tower";
  if (day >= 15) return "School Building";
  if (day >= 10) return "Apartment Block";
  if (day >= 7) return "Corner Shop";
  if (day >= 5) return "Small Park";
  if (day >= 3) return "Neighborhood";
  if (day >= 1) return "First House";
  return "Foundation";
}

function renderCityGrid(logs, habits) {
  // We'll generate the last 16 weeks
  const gridContainer = document.getElementById('city-grid-cols');
  let gridHtml = '';
  
  const today = new Date();
  const cursor = new Date(today);
  cursor.setDate(cursor.getDate() - (today.getDay())); // Go to previous Sunday
  cursor.setDate(cursor.getDate() - (15 * 7)); // Go back 16 weeks
  
  for (let w = 0; w < 16; w++) {
    gridHtml += `<div style="display:flex;flex-direction:column;gap:3px">`;
    for (let d = 0; d < 7; d++) {
      const dStr = cursor.toISOString().split('T')[0];
      const dayLogs = logs.filter(l => l.date === dStr);
      const doneCount = dayLogs.filter(l => l.completed).length;
      const totalCount = habits.length; // Approximate for now
      
      let fill = 'var(--grid-empty)';
      if (totalCount > 0) {
        const pct = doneCount / totalCount;
        if (pct > 0) fill = 'var(--grid-l1)';
        if (pct >= 0.26) fill = 'var(--grid-l2)';
        if (pct >= 0.51) fill = 'var(--grid-l3)';
        if (pct >= 0.76) fill = 'var(--grid-l4)';
      }
      
      const isToday = dStr === todayStr();
      const border = isToday ? '1px solid var(--accent)' : 'none';
      
      gridHtml += `<div style="width:12px;height:12px;border-radius:2px;background:${fill};border:${border}"></div>`;
      
      cursor.setDate(cursor.getDate() + 1);
    }
    gridHtml += `</div>`;
  }
  
  gridContainer.innerHTML = gridHtml;
}
