// Main App Controller

const App = {
  currentTab: 'home',

  async init() {
    await initDB();
    const today = todayStr();
    
    // N1: App open sequence
    let stats = await getUserStats();
    
    // Apply Theme
    if (stats.theme === 'light') document.body.classList.add('light-mode');
    else document.body.classList.remove('light-mode');
    
    // 3. Detect new day
    if (stats.last_active_date && stats.last_active_date !== today) {
      await updateUserStats({ city_days_logged_today: 0, last_active_date: today });
    } else if (!stats.last_active_date) {
      await updateUserStats({ last_active_date: today });
    }
    
    // 5-6. Ensure today's logs exist
    const habits = await getActiveHabits();
    for (const h of habits) {
      const log = await getLog(h.id, today);
      if (!log) await upsertLog(h.id, today, 0, 0);
    }
    
    // 7. Check if MoodLog exists for today -> if not, show MoodCheckInSheet
    const moodLog = await getMoodForDate(today);
    if (!moodLog) {
      showMoodCheckin();
    }
    
    // Render initial
    await renderHome();
    this.bindNav();
    this.bindFAB();
    this.bindMoreMenu();
    this.bindInstallPrompt();
    
    // Reschedule SW notifications if supported
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'RESCHEDULE_NOTIFICATIONS' });
    }
  },

  bindNav() {
    const bottomNav = document.getElementById('bottom-nav');
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (sidebarNav && bottomNav) {
      sidebarNav.innerHTML = bottomNav.innerHTML;
      // Convert button classes to desktop styles
      sidebarNav.querySelectorAll('.nav-tab').forEach(t => {
        t.style.flexDirection = 'row';
        t.style.padding = '12px 16px';
        t.style.justifyContent = 'flex-start';
        t.style.gap = '12px';
        t.querySelector('.nav-label').style.fontSize = '14px';
        t.querySelector('.nav-indicator').style.display = 'none';
      });
    }

    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const t = tab.dataset.tab;
        this.switchTab(t);
      });
    });
  },

  async switchTab(tab) {
    if (this.currentTab === tab && !document.querySelector('.push-screen.active')) return;
    
    // Close any push screens
    document.querySelectorAll('.push-screen.active').forEach(s => s.classList.remove('active'));

    // Hide current tab
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.screen:not(.push-screen)').forEach(s => s.classList.remove('active'));

    document.getElementById(`nav-${tab}`).classList.add('active');
    const screen = document.getElementById(`screen-${tab}`);
    screen.classList.add('active');

    this.currentTab = tab;

    // Show/hide FAB (only on home)
    document.getElementById('fab').style.display = tab === 'home' ? 'flex' : 'none';

    // SKELETON LOADING PHASE (Only for heavy screens)
    if (['home', 'stats', 'city'].includes(tab)) {
      screen.innerHTML = `
        <div class="top-bar"><div class="top-bar-title skeleton" style="width:120px;height:24px"></div></div>
        <div style="padding:16px">
          <div class="card skeleton" style="height:100px;margin-bottom:12px"></div>
          <div class="card skeleton" style="height:70px;margin-bottom:12px"></div>
          <div class="card skeleton" style="height:70px;margin-bottom:12px"></div>
        </div>
      `;
    }

    try {
      if (tab === 'home') await renderHome();
      else if (tab === 'stats') await renderStats();
      else if (tab === 'city') await renderCity();
      else if (tab === 'calendar') await renderCalendar();
    } catch (e) {
      console.error(`Error rendering ${tab}:`, e);
      screen.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-sub)">Error loading ${tab}. Please refresh.</div>`;
    }
  },
  
  bindMoreMenu() {
    document.querySelectorAll('.more-menu-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const target = btn.dataset.target;
        if (!target) return;
        
        const el = document.getElementById(target) || document.getElementById(`screen-${target}`);
        if (!el) return;
        
        if (el.classList.contains('bottom-sheet')) {
          const overlay = document.getElementById('sheet-overlay');
          el.classList.remove('hidden');
          overlay.classList.remove('hidden');
          setTimeout(() => {
            el.classList.add('open');
            overlay.classList.add('visible');
          }, 10);
        } else {
          el.classList.add('active');
          if (target === 'weekly-review') await renderWeeklyReview();
          if (target === 'notes') await renderNotes();
          if (target === 'settings') await renderSettings();
        }
      });
    });
  },
  
  closePushScreen(id) {
    document.getElementById(id).classList.remove('active');
  },

  bindFAB() {
    document.getElementById('fab').addEventListener('click', () => openAddHabitSheet());
  },

  bindInstallPrompt() {
    const visits = parseInt(localStorage.getItem('pt_visits') || '0') + 1;
    localStorage.setItem('pt_visits', visits);

    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      window.deferredPrompt = e;
      if (visits >= 1) {
        document.getElementById('install-banner').classList.remove('hidden');
      }
    });

    document.getElementById('install-btn').addEventListener('click', () => this.triggerInstall());

    document.getElementById('install-dismiss').addEventListener('click', () => {
      document.getElementById('install-banner').classList.add('hidden');
    });
  },

  async triggerInstall() {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        window.deferredPrompt = null;
        document.getElementById('install-banner').classList.add('hidden');
      }
    } else {
      // Fallback: take them to the install page with instructions
      window.location.href = 'install.html';
    }
  }
};

// Mood Check-in Sheet
function showMoodCheckin() {
  const overlay = document.getElementById('mood-checkin-overlay');
  const card = document.getElementById('mood-checkin-card');
  
  card.innerHTML = `
    <div class="dialog-title" style="text-align:center">How are you feeling today?</div>
    <div class="mood-buttons">
      <button class="mood-btn" onclick="saveMood(1)">
        <div class="mood-dot" style="background:var(--mood-1)"></div>
        <span class="mood-lbl">Terrible</span>
      </button>
      <button class="mood-btn" onclick="saveMood(2)">
        <div class="mood-dot" style="background:var(--mood-2)"></div>
        <span class="mood-lbl">Bad</span>
      </button>
      <button class="mood-btn" onclick="saveMood(3)">
        <div class="mood-dot" style="background:var(--mood-3)"></div>
        <span class="mood-lbl">Neutral</span>
      </button>
      <button class="mood-btn" onclick="saveMood(4)">
        <div class="mood-dot" style="background:var(--mood-4)"></div>
        <span class="mood-lbl">Good</span>
      </button>
      <button class="mood-btn" onclick="saveMood(5)">
        <div class="mood-dot" style="background:var(--mood-5)"></div>
        <span class="mood-lbl">Excellent</span>
      </button>
    </div>
  `;
  
  overlay.classList.remove('hidden');
}

async function saveMood(level) {
  await upsertMood(todayStr(), level, '');
  document.getElementById('mood-checkin-overlay').classList.add('hidden');
  await renderHome(); // Refresh if needed
}

// Global functions for bottom sheets
function closeBottomSheet(id) {
  const sheet = document.getElementById(id);
  const overlay = document.getElementById('sheet-overlay');
  sheet.classList.remove('open');
  overlay.classList.remove('visible');
  setTimeout(() => {
    sheet.classList.add('hidden');
    overlay.classList.add('hidden');
  }, 260);
}

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.error(err));
  });
}

// Start app
window.addEventListener('DOMContentLoaded', () => App.init());
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden) {
    const stats = await getUserStats();
    const today = todayStr();
    if (stats && stats.last_active_date && stats.last_active_date !== today) {
      await App.init();
    }
  }
});
