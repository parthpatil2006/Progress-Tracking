// home.js — Main dashboard, habit cards, real-time progress, daily quote, and check-ins

let currentCategory = 'All';

window.renderHome = async function() {
  const container = document.getElementById('screen-home');
  if (!container) return;

  const now = new Date();
  const today = todayStr();
  const dateStr = formatFullDate(now);
  const timeStr = formatTime(now);
  
  const hour = now.getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  const [activeHabits, allLogs, stats, streakData] = await Promise.all([
    getActiveHabits(),
    getLogsForDate(today),
    getUserStats(),
    calculateAllStreaks()
  ]);
  
  let doneCount = 0;
  const habitsData = activeHabits.map(h => {
    const log = allLogs.find(l => l.habit_id === h.id);
    const completed = log ? log.completed : 0;
    if (completed === 1) doneCount++;
    return { ...h, completed };
  });

  const totalTasks = activeHabits.length;
  const pct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
  
  // Progress Ring Circumference
  const circumference = 2 * Math.PI * 26;
  const offset = circumference - (pct / 100) * circumference;

  // Streak
  const streakDays = streakData.overallStreak;

  // Daily Quote
  const dailyQuote = (typeof getDailyQuote === 'function') ? getDailyQuote() : "Discipline is choosing between what you want now and what you want most.";

  // Filter habits
  let filtered = habitsData;
  if (currentCategory !== 'All') {
    filtered = habitsData.filter(h => h.category === currentCategory);
  }
  
  const incomplete = filtered.filter(h => !h.completed);
  const complete = filtered.filter(h => h.completed);

  let html = `
    <!-- Top Header Bar -->
    <div class="top-bar">
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="width:28px; height:28px; border-radius:var(--radius-sm); background:var(--card-alt); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:var(--text-primary);">
          ⚡
        </div>
        <div class="top-bar-title">HabitForge</div>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <button onclick="openAddHabitSheet()" style="background:var(--text-primary); color:var(--bg); padding:6px 12px; border-radius:var(--radius-sm); font-size:12px; font-weight:600; display:flex; align-items:center; gap:5px; transition:opacity 0.12s;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Habit
        </button>
        <button onclick="pushScreen('settings')" style="padding:6px; color:var(--text-secondary);" aria-label="Settings">
          <svg width="18" height="18" stroke="currentColor" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>
      </div>
    </div>
    
    <!-- Greeting & Live Time Header -->
    <div style="padding:20px 16px 12px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-end;">
        <div>
          <div style="font-size:20px; font-weight:700; color:var(--text-primary); letter-spacing:-0.02em;">${greeting}</div>
          <div id="live-time-label" style="font-size:12px; font-weight:500; color:var(--text-secondary); margin-top:2px;">${dateStr} &bull; ${timeStr}</div>
        </div>
        <div style="background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); padding:4px 10px; display:flex; gap:6px; align-items:center;">
          <span style="font-size:11px; font-weight:600; color:var(--text-secondary);">Streak:</span>
          <span style="font-size:12px; font-weight:700; color:var(--primary);">${streakDays}d</span>
        </div>
      </div>
    </div>

    <!-- Daily Reflection Thought -->
    <div style="padding:0 16px 14px;">
      <div style="background:var(--card-alt); border:1px solid var(--border); border-radius:var(--radius-md); padding:12px 14px; display:flex; gap:8px; align-items:flex-start;">
        <span style="color:var(--primary); font-size:16px; line-height:1; font-weight:700;">“</span>
        <div style="font-size:12px; font-style:italic; color:var(--text-secondary); line-height:1.45;">${escapeHtml(dailyQuote)}</div>
      </div>
    </div>

    <!-- PWA Install Card -->
    ${renderInstallCard()}

    <!-- Category Filter Chips (Clean, Monochromatic & Purposeful) -->
    <div style="display:flex; gap:6px; overflow-x:auto; padding:0 16px; margin-bottom:14px; scrollbar-width:none;">
      ${['All', 'Core', 'Wellness', 'Learning', 'Productivity'].map(c => {
        const isSel = c === currentCategory;
        return `
          <button type="button" onclick="setCategory('${c}')" 
            style="background:${isSel ? 'var(--text-primary)' : 'var(--card)'}; color:${isSel ? 'var(--bg)' : 'var(--text-secondary)'}; border:1px solid ${isSel ? 'var(--text-primary)' : 'var(--border)'}; padding:5px 12px; border-radius:var(--radius-sm); font-size:12px; font-weight:${isSel ? '600' : '500'}; white-space:nowrap; cursor:pointer; transition:all 0.12s ease;">
            ${c}
          </button>
        `;
      }).join('')}
    </div>

    <!-- Progress Overview Card -->
    <div class="card" style="display:flex; align-items:center; gap:16px; cursor:pointer; margin-bottom:14px;" onclick="switchTab('stats')">
      <div style="position:relative; width:56px; height:56px; flex-shrink:0;">
        <svg viewBox="0 0 64 64" width="56" height="56" style="transform:rotate(-90deg);">
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" stroke-width="5"></circle>
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--primary)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" style="transition:stroke-dashoffset 0.4s ease-in-out;"></circle>
        </svg>
        <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:var(--text-primary);">${pct}%</div>
      </div>
      <div style="flex:1;">
        <div style="font-size:14px; font-weight:600; color:var(--text-primary);">${doneCount} of ${totalTasks} completed</div>
        <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">
          ${totalTasks - doneCount === 0 ? 'All habits finished for today' : `${totalTasks - doneCount} remaining`}
        </div>
      </div>
      <div style="color:var(--text-muted); font-size:12px; font-weight:600;">View Stats &rarr;</div>
    </div>

    <!-- Mood Check-in -->
    <div id="mood-section" style="padding:0 16px 14px;">
      ${await renderMoodCard()}
    </div>

    <!-- Section Header -->
    <div style="padding:0 16px 8px; display:flex; justify-content:space-between; align-items:center;">
      <div style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em;">
        Today's Schedule (${filtered.length})
      </div>
      <div style="font-size:11px; font-weight:600; color:var(--text-muted);">${pct}% complete</div>
    </div>
    
    <!-- Habit List -->
    <div style="display:flex; flex-direction:column; padding-bottom:80px;">
      ${filtered.length === 0 ? `
        <div class="card" style="text-align:center; padding:32px 16px;">
          <div style="font-size:13px; font-weight:600; color:var(--text-primary); margin-bottom:4px;">No habits in ${escapeHtml(currentCategory)}</div>
          <div style="font-size:12px; color:var(--text-secondary); margin-bottom:14px;">Add a habit to start tracking this category.</div>
          <button onclick="openAddHabitSheet()" style="padding:7px 14px; background:var(--text-primary); color:var(--bg); border-radius:var(--radius-sm); font-size:12px; font-weight:600;">+ Create Habit</button>
        </div>
      ` : `
        ${incomplete.map(h => renderHabitCard(h, streakData.habitStreaks[h.id] || 0)).join('')}
        ${(complete.length > 0 && incomplete.length > 0) ? `<div style="height:1px; background:var(--border-subtle); margin:4px 16px 8px;"></div>` : ''}
        ${complete.map(h => renderHabitCard(h, streakData.habitStreaks[h.id] || 0)).join('')}
      `}
    </div>
  `;

  container.innerHTML = html;
};

window.setCategory = function(c) {
  currentCategory = c;
  window.renderHome();
};

function renderHabitCard(h, habitStreak = 0) {
  const isC = h.completed === 1;
  const cardClass = isC ? 'habit-card completed' : 'habit-card';
  const xp = (h.difficulty || 1) * 10;

  return `
    <div class="${cardClass}" id="habit-card-${h.id}">
      <div class="habit-cb" onclick="toggleHabit(${h.id}, ${isC})" aria-label="Toggle ${escapeHtml(h.name)}">
        <svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <div class="habit-content" onclick="pushScreen('habit-detail', ${h.id})" style="cursor:pointer;">
        <div class="habit-name">${escapeHtml(h.name)}</div>
        <div class="habit-sub">
          <span>${escapeHtml(h.category)}</span>
          ${h.reminder_time ? `<span>&bull; ${h.reminder_time}</span>` : ''}
          <span style="color:var(--text-muted);">&bull; +${xp} XP</span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:4px; font-size:11px; font-weight:600; color:var(--text-muted); flex-shrink:0;">
        <span>${habitStreak}d</span>
      </div>
    </div>
  `;
}

window.toggleHabit = async function(id, isCompleted) {
  const habit = await db.Habit.get(id);
  if (!habit) return;
  const today = todayStr();
  const xp = (habit.difficulty || 1) * 10;
  
  if (isCompleted) {
    playHapticSound('uncheck');
    await upsertHabitLog(id, today, 0, 0);
    const stats = await getUserStats();
    await updateUserStats({ total_xp: Math.max(0, stats.total_xp - xp) });
  } else {
    playHapticSound('check');
    await upsertHabitLog(id, today, 1, xp);
    const stats = await getUserStats();
    await updateUserStats({ total_xp: stats.total_xp + xp });
    
    const newStats = await getUserStats();
    const newLevel = calculateLevel(newStats.total_xp);
    if (newLevel.level > newStats.current_level) {
      await updateUserStats({ current_level: newLevel.level });
      showSnackbar(`Level ${newLevel.level}: ${newLevel.name}`);
      playHapticSound('celebrate');
    }
    
    // Check 100% completion
    const [active, logs] = await Promise.all([
      getActiveHabits(),
      getLogsForDate(today)
    ]);
    const doneCount = active.filter(h => {
      const l = logs.find(log => log.habit_id === h.id);
      return l && l.completed === 1;
    }).length;
    
    if (doneCount >= active.length && newStats.city_days_logged_today === 0) {
      if (typeof triggerCelebration === 'function') {
        triggerCelebration();
      }
    }
  }
  
  await window.renderHome();
  if (window.renderDesktopRightPanel) window.renderDesktopRightPanel();
};

function renderInstallCard() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInstalled = localStorage.getItem('pt_installed') === '1';
  
  if (isStandalone || isInstalled) return '';

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  let btnText = "Install";
  if (isIOS) btnText = "Instructions";

  return `
    <div class="card" style="margin-bottom:14px; padding:12px 14px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:13px; font-weight:600; color:var(--text-primary);">Install Offline App</div>
          <div style="font-size:11px; color:var(--text-secondary);">Run locally without network</div>
        </div>
        <button onclick="handleInstallClick()" style="padding:6px 12px; background:var(--card-alt); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-size:12px; font-weight:600;">
          ${btnText}
        </button>
      </div>
    </div>
  `;
}

window.handleInstallClick = async function() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  if (isIOS) {
    showIOSInstructions();
  } else if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('pt_installed', '1');
      window.renderHome();
    }
    deferredPrompt = null;
  } else {
    alert("To install: Tap your browser's menu and select 'Add to Home Screen'.");
  }
};

function showIOSInstructions() {
  const sheet = document.getElementById('day-detail-sheet');
  if (!sheet) return;
  sheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-header">
      <div class="top-bar-title">Install on iOS</div>
      <button class="sheet-close" onclick="closeAllSheets()">&times;</button>
    </div>
    <div style="padding:20px; color:var(--text-primary);">
      <div style="font-size:13px; margin-bottom:12px; color:var(--text-secondary);">1. Tap <b>Share</b> in Safari (square with up arrow).</div>
      <div style="font-size:13px; margin-bottom:12px; color:var(--text-secondary);">2. Scroll and tap <b>Add to Home Screen</b>.</div>
      <div style="font-size:13px; margin-bottom:20px; color:var(--text-secondary);">3. Tap <b>Add</b> in the top-right corner.</div>
      <button onclick="closeAllSheets()" style="width:100%; height:40px; background:var(--text-primary); border-radius:var(--radius-sm); color:var(--bg); font-size:13px; font-weight:600;">Close</button>
    </div>
  `;
  openSheet('day-detail-sheet');
}

async function renderMoodCard() {
  const today = todayStr();
  const mood = await getMoodForDate(today);
  
  if (mood) {
    const emojis = ['😫', '😕', '😐', '🙂', '🤩'];
    const names = ['Low', 'Challenged', 'Neutral', 'Good', 'Peak'];
    return `
      <div class="card" style="margin:0; padding:12px 14px; display:flex; align-items:center; justify-content:space-between;">
        <div>
          <div style="font-size:12px; font-weight:600; color:var(--text-primary);">Mood: ${names[mood.mood_level - 1]}</div>
          <div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">Check-in logged ${mood.note ? `&bull; ${escapeHtml(mood.note)}` : ''}</div>
        </div>
        <div style="font-size:20px;">${emojis[mood.mood_level - 1]}</div>
      </div>
    `;
  }

  return `
    <div class="card" style="margin:0; padding:12px 14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="font-size:11px; font-weight:600; color:var(--text-secondary); text-transform:uppercase;">Daily check-in</span>
        <span style="font-size:11px; color:var(--text-muted);">How do you feel?</span>
      </div>
      <div style="display:flex; justify-content:space-between; gap:4px;">
        ${[1, 2, 3, 4, 5].map(i => {
          const emojis = ['😫', '😕', '😐', '🙂', '🤩'];
          return `<button type="button" onclick="logMood(${i})" style="font-size:20px; padding:4px 8px; border-radius:var(--radius-sm); background:var(--card-alt); transition:background 0.12s;" onmouseover="this.style.background='var(--border)'" onmouseout="this.style.background='var(--card-alt)'">${emojis[i-1]}</button>`;
        }).join('')}
      </div>
    </div>
  `;
}

window.logMood = async function(level) {
  const today = todayStr();
  await saveMood(today, level);
  playHapticSound('check');
  showSnackbar("Mood logged");
  window.renderHome();
  if (window.renderDesktopRightPanel) window.renderDesktopRightPanel();
};

// Live Clock Update
setInterval(() => {
  const homeScreen = document.getElementById('screen-home');
  if (homeScreen && homeScreen.classList.contains('active')) {
    const timeLabel = document.getElementById('live-time-label');
    if (timeLabel) {
      const now = new Date();
      timeLabel.innerText = `${formatFullDate(now)} • ${formatTime(now)}`;
    }
  }
}, 60000);
