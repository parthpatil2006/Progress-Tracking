// settings.js — App preferences, sound effects, reminders, and data backup/restore

window.renderSettings = async function() {
  const container = document.getElementById('screen-settings');
  if (!container) return;
  
  // Notification status
  const perm = ('Notification' in window) ? Notification.permission : 'unsupported';
  let notifStatus = 'Disabled';
  let notifAction = `<button class="btn-sm" onclick="requestNotificationPermission()" style="background:var(--primary); color:#FFF; border-radius:8px; padding:6px 12px; font-size:12px; font-weight:600;">Enable</button>`;
  if (perm === 'granted') {
    notifStatus = '<span style="color:var(--success); font-weight:600;">Granted</span>';
    notifAction = '';
  } else if (perm === 'unsupported') {
    notifStatus = 'Not supported';
    notifAction = '';
  }

  // Local settings
  const defaultReminder = localStorage.getItem('pt_default_reminder') || '09:00';
  const dailySummary = localStorage.getItem('pt_daily_summary') === 'true';
  const streakAlerts = localStorage.getItem('pt_streak_alerts') === 'true';
  const soundEnabled = localStorage.getItem('pt_sound') !== 'false';

  let html = `
    <div class="top-bar">
      <div style="display:flex; align-items:center; gap:12px;">
        <button onclick="popScreen()" style="padding:4px;" aria-label="Go Back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="top-bar-title" style="font-size:18px;">Settings &amp; Backup</div>
      </div>
    </div>

    <div style="padding:16px 0 60px;">
      <!-- Preferences -->
      <div class="form-label" style="padding:0 16px;">Preferences</div>
      
      <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:15px; font-weight:600; color:var(--text-primary);">Light Mode</div>
          <div style="font-size:12px; color:var(--text-secondary);">Toggle high-contrast daylight theme</div>
        </div>
        <div>
          <label class="toggle">
            <input type="checkbox" id="theme-toggle" ${document.body.classList.contains('light-mode') ? 'checked' : ''} onchange="toggleTheme(this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:15px; font-weight:600; color:var(--text-primary);">Sound Feedback</div>
          <div style="font-size:12px; color:var(--text-secondary);">Synthesized haptic audio on habit completion</div>
        </div>
        <div>
          <label class="toggle">
            <input type="checkbox" id="sound-toggle" ${soundEnabled ? 'checked' : ''} onchange="toggleSound(this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:15px; font-weight:600; color:var(--text-primary);">Push Notifications</div>
          <div style="font-size:12px; color:var(--text-secondary);">${notifStatus}</div>
        </div>
        <div>${notifAction}</div>
      </div>
      
      <!-- Notification Settings -->
      <div class="form-label" style="padding:0 16px; margin-top:24px;">Reminders</div>
      
      <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:15px; font-weight:600; color:var(--text-primary);">Default Reminder Time</div>
          <div style="font-size:12px; color:var(--text-secondary);">Morning prompt schedule</div>
        </div>
        <div>
          <input type="time" class="form-input" style="height:36px; width:110px;" value="${defaultReminder}" onchange="localStorage.setItem('pt_default_reminder', this.value)">
        </div>
      </div>

      <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:15px; font-weight:600; color:var(--text-primary);">Daily Evening Review</div>
          <div style="font-size:12px; color:var(--text-secondary);">9:00 PM summary check-in</div>
        </div>
        <div>
          <label class="toggle">
            <input type="checkbox" ${dailySummary ? 'checked' : ''} onchange="toggleSetting('pt_daily_summary', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:15px; font-weight:600; color:var(--text-primary);">Streak Danger Alert</div>
          <div style="font-size:12px; color:var(--text-secondary);">8:00 PM warning if habits are pending</div>
        </div>
        <div>
          <label class="toggle">
            <input type="checkbox" ${streakAlerts ? 'checked' : ''} onchange="toggleSetting('pt_streak_alerts', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <!-- Data Management -->
      <div class="form-label" style="padding:0 16px; margin-top:24px;">Data &amp; Portability</div>
      
      <div class="card card-hover" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="exportData()">
        <div>
          <div style="font-size:15px; font-weight:600; color:var(--text-primary);">Export Data Backup (JSON)</div>
          <div style="font-size:12px; color:var(--text-secondary);">Download complete offline backup file</div>
        </div>
        <div style="color:var(--text-secondary); font-size:18px;">&rarr;</div>
      </div>

      <div class="card card-hover" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="document.getElementById('import-file').click()">
        <div>
          <div style="font-size:15px; font-weight:600; color:var(--text-primary);">Import Data Backup</div>
          <div style="font-size:12px; color:var(--text-secondary);">Restore your habits and history</div>
        </div>
        <div style="color:var(--text-secondary); font-size:18px;">&rarr;</div>
        <input type="file" id="import-file" style="display:none" accept=".json" onchange="importData(event)">
      </div>

      <div class="card card-hover" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="showResetDialog()">
        <div>
          <div style="font-size:15px; font-weight:600; color:var(--danger);">Reset All Data</div>
          <div style="font-size:12px; color:var(--text-secondary);">Wipe all logs and return to default habits</div>
        </div>
        <div style="color:var(--danger); font-size:14px; font-weight:700;">Reset</div>
      </div>
      
      <!-- App Version & Offline Badge -->
      <div style="text-align:center; padding:32px 16px 16px; color:var(--text-secondary);">
        <div style="display:inline-flex; align-items:center; gap:6px; background:var(--success-subtle); color:var(--success); border:1px solid rgba(34,197,94,0.25); padding:4px 12px; border-radius:var(--radius-sm); font-size:11px; font-weight:700; margin-bottom:10px;">
          <span style="width:6px; height:6px; border-radius:50%; background:var(--success);"></span>
          100% Client-Side &amp; Offline Ready
        </div>
        <div style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:4px;">HabitForge v4.0</div>
        <div style="font-size:12px;">Engineered for Tech Zephyr 4.0 Hackathon</div>
      </div>
    </div>
  `;
  
  // Dialog setup
  const resetDialog = document.getElementById('reset-dialog');
  if (resetDialog) {
    resetDialog.innerHTML = `
      <div style="font-size:18px; font-weight:700; color:var(--text-primary); margin-bottom:12px;">Reset All Habits &amp; Progress?</div>
      <div style="font-size:14px; color:var(--text-secondary); line-height:1.5; margin-bottom:24px;">
        This will permanently clear your habit logs, notes, city progress, and custom habits. Default starter habits will be restored.
      </div>
      <div style="display:flex; gap:10px;">
        <button style="flex:1; height:44px; border-radius:var(--radius-md); border:1px solid var(--border); background:var(--card-alt); color:var(--text-primary); font-weight:600;" onclick="document.getElementById('reset-dialog-overlay').classList.add('hidden')">Cancel</button>
        <button style="flex:1; height:44px; border-radius:var(--radius-md); border:none; background:var(--danger); color:#FFF; font-weight:700;" onclick="performReset()">Reset Everything</button>
      </div>
    `;
  }
  
  container.innerHTML = html;
};

window.toggleSound = function(enabled) {
  localStorage.setItem('pt_sound', enabled ? 'true' : 'false');
  if (enabled) playHapticSound('check');
  showSnackbar(enabled ? 'Sound effects enabled' : 'Sound effects muted');
};

window.toggleSetting = function(key, val) {
  localStorage.setItem(key, val ? 'true' : 'false');
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'RESCHEDULE_NOTIFICATIONS' });
  }
};

window.toggleTheme = async function(isLight) {
  if (isLight) {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
  await updateUserStats({ theme: isLight ? 'light' : 'dark' });
};

window.requestNotificationPermission = async function() {
  if (!('Notification' in window)) {
    showSnackbar('Notifications are not supported in this browser.');
    return;
  }
  const perm = await Notification.requestPermission();
  window.renderSettings();
  if (perm === 'granted') {
    showSnackbar('Notifications granted!');
    if (typeof rescheduleAllNotifications === 'function') {
      rescheduleAllNotifications();
    }
  } else {
    showSnackbar('Notifications disabled or blocked.');
  }
};

window.exportData = async function() {
  try {
    const data = {
      habits: await db.Habit.toArray(),
      logs: await db.HabitLog.toArray(),
      moods: await db.MoodLog.toArray(),
      notes: await db.HabitNote.toArray(),
      stats: await getUserStats(),
      version: '4.0',
      exported_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habitforge_backup_${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSnackbar('Backup exported successfully!');
  } catch (err) {
    console.error('Export error:', err);
    showSnackbar('Failed to export backup file.');
  }
};

window.importData = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data && data.habits && data.logs && data.stats) {
        await resetAllData();
        await db.transaction('rw', db.Habit, db.HabitLog, db.MoodLog, db.HabitNote, db.UserStats, async () => {
          if (data.habits.length) await db.Habit.bulkAdd(data.habits);
          if (data.logs.length) await db.HabitLog.bulkAdd(data.logs);
          if (data.moods && data.moods.length) await db.MoodLog.bulkAdd(data.moods);
          if (data.notes && data.notes.length) await db.HabitNote.bulkAdd(data.notes);
          await db.UserStats.put(data.stats);
        });
        showSnackbar('Backup imported successfully!');
        setTimeout(() => window.location.reload(), 600);
      } else {
        showSnackbar('Invalid backup file format.');
      }
    } catch(err) {
      console.error('Import error:', err);
      showSnackbar('Error reading backup file.');
    }
  };
  reader.readAsText(file);
};

window.showResetDialog = function() {
  const overlay = document.getElementById('reset-dialog-overlay');
  if (overlay) overlay.classList.remove('hidden');
};

window.performReset = async function() {
  try {
    await resetAllData();
    const overlay = document.getElementById('reset-dialog-overlay');
    if (overlay) overlay.classList.add('hidden');
    popScreen();
    switchTab('home');
    showSnackbar('All data reset to initial defaults');
    playHapticSound('check');
  } catch (err) {
    console.error('Reset error:', err);
    showSnackbar('Failed to reset data.');
  }
};
