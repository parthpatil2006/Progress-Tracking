// add-habit.js — Interactive modal/sheet for adding custom habits

let currentAddHabitState = {
  name: '',
  category: 'Core',
  difficulty: 1,
  accent_color: '#D9822B',
  reminder_time: null,
  note: ''
};

const HABIT_PALETTE = [
  '#D9822B', // Ochre Bronze (Primary)
  '#10B981', // Emerald
  '#64748B', // Slate
  '#EF4444', // Red
  '#0EA5E9', // Sky Blue
  '#8B6914', // Dark Gold
  '#6B7280', // Cool Gray
  '#D97706'  // Warm Amber
];

window.openAddHabitSheet = function() {
  const overlay = document.getElementById('sheet-overlay');
  const sheet = document.getElementById('add-habit-sheet');
  if (!sheet) return;

  // Reset state
  currentAddHabitState = {
    name: '',
    category: 'Core',
    difficulty: 1,
    accent_color: '#D9822B',
    reminder_time: null,
    note: ''
  };

  sheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-header">
      <div class="top-bar-title" style="font-size:16px; font-weight:700; letter-spacing:0.5px;">New Habit</div>
      <button class="sheet-close" onclick="closeBottomSheet('add-habit-sheet')" aria-label="Close">&times;</button>
    </div>
    
    <div style="flex:1; overflow-y:auto; padding:0 20px 90px;">
      <!-- Habit Name -->
      <div style="margin-bottom:18px;">
        <label for="habit-name" style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px; display:block;">
          Habit Name *
        </label>
        <input type="text" id="habit-name" placeholder="e.g., Read 20 pages, 30m Workout" 
          maxlength="60"
          style="width:100%; padding:14px; background:var(--card-alt); border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text-primary); font-size:15px; outline:none; transition:border-color 0.2s;"
          onfocus="this.style.borderColor='var(--primary)'"
          onblur="this.style.borderColor='var(--border)'"
        />
      </div>

      <!-- Category -->
      <div style="margin-bottom:18px;">
        <label style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px; display:block;">
          Category
        </label>
        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px;">
          ${['Core', 'Wellness', 'Learning', 'Productivity'].map(c => `
            <button type="button" class="cat-chip-btn" id="add-cat-${c}" onclick="setAddHabitCat('${c}')"
              style="padding:11px; border-radius:10px; border:1px solid var(--border); background:var(--card-alt); color:var(--text-primary); font-size:13px; font-weight:600; text-align:center; transition:all 0.18s ease;">
              ${c}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Difficulty & XP -->
      <div style="margin-bottom:18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <label style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Difficulty &amp; Reward</label>
          <span id="diff-xp-indicator" style="font-size:12px; font-weight:700; color:var(--primary);">+10 XP / day</span>
        </div>
        <div style="display:flex; gap:8px;">
          ${[
            { diff: 1, label: 'Easy', xp: 10 },
            { diff: 2, label: 'Medium', xp: 20 },
            { diff: 3, label: 'Hard', xp: 30 }
          ].map(d => `
            <button type="button" class="diff-btn" id="add-diff-${d.diff}" onclick="setAddHabitDiff(${d.diff})"
              style="flex:1; padding:10px; border-radius:10px; border:1px solid var(--border); background:var(--card-alt); font-size:12px; font-weight:600; text-align:center; transition:all 0.18s ease;">
              ${d.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Accent Color Picker -->
      <div style="margin-bottom:18px;">
        <label style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px; display:block;">
          Accent Color
        </label>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          ${HABIT_PALETTE.map(color => `
            <button type="button" class="color-picker-dot" onclick="setAddHabitColor('${color}')"
              style="width:32px; height:32px; border-radius:50%; background:${color}; border:2px solid transparent; cursor:pointer; transition:transform 0.15s, border-color 0.15s;"
              id="color-dot-${color.replace('#','')}"
            ></button>
          `).join('')}
        </div>
      </div>

      <!-- Reminder Time -->
      <div style="margin-bottom:18px;">
        <label for="habit-time" style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px; display:block;">
          Daily Reminder (Optional)
        </label>
        <input type="time" id="habit-time" 
          style="width:100%; padding:12px; background:var(--card-alt); border:1px solid var(--border); border-radius:10px; color:var(--text-primary); font-size:14px; outline:none;"
        />
      </div>

      <!-- Motivational Note -->
      <div style="margin-bottom:12px;">
        <label for="habit-note-input" style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px; display:block;">
          Personal Intention / Note
        </label>
        <textarea id="habit-note-input" placeholder="Why is this habit important to you?" 
          rows="2"
          style="width:100%; padding:12px; background:var(--card-alt); border:1px solid var(--border); border-radius:10px; color:var(--text-primary); font-size:13px; outline:none; resize:none; font-family:inherit;"
        ></textarea>
      </div>
    </div>

    <!-- Sticky Action Footer -->
    <div style="position:absolute; bottom:0; left:0; right:0; padding:16px 20px; background:var(--card); border-top:1px solid var(--border); display:flex; gap:12px;">
      <button type="button" onclick="closeBottomSheet('add-habit-sheet')" 
        style="flex:1; height:48px; border-radius:var(--radius-md); border:1px solid var(--border); background:var(--card-alt); color:var(--text-secondary); font-weight:600; font-size:14px;">
        Cancel
      </button>
      <button type="button" onclick="saveNewHabit()" 
        style="flex:2; height:48px; border-radius:var(--radius-md); border:none; background:var(--primary); color:#FFFFFF; font-weight:700; font-size:14px;">
        Create Habit
      </button>
    </div>
  `;

  openSheet('add-habit-sheet');
  
  // Set defaults
  setAddHabitCat('Core');
  setAddHabitDiff(1);
  setAddHabitColor('#D9822B');

  // Focus input on open
  setTimeout(() => {
    const input = document.getElementById('habit-name');
    if (input) input.focus();
  }, 150);
};

window.setAddHabitCat = function(cat) {
  currentAddHabitState.category = cat;
  const defaultColors = {
    'Core': '#D9822B',
    'Wellness': '#10B981',
    'Learning': '#64748B',
    'Productivity': '#D97706'
  };
  
  ['Core', 'Wellness', 'Learning', 'Productivity'].forEach(c => {
    const el = document.getElementById(`add-cat-${c}`);
    if (!el) return;
    if (c === cat) {
      el.style.background = 'var(--primary)';
      el.style.color = '#FFFFFF';
      el.style.borderColor = 'var(--primary)';
    } else {
      el.style.background = 'var(--card-alt)';
      el.style.color = 'var(--text-primary)';
      el.style.borderColor = 'var(--border)';
    }
  });

  if (defaultColors[cat]) {
    setAddHabitColor(defaultColors[cat]);
  }
};

window.setAddHabitDiff = function(diff) {
  currentAddHabitState.difficulty = diff;
  const xpMap = { 1: 10, 2: 20, 3: 30 };
  const xpIndicator = document.getElementById('diff-xp-indicator');
  if (xpIndicator) {
    xpIndicator.innerText = `+${xpMap[diff]} XP / day`;
  }

  [1, 2, 3].forEach(d => {
    const el = document.getElementById(`add-diff-${d}`);
    if (!el) return;
    if (d === diff) {
      el.style.background = 'var(--primary)';
      el.style.color = '#FFFFFF';
      el.style.borderColor = 'var(--primary)';
    } else {
      el.style.background = 'var(--card-alt)';
      el.style.color = 'var(--text-primary)';
      el.style.borderColor = 'var(--border)';
    }
  });
};

window.setAddHabitColor = function(color) {
  currentAddHabitState.accent_color = color;
  HABIT_PALETTE.forEach(c => {
    const el = document.getElementById(`color-dot-${c.replace('#','')}`);
    if (!el) return;
    if (c.toLowerCase() === color.toLowerCase()) {
      el.style.borderColor = 'var(--text-primary)';
      el.style.transform = 'scale(1.15)';
    } else {
      el.style.borderColor = 'transparent';
      el.style.transform = 'scale(1)';
    }
  });
};

window.saveNewHabit = async function() {
  const nameInput = document.getElementById('habit-name');
  const timeInput = document.getElementById('habit-time');
  const noteInput = document.getElementById('habit-note-input');

  const name = nameInput ? nameInput.value.trim() : '';
  if (!name) {
    showSnackbar('Please enter a habit name');
    if (nameInput) nameInput.focus();
    return;
  }

  const reminder = timeInput && timeInput.value ? timeInput.value : null;
  const note = noteInput ? noteInput.value.trim() : '';

  try {
    const habitId = await addHabit({
      name: name,
      category: currentAddHabitState.category,
      difficulty: currentAddHabitState.difficulty,
      accent_color: currentAddHabitState.accent_color,
      reminder_time: reminder,
      note: note
    });

    if (reminder && typeof scheduleHabitNotification === 'function') {
      scheduleHabitNotification(habitId, name, reminder);
    }

    closeBottomSheet('add-habit-sheet');
    showSnackbar(`"${name}" created!`);
    playHapticSound('check');

    if (window.renderHome) await window.renderHome();
    if (window.renderDesktopRightPanel) window.renderDesktopRightPanel();
  } catch (err) {
    console.error('Failed to create habit:', err);
    showSnackbar('Error creating habit. Please try again.');
  }
};
