/* Notifications helper */

async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  const result = await Notification.requestPermission();
  return result;
}

function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// Store scheduled timeouts in memory (cleared on page refresh, re-registered on open)
const _scheduledAlarms = {};

function scheduleHabitNotification(habitId, habitName, timeStr) {
  if (!timeStr) return;
  if (getNotificationPermission() !== 'granted') return;

  // Cancel existing
  cancelHabitNotification(habitId);

  const [hour, min] = timeStr.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hour, min, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  const delay = next - now;

  function fire() {
    if (getNotificationPermission() !== 'granted') return;
    new Notification('Progress Tracker', {
      body: `Time to complete: ${habitName}`,
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      tag: `habit-${habitId}`,
    });
    // Reschedule for next day
    _scheduledAlarms[habitId] = setTimeout(fire, 24 * 60 * 60 * 1000);
  }

  _scheduledAlarms[habitId] = setTimeout(fire, delay);
}

function cancelHabitNotification(habitId) {
  if (_scheduledAlarms[habitId]) {
    clearTimeout(_scheduledAlarms[habitId]);
    delete _scheduledAlarms[habitId];
  }
}

async function rescheduleAllNotifications() {
  const habits = await getActiveHabits();
  for (const h of habits) {
    if (h.reminder_time) {
      scheduleHabitNotification(h.id, h.name, h.reminder_time);
    }
  }
}
