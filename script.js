

'use strict';


const MOOD_EMOJI = { Happy: '😀', Neutral: '😐', Tired: '😴', Stressed: '😣' };
const STRESS_VAL = { Low: 0, Medium: 1, High: 2 };
const FOCUS_VAL  = { Low: 0, Medium: 1, High: 2 };


let currentUser = null; // { name, email, password }
let selectedMood = '';


function getUsers()     { return JSON.parse(localStorage.getItem('wt_users') || '[]'); }
function saveUsers(u)   { localStorage.setItem('wt_users', JSON.stringify(u)); }
function getLogs(email) { return JSON.parse(localStorage.getItem('wt_logs_' + email) || '[]'); }
function saveLogs(email, logs) { localStorage.setItem('wt_logs_' + email, JSON.stringify(logs)); }


window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('wt_session');
  if (saved) {
    currentUser = JSON.parse(saved);
    bootApp();
  } else {
    showAuthScreen();
  }
  setTodayDate();
  setTopbarDate();
});

function setTodayDate() {
  const d = new Date();
  const str = d.toISOString().split('T')[0];
  const el = document.getElementById('log-date');
  if (el) el.value = str;
}

function setTopbarDate() {
  const el = document.getElementById('topbar-date');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}


function showAuthScreen() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('app-shell').classList.add('hidden');
}
function showRegister() {
  document.getElementById('login-panel').classList.add('hidden');
  document.getElementById('register-panel').classList.remove('hidden');
}
function showLogin() {
  document.getElementById('register-panel').classList.add('hidden');
  document.getElementById('login-panel').classList.remove('hidden');
}

function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pw    = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');

  errEl.classList.add('hidden');
  if (!email || !pw) { showErr(errEl, 'Please fill in all fields.'); return; }

  const users = getUsers();
  const user  = users.find(u => u.email === email && u.password === pw);
  if (!user) { showErr(errEl, 'Invalid email or password.'); return; }

  currentUser = user;
  localStorage.setItem('wt_session', JSON.stringify(user));
  bootApp();
}

function handleRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pw    = document.getElementById('reg-password').value;
  const errEl = document.getElementById('reg-error');

  errEl.classList.add('hidden');
  if (!name || !email || !pw) { showErr(errEl, 'Please fill in all fields.'); return; }
  if (!email.includes('@'))   { showErr(errEl, 'Enter a valid email address.'); return; }
  if (pw.length < 6)          { showErr(errEl, 'Password must be at least 6 characters.'); return; }

  const users = getUsers();
  if (users.find(u => u.email === email)) { showErr(errEl, 'An account with this email already exists.'); return; }

  const user = { name, email, password: pw };
  users.push(user);
  saveUsers(users);
  currentUser = user;
  localStorage.setItem('wt_session', JSON.stringify(user));
  bootApp();
}

function logout() {
  localStorage.removeItem('wt_session');
  currentUser = null;
  showAuthScreen();
}

function showErr(el, msg) { el.textContent = msg; el.classList.remove('hidden'); }


function bootApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');


  document.getElementById('user-name-sidebar').textContent = currentUser.name;
  document.getElementById('user-email-sidebar').textContent = currentUser.email;
  document.getElementById('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();

  showSection('dashboard', document.querySelector('.nav-item.active'));
}


function showSection(id, link) {

  document.querySelectorAll('.section').forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const target = document.getElementById('section-' + id);
  if (target) { target.classList.remove('hidden'); target.classList.add('active'); }

  if (link) link.classList.add('active');


  const titles = { dashboard:'Dashboard', log:'Daily Log', mood:'Mood History', streaks:'Habit Streaks', weekly:'Weekly Summary', alerts:'Alerts' };
  document.getElementById('topbar-title').textContent = titles[id] || id;


  if (id === 'dashboard')  renderDashboard();
  if (id === 'mood')       renderMoodHistory();
  if (id === 'streaks')    renderStreaks();
  if (id === 'weekly')     renderWeekly();
  if (id === 'alerts')     renderAlertsFull();


  document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}


function selectMood(btn) {
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedMood = btn.dataset.mood;
}

function saveLog() {
  const date     = document.getElementById('log-date').value;
  const sleep    = parseFloat(document.getElementById('log-sleep').value);
  const study    = parseFloat(document.getElementById('log-study').value);
  const screen   = parseFloat(document.getElementById('log-screen').value);
  const exercise = parseFloat(document.getElementById('log-exercise').value);
  const stress   = document.getElementById('log-stress').value;
  const focus    = document.getElementById('log-focus').value;
  const mood     = selectedMood;

  const errEl = document.getElementById('log-error');
  const sucEl = document.getElementById('log-success');
  errEl.classList.add('hidden');
  sucEl.classList.add('hidden');

  if (!date)                          { showErr(errEl, 'Please select a date.');            return; }
  if (isNaN(sleep)  || sleep  < 0)   { showErr(errEl, 'Enter valid sleep hours.');          return; }
  if (isNaN(study)  || study  < 0)   { showErr(errEl, 'Enter valid study/work hours.');     return; }
  if (isNaN(screen) || screen < 0)   { showErr(errEl, 'Enter valid screen time hours.');    return; }
  if (isNaN(exercise) || exercise < 0){ showErr(errEl, 'Enter valid exercise minutes.');    return; }
  if (!stress)                        { showErr(errEl, 'Please select a stress level.');    return; }
  if (!focus)                         { showErr(errEl, 'Please select a focus level.');     return; }
  if (!mood)                          { showErr(errEl, 'Please select your mood.');          return; }

  const log = { date, sleep, study, screen, exercise, stress, focus, mood,
    smartScore: calcSmartScore({ sleep, study, screen, exercise, stress, focus, mood }),
    prodScore:  calcProdScore({ study, focus, sleep, screen, stress })
  };

  const logs = getLogs(currentUser.email);

  const idx = logs.findIndex(l => l.date === date);
  if (idx >= 0) logs[idx] = log; else logs.push(log);
  logs.sort((a,b) => new Date(b.date) - new Date(a.date));
  saveLogs(currentUser.email, logs);

  sucEl.textContent = '✓ Log saved successfully for ' + formatDate(date);
  sucEl.classList.remove('hidden');
  showToast('Log saved! 🎉', 'success');
  setTimeout(() => sucEl.classList.add('hidden'), 4000);
}


function calcSmartScore({ sleep, study, screen, exercise, stress, focus, mood }) {
  let score = 0;
  
  if      (sleep >= 8)   score += 25;
  else if (sleep >= 7)   score += 22;
  else if (sleep >= 6)   score += 15;
  else if (sleep >= 5)   score += 8;
  else                   score += 2;

  
  if      (study >= 7)   score += 15;
  else if (study >= 5)   score += 12;
  else if (study >= 3)   score += 8;
  else if (study >= 1)   score += 4;
  else                   score += 0;

 
  if      (stress === 'Low')    score += 20;
  else if (stress === 'Medium') score += 12;
  else                          score += 4;

 
  if      (screen <= 1)  score += 15;
  else if (screen <= 2)  score += 13;
  else if (screen <= 3)  score += 10;
  else if (screen <= 5)  score += 6;
  else                   score += 1;

  
  if      (exercise >= 60) score += 15;
  else if (exercise >= 30) score += 12;
  else if (exercise >= 20) score += 8;
  else if (exercise >= 10) score += 4;
  else                     score += 0;


  if      (mood === 'Happy')    score += 10;
  else if (mood === 'Neutral')  score += 7;
  else if (mood === 'Tired')    score += 4;
  else if (mood === 'Stressed') score += 2;

  return Math.min(100, Math.round(score));
}

function calcProdScore({ study, focus, sleep, screen, stress }) {
  let score = 0;


  if      (study >= 8)  score += 30;
  else if (study >= 6)  score += 25;
  else if (study >= 4)  score += 18;
  else if (study >= 2)  score += 10;
  else                  score += 3;


  if      (focus === 'High')   score += 30;
  else if (focus === 'Medium') score += 18;
  else                         score += 6;

  
  if      (sleep >= 8)  score += 20;
  else if (sleep >= 7)  score += 17;
  else if (sleep >= 6)  score += 10;
  else                  score += 3;

 
  if      (screen <= 2)  score += 10;
  else if (screen <= 4)  score += 6;
  else                   score += 2;

 
  if      (stress === 'Low')    score += 10;
  else if (stress === 'Medium') score += 6;
  else                          score += 1;

  return Math.min(100, Math.round(score));
}

function scoreGrade(s) {
  if (s >= 80) return { label: 'Excellent', cls: 'score-excellent', badge: 'badge-green' };
  if (s >= 55) return { label: 'Average',   cls: 'score-average',  badge: 'badge-yellow' };
  return       { label: 'Needs Improvement', cls: 'score-poor',    badge: 'badge-red' };
}

function prodLabel(s) {
  if (s >= 75) return 'High Productivity';
  if (s >= 45) return 'Moderate Productivity';
  return 'Low Productivity';
}


function calcStreaks(logs) {

  const sorted = [...logs].sort((a,b) => new Date(a.date) - new Date(b.date));

  const streaks = {
    sleep:    { icon:'😴', label:'Sleep ≥ 7h', count: 0 },
    exercise: { icon:'🏃', label:'Daily Exercise', count: 0 },
    screen:   { icon:'📵', label:'Low Screen Time', count: 0 },
    prod:     { icon:'📈', label:'Productivity', count: 0 }
  };


  const today = new Date(); today.setHours(0,0,0,0);

  function streakFor(field) {
    let streak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const logDate = new Date(sorted[i].date); logDate.setHours(0,0,0,0);
      const diffDays = Math.round((today - logDate) / 86400000);
      if (diffDays !== (sorted.length - 1 - i) + streak - streak) {
        
      }
      if (field(sorted[i])) streak++;
      else break;
    }
    return streak;
  }

 
  function buildStreak(predicate) {
    let count = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (predicate(sorted[i])) count++;
      else break;
    }
    return count;
  }

  streaks.sleep.count    = buildStreak(l => l.sleep >= 7);
  streaks.exercise.count = buildStreak(l => l.exercise >= 20);
  streaks.screen.count   = buildStreak(l => l.screen <= 3);
  streaks.prod.count     = buildStreak(l => l.prodScore >= 65);

  return streaks;
}


function buildAlerts(logs) {
  const alerts = [];
  if (!logs.length) return alerts;

  const latest = logs[0]; 
  const { sleep, screen, exercise, stress, mood, focus } = latest;

  
  if (sleep < 6)
    alerts.push({ type:'danger', icon:'🌙', title:'Sleep Alert', msg:`You only slept ${sleep}h last night. Aim for at least 7–8 hours.` });
  else if (sleep < 7)
    alerts.push({ type:'warn', icon:'🌙', title:'Sleep Warning', msg:`You slept ${sleep}h. Try to get closer to 7 hours for better focus.` });


  if (screen > 7)
    alerts.push({ type:'danger', icon:'📱', title:'Distraction Alert', msg:`Your screen time was ${screen}h today — very high. Consider a digital detox.` });
  else if (screen > 5)
    alerts.push({ type:'warn', icon:'📱', title:'High Screen Time', msg:`Your screen time exceeded 5 hours (${screen}h). Try to reduce before bedtime.` });


  if (exercise < 10)
    alerts.push({ type:'warn', icon:'🏃', title:'Exercise Reminder', msg:`You've had very little physical activity (${exercise} min). Even a 10-min walk helps!` });

 
  if (stress === 'High')
    alerts.push({ type:'danger', icon:'⚠', title:'Stress Alert', msg:'High stress detected. Take a short break, breathe deeply, or go for a walk.' });

  
  if (mood === 'Stressed')
    alerts.push({ type:'warn', icon:'😣', title:'Mood Check', msg:'You reported feeling stressed. Reach out to someone or practice mindfulness.' });
  if (mood === 'Tired')
    alerts.push({ type:'info', icon:'😴', title:'Fatigue Notice', msg:'Feeling tired? Make sure to prioritise rest and limit caffeine late in the day.' });


  if (focus === 'Low' && screen >= 5)
    alerts.push({ type:'warn', icon:'🎯', title:'Distraction Detected', msg:'Low focus combined with high screen time detected. Try a Pomodoro session.' });


  if (sleep >= 8 && exercise >= 30 && screen <= 3)
    alerts.push({ type:'good', icon:'🌟', title:'Great Habits!', msg:'Excellent day — strong sleep, exercise, and low screen time. Keep it up!' });


  if (logs.length >= 3) {
    const last3 = logs.slice(0, 3);
    const avgSleep = avg(last3.map(l => l.sleep));
    if (avgSleep < 6.5)
      alerts.push({ type:'warn', icon:'📊', title:'Weekly Trend — Sleep', msg:`Your average sleep over the last 3 days is ${avgSleep.toFixed(1)}h. Prioritise rest this week.` });
  }

  return alerts;
}


function renderDashboard() {
  const logs = getLogs(currentUser.email);
  const latest = logs[0] || null;

  // Smart Score
  renderSmartScore(latest);
  // Productivity Score
  renderProdScore(latest);
  // Today Mood
  renderTodayMood(latest);
  // Streaks
  renderStreakMini(logs);
  // Recent Logs
  renderRecentLogs(logs);
  // Alert Banner
  renderAlertBanner(logs);
}

function renderSmartScore(log) {
  const numEl  = document.getElementById('smart-score-num');
  const barEl  = document.getElementById('score-bar-fill');
  const gradeEl = document.getElementById('score-grade');
  const breakEl = document.getElementById('score-breakdown');
  const ringEl  = document.getElementById('ring-fill');
  const card    = document.getElementById('smart-score-card');

  if (!log) {
    numEl.textContent = '--';
    gradeEl.textContent = 'No log yet';
    breakEl.textContent = '';
    barEl.style.width = '0%';
    ringEl.style.strokeDashoffset = 314;
    return;
  }

  const s = log.smartScore;
  const g = scoreGrade(s);


  card.classList.remove('score-excellent', 'score-average', 'score-poor');
  card.classList.add(g.cls);


  animateNumber(numEl, 0, s, 900);
  // Ring
  const offset = 314 - (314 * s / 100);
  ringEl.style.strokeDashoffset = offset;
  // Bar
  setTimeout(() => { barEl.style.width = s + '%'; }, 100);
  // Grade
  gradeEl.textContent = g.label;
  gradeEl.style.color = g.cls === 'score-excellent' ? 'var(--teal)' : g.cls === 'score-average' ? 'var(--amber)' : 'var(--red)';
  // Breakdown
  breakEl.innerHTML = `
    😴 Sleep: ${log.sleep}h &nbsp;|&nbsp; 📚 Study: ${log.study}h<br>
    📱 Screen: ${log.screen}h &nbsp;|&nbsp; 🏃 Exercise: ${log.exercise}min<br>
    🔥 Stress: ${log.stress} &nbsp;|&nbsp; 😊 Mood: ${log.mood}
  `;
}

function renderProdScore(log) {
  const numEl  = document.getElementById('prod-score-num');
  const barEl  = document.getElementById('prod-bar-fill');
  const lblEl  = document.getElementById('prod-bar-label');
  const facEl  = document.getElementById('prod-factors');

  if (!log) {
    numEl.textContent = '--';
    lblEl.textContent = '—';
    barEl.style.width = '0%';
    facEl.innerHTML   = '';
    return;
  }

  const s = log.prodScore;
  animateNumber(numEl, 0, s, 900);
  setTimeout(() => { barEl.style.width = s + '%'; }, 100);
  lblEl.textContent = prodLabel(s);

  const factors = [];
  if (log.study >= 5) factors.push('✅ Good study hours');
  else factors.push('⚠ Low study hours');
  if (log.focus === 'High') factors.push('✅ High focus');
  else if (log.focus === 'Medium') factors.push('▲ Moderate focus');
  else factors.push('⚠ Low focus');
  if (log.sleep >= 7) factors.push('✅ Adequate sleep');
  else factors.push('⚠ Insufficient sleep');

  facEl.innerHTML = factors.join('<br>');
}

function renderTodayMood(log) {
  const el = document.getElementById('today-mood-display');
  if (!log) {
    el.innerHTML = '<span class="mood-big">—</span><span class="mood-label-big">No log yet</span>';
    return;
  }
  el.innerHTML = `<span class="mood-big">${MOOD_EMOJI[log.mood] || '—'}</span><span class="mood-label-big">${log.mood}</span>`;
}

function renderStreakMini(logs) {
  const streaks = calcStreaks(logs);
  const el = document.getElementById('streak-mini');
  el.innerHTML = '';

  const items = [
    { icon:'😴', label:'Sleep ≥ 7h', count: streaks.sleep.count },
    { icon:'🏃', label:'Exercise',   count: streaks.exercise.count },
    { icon:'📵', label:'Low Screen', count: streaks.screen.count },
    { icon:'📈', label:'Productivity',count: streaks.prod.count }
  ];

  items.forEach(item => {
    el.innerHTML += `
      <div class="streak-item-mini">
        <span class="streak-left">${item.icon} ${item.label}</span>
        <span><span class="streak-count">${item.count}</span><span class="streak-unit">days</span></span>
      </div>`;
  });

  if (!items.some(i => i.count > 0)) {
    el.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:12px 0;">Log daily to build streaks!</div>';
  }
}

function renderRecentLogs(logs) {
  const body = document.getElementById('recent-logs-body');
  if (!logs.length) {
    body.innerHTML = '<tr><td colspan="8" class="empty-row">No logs yet. Start tracking!</td></tr>';
    return;
  }

  body.innerHTML = logs.slice(0, 7).map(l => {
    const g = scoreGrade(l.smartScore);
    return `<tr>
      <td>${formatDate(l.date)}</td>
      <td>${l.sleep}h</td>
      <td>${l.study}h</td>
      <td>${l.screen}h</td>
      <td>${l.exercise}min</td>
      <td><span class="badge ${l.stress === 'Low' ? 'badge-green' : l.stress === 'Medium' ? 'badge-yellow' : 'badge-red'}">${l.stress}</span></td>
      <td>${MOOD_EMOJI[l.mood]} ${l.mood}</td>
      <td><span class="badge ${g.badge}">${l.smartScore}</span></td>
    </tr>`;
  }).join('');
}

function renderAlertBanner(logs) {
  const el = document.getElementById('alert-banner');
  const alerts = buildAlerts(logs);
  if (!alerts.length) { el.classList.add('hidden'); return; }

  el.classList.remove('hidden');
  el.innerHTML = alerts.slice(0, 3).map(a =>
    `<div class="alert-item ${a.type}">
      <span class="alert-icon">${a.icon}</span>
      <div class="alert-text"><strong>${a.title}</strong><span>${a.msg}</span></div>
    </div>`
  ).join('');
}


function renderMoodHistory() {
  const logs = getLogs(currentUser.email);
  const body = document.getElementById('mood-history-body');
  if (!logs.length) {
    body.innerHTML = '<tr><td colspan="4" class="empty-row">No mood logs yet.</td></tr>';
    return;
  }
  body.innerHTML = logs.map(l => `
    <tr>
      <td>${formatDate(l.date)}</td>
      <td>${MOOD_EMOJI[l.mood]} ${l.mood}</td>
      <td><span class="badge ${l.stress==='Low'?'badge-green':l.stress==='Medium'?'badge-yellow':'badge-red'}">${l.stress}</span></td>
      <td><span class="badge ${l.focus==='High'?'badge-green':l.focus==='Medium'?'badge-yellow':'badge-red'}">${l.focus}</span></td>
    </tr>`).join('');
}


function renderStreaks() {
  const logs = getLogs(currentUser.email);
  const s = calcStreaks(logs);
  const el = document.getElementById('streaks-grid');

  const items = [
    { ...s.sleep,    icon:'😴', label:'Sleep Streak' },
    { ...s.exercise, icon:'🏃', label:'Exercise Streak' },
    { ...s.screen,   icon:'📵', label:'Low Screen Streak' },
    { ...s.prod,     icon:'📈', label:'Productivity Streak' }
  ];

  el.innerHTML = items.map(item => `
    <div class="streak-card">
      <span class="streak-icon">${item.icon}</span>
      <span class="streak-num">${item.count}</span>
      <span class="streak-days">consecutive days</span>
      <span class="streak-name">${item.label}</span>
    </div>`).join('');
}


function renderWeekly() {
  const logs = getLogs(currentUser.email);
  const el   = document.getElementById('weekly-content');

  if (logs.length < 2) {
    el.innerHTML = '<p style="color:var(--text-dim);font-size:14px;padding:20px 0;">Log at least 2 days to see your weekly summary.</p>';
    return;
  }

  const week = logs.slice(0, 7);
  const avgSleep    = avg(week.map(l => l.sleep)).toFixed(1);
  const avgStudy    = avg(week.map(l => l.study)).toFixed(1);
  const avgScreen   = avg(week.map(l => l.screen)).toFixed(1);
  const avgExercise = avg(week.map(l => l.exercise)).toFixed(0);
  const avgScore    = avg(week.map(l => l.smartScore)).toFixed(0);
  const exerciseDays= week.filter(l => l.exercise >= 20).length;
  const highStress  = week.filter(l => l.stress === 'High').length;
  const happyDays   = week.filter(l => l.mood === 'Happy').length;


  const tips = [];
  if (+avgSleep < 7) tips.push('Try sleeping 7–8 hours per night — it dramatically improves focus and mood.');
  if (+avgScreen > 4) tips.push('Reduce screen time, especially within 1 hour of bedtime, to improve sleep quality.');
  if (exerciseDays < 4) tips.push('Aim for at least 20 minutes of physical activity every day to boost energy and mood.');
  if (highStress >= 3) tips.push('High stress appears frequently — consider journaling, meditation, or talking to someone.');
  if (+avgStudy < 4) tips.push('Increasing focused study time to 5–6 hours per day can improve academic performance.');
  if (happyDays >= 5) tips.push('You\'ve been in a great mood this week! Keep nurturing positive habits.');
  if (!tips.length) tips.push('Your habits look solid! Maintain consistency for lasting results.');

  el.innerHTML = `
    <div class="weekly-stat-grid">
      <div class="weekly-stat"><span class="weekly-stat-val">${avgSleep}h</span><span class="weekly-stat-lbl">Avg Sleep</span></div>
      <div class="weekly-stat"><span class="weekly-stat-val">${avgStudy}h</span><span class="weekly-stat-lbl">Avg Study</span></div>
      <div class="weekly-stat"><span class="weekly-stat-val">${avgScreen}h</span><span class="weekly-stat-lbl">Avg Screen</span></div>
      <div class="weekly-stat"><span class="weekly-stat-val">${avgExercise}min</span><span class="weekly-stat-lbl">Avg Exercise</span></div>
      <div class="weekly-stat"><span class="weekly-stat-val">${exerciseDays}</span><span class="weekly-stat-lbl">Exercise Days</span></div>
      <div class="weekly-stat"><span class="weekly-stat-val">${avgScore}</span><span class="weekly-stat-lbl">Avg WellScore</span></div>
    </div>

    <div class="weekly-section-title">Mood Breakdown (last ${week.length} days)</div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Date</th><th>Mood</th><th>Smart Score</th><th>Productivity</th></tr></thead>
        <tbody>
          ${week.map(l => `
          <tr>
            <td>${formatDate(l.date)}</td>
            <td>${MOOD_EMOJI[l.mood]} ${l.mood}</td>
            <td><span class="badge ${scoreGrade(l.smartScore).badge}">${l.smartScore}</span></td>
            <td><span class="badge ${l.prodScore >= 70 ? 'badge-green' : l.prodScore >= 45 ? 'badge-yellow' : 'badge-red'}">${l.prodScore}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="weekly-section-title">Personalised Suggestions</div>
    ${tips.map(t => `<div class="weekly-tip">💡 ${t}</div>`).join('')}
  `;
}


function renderAlertsFull() {
  const logs = getLogs(currentUser.email);
  const el   = document.getElementById('alerts-list');
  const alerts = buildAlerts(logs);

  if (!alerts.length) {
    el.innerHTML = '<div style="color:var(--text-dim);font-size:14px;padding:20px 0;">No alerts yet. Log your daily habits to receive personalised notifications.</div>';
    return;
  }

  el.innerHTML = alerts.map(a => `
    <div class="alert-full-item ${a.type}">
      <div class="alert-full-icon">${a.icon}</div>
      <div class="alert-full-body">
        <strong>${a.title}</strong>
        <p>${a.msg}</p>
      </div>
    </div>`).join('');
}


function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s,v) => s + v, 0) / arr.length;
}

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
}

function animateNumber(el, from, to, duration) {
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(from + (to - from) * ease);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function showToast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
