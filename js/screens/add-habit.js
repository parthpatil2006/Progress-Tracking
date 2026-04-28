let currentAddHabitState = {
  name: '',
  category: 'Core',
  difficulty: 1,
  reminder_time: null,
  note: ''
};

function openAddHabitSheet() {
  const overlay = document.getElementById('sheet-overlay');
  const sheet = document.getElementById('add-habit-sheet');
  
  // Reset state
  currentAddHabitState = { name: '', category: 'Core', difficulty: 1, reminder_time: null, note: '' };
  
  sheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-header">
      <div class="top-bar-title" style="font-size:15px;text-transform:uppercase;letter-spacing:1px">New Habit</div>
      <div class="sheet-close" onclick="closeBottomSheet('add-habit-sheet')" style="font-size:20px">&times;</div>
    </div>
    <div style="flex:1; overflow-y:auto; padding-bottom:80px">
      <!-- Name -->
      <div style="padding:16px">
        <label style="font-size:11px; font-weight:700; color:var(--text-sub); text-transform:uppercase; margin-bottom:8px; display:block">Habit Name</label>
        <input type="text" id="habit-name" placeholder="What will you track?" style="width:100%; padding:14px; background:var(--card-alt); border:1px solid var(--border); border-radius:12px; color:var(--text); font-size:16px; outline:none">
      </div>

      <!-- Category Chips -->
      <div style="padding:16px">
        <label style="font-size:11px; font-weight:700; color:var(--text-sub); text-transform:uppercase; margin-bottom:12px; display:block">Category</label>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
          ${['Core', 'Wellness', 'Learning', 'Productivity'].map(c => `
            <button class="cat-chip" data-cat="${c}" onclick="setAddHabitCat('${c}')" id="cat-chip-${c}" 
              style="padding:12px; border-radius:12px; border:1px solid var(--border); background:var(--card-alt); font-size:13px; font-weight:600; text-align:center; transition:all 0.2s">
              ${c}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Difficulty -->
      <div style="padding:16px">
        <label style="font-size:11px; font-weight:700; color:var(--text-sub); text-transform:uppercase; margin-bottom:12px; display:block">Difficulty</label>
        <div style="display:flex; gap:10px">
          ${[1, 2, 3].map(d => `
            <button onclick="updateAHDiff(${d})" id="ah-diff-${d}" 
              style="flex:1; padding:12px; border-radius:12px; border:1px solid var(--border); background:var(--card-alt); font-size:12px; font-weight:600; transition:all 0.2s">
              ${d===1?'Easy':d===2?'Med':'Hard'}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Note -->
      <div style="padding:16px">
        <label style="font-size:11px; font-weight:700; color:var(--text-sub); text-transform:uppercase; margin-bottom:8px; display:block">Note (optional)</label>
        <textarea id="habit-note" placeholder="Write a note..." style="width:100%; height:80px; padding:14px; background:var(--card-alt); border:1px solid var(--border); border-radius:12px; color:var(--text); font-size:14px; outline:none; resize:none"></textarea>
      </div>
    </div>
    <div style="position:absolute; bottom:0; left:0; right:0; padding:16px; background:var(--card); border-top:1px solid var(--border)">
      <button class="btn-primary" onclick="saveNewHabit()" style="margin:0; width:100%">Create Habit</button>
    </div>
  `;
  
  // Dynamic styles for chips
  const style = document.createElement('style');
  style.innerHTML = `
    .ah-chip { height:34px; padding:0 14px; border-radius:17px; font-size:12px; font-weight:600; border:1px solid var(--border); background:var(--card); transition:all 0.15s; }
    .ah-chip.active-diff { background:var(--primary); color:#fff; border-color:var(--primary); }
  `;
  sheet.appendChild(style);

  overlay.classList.remove('hidden');
  sheet.classList.remove('hidden');
  
  // Trigger layout
  setTimeout(() => {
    overlay.classList.add('visible');
    sheet.classList.add('open');
    // Set initial UI state
    setAddHabitCat('Core');
    updateAHDiff(1);
  }, 10);
}

function setAddHabitCat(cat) {
  currentAddHabitState.category = cat;
  ['Core', 'Wellness', 'Learning', 'Productivity'].forEach(c => {
    const el = document.getElementById(`cat-chip-${c}`);
    if (c === cat) {
      el.style.background = 'var(--primary)';
      el.style.color = '#fff';
      el.style.borderColor = 'var(--primary)';
    } else {
      el.style.background = 'var(--card-alt)';
      el.style.color = 'var(--text)';
      el.style.borderColor = 'var(--border)';
    }
  });
}

function updateAHDiff(diff) {
  currentAddHabitState.difficulty = diff;
  [1, 2, 3].forEach(d => {
    const el = document.getElementById(`ah-diff-${d}`);
    if (d === diff) {
      el.style.background = 'var(--primary)';
      el.style.color = '#fff';
      el.style.borderColor = 'var(--primary)';
    } else {
      el.style.background = 'var(--card-alt)';
      el.style.color = 'var(--text)';
      el.style.borderColor = 'var(--border)';
    }
  });
}

async function saveNewHabit() {
  const name = document.getElementById('habit-name').value;
  const note = document.getElementById('habit-note').value;
  
  if (!name.trim()) {
    showSnackbar('Please enter a habit name');
    return;
  }
  
  try {
    await addHabit({
      name: name.trim(),
      category: currentAddHabitState.category,
      difficulty: currentAddHabitState.difficulty,
      note: note.trim()
    });
    
    closeBottomSheet('add-habit-sheet');
    showSnackbar('Habit added!');
    await renderHome();
  } catch (e) {
    console.error('Failed to add habit:', e);
    showSnackbar('Error adding habit. Try again.');
  }
}
