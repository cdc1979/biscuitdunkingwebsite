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
