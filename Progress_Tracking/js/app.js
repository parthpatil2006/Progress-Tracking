// app.js — Main application initialization, PWA lifecycle, desktop navigation, and shortcuts

let deferredPrompt;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Initialize Dexie Database
    await initDB();
    
    // 2. Load and apply user settings & preferences
    const stats = await getUserStats();
    if (stats) {
      if (stats.theme === 'light') {
        document.body.classList.add('light-mode');
      } else {
        document.body.classList.remove('light-mode');
      }
    }
    
    // 3. Daily rollover check
    const today = todayStr();
    if (stats && stats.last_active_date !== today) {
      await updateUserStats({ 
        city_days_logged_today: 0, 
        last_active_date: today 
      });
      
      // Ensure HabitLog rows exist for today for all active habits
      const activeHabits = await getActiveHabits();
      for (const h of activeHabits) {
        const existing = await db.HabitLog.where({ habit_id: h.id, date: today }).first();
        if (!existing) {
          await db.HabitLog.add({ habit_id: h.id, date: today, completed: 0, xp_earned: 0 });
        }
      }
    }

    // 4. Setup mobile bottom navigation listeners
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabId = e.currentTarget.getAttribute('data-tab');
        if (tabId) switchTab(tabId);
      });
    });

    // 5. Setup desktop sidebar navigation
    setupDesktopNavigation();

    // 6. Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts if typing in input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        if (e.key === 'Escape') {
          closeAllSheets();
        }
        return;
      }

      if (e.key === 'Escape') {
        closeAllSheets();
        if (screenStack && screenStack.length > 0) popScreen();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openAddHabitSheet();
      } else if (e.key === '1') {
        switchTab('home');
      } else if (e.key === '2') {
        switchTab('stats');
      } else if (e.key === '3') {
        switchTab('city');
      } else if (e.key === '4') {
        switchTab('calendar');
      }
    });

    // 7. Initial render
    switchTab('home');
    renderDesktopRightPanel();

    // 8. Reschedule notifications if permission was granted
    if (typeof rescheduleAllNotifications === 'function') {
      rescheduleAllNotifications();
    }

    // 9. PWA Install Prompt Listener
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (window.renderHome) window.renderHome();
    });

    window.addEventListener('appinstalled', () => {
      localStorage.setItem('pt_installed', '1');
      if (window.renderHome) window.renderHome();
    });

    // 10. Service Worker Registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then(reg => {
        console.log('SW Registered with scope:', reg.scope);
      }).catch(err => {
        console.warn('SW registration skipped or failed:', err);
      });
    }
  } catch (err) {
    console.error("Initialization error:", err);
    document.body.innerHTML = `
      <div style="background:#0C0C0E; color:#FAFAFA; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px; text-align:center; font-family:Inter, sans-serif;">
        <div style="font-size:48px; margin-bottom:16px;">⚡</div>
        <div style="font-size:22px; font-weight:800; margin-bottom:10px;">Unable to initialize HabitForge</div>
        <div style="font-size:14px; color:#A1A1AA; max-width:400px; margin-bottom:24px; line-height:1.5;">
          ${escapeHtml(err.message || 'IndexedDB storage could not be accessed. Please reload or check your browser storage permissions.')}
        </div>
        <button onclick="location.reload()" style="background:#D9822B; color:#FFF; border:none; padding:12px 28px; border-radius:8px; font-weight:700; cursor:pointer;">Reload Application</button>
      </div>
    `;
  }
});

// Setup Desktop Sidebar Navigation Links
function setupDesktopNavigation() {
  const sidebarNav = document.querySelector('.sidebar-nav');
  if (!sidebarNav) return;

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>' },
    { id: 'stats', label: 'Statistics', icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>' },
    { id: 'city', label: 'Habit Skyline', icon: '<rect x="3" y="8" width="7" height="13"/><rect x="14" y="3" width="7" height="18"/><path d="M10 21V12h4v9"/>' },
    { id: 'calendar', label: 'Calendar', icon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
    { id: 'weekly-review', label: 'Weekly Review', isPush: true, icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>' },
    { id: 'notes', label: 'Journal & Notes', isPush: true, icon: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>' },
    { id: 'analytics', label: 'Deep Analytics', isPush: true, icon: '<circle cx="12" cy="12" r="10"/><path d="M16 12l-4-4-4 4M12 16V8"/>' },
    { id: 'settings', label: 'Settings', isPush: true, icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>' }
  ];

  sidebarNav.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:24px;">
      ${navItems.map(item => `
        <button type="button" class="sidebar-link ${item.id === 'home' ? 'active' : ''}" id="sidebar-nav-${item.id}"
          onclick="${item.isPush ? `pushScreen('${item.id}')` : `switchTab('${item.id}')`}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${item.icon}
          </svg>
          <span>${item.label}</span>
        </button>
      `).join('')}
    </div>

    <!-- Quick Action Button in Sidebar -->
    <button onclick="openAddHabitSheet()" style="width:100%; height:44px; background:var(--primary); color:#FFF; border-radius:var(--radius-md); font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:24px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Add New Habit
    </button>

    <!-- User Level Sidebar Card -->
    <div id="sidebar-user-card" style="margin-top:auto; background:var(--card-alt); border:1px solid var(--border); border-radius:14px; padding:14px;"></div>
  `;

  updateSidebarUserCard();
}

async function updateSidebarUserCard() {
  const card = document.getElementById('sidebar-user-card');
  if (!card) return;
  const stats = await getUserStats();
  if (!stats) return;
  const levelInfo = calculateLevel(stats.total_xp);
  const nextXP = levelInfo.next || 1000;
  const currMin = levelInfo.min || 0;
  const progressPct = Math.min(Math.round(((stats.total_xp - currMin) / (nextXP - currMin)) * 100), 100);

  card.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
      <span style="font-size:12px; font-weight:800; color:var(--text-primary);">Level ${stats.current_level} &bull; ${levelInfo.name}</span>
      <span style="font-size:11px; font-weight:700; color:var(--primary);">${stats.total_xp} XP</span>
    </div>
    <div style="height:6px; background:var(--bg); border-radius:3px; overflow:hidden; margin-bottom:8px;">
      <div style="height:100%; width:${progressPct}%; background:var(--primary); border-radius:3px;"></div>
    </div>
    <div style="font-size:10px; color:var(--text-secondary); text-align:right;">
      ${Math.max(0, nextXP - stats.total_xp)} XP to Level ${stats.current_level + 1}
    </div>
  `;
}

// Render Desktop Right Panel
window.renderDesktopRightPanel = async function() {
  const panel = document.getElementById('desktop-right-panel');
  if (!panel) return;

  const [stats, activeHabits, todayLogs, streaks] = await Promise.all([
    getUserStats(),
    getActiveHabits(),
    getLogsForDate(todayStr()),
    calculateAllStreaks()
  ]);

  const doneCount = activeHabits.filter(h => {
    const l = todayLogs.find(log => log.habit_id === h.id);
    return l && l.completed === 1;
  }).length;
  
  const dailyQuote = (typeof getDailyQuote === 'function') ? getDailyQuote() : "Discipline is choosing between what you want now and what you want most.";

  panel.innerHTML = `
    <div style="padding:20px; display:flex; flex-direction:column; gap:20px; height:100%; overflow-y:auto;">
      <!-- Daily Summary -->
      <div>
        <div style="font-size:14px; font-weight:800; color:var(--text-primary); margin-bottom:12px; text-transform:uppercase; letter-spacing:0.5px;">Today's Velocity</div>
        <div style="background:var(--card-alt); border:1px solid var(--border); border-radius:14px; padding:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-size:13px; font-weight:600; color:var(--text-secondary);">Habits Completed</span>
            <span style="font-size:15px; font-weight:800; color:var(--success);">${doneCount} / ${activeHabits.length}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-size:13px; font-weight:600; color:var(--text-secondary);">Current Streak</span>
            <span style="font-size:15px; font-weight:800; color:var(--text-primary);">${streaks.overallStreak} days</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:13px; font-weight:600; color:var(--text-secondary);">Skyline Growth</span>
            <span style="font-size:15px; font-weight:800; color:var(--primary);">${stats.city_days} buildings</span>
          </div>
        </div>
      </div>

      <!-- Motivation Widget -->
      <div>
        <div style="font-size:14px; font-weight:800; color:var(--text-primary); margin-bottom:12px; text-transform:uppercase; letter-spacing:0.5px;">Daily Thought</div>
        <div style="background:var(--card-alt); border:1px solid var(--border); border-radius:14px; padding:16px; font-size:13px; font-style:italic; color:var(--text-primary); line-height:1.5;">
          “${escapeHtml(dailyQuote)}”
        </div>
      </div>

      <!-- Quick Shortcuts Help -->
      <div style="margin-top:auto; background:var(--card-alt); border:1px solid var(--border); border-radius:14px; padding:14px;">
        <div style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px;">Shortcuts</div>
        <div style="display:grid; grid-template-columns:auto 1fr; gap:6px 12px; font-size:12px;">
          <kbd style="background:var(--bg); border:1px solid var(--border); border-radius:4px; padding:2px 6px; font-weight:700;">N</kbd>
          <span style="color:var(--text-secondary);">New habit</span>
          <kbd style="background:var(--bg); border:1px solid var(--border); border-radius:4px; padding:2px 6px; font-weight:700;">1-4</kbd>
          <span style="color:var(--text-secondary);">Switch views</span>
          <kbd style="background:var(--bg); border:1px solid var(--border); border-radius:4px; padding:2px 6px; font-weight:700;">Esc</kbd>
          <span style="color:var(--text-secondary);">Close sheets</span>
        </div>
      </div>
    </div>
  `;

  updateSidebarUserCard();
};
