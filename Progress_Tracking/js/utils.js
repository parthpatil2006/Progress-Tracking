// utils.js — Core helper utilities, navigation, sound, and optimized data analytics

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatFullDate(date) {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatTime(date) {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${y}`;
}

function dayOfYear(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

function showSnackbar(msg, duration = 2200) {
  const s = document.getElementById('snackbar');
  if (!s) return;
  s.innerText = msg;
  s.classList.remove('hidden');
  s.classList.add('show');
  setTimeout(() => {
    s.classList.remove('show');
    setTimeout(() => s.classList.add('hidden'), 250);
  }, duration);
}

// Calculate level from XP
function calculateLevel(xp) {
  const thresholds = [
    { level: 1, name: 'Beginner', min: 0, next: 100 },
    { level: 2, name: 'Builder', min: 100, next: 300 },
    { level: 3, name: 'Achiever', min: 300, next: 600 },
    { level: 4, name: 'Consistent', min: 600, next: 1000 },
    { level: 5, name: 'Master', min: 1000, next: 2000 },
    { level: 6, name: 'Legend', min: 2000, next: 5000 },
    { level: 7, name: 'Unstoppable', min: 5000, next: 10000 }
  ];
  let curr = thresholds[0];
  for (const t of thresholds) {
    if (xp >= t.min) curr = t;
    else break;
  }
  return curr;
}

// Fast In-Memory Streak Engine (Eliminates 365+ queries down to a single pass)
async function calculateAllStreaks() {
  const [activeHabits, allLogs] = await Promise.all([
    getActiveHabits(),
    db.HabitLog.toArray()
  ]);

  // Index logs by `habit_id_date`
  const logMap = new Map();
  allLogs.forEach(l => {
    if (l.completed === 1) {
      logMap.set(`${l.habit_id}_${l.date}`, l);
    }
  });

  const today = todayStr();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  // Calculate per-habit streaks
  const habitStreaks = {};
  const habitBestStreaks = {};

  activeHabits.forEach(h => {
    let current = 0;
    let cursor = new Date();
    
    // Check from today or yesterday
    const todayDone = logMap.has(`${h.id}_${today}`);
    const yesterdayDone = logMap.has(`${h.id}_${yesterday}`);

    if (todayDone || yesterdayDone) {
      if (!todayDone) {
        cursor.setDate(cursor.getDate() - 1);
      }
      for (let i = 0; i < 365; i++) {
        const dStr = cursor.toISOString().split('T')[0];
        if (logMap.has(`${h.id}_${dStr}`)) {
          current++;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }
    }
    habitStreaks[h.id] = current;
  });

  // Calculate Overall Streak (all active habits completed in a day)
  let overallStreak = 0;
  let overallBest = 0;

  if (activeHabits.length > 0) {
    let cursor = new Date();
    const isDayAllDone = (dStr) => {
      return activeHabits.every(h => logMap.has(`${h.id}_${dStr}`));
    };

    const todayAllDone = isDayAllDone(today);
    const yesterdayAllDone = isDayAllDone(yesterday);

    if (todayAllDone || yesterdayAllDone) {
      if (!todayAllDone) {
        cursor.setDate(cursor.getDate() - 1);
      }
      for (let i = 0; i < 365; i++) {
        const dStr = cursor.toISOString().split('T')[0];
        if (isDayAllDone(dStr)) {
          overallStreak++;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Historical best streak calculation
    let tempStreak = 0;
    const historicalCursor = new Date();
    historicalCursor.setDate(historicalCursor.getDate() - 365);
    for (let i = 0; i < 365; i++) {
      const dStr = historicalCursor.toISOString().split('T')[0];
      if (isDayAllDone(dStr)) {
        tempStreak++;
        if (tempStreak > overallBest) overallBest = tempStreak;
      } else {
        tempStreak = 0;
      }
      historicalCursor.setDate(historicalCursor.getDate() + 1);
    }
    if (overallStreak > overallBest) overallBest = overallStreak;
  }

  return {
    habitStreaks,
    overallStreak,
    overallBest
  };
}

async function calculateStreak(habitId = null) {
  const streaks = await calculateAllStreaks();
  if (habitId) {
    return streaks.habitStreaks[habitId] || 0;
  }
  return streaks.overallStreak;
}

// App routing & navigation logic
let currentTab = 'home';
let screenStack = [];

function switchTab(tabId) {
  currentTab = tabId;
  screenStack = []; // clear push stack
  
  // Update mobile bottom nav
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#bottom-nav .nav-indicator').forEach(ind => ind.style.background = 'transparent');
  const btn = document.getElementById('nav-' + tabId);
  if (btn) {
    btn.classList.add('active');
    const indicator = btn.querySelector('.nav-indicator');
    if (indicator) indicator.style.background = 'var(--primary)';
  }

  // Update desktop sidebar nav
  document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active'));
  const desktopBtn = document.getElementById('sidebar-nav-' + tabId);
  if (desktopBtn) {
    desktopBtn.classList.add('active');
  }
  
  // Screen transition
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const targetScreen = document.getElementById('screen-' + tabId);
  if (targetScreen) {
    targetScreen.classList.add('active');
  }
  
  // Render active screen
  if (tabId === 'home') window.renderHome?.();
  if (tabId === 'stats') window.renderStats?.();
  if (tabId === 'city') window.renderCity?.();
  if (tabId === 'calendar') window.renderCalendar?.();

  // Also update desktop right panel
  window.renderDesktopRightPanel?.();
  
  window.scrollTo(0, 0);
}

function pushScreen(screenId, contextData = null) {
  const screen = document.getElementById('screen-' + screenId);
  if (!screen) {
    console.warn("Screen not found:", screenId);
    return;
  }
  screen.classList.remove('hidden');
  screen.classList.add('active');
  screenStack.push({ id: screenId, data: contextData });
  
  const bottomNav = document.getElementById('bottom-nav');
  if (bottomNav) bottomNav.style.display = 'none';
  const fab = document.getElementById('fab');
  if (fab) fab.style.display = 'none';
  
  if (screenId === 'settings') window.renderSettings?.();
  if (screenId === 'weekly-review') window.renderWeeklyReview?.();
  if (screenId === 'habit-detail') window.renderHabitDetail?.(contextData);
  if (screenId === 'notes') window.renderNotes?.();
  if (screenId === 'analytics') window.renderAnalytics?.();
}

function popScreen() {
  const popped = screenStack.pop();
  if (popped) {
    const el = document.getElementById('screen-' + popped.id);
    if (el) el.classList.remove('active');
  }
  if (screenStack.length === 0) {
    const bottomNav = document.getElementById('bottom-nav');
    if (bottomNav) bottomNav.style.display = 'flex';
    const fab = document.getElementById('fab');
    if (fab) fab.style.display = 'flex';
    switchTab(currentTab);
  }
}

// Sheet controls
function openSheet(sheetId) {
  const overlay = document.getElementById('sheet-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    void overlay.offsetWidth;
    overlay.classList.add('visible');
  }
  
  const sheet = document.getElementById(sheetId);
  if (sheet) {
    sheet.classList.remove('hidden');
    setTimeout(() => sheet.classList.add('open'), 10);
  }
}

function closeBottomSheet(sheetId) {
  const sheet = document.getElementById(sheetId);
  if (sheet) {
    sheet.classList.remove('open');
    setTimeout(() => sheet.classList.add('hidden'), 260);
  }
  const openSheets = document.querySelectorAll('.bottom-sheet.open');
  if (openSheets.length <= 1) {
    const overlay = document.getElementById('sheet-overlay');
    if (overlay) {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.classList.add('hidden'), 260);
    }
  }
}

function closeAllSheets() {
  const overlay = document.getElementById('sheet-overlay');
  if (overlay) overlay.classList.remove('visible');
  document.querySelectorAll('.bottom-sheet.open').forEach(s => {
    s.classList.remove('open');
    setTimeout(() => s.classList.add('hidden'), 260);
  });
  setTimeout(() => {
    if (overlay) overlay.classList.add('hidden');
  }, 260);
}

// Audio Synthesizer (Zero External Dependencies)
let _audioCtx = null;
function playHapticSound(type = 'check') {
  if (localStorage.getItem('pt_sound') === 'false') return;
  try {
    if (!_audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) _audioCtx = new AudioCtx();
    }
    if (_audioCtx && _audioCtx.state === 'suspended') {
      _audioCtx.resume();
    }
    if (!_audioCtx) return;
    
    const now = _audioCtx.currentTime;
    
    if (type === 'check') {
      const osc = _audioCtx.createOscillator();
      const gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === 'uncheck') {
      const osc = _audioCtx.createOscillator();
      const gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'celebrate') {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const noteOsc = _audioCtx.createOscillator();
        const noteGain = _audioCtx.createGain();
        noteOsc.connect(noteGain);
        noteGain.connect(_audioCtx.destination);
        noteOsc.type = 'triangle';
        const startTime = now + idx * 0.09;
        noteOsc.frequency.setValueAtTime(freq, startTime);
        noteGain.gain.setValueAtTime(0.15, startTime);
        noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        noteOsc.start(startTime);
        noteOsc.stop(startTime + 0.3);
      });
    }
  } catch (e) {
    // Ignore audio permission restrictions
  }
}
