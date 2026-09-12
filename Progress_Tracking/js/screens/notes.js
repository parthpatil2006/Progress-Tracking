// notes.js — Daily reflections and productivity journal

window.renderNotes = async function() {
  const container = document.getElementById('screen-notes');
  if (!container) return;
  const allNotes = await db.HabitNote.reverse().toArray();

  let html = `
    <div class="top-bar">
      <div style="display:flex; align-items:center; gap:12px;">
        <button onclick="popScreen()" style="padding:4px;" aria-label="Go Back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="top-bar-title" style="font-size:18px;">Journal &amp; Reflections</div>
      </div>
    </div>
    
    <div style="padding:16px 16px 60px;">
      <!-- New Entry Card -->
      <div class="card" style="margin:0 0 20px; padding:16px;">
        <div style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:10px;">New Reflection</div>
        <textarea id="note-input" placeholder="What went well today? What will you adjust tomorrow?" 
          rows="3"
          style="width:100%; background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-md); padding:12px; color:var(--text-primary); font-family:inherit; font-size:14px; resize:none; outline:none;"></textarea>
        <div style="display:flex; justify-content:flex-end; margin-top:10px;">
          <button onclick="saveQuickNote()" 
            style="height:40px; padding:0 20px; background:var(--primary); border-radius:var(--radius-sm); color:#FFF; font-weight:700; font-size:13px;">
            Save Note
          </button>
        </div>
      </div>

      <!-- Journal Stream -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding:0 4px;">
        <div style="font-size:13px; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Past Reflections</div>
        <div style="font-size:12px; color:var(--text-secondary);">${allNotes.length} entries</div>
      </div>

      <div style="display:flex; flex-direction:column; gap:12px;">
        ${allNotes.length === 0 ? `
          <div style="text-align:center; padding:36px 20px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text-secondary);">
            <div style="font-size:28px; margin-bottom:8px;">📝</div>
            <div style="font-size:14px; font-weight:600; color:var(--text-primary); margin-bottom:4px;">No journal entries yet</div>
            <div style="font-size:12px;">Capture your daily thoughts and wins to track mental growth alongside habit consistency.</div>
          </div>
        ` : allNotes.map(n => `
          <div class="card" style="margin:0; padding:16px; position:relative;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-size:12px; font-weight:700; color:var(--primary);">${formatDateDisplay(n.date)}</span>
              <button onclick="deleteNote(${n.id})" style="color:var(--text-secondary); font-size:16px; padding:4px;" title="Delete Entry" aria-label="Delete">&times;</button>
            </div>
            <div style="font-size:14px; color:var(--text-primary); line-height:1.5; white-space:pre-wrap;">${escapeHtml(n.note)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  container.innerHTML = html;
};

window.saveQuickNote = async function() {
  const input = document.getElementById('note-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) {
    showSnackbar("Please write a reflection first.");
    return;
  }
  const today = todayStr();
  await db.HabitNote.add({ habit_id: 0, date: today, note: text });
  showSnackbar("Reflection saved!");
  playHapticSound('check');
  input.value = '';
  window.renderNotes();
};

window.deleteNote = async function(id) {
  if (confirm("Delete this reflection?")) {
    await db.HabitNote.delete(Number(id));
    showSnackbar("Entry deleted");
    window.renderNotes();
  }
};
