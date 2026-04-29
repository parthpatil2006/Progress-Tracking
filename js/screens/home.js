let isAddHabitFormVisible = false;

async function renderHome() {
  const container = document.getElementById('screen-home');
  const today = todayStr();

  // ── PRELOAD DEFAULT HABITS ON FIRST LAUNCH ──
  const allHabits = await db.Habit.toArray();
  if (allHabits.length === 0) {
    const defaultHabits = [
      'Morning workout 30 min',
      'Read 20 pages',
      'Drink 8 glasses of water',
      'Meditate 10 min',
      'Learn something new 1 hr',
      'Walk 5000 steps',
      'Eat 3 healthy meals',
      'Sleep 8 hours',
      'Journal 10 min',
      'No social media before 9am',
      'Practice gratitude',
      'Evening stretch'
    ];
    for (const name of defaultHabits) {
      const id = await addHabit({ name, category: 'Learning', difficulty: 1 });
      await upsertLog(id, today, 0, 0);
    }
  }

  // ── ENSURE TODAY'S LOGS EXIST ──
  const activeHabits = await getActiveHabits();
  for (const h of activeHabits) {
    const existing = await getLog(h.id, today);
    if (!existing) await upsertLog(h.id, today, 0, 0);
  }

  // ── DAILY TASK RESET ──
  const stats = await getUserStats();
  if (stats.last_active_date !== today) {
    // New day! Uncheck all tasks
    const tasks = await db.Task.toArray();
    if (tasks.length > 0) {
      await db.Task.where('id').anyOf(tasks.map(t => t.id)).modify({ completed: 0 });
    }
    await updateUserStats({ last_active_date: today });
  }

  const allLogs = await getLogsForDate(today);
  const totalActive = activeHabits.length;
  let doneCount = 0;

  const habitsWithData = [];
  for (const h of activeHabits) {
    const log = allLogs.find(l => l.habit_id == h.id);
    habitsWithData.push({ ...h, log });
    if (log && log.completed) doneCount++;
  }

  const pct = totalActive === 0 ? 0 : Math.round((doneCount / totalActive) * 100);

  let ringColor = '#F5A623';
  if (pct >= 100) ringColor = '#34C97D';
  else if (pct >= 50) ringColor = '#4F8EF7';

  const circumference = 2 * Math.PI * 26; // ≈ 163.36
  const offset = circumference - (pct / 100) * circumference;

  const dateObj = new Date();
  const monthYear = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const incomplete = habitsWithData.filter(h => !h.log || !h.log.completed);
  const complete   = habitsWithData.filter(h => h.log && h.log.completed);

  const weekBars    = await getWeeklyBarsData();
  const streakDays  = await calculateNewStreak();
  const completionRate = totalActive > 0 ? Math.round((doneCount / totalActive) * 100) : 0;

  // ── BUILD HTML ──
  let html = `
    <!-- Top Bar (sticky) -->
    <div style="position:sticky;top:0;z-index:10;height:56px;padding:0 16px;display:flex;justify-content:space-between;align-items:center;background:#0F1117;border-bottom:0.5px solid #2A2D3E;">
      <div style="font-size:16px;font-weight:500;color:#FFFFFF;">Progress Tracker</div>
      <button
        onclick="toggleAddHabitForm()"
        style="border:0.5px solid #2A2D3E;border-radius:8px;padding:5px 10px;background:transparent;font-size:12px;color:#8A8FA8;cursor:pointer;-webkit-tap-highlight-color:transparent;">
        + Add habit
      </button>
    </div>

    <!-- Inline Add Habit Form -->
    <div id="inline-add-habit-form" style="display:${isAddHabitFormVisible ? 'flex' : 'none'};background:#1A1D27;border:0.5px solid #4F8EF7;border-radius:12px;margin:12px 12px 0;padding:12px;flex-direction:row;gap:8px;align-items:center;">
      <input
        type="text"
        id="inline-habit-input"
        placeholder="e.g. Morning run, Read 20 pages…"
        style="flex-grow:1;font-size:13px;background:#0F1117;border:0.5px solid #2A2D3E;border-radius:8px;padding:7px 10px;color:#FFFFFF;outline:none;"
        onkeydown="if(event.key==='Enter')saveInlineHabit();if(event.key==='Escape')toggleAddHabitForm();"
      />
      <button onclick="saveInlineHabit()" style="background:#1A3A6E;color:#4F8EF7;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:500;border:none;cursor:pointer;white-space:nowrap;-webkit-tap-highlight-color:transparent;">Save</button>
      <button onclick="toggleAddHabitForm()" style="border:0.5px solid #2A2D3E;background:transparent;border-radius:8px;padding:7px 10px;font-size:12px;color:#8A8FA8;cursor:pointer;white-space:nowrap;-webkit-tap-highlight-color:transparent;">Cancel</button>
    </div>

    <!-- Progress Ring Card -->
    <div style="background: rgba(26, 29, 39, 0.7); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 0.5px solid rgba(255, 255, 255, 0.1); border-radius: 16px; margin: 12px 12px 0; padding: 14px 16px; display: flex; align-items: center; gap: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.2);">
      <!-- Ring -->
      <div style="position:relative;width:64px;height:64px;flex-shrink:0;">
        <svg viewBox="0 0 64 64" width="64" height="64" style="transform:rotate(-90deg); filter: drop-shadow(0 0 4px ${ringColor}44);">
          <circle cx="32" cy="32" r="26" fill="none" stroke="#2A2D3E" stroke-width="7"></circle>
          <circle
            cx="32" cy="32" r="26" fill="none"
            stroke="${ringColor}" stroke-width="7" stroke-linecap="round"
            stroke-dasharray="${circumference.toFixed(2)}"
            stroke-dashoffset="${offset.toFixed(2)}"
            style="transition:stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1),stroke 0.3s ease;">
          </circle>
        </svg>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#FFFFFF; text-shadow: 0 0 10px rgba(255,255,255,0.3);">${pct}%</div>
      </div>
      <!-- Info -->
      <div style="flex:1;min-width:0;">
        <div style="font-size:15px;font-weight:600;color:#FFFFFF;">${doneCount} of ${totalActive} done</div>
        <div style="font-size:12px;color:#8A8FA8;margin-top:2px;">${monthYear} · ${totalActive} habits</div>
        <div style="background:rgba(15, 17, 23, 0.6); border-radius:8px; padding:6px 12px; display:inline-flex; align-items:baseline; gap:3px; margin-top:8px; border: 0.5px solid rgba(255,255,255,0.05);">
          <span style="font-size:18px;font-weight:700;color:#FFFFFF;">${doneCount}</span>
          <span style="font-size:13px;color:#8A8FA8;">/ ${totalActive}</span>
          <span style="font-size:11px;color:#8A8FA8;margin-left:4px;color:#4F8EF7;">active</span>
        </div>
      </div>
    </div>


    <!-- Section Header -->
    <div style="padding:14px 16px 6px;display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:13px;font-weight:500;color:#8A8FA8;">Today's habits</div>
      <button
        onclick="toggleAddHabitForm()"
        style="border:0.5px solid #2A2D3E;border-radius:8px;padding:5px 10px;background:transparent;font-size:12px;color:#8A8FA8;cursor:pointer;-webkit-tap-highlight-color:transparent;">
        New
      </button>
    </div>

    <!-- Habit List -->
    <div style="display:flex;flex-direction:column;gap:6px;padding:0 12px;">
  `;

  incomplete.forEach(h => { html += renderNewHabitCard(h, false); });

  if (complete.length > 0 && incomplete.length > 0) {
    html += `<div style="height:1px;background:#2A2D3E;margin:2px 0;"></div>`;
  }

  complete.forEach(h => { html += renderNewHabitCard(h, true); });

  html += `</div>`; // end habit list

  // Tasks Section
  const tasksHTML = await renderTasksSection();
  html += tasksHTML;

  // ── Weekly Progress ──
  html += `
    <div style="background:#1A1D27;border:0.5px solid #2A2D3E;border-radius:12px;margin:12px 12px 0;padding:14px 16px;">
      <div style="font-size:13px;font-weight:500;color:#8A8FA8;margin-bottom:10px;">Weekly progress</div>
      <div style="height:60px;display:flex;gap:6px;align-items:flex-end;">
  `;

  weekBars.forEach((w, index) => {
    const isCurrentWeek = (index === 5);
    const barColor = isCurrentWeek ? '#34C97D' : '#4F8EF7';
    const barHeight = w.pct > 0 ? w.pct : 0;
    html += `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;height:100%;">
        <div style="font-size:9px;color:#8A8FA8;line-height:1;">${w.pct > 0 ? w.pct + '%' : ''}</div>
        <div style="flex-grow:1;width:100%;background:#22263A;border-radius:3px;overflow:hidden;display:flex;align-items:flex-end;">
          <div style="width:100%;border-radius:2px;height:${barHeight}%;background:${barColor};${barHeight > 0 ? 'min-height:2px;' : ''}transition:height 0.3s ease;"></div>
        </div>
        <div style="font-size:9px;color:#8A8FA8;line-height:1;">W${index + 1}</div>
      </div>
    `;
  });

  html += `</div></div>`;

  // ── Bottom Stats 2×2 ──
  html += `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px;margin:0 0 12px;">
      <div style="background:#1A1D27;border:0.5px solid #2A2D3E;border-radius:12px;padding:12px;">
        <div style="font-size:20px;font-weight:500;color:#FFFFFF;">${doneCount}</div>
        <div style="font-size:11px;color:#8A8FA8;margin-top:2px;">Completed today</div>
      </div>
      <div style="background:#1A1D27;border:0.5px solid #2A2D3E;border-radius:12px;padding:12px;">
        <div style="font-size:20px;font-weight:500;color:#FFFFFF;">${completionRate}%</div>
        <div style="font-size:11px;color:#8A8FA8;margin-top:2px;">Completion rate</div>
      </div>
      <div style="background:#1A1D27;border:0.5px solid #2A2D3E;border-radius:12px;padding:12px;">
        <div style="font-size:20px;font-weight:500;color:#FFFFFF;">${streakDays}</div>
        <div style="font-size:11px;color:#8A8FA8;margin-top:2px;">Day streak</div>
      </div>
      <div style="background:#1A1D27;border:0.5px solid #2A2D3E;border-radius:12px;padding:12px;">
        <div style="font-size:20px;font-weight:500;color:#FFFFFF;">${totalActive}</div>
        <div style="font-size:11px;color:#8A8FA8;margin-top:2px;">Total habits</div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  if (isAddHabitFormVisible) {
    const input = document.getElementById('inline-habit-input');
    if (input) {
      input.focus();
      // On mobile, scroll to show the form
      input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

// ── TASK LOGIC ──
async function renderTasksSection() {
  const tasks = await getAllTasks();
  // Reset if over limit
  await resetTasksIfLimit();

  const taskCards = tasks.map(t => renderTaskCard(t, t.completed)).join('');

  const addTaskFormHTML = `
    <div class="add-task-form" style="background:#1A1D27;border:0.5px solid #4F8EF7;border-radius:12px;margin:0 12px;padding:12px;display:${isAddTaskFormVisible ? 'flex' : 'none'};gap:8px;align-items:center;">
      <input id="new-task-input" type="text" placeholder="e.g. Read a book, 30‑min walk…" style="flex-grow:1;font-size:13px;background:#0F1117;border:0.5px solid #2A2D3E;border-radius:8px;padding:7px 10px;color:#FFFFFF;" onkeydown="if(event.key==='Enter'){saveNewTask();}" />
      <button onclick="saveNewTask()" style="background:#1A3A6E;color:#4F8EF7;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:500;">Save</button>
      <button onclick="toggleAddTaskForm()" style="border:0.5px solid #2A2D3E;background:transparent;border-radius:8px;padding:7px 10px;font-size:12px;color:#8A8FA8;">Cancel</button>
    </div>`;

  const tasksHTML = `
    <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px 6px;">
      <div style="font-size:13px;font-weight:600;color:#8A8FA8;display:flex;align-items:center;gap:6px;">
        Tasks
        ${tasks.some(t => !t.completed) ? `<span style="width:6px;height:6px;border-radius:50%;background:#F5A623;box-shadow:0 0 8px #F5A623;animation:pulse 2s infinite;"></span>` : ''}
      </div>
      <button onclick="toggleAddTaskForm()" style="border:0.5px solid #2A2D3E;background:transparent;border-radius:8px;padding:5px 10px;font-size:12px;color:#8A8FA8;cursor:pointer;">+ Add task</button>
    </div>
    <style>
      @keyframes pulse {
        0% { opacity: 0.4; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.2); }
        100% { opacity: 0.4; transform: scale(0.8); }
      }
    </style>

    ${addTaskFormHTML}
    <div class="tasks-list" style="display:flex;flex-direction:column;gap:6px;padding:0 12px;">
      ${taskCards}
    </div>`;

  return tasksHTML;
}

  const bg = isComplete ? 'background: linear-gradient(135deg, #1A1D27 0%, #1a2c3a 100%);' : 'background:#1A1D27;';
  const border = isComplete ? 'border: 0.5px solid #34C97D;' : 'border: 0.5px solid #2A2D3E;';

  return `
    <div style="${bg}${border}border-radius:12px;padding:11px 12px;display:flex;align-items:center;gap:10px;opacity:${isComplete ? '0.85' : '1'};transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);transform: ${isComplete ? 'scale(0.98)' : 'scale(1)'};">
        <div onclick="toggleTaskUI(${t.id},${isComplete ? 1 : 0})"
             style="min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;">
        <div style="width:20px;height:20px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:all 0.2s;${cbStyle}">
          ${svgCheck}
        </div>
      </div>
      <div style="flex-grow:1;min-width:0;">
        <div style="font-size:13px;font-weight:500;color:${isComplete ? '#34C97D' : '#FFFFFF'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition: color 0.2s;">${t.name}</div>
        <div style="font-size:11px;color:#8A8FA8;margin-top:2px;">${statusText}</div>
      </div>
        <div onclick="deleteTaskUI(${t.id})"
             style="min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0.4;color:#8A8FA8;-webkit-tap-highlight-color:transparent;"
             onmouseover="this.style.opacity='1';this.style.color='#F75A5A';"
             onmouseout="this.style.opacity='0.4';this.style.color='#8A8FA8';">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </div>
    </div>`;
}

let isAddTaskFormVisible = false;
function toggleAddTaskForm() { isAddTaskFormVisible = !isAddTaskFormVisible; renderHome(); }
async function saveNewTask() {
  const input = document.getElementById('new-task-input');
  const name = input.value.trim();
  if (!name) return;
  await addTask(name);
  input.value = '';
  await renderHome();
  // Snackbar
  showSnackbar('Task added!', 2000);

}
async function toggleTaskUI(id, currentlyDone) {
  // Play sound
  playToggleSound();
  // Call DB toggleTask
  await toggleTask(id, currentlyDone);
  await resetTasksIfLimit();
  await renderHome();
}

async function deleteTaskUI(id) {
  await deleteTask(id);
  await renderHome();
}


// Simple toggle sound using Web Audio API
function playToggleSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    
    // Fundamental note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.1); // C6
    
    gain1.gain.setValueAtTime(0.1, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    // Higher harmonic chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1567.98, now); // G6
    
    gain2.gain.setValueAtTime(0.05, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.15);
    osc2.stop(now + 0.15);
  } catch(e) { console.warn('Audio play failed', e); }
}

function renderNewHabitCard(h, isComplete) {
  const cbStyle = isComplete
    ? 'background:#34C97D;border:1.5px solid #34C97D;box-shadow: 0 0 8px rgba(52, 201, 125, 0.4);'
    : 'background:transparent;border:1.5px solid #2A2D3E;';
  const svgCheck = isComplete
    ? `<svg viewBox="0 0 24 24" width="14" height="14"><polyline points="20 6 9 17 4 12" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline></svg>`
    : '';
  const statusText  = isComplete ? 'Completed today' : 'Pending';
  const cardOpacity = isComplete ? '0.85' : '1';
  const leftBorder  = isComplete ? '3px solid #34C97D' : '0.5px solid #2A2D3E';
  const bg = isComplete ? 'background: linear-gradient(135deg, #1A1D27 0%, #1a3a2a 100%);' : 'background:#1A1D27;';

  return `
    <div style="${bg}border:0.5px solid #2A2D3E;border-left:${leftBorder};border-radius:12px;padding:11px 12px;display:flex;align-items:center;gap:10px;opacity:${cardOpacity};transition: all 0.25s ease;transform: ${isComplete ? 'scale(0.98)' : 'scale(1)'};">

      <!-- Checkbox (44×44 tap target) -->
      <div
        onclick="toggleNewHabit(${h.id},${isComplete ? 1 : 0})"
        ontouchstart="this.firstElementChild.style.transform='scale(0.85)'"
        ontouchend="this.firstElementChild.style.transform='scale(1.0)'"
        onmousedown="this.firstElementChild.style.transform='scale(0.85)'"
        onmouseup="this.firstElementChild.style.transform='scale(1.0)'"
        onmouseleave="this.firstElementChild.style.transform='scale(1.0)'"
        style="min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;">
        <div style="width:20px;height:20px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);${cbStyle}">
          ${svgCheck}
        </div>
      </div>

      <!-- Name + Status -->
      <div style="flex-grow:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;color:${isComplete ? '#34C97D' : '#FFFFFF'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition: color 0.2s;">${h.name}</div>
        <div style="font-size:11px;color:#8A8FA8;margin-top:2px;">${statusText}</div>
      </div>

      <!-- Delete Button (44×44 tap target wrapper) -->
      <div
        onclick="deleteNewHabit(${h.id})"
        style="min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;">
        <div style="opacity:0.4;color:#8A8FA8;border-radius:4px;padding:3px;display:flex;align-items:center;justify-content:center;transition:all 0.15s;"
             onmouseover="this.style.opacity='1';this.style.color='#F75A5A';this.style.background='rgba(247, 90, 90, 0.1)';"
             onmouseout="this.style.opacity='0.4';this.style.color='#8A8FA8';this.style.background='transparent';">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
      </div>

    </div>
  `;
}

// ── FORM TOGGLE ──
function toggleAddHabitForm() {
  isAddHabitFormVisible = !isAddHabitFormVisible;
  renderHome();
}

// ── SAVE INLINE HABIT ──
async function saveInlineHabit() {
  const input = document.getElementById('inline-habit-input');
  if (!input) return;
  const val = input.value.trim();
  if (val === '') return;

  const id = await addHabit({ name: val, category: 'Learning', difficulty: 1 });
  await upsertLog(id, todayStr(), 0, 0);

  isAddHabitFormVisible = false;
  showSnackbar('Habit added!', 2000);
  await renderHome();
}

// ── TOGGLE HABIT ──
async function toggleNewHabit(habitId, currentlyDone) {
  const habit  = await db.Habit.get(habitId);
  const today  = todayStr();
  const xp     = habit.difficulty * 10;

  if (currentlyDone) {
    await upsertLog(habitId, today, 0, 0);
    const stats = await getUserStats();
    await updateUserStats({ total_xp: Math.max(0, stats.total_xp - xp) });
  } else {
    await upsertLog(habitId, today, 1, xp);
    const stats = await getUserStats();
    await updateUserStats({ total_xp: stats.total_xp + xp });

    const newStats = await getUserStats();
    const newLevel = calculateLevel(newStats.total_xp);
    if (newLevel.level !== newStats.current_level) {
      await updateUserStats({ current_level: newLevel.level });
    }
  }

  await checkAllComplete();
  await renderHome();
}

// ── DELETE HABIT ──
async function deleteNewHabit(habitId) {
  await archiveHabit(habitId);
  await renderHome();
}

// ── WEEKLY BARS DATA ──
async function getWeeklyBarsData() {
  const now          = new Date();
  const currentMonth = now.getMonth();
  const currentYear  = now.getFullYear();

  const allLogs  = await db.HabitLog.toArray();
  const monthLogs = allLogs.filter(l => {
    if (!l.date) return false;
    const [y, m] = l.date.split('-').map(Number);
    return y === currentYear && (m - 1) === currentMonth;
  });

  const weeks = Array.from({ length: 6 }, () => ({ done: 0, total: 0 }));

  monthLogs.forEach(l => {
    const day    = parseInt(l.date.split('-')[2], 10);
    const wIndex = Math.min(Math.floor((day - 1) / 7), 5);
    weeks[wIndex].total++;
    if (l.completed) weeks[wIndex].done++;
  });

  const hasData = weeks.some(w => w.total > 0);
  if (!hasData) {
    return [0, 0, 20, 17, 27, 8].map(pct => ({ pct }));
  }

  return weeks.map(w => ({
    pct: w.total === 0 ? 0 : Math.round((w.done / w.total) * 100)
  }));
}

// ── STREAK CALCULATION ──
async function calculateNewStreak() {
  const activeHabits = await getActiveHabits();
  if (activeHabits.length === 0) return 0;

  let streak  = 0;
  let cursor  = new Date();
  const todayS = todayStr();

  // Safety cap: max 365 days back
  for (let i = 0; i < 365; i++) {
    const yr  = cursor.getFullYear();
    const mo  = String(cursor.getMonth() + 1).padStart(2, '0');
    const dy  = String(cursor.getDate()).padStart(2, '0');
    const dStr = `${yr}-${mo}-${dy}`;

    const dayLogs = await getLogsForDate(dStr);

    let allDone = true;
    for (const h of activeHabits) {
      const log = dayLogs.find(l => l.habit_id == h.id);
      if (!log || log.completed !== 1) { allDone = false; break; }
    }

    if (dStr === todayS) {
      // Today counts only if all done, then keep going back
      if (allDone) streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      if (allDone) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return streak;
}
