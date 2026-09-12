// calendar.js — Monthly habit matrix, historical date drill-down, and day inspection sheet

let currentCalendarDate = new Date();

window.renderCalendar = async function() {
  const container = document.getElementById('screen-calendar');
  if (!container) return;

  const monthName = currentCalendarDate.toLocaleString('default', { month: 'long' });
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const today = todayStr();

  const [logs, moods, allHabits] = await Promise.all([
    db.HabitLog.toArray(),
    db.MoodLog.toArray(),
    getAllHabits()
  ]);

  const dailyCompletions = {};
  logs.forEach(l => {
    if (l.completed === 1) {
      dailyCompletions[l.date] = (dailyCompletions[l.date] || 0) + 1;
    }
  });

  const dailyMoods = {};
  moods.forEach(m => {
    dailyMoods[m.date] = m.mood_level;
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();

  const cells = [];
  // Empty padding cells for start of month
  for (let i = 0; i < startDay; i++) {
    cells.push('<div style="aspect-ratio:1/1;"></div>');
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const count = dailyCompletions[dStr] || 0;
    const isToday = dStr === today;
    const moodLevel = dailyMoods[dStr];
    
    let dotColor = 'var(--primary)';
    if (count >= 8) dotColor = 'var(--success)';
    else if (count >= 4) dotColor = 'var(--primary)';

    cells.push(`
      <div onclick="openDayDetailSheet('${dStr}')" 
        style="aspect-ratio:1/1; display:flex; flex-direction:column; align-items:center; justify-content:center; ${isToday ? 'border: 2px solid var(--primary);' : 'border: 1px solid var(--border);'} background:${count > 0 ? 'var(--card-alt)' : 'transparent'}; border-radius:10px; cursor:pointer; transition:transform 0.12s, border-color 0.12s;"
        onmousedown="this.style.transform='scale(0.92)'"
        onmouseup="this.style.transform='scale(1)'">
        <span style="font-size:13px; font-weight:${isToday ? '800' : '600'}; color:${isToday ? 'var(--primary)' : 'var(--text-primary)'};">${i}</span>
        <div style="display:flex; gap:2px; margin-top:3px; height:4px; align-items:center;">
          ${count > 0 ? `<div style="width:5px; height:5px; border-radius:50%; background:${dotColor};"></div>` : ''}
          ${moodLevel ? `<div style="width:4px; height:4px; border-radius:2px; background:var(--accent);"></div>` : ''}
        </div>
      </div>
    `);
  }

  let html = `
    <div class="top-bar">
      <div style="display:flex; align-items:center; gap:8px;">
        <button onclick="changeCalendarMonth(-1)" style="padding:6px 10px; background:var(--card); border:1px solid var(--border); border-radius:8px;" aria-label="Previous Month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="top-bar-title" style="font-size:18px;">${monthName} ${year}</div>
        <button onclick="changeCalendarMonth(1)" style="padding:6px 10px; background:var(--card); border:1px solid var(--border); border-radius:8px;" aria-label="Next Month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <button onclick="resetCalendarToToday()" style="color:var(--primary); font-size:13px; font-weight:700; background:var(--card); border:1px solid var(--border); padding:6px 12px; border-radius:8px;">Today</button>
    </div>
    
    <div class="card" style="margin:16px; padding:16px;">
      <div style="display:grid; grid-template-columns: repeat(7, 1fr); text-align:center; margin-bottom:12px;">
        ${['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => `<div style="font-size:11px; font-weight:700; color:var(--text-secondary);">${d}</div>`).join('')}
      </div>
      <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:6px;">
        ${cells.join('')}
      </div>
    </div>

    <!-- Monthly Summary Bar -->
    <div style="padding:0 16px; display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:16px;">
      <div class="card" style="margin:0; padding:14px 10px; text-align:center;">
        <div style="font-size:20px; font-weight:800; color:var(--primary);">${Object.keys(dailyCompletions).length}</div>
        <div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">Active Days</div>
      </div>
      <div class="card" style="margin:0; padding:14px 10px; text-align:center;">
        <div style="font-size:20px; font-weight:800; color:var(--success);">${logs.filter(l => l.completed === 1).length}</div>
        <div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">Check-ins</div>
      </div>
      <div class="card" style="margin:0; padding:14px 10px; text-align:center;">
        <div style="font-size:20px; font-weight:800; color:var(--text-primary);">${moods.length}</div>
        <div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">Mood Logs</div>
      </div>
    </div>

    <div style="padding:0 16px; font-size:12px; color:var(--text-secondary); text-align:center;">
      💡 Tap any date to view completed habits and reflections
    </div>
  `;

  container.innerHTML = html;
};

window.changeCalendarMonth = function(offset) {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
  window.renderCalendar();
};

window.resetCalendarToToday = function() {
  currentCalendarDate = new Date();
  window.renderCalendar();
};

// Day Detail Inspection Bottom Sheet
window.openDayDetailSheet = async function(dateStr) {
  const [dayLogs, dayMood, dayNotes, allHabits] = await Promise.all([
    db.HabitLog.where('date').equals(dateStr).toArray(),
    getMoodForDate(dateStr),
    db.HabitNote.where('date').equals(dateStr).toArray(),
    getAllHabits()
  ]);

  const completedLogs = dayLogs.filter(l => l.completed === 1);
  const xpEarned = completedLogs.reduce((acc, l) => acc + (l.xp_earned || 0), 0);
  const moodEmojis = ['😫', '😕', '😐', '🙂', '🤩'];
  const moodNames = ['Awful', 'Bad', 'Okay', 'Good', 'Great'];

  const sheet = document.getElementById('day-detail-sheet');
  if (!sheet) return;

  sheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-header">
      <div class="top-bar-title" style="font-size:16px; font-weight:700;">${formatDateDisplay(dateStr)}</div>
      <button class="sheet-close" onclick="closeBottomSheet('day-detail-sheet')">&times;</button>
    </div>
    
    <div style="padding:0 20px 80px; flex:1; overflow-y:auto;">
      <!-- Day Stats Summary -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
        <div class="card" style="margin:0; padding:12px; text-align:center;">
          <div style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Completed</div>
          <div style="font-size:22px; font-weight:800; color:var(--success); margin-top:2px;">${completedLogs.length}</div>
        </div>
        <div class="card" style="margin:0; padding:12px; text-align:center;">
          <div style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">XP Earned</div>
          <div style="font-size:22px; font-weight:800; color:var(--primary); margin-top:2px;">+${xpEarned}</div>
        </div>
      </div>

      <!-- Mood Entry -->
      ${dayMood ? `
        <div class="card" style="margin:0 0 16px; padding:14px; display:flex; align-items:center; justify-content:space-between;">
          <div>
            <div style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Mood Check-in</div>
            <div style="font-size:14px; font-weight:700; color:var(--text-primary); margin-top:2px;">Feeling ${moodNames[dayMood.mood_level - 1]}</div>
            ${dayMood.note ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">${escapeHtml(dayMood.note)}</div>` : ''}
          </div>
          <div style="font-size:28px;">${moodEmojis[dayMood.mood_level - 1]}</div>
        </div>
      ` : ''}

      <!-- Completed Habits List -->
      <div style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px;">
        Completed Habits (${completedLogs.length})
      </div>
      <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
        ${completedLogs.length === 0 ? `
          <div style="color:var(--text-secondary); font-size:13px; padding:12px; text-align:center; background:var(--card-alt); border-radius:10px;">No habits completed on this date.</div>
        ` : completedLogs.map(l => {
          const habit = allHabits.find(h => h.id === l.habit_id);
          const name = habit ? habit.name : `Habit #${l.habit_id}`;
          const color = habit ? habit.accent_color : 'var(--primary)';
          return `
            <div style="background:var(--card); border:1px solid var(--border); border-left:3px solid ${color}; border-radius:10px; padding:10px 14px; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:14px; font-weight:600; color:var(--text-primary);">${escapeHtml(name)}</span>
              <span style="font-size:12px; font-weight:700; color:${color};">+${l.xp_earned || 10} XP</span>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Notes for this day -->
      ${dayNotes.length > 0 ? `
        <div style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px;">
          Notes &amp; Reflections
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${dayNotes.map(n => `
            <div style="background:var(--card-alt); border:1px solid var(--border); border-radius:10px; padding:12px; font-size:13px; color:var(--text-primary); line-height:1.4;">
              ${escapeHtml(n.note)}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;

  openSheet('day-detail-sheet');
};
