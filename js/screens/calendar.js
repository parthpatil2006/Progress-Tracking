let currentCalMonth = new Date();

async function renderCalendar() {
  const container = document.getElementById('screen-calendar');
  const allHabits = await getAllHabits();
  const allLogsArray = await db.HabitLog.toArray();
  const today = todayStr();
  
  const y = currentCalMonth.getFullYear();
  const m = currentCalMonth.getMonth();
  
  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0);
  
  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  let html = `
    <div class="top-bar">
      <button onclick="changeMonth(-1)" style="padding:8px;color:var(--text)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
      <div class="top-bar-title small" style="flex:1;text-align:center">${monthName}</div>
      <button onclick="changeMonth(0)" style="font-size:13px;font-weight:600;color:var(--primary);margin-right:8px">Today</button>
      <button onclick="changeMonth(1)" style="padding:8px;color:var(--text)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>
    </div>
    
    <div class="card" style="padding:16px 8px">
      <div style="display:grid;grid-template-columns:repeat(7,1fr);text-align:center;margin-bottom:8px">
        ${['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => `<div style="font-size:11px;font-weight:600;color:var(--text-sub)">${d}</div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">
  `;
  
  const startOffset = firstDay.getDay();
  for (let i = 0; i < startOffset; i++) {
    html += `<div></div>`;
  }
  
  let daysTracked = 0;
  let perfectDays = 0;
  let sumCompletion = 0;
  
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const curDate = new Date(y, m, d);
    const dStr = curDate.toISOString().split('T')[0];
    const isToday = dStr === today;
    const isFuture = curDate > new Date(today);
    
    const dayLogs = allLogsArray.filter(l => l.date === dStr);
    const activeForDay = dayLogs.length; // Approximate using logs
    const completedForDay = dayLogs.filter(l => l.completed);
    const isPerfect = activeForDay > 0 && completedForDay.length === activeForDay;
    const pct = activeForDay > 0 ? completedForDay.length / activeForDay : 0;
    
    if (activeForDay > 0) {
      daysTracked++;
      if (isPerfect) perfectDays++;
      sumCompletion += pct;
    }
    
    let bg = 'var(--bg)';
    let color = 'var(--text)';
    let border = 'none';
    
    if (isFuture) {
      color = 'var(--text-muted)';
    } else if (isToday) {
      border = '2px solid var(--primary)';
      color = 'var(--primary)';
      bg = 'var(--card)';
    } else if (isPerfect) {
      bg = '#0D2A0D'; // very dark green
    } else if (activeForDay > 0 && completedForDay.length > 0) {
      bg = 'var(--card)';
    } else if (activeForDay > 0 && completedForDay.length === 0) {
      color = 'var(--text-muted)';
    }

    let dotsHtml = '';
    if (!isFuture && activeForDay > 0) {
      const maxDots = 4;
      const displayLogs = dayLogs.slice(0, maxDots);
      dotsHtml += `<div style="display:flex;gap:2px;justify-content:center;margin-top:2px">`;
      displayLogs.forEach(l => {
        const h = allHabits.find(hx => hx.id == l.habit_id);
        const c = l.completed && h ? `var(--cat-${h.category.toLowerCase()})` : 'var(--border)';
        dotsHtml += `<div style="width:4px;height:4px;border-radius:2px;background:${c}"></div>`;
      });
      if (dayLogs.length > maxDots) {
        dotsHtml += `<div style="font-size:8px;color:var(--text-sub)">+</div>`;
      }
      dotsHtml += `</div>`;
    }

    html += `
      <div style="height:46px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:${bg};border-radius:8px;border:${border};cursor:pointer;position:relative" onclick="openDayDetail('${dStr}')">
        <div style="font-size:14px;font-weight:500;color:${color}">${d}</div>
        ${dotsHtml}
        ${isPerfect ? `<div style="position:absolute;top:-4px;right:-4px;background:var(--success);color:#fff;border-radius:8px;width:14px;height:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.3)"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg></div>` : ''}
      </div>
    `;
  }
  
  html += `
      </div>
    </div>
    
    <div class="row space-between" style="padding:0 16px 16px">
      <div style="text-align:center">
        <div style="font-size:18px;font-weight:700;color:var(--primary)">${daysTracked}</div>
        <div style="font-size:11px;color:var(--text-sub)">Days tracked</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:18px;font-weight:700;color:var(--success)">${perfectDays}</div>
        <div style="font-size:11px;color:var(--text-sub)">Perfect days</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:18px;font-weight:700;color:var(--accent)">${daysTracked > 0 ? Math.round((sumCompletion/daysTracked)*100) : 0}%</div>
        <div style="font-size:11px;color:var(--text-sub)">Avg completion</div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function changeMonth(offset) {
  if (offset === 0) {
    currentCalMonth = new Date();
  } else {
    currentCalMonth.setMonth(currentCalMonth.getMonth() + offset);
  }
  renderCalendar();
}

async function openDayDetail(dateStr) {
  const overlay = document.getElementById('sheet-overlay');
  const sheet = document.getElementById('day-detail-sheet');
  
  const allHabits = await getAllHabits();
  const dayLogs = await getLogsForDate(dateStr);
  const mood = await getMoodForDate(dateStr);
  
  const doneCount = dayLogs.filter(l => l.completed).length;
  const total = dayLogs.length;
  const isPast = new Date(dateStr) < new Date(todayStr());
  const isToday = dateStr === todayStr();
  
  let html = `
    <div class="sheet-handle"></div>
    <div class="sheet-header" style="text-align:left">
      <div class="top-bar-title" style="font-size:18px">${formatDate(dateStr)}</div>
      <div class="sheet-close" onclick="closeBottomSheet('day-detail-sheet')">&times;</div>
    </div>
    <div style="padding:16px;overflow-y:auto;flex:1">
      <div class="card" style="margin:0 0 16px;padding:12px">
        <div style="font-size:15px;font-weight:600;margin-bottom:8px">Completion</div>
        <div style="font-size:14px;color:var(--text-sub)">${doneCount} of ${total} habits done</div>
      </div>
      
      <div style="font-size:15px;font-weight:600;margin-bottom:12px">Habits</div>
  `;
  
  if (total === 0) {
    html += `<div style="font-size:13px;color:var(--text-sub);margin-bottom:16px">No habits tracked on this day.</div>`;
  } else {
    dayLogs.forEach(l => {
      const h = allHabits.find(hx => hx.id == l.habit_id);
      if (!h) return;
      const checked = l.completed ? 'checked' : '';
      const fill = l.completed ? 'var(--success)' : 'transparent';
      const border = l.completed ? 'var(--success)' : 'var(--border)';
      
      html += `
        <div class="row gap-8" style="margin-bottom:12px">
          <div style="width:20px;height:20px;border-radius:4px;border:2px solid ${border};background:${fill};display:flex;align-items:center;justify-content:center">
            ${l.completed ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
          </div>
          <div style="width:6px;height:6px;border-radius:3px;background:var(--cat-${h.category.toLowerCase()})"></div>
          <div style="flex:1;font-size:14px;${l.completed ? 'opacity:0.6' : ''}">${h.name}</div>
          ${l.completed ? `<div style="font-size:11px;color:var(--primary)">+${l.xp_earned} XP</div>` : ''}
        </div>
      `;
    });
  }

  // Mood
  html += `<div style="font-size:15px;font-weight:600;margin:24px 0 12px">Mood</div>`;
  if (mood) {
    const moodLabels = {1:'Terrible', 2:'Bad', 3:'Neutral', 4:'Good', 5:'Excellent'};
    html += `
      <div class="row gap-8">
        <div style="width:16px;height:16px;border-radius:8px;background:var(--mood-${mood.mood_level})"></div>
        <div style="font-size:14px">${moodLabels[mood.mood_level]}</div>
      </div>
    `;
  } else {
    html += `<div style="font-size:13px;color:var(--text-sub)">No mood logged.</div>`;
  }
  
  html += `</div>`;
  
  sheet.innerHTML = html;
  
  overlay.classList.remove('hidden');
  sheet.classList.remove('hidden');
  setTimeout(() => {
    overlay.classList.add('visible');
    sheet.classList.add('open');
  }, 10);
}
