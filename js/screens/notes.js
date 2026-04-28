async function renderNotes() {
  const container = document.getElementById('screen-notes');
  const allNotes = await getAllNotes();
  const allHabits = await getAllHabits();
  
  let html = `
    <div class="top-bar">
      <div class="top-bar-title">Notes</div>
      <div class="sheet-close" style="position:relative;right:0;top:0" onclick="App.closePushScreen('screen-notes')">&times;</div>
    </div>
    <div style="padding:16px">
  `;
  
  if (allNotes.length === 0) {
    html += `<div style="text-align:center;color:var(--text-sub);margin-top:40px;font-size:14px">No notes yet. Add notes to your habits from the Home screen.</div>`;
  } else {
    // Group by date
    const groups = {};
    allNotes.forEach(n => {
      if (!groups[n.date]) groups[n.date] = [];
      groups[n.date].push(n);
    });
    
    Object.keys(groups).sort((a,b) => b.localeCompare(a)).forEach(dateStr => {
      html += `<div style="font-size:13px;font-weight:600;color:var(--text-sub);margin:16px 0 8px">${formatDate(dateStr)}</div>`;
      
      groups[dateStr].forEach(n => {
        const h = allHabits.find(hx => hx.id == n.habit_id);
        if (!h) return;
        
        html += `
          <div class="card card-hover" style="margin:0 0 10px;padding:12px;cursor:pointer" onclick="openNoteSheet(${n.habit_id}, '${h.name}', '${n.date}')">
            <div class="row gap-8" style="margin-bottom:6px">
              <div style="width:8px;height:8px;border-radius:4px;background:var(--cat-${h.category.toLowerCase()})"></div>
              <div style="font-size:14px;font-weight:600">${h.name}</div>
            </div>
            <div style="font-size:13px;color:var(--text-sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${n.content}
            </div>
          </div>
        `;
      });
    });
  }
  
  html += `</div>`;
  container.innerHTML = html;
}

// Habit Note Sheet
async function openNoteSheet(habitId, habitName, dateStr = null) {
  const targetDate = dateStr || todayStr();
  const existingNote = await getNote(habitId, targetDate);
  const content = existingNote ? existingNote.content : '';
  
  const overlay = document.getElementById('sheet-overlay');
  const sheet = document.getElementById('habit-note-sheet');
  
  sheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-header" style="text-align:left">
      <div class="top-bar-title small">${habitName}</div>
      <div style="font-size:12px;color:var(--text-sub);margin-top:2px">${formatDate(targetDate)}</div>
      <div class="sheet-close" onclick="closeBottomSheet('habit-note-sheet')">&times;</div>
    </div>
    <div style="padding:16px;flex:1;display:flex;flex-direction:column">
      <textarea id="hn-content" class="form-input" style="flex:1;border:none;background:var(--bg);padding:16px;resize:none" placeholder="Write a note for today...">${content}</textarea>
    </div>
    <div style="padding:16px;border-top:1px solid var(--border)">
      <button class="btn-primary" style="margin:0;width:100%" onclick="saveNoteFromSheet(${habitId}, '${targetDate}')">Save Note</button>
    </div>
  `;
  
  overlay.classList.remove('hidden');
  sheet.classList.remove('hidden');
  setTimeout(() => {
    overlay.classList.add('visible');
    sheet.classList.add('open');
    document.getElementById('hn-content').focus();
  }, 10);
}

async function saveNoteFromSheet(habitId, dateStr) {
  const content = document.getElementById('hn-content').value.trim();
  if (content) {
    await upsertNote(habitId, dateStr, content);
    showSnackbar('Note saved');
  }
  closeBottomSheet('habit-note-sheet');
  
  // Refresh if on notes screen or home screen
  if (App.currentTab === 'home') await renderHome();
  if (document.getElementById('screen-notes').classList.contains('active')) await renderNotes();
}
