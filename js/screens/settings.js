async function renderSettings() {
  const container = document.getElementById('screen-settings');
  
  // Fetch current notification permission if supported
  const perm = ('Notification' in window) ? Notification.permission : 'unsupported';
  let notifStatus = 'Disabled';
  let notifAction = `<button class="btn-sm" onclick="requestNotificationPermission()">Enable</button>`;
  if (perm === 'granted') {
    notifStatus = '<span class="text-success">Granted</span>';
    notifAction = '';
  } else if (perm === 'unsupported') {
    notifStatus = 'Not supported';
    notifAction = '';
  }

  // Local storage for settings
  const defaultReminder = localStorage.getItem('pt_default_reminder') || '09:00';
  const dailySummary = localStorage.getItem('pt_daily_summary') === 'true';
  const streakAlerts = localStorage.getItem('pt_streak_alerts') === 'true';

  let html = `
    <div class="top-bar">
      <div class="top-bar-title">Settings</div>
      <div class="sheet-close" style="position:relative;right:0;top:0" onclick="App.closePushScreen('screen-settings')">&times;</div>
    </div>
    <div style="padding:16px 0">
      
      <div class="form-label" style="padding:0 16px">Preferences</div>
      <div class="card row space-between">
        <div>
          <div style="font-size:15px">Light Mode</div>
          <div style="font-size:12px;color:var(--text-sub)">Toggle theme</div>
        </div>
        <div>
          <!-- Toggle -->
          <label class="toggle">
            <input type="checkbox" id="theme-toggle" ${document.body.classList.contains('light-mode') ? 'checked' : ''} onchange="toggleTheme(this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      <div class="card row space-between">
        <div>
          <div style="font-size:15px">Notifications</div>
          <div style="font-size:12px;color:var(--text-sub)">${notifStatus}</div>
        </div>
        <div>${notifAction}</div>
      </div>
      
      <div class="form-label" style="padding:0 16px;margin-top:24px">Notification Settings</div>
      <div class="card row space-between">
        <div>
          <div style="font-size:15px">Default Reminder Time</div>
        </div>
        <div>
          <input type="time" class="form-input" style="height:36px;width:110px" value="${defaultReminder}" onchange="localStorage.setItem('pt_default_reminder', this.value)">
        </div>
      </div>
      <div class="card row space-between">
        <div>
          <div style="font-size:15px">Daily Summary</div>
          <div style="font-size:12px;color:var(--text-sub)">9 PM summary</div>
        </div>
        <div>
          <label class="toggle">
            <input type="checkbox" ${dailySummary ? 'checked' : ''} onchange="toggleSetting('pt_daily_summary', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      <div class="card row space-between">
        <div>
          <div style="font-size:15px">Streak Alerts</div>
          <div style="font-size:12px;color:var(--text-sub)">8 PM warning</div>
        </div>
        <div>
          <label class="toggle">
            <input type="checkbox" ${streakAlerts ? 'checked' : ''} onchange="toggleSetting('pt_streak_alerts', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <div class="form-label" style="padding:0 16px;margin-top:24px">Data</div>
      <div class="card row space-between card-hover" style="cursor:pointer" onclick="exportData()">
        <div style="font-size:15px">Export My Data</div>
        <div style="color:var(--text-sub)">→</div>
      </div>
      <div class="card row space-between card-hover" style="cursor:pointer" onclick="document.getElementById('import-file').click()">
        <div style="font-size:15px">Import Data</div>
        <div style="color:var(--text-sub)">→</div>
        <input type="file" id="import-file" style="display:none" accept=".json" onchange="importData(event)">
      </div>
      <div class="card row space-between card-hover" style="cursor:pointer" onclick="showResetDialog()">
        <div style="font-size:15px;color:var(--danger)">Reset All Data</div>
      </div>
      
      <div style="text-align:center;padding:32px 16px;color:var(--text-sub)">
        <div style="font-size:14px;font-weight:600;margin-bottom:4px">Progress Tracker v3.0</div>
        <div style="font-size:12px">Fully offline. All data on your device.</div>
      </div>
    </div>
  `;
  
  // Setup toggle styles
  const style = document.createElement('style');
  style.innerHTML = `
    .btn-sm { padding:6px 12px; border-radius:6px; background:var(--primary); color:#fff; font-size:12px; font-weight:600; }
    .toggle { position:relative; width:48px; height:28px; display:inline-block; }
    .toggle input { opacity:0; width:0; height:0; }
    .toggle-slider { position:absolute; inset:0; background:var(--border); border-radius:14px; cursor:pointer; transition:background 0.2s; }
    .toggle-slider::after { content:''; position:absolute; left:3px; top:3px; width:22px; height:22px; background:#fff; border-radius:11px; transition:transform 0.2s; }
    .toggle input:checked + .toggle-slider { background:var(--primary); }
    .toggle input:checked + .toggle-slider::after { transform:translateX(20px); }
  `;
  container.appendChild(style);
  
  // Setup dialog
  document.getElementById('reset-dialog').innerHTML = `
    <div class="dialog-title" style="font-size:18px;font-weight:700;margin-bottom:12px">Delete Everything?</div>
    <div style="font-size:14px;color:var(--text-sub);line-height:1.5;margin-bottom:24px">
      All habits, logs, mood data, notes, and your city will be permanently deleted.
    </div>
    <div class="row gap-8">
      <button style="flex:1;height:44px;border-radius:10px;border:1px solid var(--border);color:var(--text)" onclick="document.getElementById('reset-dialog-overlay').classList.add('hidden')">Cancel</button>
      <button style="flex:1;height:44px;border-radius:10px;background:var(--danger);color:#fff;font-weight:600" onclick="performReset()">Delete Everything</button>
    </div>
  `;
  
  container.innerHTML = html + container.innerHTML; // Prepend html keeping style
}

function toggleSetting(key, val) {
  localStorage.setItem(key, val);
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'RESCHEDULE_NOTIFICATIONS' });
  }
}

async function toggleTheme(isLight) {
  if (isLight) {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
  const stats = await getUserStats();
  await updateUserStats({ theme: isLight ? 'light' : 'dark' });
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  const perm = await Notification.requestPermission();
  renderSettings();
  if (perm === 'granted' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'RESCHEDULE_NOTIFICATIONS' });
  }
}

async function exportData() {
  const data = {
    habits: await db.Habit.toArray(),
    logs: await db.HabitLog.toArray(),
    moods: await db.MoodLog.toArray(),
    notes: await db.HabitNote.toArray(),
    stats: await getUserStats()
  };
  
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `progress_tracker_backup_${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.habits && data.logs && data.stats) {
        await resetAllData();
        await db.transaction('rw', db.Habit, db.HabitLog, db.MoodLog, db.HabitNote, db.UserStats, async () => {
          if(data.habits.length) await db.Habit.bulkAdd(data.habits);
          if(data.logs.length) await db.HabitLog.bulkAdd(data.logs);
          if(data.moods && data.moods.length) await db.MoodLog.bulkAdd(data.moods);
          if(data.notes && data.notes.length) await db.HabitNote.bulkAdd(data.notes);
          await db.UserStats.put(data.stats);
        });
        showSnackbar('Data imported successfully!');
        window.location.reload();
      } else {
        showSnackbar('Invalid backup file');
      }
    } catch(err) {
      showSnackbar('Error parsing file');
    }
  };
  reader.readAsText(file);
}

function showResetDialog() {
  document.getElementById('reset-dialog-overlay').classList.remove('hidden');
}

async function performReset() {
  await resetAllData();
  document.getElementById('reset-dialog-overlay').classList.add('hidden');
  App.closePushScreen('screen-settings');
  App.closePushScreen('screen-more'); // actually more is not a push screen, but we need to reset to home
  await App.init();
  showSnackbar('All data deleted');
}
