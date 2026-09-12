// celebration.js — Canvas confetti and milestone celebrations for 100% completion days

const CELEBRATION_MESSAGES = [
  "Day {city_days}. You are building something real.",
  "Flawless execution. Most people never even start.",
  "100% complete! Another building joins your skyline.",
  "The skyline remembers every perfect day.",
  "You showed up. That is everything.",
  "Streak: {streak} days and climbing.",
  "{city_days} buildings standing tall. Unstoppable.",
  "Every habit ticked. One more floor.",
  "You did it. Same commitment tomorrow.",
  "Compound effect in action. Trust the process."
];

async function triggerCelebration() {
  const stats = await getUserStats();
  if (!stats) return;
  if (stats.city_days_logged_today === 1) return;
  
  // Update stats
  stats.city_days_logged_today = 1;
  stats.city_days += 1;
  await updateUserStats(stats);
  
  // Gather info
  const allLogs = await getLogsForDate(todayStr());
  const xpEarned = allLogs.reduce((acc, l) => acc + (l.completed ? l.xp_earned : 0), 0);
  
  // Determine message
  const msgTemplate = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
  const msg = msgTemplate.replace('{city_days}', stats.city_days).replace('{streak}', stats.city_days);
  
  const overlay = document.getElementById('celebration-overlay');
  if (!overlay) return;
  
  overlay.innerHTML = `
    <div id="celeb-card" class="celeb-card" style="background:var(--card); border:1px solid var(--border); border-radius:24px; padding:32px 24px; max-width:340px; width:90%; text-align:center; box-shadow:0 20px 50px rgba(0,0,0,0.6); transform:scale(0.85); opacity:0; transition:all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
      <div style="width:68px; height:68px; border-radius:50%; background:rgba(16,185,129,0.15); border:2px solid var(--success); display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div style="font-size:22px; font-weight:800; color:var(--text-primary); margin-bottom:8px;">Perfect Day!</div>
      <div style="font-size:14px; color:var(--text-secondary); line-height:1.5; margin-bottom:16px;">${escapeHtml(msg)}</div>
      <div style="background:var(--card-alt); border:1px solid var(--border); border-radius:14px; padding:10px; font-size:12px; color:var(--accent); font-weight:700; margin-bottom:12px;">
        🏢 New building added to your city skyline
      </div>
      <div style="font-size:13px; color:var(--primary); font-weight:700; margin-bottom:20px;">+${xpEarned} XP Earned Today</div>
      <button type="button" id="celeb-dismiss-btn" style="width:100%; height:44px; border-radius:12px; background:var(--primary); color:#FFFFFF; font-weight:700; font-size:14px;">
        Continue Building
      </button>
    </div>
  `;
  
  overlay.classList.remove('hidden');
  playHapticSound('celebrate');

  setTimeout(() => {
    const card = document.getElementById('celeb-card');
    if (card) {
      card.style.transform = 'scale(1)';
      card.style.opacity = '1';
    }
    fireConfetti();
  }, 10);
  
  const dismiss = () => {
    const card = document.getElementById('celeb-card');
    if (card) {
      card.style.transform = 'scale(0.85)';
      card.style.opacity = '0';
    }
    setTimeout(() => {
      overlay.classList.add('hidden');
      if (currentTab === 'home' && window.renderHome) {
        window.renderHome();
      }
      if (window.renderDesktopRightPanel) {
        window.renderDesktopRightPanel();
      }
    }, 280);
  };

  const btn = document.getElementById('celeb-dismiss-btn');
  if (btn) btn.onclick = dismiss;
  overlay.onclick = (e) => {
    if (e.target === overlay) dismiss();
  };
}

function fireConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const colors = ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
  const particles = [];
  
  for (let i = 0; i < 90; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2 + 80,
      r: Math.random() * 6 + 2,
      dx: (Math.random() - 0.5) * 14,
      dy: Math.random() * -14 - 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 2200,
      shape: Math.random() > 0.4 ? 'circle' : 'rect'
    });
  }
  
  let start = Date.now();
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let now = Date.now();
    let elapsed = now - start;
    
    if (elapsed > 2200) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    
    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      p.dy += 0.28; // gravity
      
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - (elapsed / 2200));
      
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x, p.y, p.r * 2, p.r * 2);
      }
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
}
