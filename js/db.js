// Database wrapper using Dexie.js
// Identical schema logic to SQLite specs

const db = new Dexie('ProgressTrackerDB');

db.version(2).stores({
  Habit: '++id, name, category, difficulty, reminder_time, note, created_at, is_active',
  HabitLog: '++id, habit_id, date, completed, xp_earned, [habit_id+date]',
  MoodLog: '++id, date, mood_level, note', // date is UNIQUE logically
  UserStats: 'id, total_xp, current_level, city_days, city_days_logged_today, last_active_date, theme',
  HabitNote: '++id, habit_id, date, content, created_at, [habit_id+date]'
});

// Initialization
async function initDB() {
  await db.open();
  
  // Ensure UserStats exists (always id 1)
  const stats = await db.UserStats.get(1);
  if (!stats) {
    await db.UserStats.put({
      id: 1,
      total_xp: 0,
      current_level: 1,
      city_days: 0,
      city_days_logged_today: 0,
      last_active_date: '',
      theme: 'dark'
    });
  }
}

// UserStats
async function getUserStats() {
  return await db.UserStats.get(1);
}

async function updateUserStats(updates) {
  await db.UserStats.update(1, updates);
}

// Habits
async function getActiveHabits() {
  return await db.Habit.where('is_active').equals(1).toArray();
}

async function getAllHabits() {
  return await db.Habit.toArray();
}

async function addHabit(habit) {
  return await db.Habit.add({
    ...habit,
    is_active: 1,
    created_at: new Date().toISOString().split('T')[0]
  });
}

async function archiveHabit(id) {
  await db.Habit.update(id, { is_active: 0 });
}

// Habit Logs
async function getLog(habit_id, date) {
  return await db.HabitLog.where('[habit_id+date]').equals([habit_id, date]).first();
}

async function getLogsForDate(date) {
  return await db.HabitLog.where('date').equals(date).toArray();
}

async function getLogsForHabit(habit_id) {
  return await db.HabitLog.where('habit_id').equals(habit_id).toArray();
}

async function upsertLog(habit_id, date, completed, xp_earned) {
  const existing = await getLog(habit_id, date);
  if (existing) {
    await db.HabitLog.update(existing.id, { completed, xp_earned });
  } else {
    await db.HabitLog.add({ habit_id, date, completed, xp_earned });
  }
}

// Mood Log
async function getMoodForDate(date) {
  return await db.MoodLog.where('date').equals(date).first();
}

async function getRecentMoods(limit = 7) {
  return await db.MoodLog.orderBy('date').reverse().limit(limit).toArray();
}

async function upsertMood(date, mood_level, note = '') {
  const existing = await getMoodForDate(date);
  if (existing) {
    await db.MoodLog.update(existing.id, { mood_level, note });
  } else {
    await db.MoodLog.add({ date, mood_level, note });
  }
}

// Notes
async function getNote(habit_id, date) {
  return await db.HabitNote.where('[habit_id+date]').equals([habit_id, date]).first();
}

async function getAllNotes() {
  return await db.HabitNote.orderBy('date').reverse().toArray();
}

async function upsertNote(habit_id, date, content) {
  const existing = await getNote(habit_id, date);
  if (existing) {
    await db.HabitNote.update(existing.id, { content });
  } else {
    await db.HabitNote.add({ 
      habit_id, date, content, 
      created_at: new Date().toISOString() 
    });
  }
}

// Reset Everything
async function resetAllData() {
  await db.transaction('rw', db.Habit, db.HabitLog, db.MoodLog, db.UserStats, db.HabitNote, async () => {
    await db.Habit.clear();
    await db.HabitLog.clear();
    await db.MoodLog.clear();
    await db.HabitNote.clear();
    await db.UserStats.put({
      id: 1,
      total_xp: 0,
      current_level: 1,
      city_days: 0,
      city_days_logged_today: 0,
      last_active_date: '',
      theme: 'dark'
    });
  });
}
