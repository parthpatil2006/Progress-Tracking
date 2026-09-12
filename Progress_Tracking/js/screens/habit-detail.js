// habit-detail.js — Habit analytics, history, editing, and deletion management

let currentDetailHabitId = null;

window.renderHabitDetail = async function(habitId) {
  const container = document.getElementById('screen-habit-detail');
  if (!container) return;

  const numId = Number(habitId);
  currentDetailHabitId = numId;
  const habit = await db.Habit.get(numId);
  if (!habit) {
    container.innerHTML = `
      <div class="top-bar">
        <button onclick="popScreen()" style="padding:4px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
        <div class="top-bar-title">Habit Not Found</div>
      </div>
      <div style="padding:24px; text-align:center; color:var(--text-secondary);">This habit may have been deleted.</div>
    `;
    return;
  }
  
  const streak = await calculateStreak(habit.id);
  const logs = await db.HabitLog.where('habit_id').equals(habit.id).toArray();
  const totalTracked = logs.length;
  const totalCompleted = logs.filter(l => l.completed === 1).length;
  const strengthPercent = totalTracked > 0 ? Math.round((totalCompleted / totalTracked) * 100) : 0;
  
  // Semi-circle gauge (arc length approx 125.6)
  const offset = 125.6 * (1 - strengthPercent / 100);

  // 14-day history dots
  const historyDays = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    const log = logs.find(l => l.date === dStr);
    const isDone = log && log.completed === 1;
    historyDays.push({
      dateStr: dStr,
      dayLabel: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      isDone: isDone,
      isToday: i === 0
    });
  }

  let html = `
    <div class="top-bar">
      <div style="display:flex; align-items:center; gap:12px;">
        <button onclick="popScreen()" style="padding:4px;" aria-label="Go Back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="top-bar-title" style="font-size:18px; max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          ${escapeHtml(habit.name)}
        </div>
      </div>
      <div style="display:flex; gap:8px;">
        <button onclick="openEditHabitSheet(${habit.id})" style="padding:6px; color:var(--text-secondary);" title="Edit Habit" aria-label="Edit">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>
    </div>
    
    <div style="padding:16px 16px 60px;">
      <!-- Hero Overview Card -->
      <div class="card" style="margin:0 0 16px; padding:24px; text-align:center; position:relative; overflow:hidden;">
        <div style="width:56px; height:56px; border-radius:var(--radius-lg); background:var(--card-alt); border:1px solid var(--border); margin:0 auto 12px; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:800; color:var(--text-primary);">
          ${escapeHtml(habit.name.charAt(0).toUpperCase())}
        </div>
        <div style="font-size:20px; font-weight:800; color:var(--text-primary); margin-bottom:8px;">
          ${escapeHtml(habit.name)}
        </div>
        <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
          <span style="background:var(--card-alt); color:var(--text-secondary); border:1px solid var(--border); padding:4px 12px; border-radius:var(--radius-sm); font-size:11px; font-weight:700;">
            ${escapeHtml(habit.category)}
          </span>
          <span style="background:var(--card-alt); color:var(--text-secondary); border:1px solid var(--border); padding:4px 12px; border-radius:var(--radius-sm); font-size:11px; font-weight:600;">
            Difficulty: ${habit.difficulty === 1 ? 'Easy' : habit.difficulty === 2 ? 'Medium' : 'Hard'} (+${habit.difficulty * 10} XP)
          </span>
          ${habit.reminder_time ? `
            <span style="background:var(--card-alt); color:var(--text-secondary); border:1px solid var(--border); padding:4px 12px; border-radius:var(--radius-sm); font-size:11px; font-weight:600; display:flex; align-items:center; gap:4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${habit.reminder_time}
            </span>
          ` : ''}
        </div>
      </div>

      <!-- Strength Meter -->
      <div class="card" style="margin:0 0 16px; padding:20px; text-align:center;">
        <div style="font-size:13px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:12px;">Habit Strength</div>
        <div style="position:relative; width:150px; height:75px; margin:0 auto; overflow:hidden;">
          <svg viewBox="0 0 100 50" width="150" height="75">
            <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="var(--border)" stroke-width="9" />
            <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="var(--primary)" stroke-width="9" 
              stroke-dasharray="125.6" stroke-dashoffset="${offset}" 
              stroke-linecap="round"
              style="transition: stroke-dashoffset 1s ease-in-out;" />
          </svg>
          <div style="position:absolute; bottom:0; left:0; right:0; font-size:24px; font-weight:800; color:var(--text-primary);">
            ${strengthPercent}%
          </div>
        </div>
        <div style="font-size:12px; color:var(--text-secondary); margin-top:10px;">
          Completed <b>${totalCompleted}</b> out of <b>${totalTracked}</b> days tracked
        </div>
      </div>

      <!-- 14-Day Consistency Trail -->
      <div class="card" style="margin:0 0 16px; padding:16px;">
        <div style="font-size:13px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:12px;">
          Last 14 Days Activity
        </div>
        <div style="display:flex; justify-content:space-between; gap:4px;">
          ${historyDays.map(hd => `
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:6px;" title="${hd.dateStr}: ${hd.isDone ? 'Completed' : 'Missed'}">
              <div style="width:100%; aspect-ratio:1/1; max-width:20px; border-radius:var(--radius-sm); background:${hd.isDone ? 'var(--primary)' : 'transparent'}; border:${hd.isToday ? '2px solid var(--text-primary)' : '1px solid var(--border)'};"></div>
              <span style="font-size:10px; color:var(--text-secondary);">${hd.dayLabel}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:16px;">
        <div class="card" style="margin:0; padding:12px; text-align:center;">
          <div style="font-size:20px; font-weight:800; color:var(--text-primary);">${streak}</div>
          <div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">Current Streak</div>
        </div>
        <div class="card" style="margin:0; padding:12px; text-align:center;">
          <div style="font-size:20px; font-weight:800; color:var(--primary);">${totalCompleted}</div>
          <div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">Days Done</div>
        </div>
        <div class="card" style="margin:0; padding:12px; text-align:center;">
          <div style="font-size:20px; font-weight:800; color:var(--success);">+${habit.difficulty * 10}</div>
          <div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">XP Per Log</div>
        </div>
      </div>

      <!-- Intention / Note -->
      ${habit.note ? `
        <div class="card" style="margin:0 0 16px; padding:16px;">
          <div style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:6px;">Habit Intention</div>
          <div style="font-size:14px; color:var(--text-primary); line-height:1.5;">${escapeHtml(habit.note)}</div>
        </div>
      ` : ''}

      <!-- Actions -->
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button onclick="openEditHabitSheet(${habit.id})" 
          style="flex:1; height:44px; border-radius:var(--radius-md); border:1px solid var(--border); background:var(--card); color:var(--text-primary); font-size:14px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:8px; transition:background 0.12s ease;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit Habit
        </button>
        <button onclick="confirmDeleteHabit(${habit.id})" 
          style="flex:1; height:44px; border-radius:var(--radius-md); border:1px solid var(--danger-subtle); background:var(--danger-subtle); color:var(--danger); font-size:14px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:8px; transition:background 0.12s ease;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Archive Habit
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;
};

// Interactive Edit Habit Sheet
window.openEditHabitSheet = async function(habitId) {
  const habit = await db.Habit.get(Number(habitId));
  if (!habit) return;

  const sheet = document.getElementById('habit-note-sheet');
  if (!sheet) return;

  sheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-header">
      <div class="top-bar-title" style="font-size:16px; font-weight:700;">Edit Habit</div>
      <button class="sheet-close" onclick="closeBottomSheet('habit-note-sheet')">&times;</button>
    </div>
    <div style="padding:0 20px 80px; flex:1; overflow-y:auto;">
      <div style="margin-bottom:16px;">
        <label style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px; display:block;">Habit Name</label>
        <input type="text" id="edit-habit-name" value="${escapeHtml(habit.name)}" style="width:100%; padding:12px; background:var(--card-alt); border:1px solid var(--border); border-radius:10px; color:var(--text-primary); font-size:15px; outline:none;" />
      </div>

      <div style="margin-bottom:16px;">
        <label style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px; display:block;">Category</label>
        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px;">
          ${['Core', 'Wellness', 'Learning', 'Productivity'].map(c => `
            <button type="button" class="edit-cat-btn" id="edit-cat-${c}" onclick="setEditHabitCat('${c}')"
              style="padding:10px; border-radius:10px; border:1px solid ${c === habit.category ? 'var(--primary)' : 'var(--border)'}; background:${c === habit.category ? 'var(--primary)' : 'var(--card-alt)'}; color:${c === habit.category ? '#FFF' : 'var(--text-primary)'}; font-size:13px; font-weight:600;">
              ${c}
            </button>
          `).join('')}
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <label style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px; display:block;">Daily Reminder</label>
        <input type="time" id="edit-habit-time" value="${habit.reminder_time || ''}" style="width:100%; padding:12px; background:var(--card-alt); border:1px solid var(--border); border-radius:10px; color:var(--text-primary); font-size:14px; outline:none;" />
      </div>

      <div style="margin-bottom:16px;">
        <label style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px; display:block;">Intention / Note</label>
        <textarea id="edit-habit-note" rows="2" style="width:100%; padding:12px; background:var(--card-alt); border:1px solid var(--border); border-radius:10px; color:var(--text-primary); font-size:13px; outline:none; font-family:inherit; resize:none;">${escapeHtml(habit.note || '')}</textarea>
      </div>
    </div>
    <div style="position:absolute; bottom:0; left:0; right:0; padding:16px 20px; background:var(--card); border-top:1px solid var(--border); display:flex; gap:10px;">
      <button onclick="closeBottomSheet('habit-note-sheet')" style="flex:1; height:46px; border-radius:10px; border:1px solid var(--border); background:var(--card-alt); color:var(--text-secondary); font-weight:600;">Cancel</button>
      <button onclick="saveHabitEdits(${habit.id})" style="flex:2; height:46px; border-radius:10px; border:none; background:var(--primary); color:#FFF; font-weight:700;">Save Changes</button>
    </div>
  `;

  openSheet('habit-note-sheet');
  window._activeEditCategory = habit.category;
};

window.setEditHabitCat = function(cat) {
  window._activeEditCategory = cat;
  ['Core', 'Wellness', 'Learning', 'Productivity'].forEach(c => {
    const el = document.getElementById(`edit-cat-${c}`);
    if (el) {
      if (c === cat) {
        el.style.background = 'var(--primary)';
        el.style.color = '#FFF';
        el.style.borderColor = 'var(--primary)';
      } else {
        el.style.background = 'var(--card-alt)';
        el.style.color = 'var(--text-primary)';
        el.style.borderColor = 'var(--border)';
      }
    }
  });
};

window.saveHabitEdits = async function(habitId) {
  const nameInput = document.getElementById('edit-habit-name');
  const timeInput = document.getElementById('edit-habit-time');
  const noteInput = document.getElementById('edit-habit-note');
  
  const name = nameInput ? nameInput.value.trim() : '';
  if (!name) {
    showSnackbar('Please enter a habit name');
    return;
  }

  await updateHabit(habitId, {
    name: name,
    category: window._activeEditCategory || 'Core',
    reminder_time: timeInput && timeInput.value ? timeInput.value : null,
    note: noteInput ? noteInput.value.trim() : ''
  });

  closeBottomSheet('habit-note-sheet');
  showSnackbar('Habit updated!');
  playHapticSound('check');

  await window.renderHabitDetail(habitId);
  if (window.renderHome) window.renderHome();
};

window.confirmDeleteHabit = function(habitId) {
  if (confirm('Archive this habit? It will be removed from your daily active list, but past progress is preserved.')) {
    deleteHabit(habitId, false).then(() => {
      showSnackbar('Habit archived');
      popScreen();
      if (window.renderHome) window.renderHome();
      if (window.renderDesktopRightPanel) window.renderDesktopRightPanel();
    });
  }
};
