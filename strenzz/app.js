// strenzz — personal lift tracker
// started this because every app out there is either too bloated
// or wants a monthly subscription for basic stuff

const STORAGE_KEY = 'strenzz_logs';

// ----- storage helpers -----

function getLogs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveLogs(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ----- navigation -----

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

    item.classList.add('active');
    document.getElementById('tab-' + item.dataset.tab).classList.add('active');

    if (item.dataset.tab === 'dashboard') renderDashboard();
    if (item.dataset.tab === 'graph') renderGraph();
    if (item.dataset.tab === 'log') renderAllLogs();
  });
});

document.getElementById('log-date').value = todayStr();

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// hide hip field for males by default
document.getElementById('bf-hip-group').style.display = 'none';
document.getElementById('bf-gender').addEventListener('change', function () {
  document.getElementById('bf-hip-group').style.display =
    this.value === 'female' ? 'flex' : 'none';
});


// ----- log a lift -----

function saveLog() {
  const exercise = document.getElementById('log-exercise').value;
  const date     = document.getElementById('log-date').value;
  const weight   = parseFloat(document.getElementById('log-weight').value);
  const sets     = parseInt(document.getElementById('log-sets').value);
  const reps     = parseInt(document.getElementById('log-reps').value);
  const notes    = document.getElementById('log-notes').value.trim();
  const feedback = document.getElementById('log-feedback');

  if (!exercise || !date || isNaN(weight) || isNaN(sets) || isNaN(reps)) {
    showFeedback(feedback, '⚠ fill in all the fields first', 'error');
    return;
  }

  const logs = getLogs();
  logs.push({ id: Date.now(), exercise, date, weight, sets, reps, notes });
  saveLogs(logs);

  showFeedback(feedback, `saved — ${exercise} ${weight}kg × ${reps} reps ✓`, 'success');

  document.getElementById('log-exercise').value = '';
  document.getElementById('log-weight').value   = '';
  document.getElementById('log-sets').value     = '';
  document.getElementById('log-reps').value     = '';
  document.getElementById('log-notes').value    = '';
  document.getElementById('log-date').value     = todayStr();

  renderAllLogs();
}

function deleteLog(id) {
  if (!confirm('delete this log?')) return;
  saveLogs(getLogs().filter(l => l.id !== id));
  renderAllLogs();
  renderDashboard();
}

function showFeedback(el, msg, type) {
  el.textContent = msg;
  el.className = 'feedback ' + type;
  setTimeout(() => { el.textContent = ''; el.className = 'feedback'; }, 3000);
}

function renderAllLogs() {
  const filter    = document.getElementById('filter-exercise').value;
  const container = document.getElementById('all-logs-table');

  let logs = getLogs();
  if (filter) logs = logs.filter(l => l.exercise === filter);
  logs.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!logs.length) {
    container.innerHTML = '<p class="empty-state">nothing here yet</p>';
    return;
  }

  container.innerHTML = `
    <table class="log-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Exercise</th>
          <th>Weight</th>
          <th>Sets</th>
          <th>Reps</th>
          <th>Est. 1RM</th>
          <th>Notes</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${logs.map(l => `
          <tr>
            <td>${l.date}</td>
            <td>${l.exercise}</td>
            <td>${l.weight} kg</td>
            <td>${l.sets}</td>
            <td>${l.reps}</td>
            <td style="color:var(--accent2);font-family:'Bebas Neue',sans-serif;letter-spacing:1px;">
              ${calc1RMepley(l.weight, l.reps).toFixed(1)} kg
            </td>
            <td style="color:var(--muted);font-size:0.82rem;">${l.notes || '—'}</td>
            <td><button class="btn-danger" onclick="deleteLog(${l.id})">✕</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}


// ----- dashboard -----

function renderDashboard() {
  const logs      = getLogs();
  const statCards = document.getElementById('stat-cards');
  const exercises = [...new Set(logs.map(l => l.exercise))];
  const totalVol  = logs.reduce((sum, l) => sum + l.weight * l.sets * l.reps, 0);

  let bestORM = 0, bestEx = '—';
  exercises.forEach(ex => {
    logs.filter(l => l.exercise === ex).forEach(l => {
      const orm = calc1RMepley(l.weight, l.reps);
      if (orm > bestORM) { bestORM = orm; bestEx = ex; }
    });
  });

  statCards.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Sessions</div>
      <div class="stat-value">${logs.length}</div>
      <div class="stat-sub">lifts logged</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Exercises</div>
      <div class="stat-value">${exercises.length}</div>
      <div class="stat-sub">being tracked</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Volume</div>
      <div class="stat-value">${(totalVol / 1000).toFixed(1)}t</div>
      <div class="stat-sub">kg moved overall</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Best 1RM est.</div>
      <div class="stat-value">${bestORM > 0 ? bestORM.toFixed(0) + 'kg' : '—'}</div>
      <div class="stat-sub">${bestEx}</div>
    </div>
  `;

  const recent   = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const recentEl = document.getElementById('recent-logs-list');

  recentEl.innerHTML = recent.length
    ? recent.map(l => `
        <div class="recent-log-item">
          <div>
            <div class="ex-name">${l.exercise}</div>
            <div class="ex-meta">${l.date} &middot; ${l.sets}×${l.reps}</div>
          </div>
          <div class="ex-weight">${l.weight}kg</div>
        </div>
      `).join('')
    : '<p class="empty-state">no logs yet — start from the Log tab</p>';

  const ormEl = document.getElementById('orm-snapshot');
  ormEl.innerHTML = exercises.length
    ? exercises.map(ex => {
        const best = Math.max(...logs.filter(l => l.exercise === ex).map(l => calc1RMepley(l.weight, l.reps)));
        return `
          <div class="orm-snap-item">
            <span class="ex">${ex}</span>
            <span class="val">${best.toFixed(1)} kg</span>
          </div>
        `;
      }).join('')
    : '<p class="empty-state">nothing yet</p>';
}


// ----- progress graph -----

let currentRange  = 'weekly';
let chartInstance = null;

function setRange(range, btn) {
  currentRange = range;
  document.querySelectorAll('.toggle').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderGraph();
}

function renderGraph() {
  const exercise = document.getElementById('graph-exercise').value;
  const emptyEl  = document.getElementById('graph-empty');
  const canvas   = document.getElementById('progressChart');

  if (!exercise) {
    canvas.style.display = 'none';
    emptyEl.style.display = 'block';
    emptyEl.textContent = 'pick an exercise above to see your graph';
    return;
  }

  let logs = getLogs()
    .filter(l => l.exercise === exercise)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (currentRange !== 'all') {
    const days   = currentRange === 'weekly' ? 7 : 30;
    const cutoff = new Date(Date.now() - days * 86400000);
    logs = logs.filter(l => new Date(l.date) >= cutoff);
  }

  if (!logs.length) {
    canvas.style.display = 'none';
    emptyEl.style.display = 'block';
    emptyEl.textContent = `no ${exercise} data in this range yet`;
    return;
  }

  canvas.style.display = 'block';
  emptyEl.style.display = 'none';

  const labels     = logs.map(l => l.date);
  const ormData    = logs.map(l => parseFloat(calc1RMepley(l.weight, l.reps).toFixed(1)));
  const weightData = logs.map(l => l.weight);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Est. 1RM (kg)',
          data: ormData,
          borderColor: '#e8ff47',
          backgroundColor: 'rgba(232,255,71,0.07)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#e8ff47',
          pointRadius: 5,
        },
        {
          label: 'Weight Used (kg)',
          data: weightData,
          borderColor: '#ff6b35',
          backgroundColor: 'transparent',
          tension: 0.4,
          pointBackgroundColor: '#ff6b35',
          pointRadius: 4,
          borderDash: [5, 3],
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#999', font: { family: 'DM Sans', size: 12 } } },
        tooltip: {
          backgroundColor: '#161618',
          borderColor: '#2a2a2e',
          borderWidth: 1,
          titleColor: '#e8ff47',
          bodyColor: '#ccc',
        }
      },
      scales: {
        x: { ticks: { color: '#555' }, grid: { color: '#1e1e21' } },
        y: { ticks: { color: '#555' }, grid: { color: '#1e1e21' } }
      }
    }
  });
}


// ----- calculators -----

// epley is the most widely used, close enough for practical purposes
function calc1RMepley(weight, reps) {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function calc1RM() {
  const w  = parseFloat(document.getElementById('orm-weight').value);
  const r  = parseInt(document.getElementById('orm-reps').value);
  const el = document.getElementById('orm-result');

  if (isNaN(w) || isNaN(r) || r < 1) {
    showCalcResult(el, '—', 'enter valid numbers', '');
    return;
  }

  const orm  = calc1RMepley(w, r);
  const pcts = [95, 90, 85, 80, 75, 70, 65, 60]
    .map(p => `${p}% → ${(orm * p / 100).toFixed(1)}kg`)
    .join(' &nbsp;·&nbsp; ');

  showCalcResult(el, orm.toFixed(1) + ' kg', 'estimated 1 rep max (epley)', pcts);
}

function calcBMI() {
  const w  = parseFloat(document.getElementById('bmi-weight').value);
  const hm = parseFloat(document.getElementById('bmi-height').value) / 100;
  const el = document.getElementById('bmi-result');

  if (isNaN(w) || isNaN(hm) || hm <= 0) {
    showCalcResult(el, '—', 'enter weight and height', '');
    return;
  }

  const bmi = w / (hm * hm);
  let cat;
  if      (bmi < 18.5) cat = 'underweight';
  else if (bmi < 25)   cat = 'normal weight ✓';
  else if (bmi < 30)   cat = 'overweight';
  else                 cat = 'obese';

  showCalcResult(
    el,
    bmi.toFixed(1),
    `BMI — ${cat}`,
    "keep in mind BMI doesn't account for muscle. if you lift seriously you'll almost always read higher than you actually are."
  );
}

function calcBF() {
  const gender = document.getElementById('bf-gender').value;
  const height = parseFloat(document.getElementById('bf-height').value);
  const waist  = parseFloat(document.getElementById('bf-waist').value);
  const neck   = parseFloat(document.getElementById('bf-neck').value);
  const hip    = parseFloat(document.getElementById('bf-hip').value);
  const el     = document.getElementById('bf-result');

  if (isNaN(height) || isNaN(waist) || isNaN(neck)) {
    showCalcResult(el, '—', 'fill in all the measurements', '');
    return;
  }

  let bf;
  if (gender === 'male') {
    bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
  } else {
    if (isNaN(hip)) {
      showCalcResult(el, '—', 'hip measurement needed for women', '');
      return;
    }
    bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
  }

  bf = Math.max(0, bf);

  let cat;
  if (gender === 'male') {
    if      (bf < 6)  cat = 'essential fat range';
    else if (bf < 14) cat = 'athlete 🏆';
    else if (bf < 18) cat = 'fitness range ✓';
    else if (bf < 25) cat = 'average';
    else              cat = 'above average';
  } else {
    if      (bf < 14) cat = 'essential fat range';
    else if (bf < 21) cat = 'athlete 🏆';
    else if (bf < 25) cat = 'fitness range ✓';
    else if (bf < 32) cat = 'average';
    else              cat = 'above average';
  }

  showCalcResult(
    el,
    bf.toFixed(1) + '%',
    `body fat — ${cat}`,
    'using the US Navy method. measure in the morning for consistent results.'
  );
}

function showCalcResult(el, value, label, note) {
  el.innerHTML = `
    <div class="result-value">${value}</div>
    <div class="result-label">${label}</div>
    ${note ? `<div class="result-note">${note}</div>` : ''}
  `;
  el.classList.add('visible');
}


// ----- strength percentile -----
// rough standards based on symmetric strength community data
// not perfect science but gives a decent "where do i sit" feel

const standards = {
  'Bench Press':    { r50: 0.75, r75: 1.0,  r90: 1.25, r99: 1.75 },
  'Squat':          { r50: 1.0,  r75: 1.25, r90: 1.5,  r99: 2.0  },
  'Deadlift':       { r50: 1.25, r75: 1.5,  r90: 2.0,  r99: 2.5  },
  'Overhead Press': { r50: 0.5,  r75: 0.65, r90: 0.85, r99: 1.1  },
};

function calcRank() {
  const bw       = parseFloat(document.getElementById('rank-bw').value);
  const exercise = document.getElementById('rank-exercise').value;
  const best     = parseFloat(document.getElementById('rank-best').value);
  const el       = document.getElementById('rank-result');

  if (isNaN(bw) || isNaN(best) || bw <= 0 || best <= 0) {
    el.style.display = 'block';
    el.innerHTML = '<p class="empty-state">enter your bodyweight and best lift</p>';
    return;
  }

  const std   = standards[exercise];
  const ratio = best / bw;
  let pct;

  if      (ratio < std.r50) pct = Math.round((ratio / std.r50) * 50);
  else if (ratio < std.r75) pct = 50 + Math.round(((ratio - std.r50) / (std.r75 - std.r50)) * 25);
  else if (ratio < std.r90) pct = 75 + Math.round(((ratio - std.r75) / (std.r90 - std.r75)) * 15);
  else if (ratio < std.r99) pct = 90 + Math.round(((ratio - std.r90) / (std.r99 - std.r90)) * 9);
  else                      pct = 99;

  pct = Math.min(99, Math.max(1, pct));

  let tier, color, desc;
  if      (pct >= 99) { tier = 'ELITE';        color = '#e8ff47'; desc = "genuinely world-class for your weight class."; }
  else if (pct >= 90) { tier = 'ADVANCED';      color = '#47ff8a'; desc = "top 10%. most people who train for years never get here."; }
  else if (pct >= 75) { tier = 'INTERMEDIATE+'; color = '#47c8ff'; desc = "top 25%. stronger than the vast majority of gym-goers."; }
  else if (pct >= 50) { tier = 'INTERMEDIATE';  color = '#ff9f47'; desc = "above average. solid base, keep building."; }
  else                 { tier = 'BEGINNER';      color = '#ff6b35'; desc = "everyone starts here. gains come fast at this stage."; }

  el.style.display = 'block';
  el.innerHTML = `
    <div class="rank-pct" style="color:${color}">TOP ${100 - pct}%</div>
    <div class="rank-label">
      stronger than <strong style="color:${color}">${pct}%</strong> of people who train ${exercise}
    </div>
    <div class="rank-badge" style="background:${color}20;color:${color};border:1px solid ${color}40;">
      ${tier}
    </div>
    <p style="color:var(--muted);font-size:0.85rem;margin-top:0.8rem;">${desc}</p>
    <p style="color:#3a3a3a;font-size:0.78rem;margin-top:0.6rem;">
      ratio: ${ratio.toFixed(2)}× bodyweight &nbsp;·&nbsp; based on general population data, not exact science
    </p>
  `;
}


// ----- init -----
renderDashboard();
renderAllLogs();
