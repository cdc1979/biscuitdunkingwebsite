const list = document.querySelector('#summary-list');
const updated = document.querySelector('#board-updated');
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

function renderSummary(summary) {
  if (!list) return;
  const count = (value) => Number(value ?? 0).toLocaleString();
  const decimal = (value) => Number(value ?? 0).toFixed(1);
  const stats = [
    ['✦', 'Biscuits dunked worldwide', count(summary.total_global_biscuits_dunked)],
    ['▧', 'Most popular biscuit', `${escapeText(summary.most_popular_biscuit || '—')} <small>${count(summary.most_popular_biscuit_runs)} RUNS</small>`],
    ['◷', 'Completed runs', count(summary.completed_runs)],
    ['⌁', 'Average dunk life', `${decimal(summary.average_dunk_life_seconds)} <small>SECONDS</small>`],
    ['☕', 'Average dunks per run', decimal(summary.average_dunks)],
    ['↓', 'Dropped in', count(summary.dropped_in)],
  ];
  list.innerHTML = stats.map(([icon, label, value]) => `<div class="summary-row"><span class="summary-icon">${icon}</span><span class="summary-label">${label}</span><span class="summary-value">${value}</span></div>`).join('');
  updated.textContent = `UPDATED ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
function escapeText(text) {
  const el = document.createElement('span');
  el.textContent = String(text ?? 'Mug');
  return el.innerHTML;
}
async function loadScores() {
  if (!list) return;
  try {
    const response = await fetch('https://biscuit-dunker-leaderboard.cdc1979.workers.dev/api/summary', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Summary unavailable');
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || 'Summary unavailable');
    renderSummary(data);
  } catch {
    list.innerHTML = '<div class="score-empty">The biscuit tin is taking a tea break. Try again in a moment.</div>';
    updated.textContent = 'GLOBAL STATS TEMPORARILY UNAVAILABLE';
  }
}
loadScores();

const stage = document.querySelector('#game-stage');
if (stage) {
  const button = document.querySelector('#dip-button');
  const biscuit = document.querySelector('#game-biscuit');
  const fill = document.querySelector('#gauge-fill');
  const prompt = document.querySelector('#game-prompt');
  const scoreEl = document.querySelector('#game-score');
  const dunkEl = document.querySelector('#game-dunks');
  const biscuitEl = document.querySelector('#game-biscuits');
  const result = document.querySelector('#game-result');
  let score = 0, dunks = 0, biscuits = 0, active = false, startedAt = 0, timer = 0, dip = 0;
  const setMessage = (message) => { result.textContent = message; };
  function endDip() {
    if (!active) return;
    active = false;
    clearInterval(timer);
    button.classList.remove('is-dipping');
    biscuit.classList.remove('dipping');
    const elapsed = Date.now() - startedAt;
    dip = Math.min(100, Math.round(elapsed / 16));
    fill.style.height = `${dip}%`;
    if (dip < 20) {
      setMessage('A little too quick — give it a proper dunk!');
    } else if (dip <= 72) {
      const points = Math.max(10, Math.round((100 - Math.abs(dip - 58) * 1.6) * Math.max(1, Math.floor(dip / 28))));
      score += points; dunks++;
      scoreEl.textContent = score;
      dunkEl.textContent = dunks;
      biscuits++;
      biscuitEl.textContent = biscuits;
      biscuit.classList.toggle('biscuit-hero', false);
      biscuit.animate([{ transform: 'rotate(-15deg) translateY(24px)' }, { transform: 'rotate(-23deg) translateY(0)' }], { duration: 380, easing: 'ease-out' });
      setMessage(dip >= 50 && dip <= 65 ? `Golden dip! +${points} points` : `Lovely dunk! +${points} points`);
    } else {
      biscuit.classList.add('dropped');
      setMessage('Crumbly ending! That biscuit’s gone to the bottom.');
      button.textContent = 'New biscuit';
      button.dataset.restart = 'true';
    }
    prompt.textContent = 'DIP DEPTH';
    fill.style.height = `${dip}%`;
  }
  function startDip(event) {
    if (event) event.preventDefault();
    if (button.dataset.restart === 'true') {
      score = 0; dunks = 0; biscuits = 0;
      scoreEl.textContent = '0'; dunkEl.textContent = '0'; biscuitEl.textContent = '0';
      biscuit.classList.remove('dropped');
      button.dataset.restart = '';
      button.textContent = 'Hold to dunk';
      fill.style.height = '0%';
      setMessage('Steady now. Find your sweet spot.');
      return;
    }
    if (active || biscuit.classList.contains('dropped')) return;
    active = true; startedAt = Date.now();
    button.classList.add('is-dipping'); biscuit.classList.add('dipping');
    prompt.textContent = 'HOLD… HOLD…';
    setMessage('');
    timer = window.setInterval(() => {
      dip = Math.min(100, Math.round((Date.now() - startedAt) / 16));
      fill.style.height = `${dip}%`;
      if (dip >= 100) endDip();
    }, 40);
  }
  button.addEventListener('pointerdown', startDip);
  window.addEventListener('pointerup', endDip);
  window.addEventListener('pointercancel', endDip);
  button.addEventListener('keydown', (event) => { if (event.key === ' ' || event.key === 'Enter') startDip(event); });
  button.addEventListener('keyup', (event) => { if (event.key === ' ' || event.key === 'Enter') endDip(); });
  button.addEventListener('click', (event) => event.preventDefault());
}
