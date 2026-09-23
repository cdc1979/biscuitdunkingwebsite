const list = document.querySelector('#summary-list');
const updated = document.querySelector('#board-updated');
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

document.querySelectorAll('a[href="/play/"]').forEach((link) => {
  link.target = '_blank';
  link.rel = 'noopener';
});

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href="/play/"]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const screenWidth = window.screen.availWidth || window.innerWidth;
  const screenHeight = window.screen.availHeight || window.innerHeight;
  const width = Math.floor(screenWidth * 0.3);
  const height = Math.floor(screenHeight * 0.9);
  const left = Math.round((screenWidth - width) / 2 + (window.screen.availLeft ?? 0));
  const top = Math.round((screenHeight - height) / 2 + (window.screen.availTop ?? 0));
  const features = `popup=yes,width=${width},height=${height},innerWidth=${width},innerHeight=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no,scrollbars=yes,resizable=yes`;
  const popup = window.open(link.href, 'biscuitDunkingGame', features);
  if (popup) {
    event.preventDefault();
    popup.focus();
  }
});

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
