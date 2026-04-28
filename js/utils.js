// Utility functions

const LEVELS = [
  { level: 7, title: 'Unstoppable', xp: 5000 },
  { level: 6, title: 'Legend', xp: 2000 },
  { level: 5, title: 'Master', xp: 1000 },
  { level: 4, title: 'Consistent', xp: 600 },
  { level: 3, title: 'Achiever', xp: 300 },
  { level: 2, title: 'Builder', xp: 100 },
  { level: 1, title: 'Beginner', xp: 0 }
];

const CATEGORIES = {
  'Core': 'var(--cat-core)',
  'Wellness': 'var(--cat-wellness)',
  'Learning': 'var(--cat-learning)',
  'Productivity': 'var(--cat-prod)',
  'Custom': 'var(--text-sub)'
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function calculateLevel(totalXP) {
  for (let l of LEVELS) {
    if (totalXP >= l.xp) return l;
  }
  return LEVELS[LEVELS.length - 1];
}

async function calculateStreak(habitId) {
  let streak = 0;
  let cursor = new Date();
  cursor.setDate(cursor.getDate() - 1); // Start from yesterday
  
  while (true) {
    const dStr = cursor.toISOString().split('T')[0];
    const log = await getLog(habitId, dStr);
    if (log && log.completed === 1) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// Check 100% completion
async function checkAllComplete() {
  const today = todayStr();
  const activeHabits = await getActiveHabits();
  if (activeHabits.length === 0) return false;
  
  let doneCount = 0;
  for (let h of activeHabits) {
    const log = await getLog(h.id, today);
    if (log && log.completed === 1) doneCount++;
  }
  
  if (doneCount === activeHabits.length) {
    const stats = await getUserStats();
    if (stats.city_days_logged_today === 0) {
      triggerCelebration();
    }
  }
}

function showSnackbar(msg, duration=2000) {
  const sb = document.getElementById('snackbar');
  sb.textContent = msg;
  sb.classList.remove('hidden');
  setTimeout(() => sb.classList.add('show'), 10);
  setTimeout(() => {
    sb.classList.remove('show');
    setTimeout(() => sb.classList.add('hidden'), 250);
  }, duration);
}

function renderSkeleton(type) {
  if (type === 'card') {
    return `<div class="card skeleton" style="height:70px;margin-bottom:12px"></div>`;
  }
  if (type === 'chart') {
    return `<div class="card skeleton" style="height:140px;margin-bottom:16px"></div>`;
  }
  return `<div class="skeleton" style="height:20px;width:120px;margin-bottom:8px"></div>`;
}
