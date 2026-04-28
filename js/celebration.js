const CELEBRATION_MESSAGES = [
  "Day {city_days}. You are building something real.",
  "Flawless. Most people never even start.",
  "100% done. Your city grows.",
  "The skyline remembers every perfect day.",
  "You showed up. That is everything.",
  "Streak: {streak} days and climbing.",
  "{city_days} buildings. Unstoppable.",
  "Every habit ticked. One more floor.",
  "You did it. Same time tomorrow.",
  "Compound effect working. Trust the process."
];

async function triggerCelebration() {
  const stats = await getUserStats();
  if (stats.city_days_logged_today === 1) return;
  
  // Update stats
  stats.city_days_logged_today = 1;
  stats.city_days += 1;
  await updateUserStats(stats);
  
  // Gather info
  const allLogs = await getLogsForDate(todayStr());
  const xpEarned = allLogs.reduce((acc, l) => acc + (l.completed ? l.xp_earned : 0), 0);
  
  // Determine message
  let msgTemplate = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
  let msg = msgTemplate.replace('{city_days}', stats.city_days).replace('{streak}', stats.city_days); // using city_days as streak proxy globally as per design
  
  const overlay = document.getElementById('celebration-overlay');
  
  overlay.innerHTML = `
    <div id="celeb-card" class="celeb-card">
      <div class="check-circle">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="stroke-dasharray:40;stroke-dashoffset:40;animation:drawCheck 0.4s ease forwards 0.2s"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="celebration-title">Perfect Day!</div>
      <div class="celebration-msg">${msg}</div>
      <div class="celebration-city">New building added to your city</div>
      <div style="font-size:13px;color:var(--primary);margin-bottom:16px;font-weight:600">+ ${xpEarned} XP earned today</div>
      <div class="celebration-hint">Tap anywhere to continue</div>
    </div>
  `;
  
  // Inject style for drawing check
  if (!document.getElementById('celeb-styles')) {
    const s = document.createElement('style');
    s.id = 'celeb-styles';
    s.innerHTML = `@keyframes drawCheck { to { stroke-dashoffset: 0; } }`;
    document.head.appendChild(s);
  }
  
  overlay.classList.remove('hidden');
  setTimeout(() => {
    document.getElementById('celeb-card').classList.add('visible');
    fireConfetti();
  }, 10);
  
  // Close handler
  overlay.onclick = () => {
    document.getElementById('celeb-card').classList.remove('visible');
    setTimeout(() => {
      overlay.classList.add('hidden');
      if (App.currentTab === 'home') renderHome();
    }, 300);
  };
}

function fireConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const colors = ['#4F8EF7', '#34C97D', '#F5A623', '#A78BFA'];
  const particles = [];
  
  for (let i = 0; i < 70; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2 + 100, // burst from center bottom
      r: Math.random() * 6 + 2,
      dx: Math.random() * 10 - 5,
      dy: Math.random() * -10 - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1800, // ms
      shape: Math.random() > 0.5 ? 'circle' : 'rect'
    });
  }
  
  let start = Date.now();
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let now = Date.now();
    let elapsed = now - start;
    
    if (elapsed > 1800) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    
    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      p.dy += 0.2; // gravity
      
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - (elapsed / 1800));
      
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x, p.y, p.r*2, p.r*2);
      }
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
}
