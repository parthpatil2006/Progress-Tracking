const db = new Dexie("ProgressTrackerV4");

db.version(1).stores({
  Habit: "++id, name, category, difficulty, accent_color, reminder_time, note, created_at, is_active",
  HabitLog: "++id, habit_id, date, [habit_id+date]",
  MoodLog: "++id, &date, mood_level, note",
  HabitNote: "++id, habit_id, date, [habit_id+date]",
  UserStats: "id"
});

const DEFAULT_HABITS = [
  { id: 1, name: 'English learning 1hr', category: 'Learning', difficulty: 2, accent_color: '#A78BFA' },
  { id: 2, name: 'DSA 2hr', category: 'Learning', difficulty: 3, accent_color: '#34C97D' },
  { id: 3, name: 'JAVA 4hr', category: 'Learning', difficulty: 3, accent_color: '#4F8EF7' },
  { id: 4, name: 'Networking 1hr', category: 'Learning', difficulty: 2, accent_color: '#F5A623' },
  { id: 5, name: 'OSI MODEL 1hr', category: 'Learning', difficulty: 2, accent_color: '#F75A5A' },
  { id: 6, name: 'IP Address 1hr', category: 'Learning', difficulty: 1, accent_color: '#38BDF8' },
  { id: 7, name: 'Reading books 1hr', category: 'Learning', difficulty: 2, accent_color: '#FB923C' },
  { id: 8, name: 'Project 1hr', category: 'Productivity', difficulty: 2, accent_color: '#E879F9' },
  { id: 9, name: '3 Time meals', category: 'Wellness', difficulty: 1, accent_color: '#4ADE80' },
  { id: 10, name: 'GYM', category: 'Core', difficulty: 3, accent_color: '#FACC15' },
  { id: 11, name: 'Skin care', category: 'Wellness', difficulty: 1, accent_color: '#60A5FA' },
  { id: 12, name: '8 hour sleep', category: 'Wellness', difficulty: 1, accent_color: '#F472B6' }
];

async function initDB() {
  const habitsCount = await db.Habit.count();
  if (habitsCount === 0) {
    const today = new Date().toISOString().split('T')[0];
    for (const h of DEFAULT_HABITS) {
      await db.Habit.add({
        id: h.id,
        name: h.name,
        category: h.category,
        difficulty: h.difficulty,
        accent_color: h.accent_color,
        reminder_time: null,
        note: '',
        created_at: today,
        is_active: 1
      });
    }
  }

  const statsCount = await db.UserStats.count();
  if (statsCount === 0) {
    await db.UserStats.add({
      id: 1,
      total_xp: 0,
      current_level: 1,
      city_days: 0,
      city_days_logged_today: 0,
      last_active_date: null,
      theme: 'dark'
    });
  }
}

// Data access helpers
async function getUserStats() {
  return await db.UserStats.get(1);
}

async function updateUserStats(updates) {
  return await db.UserStats.update(1, updates);
}

async function getActiveHabits() {
  return await db.Habit.where('is_active').equals(1).toArray();
}

async function upsertHabitLog(habit_id, date, completed, xp_earned) {
  const existing = await db.HabitLog.where({ habit_id, date }).first();
  if (existing) {
    await db.HabitLog.update(existing.id, { completed, xp_earned });
  } else {
    await db.HabitLog.add({ habit_id, date, completed, xp_earned });
  }
}

async function getLogsForDate(date) {
  return await db.HabitLog.where('date').equals(date).toArray();
}

async function getMoodForDate(date) {
  return await db.MoodLog.get({ date });
}

async function saveMood(date, mood_level, note = '') {
  const existing = await db.MoodLog.get({ date });
  if (existing) {
    await db.MoodLog.update(existing.id, { mood_level, note });
  } else {
    await db.MoodLog.add({ date, mood_level, note });
  }
}

async function getAllHabits() {
  return await db.Habit.toArray();
}

async function addHabit(habitData) {
  const today = (typeof todayStr === 'function') ? todayStr() : new Date().toISOString().split('T')[0];
  const catColors = {
    'Core': '#D9822B',
    'Wellness': '#10B981',
    'Learning': '#64748B',
    'Productivity': '#D97706'
  };
  const accent_color = habitData.accent_color || catColors[habitData.category] || '#D9822B';
  
  const id = await db.Habit.add({
    name: habitData.name.trim(),
    category: habitData.category || 'Core',
    difficulty: Number(habitData.difficulty) || 1,
    accent_color: accent_color,
    reminder_time: habitData.reminder_time || null,
    note: habitData.note ? habitData.note.trim() : '',
    created_at: today,
    is_active: 1
  });

  // Automatically insert initial log row for today
  await db.HabitLog.add({
    habit_id: id,
    date: today,
    completed: 0,
    xp_earned: 0
  });

  return id;
}

async function updateHabit(id, updates) {
  return await db.Habit.update(Number(id), updates);
}

async function deleteHabit(id, hardDelete = false) {
  const numId = Number(id);
  if (hardDelete) {
    await db.HabitLog.where('habit_id').equals(numId).delete();
    await db.HabitNote.where('habit_id').equals(numId).delete();
    return await db.Habit.delete(numId);
  } else {
    // Soft delete/archive
    return await db.Habit.update(numId, { is_active: 0 });
  }
}

async function resetAllData() {
  await db.transaction('rw', db.Habit, db.HabitLog, db.MoodLog, db.HabitNote, db.UserStats, async () => {
    await db.Habit.clear();
    await db.HabitLog.clear();
    await db.MoodLog.clear();
    await db.HabitNote.clear();
    await db.UserStats.clear();
  });
  
  // Re-seed defaults
  await initDB();
}

