const list = document.querySelector('#summary-list');
const updated = document.querySelector('#board-updated');
const statTotal = document.querySelector('#stat-total');
const statRuns = document.querySelector('#stat-runs');
const statPopular = document.querySelector('#stat-popular');
const statPopularRuns = document.querySelector('#stat-popular-runs');
const statusLabels = document.querySelectorAll('[data-summary-status]');
const refreshButtons = document.querySelectorAll('[data-refresh]');
const summaryError = document.querySelector('[data-summary-error]');
const year = document.querySelector('#year');
const summaryUrl = 'https://biscuit-dunker-leaderboard.cdc1979.workers.dev/api/summary';
const countFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const decimalFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
let summaryLoading = false;

if (year) year.textContent = new Date().getFullYear();

document.querySelectorAll('a[data-play]').forEach((link) => {
  link.target = '_blank';
  link.rel = 'noopener';
  link.setAttribute('aria-label', 'Play Biscuit Dunking (opens a new window)');
});

document.addEventListener('click', (event) => {
  const link = event.target instanceof Element ? event.target.closest('a[data-play]') : null;
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const screenWidth = window.screen.availWidth || window.innerWidth;
  const screenHeight = window.screen.availHeight || window.innerHeight;
  const width = Math.floor(screenWidth * 0.3);
  const height = Math.floor(screenHeight * 0.9);
  const left = Math.round((screenWidth - width) / 2 + (window.screen.availLeft ?? 0));
  const top = Math.round((screenHeight - height) / 2 + (window.screen.availTop ?? 0));
  const features = `popup=yes,width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no,scrollbars=yes,resizable=yes`;
  const popup = window.open(link.href, 'biscuitDunkingGame', features);
  if (popup) {
    event.preventDefault();
    popup.focus();
  }
});

function setSummaryStatus(state, message) {
  statusLabels.forEach((label) => {
    label.dataset.state = state;
    label.textContent = message;
  });
}

function readSummary(data) {
  if (!data || data.ok !== true) throw new Error('Summary unavailable');
  const fields = ['total_global_biscuits_dunked', 'most_popular_biscuit_runs', 'average_dunk_life_seconds', 'average_dunks', 'completed_runs', 'dropped_in'];
  for (const field of fields) {
    if (typeof data[field] !== 'number' || !Number.isFinite(data[field]) || data[field] < 0) throw new Error('Incomplete summary');
  }
  if (typeof data.most_popular_biscuit !== 'string') throw new Error('Incomplete summary');
  return data;
}

function renderSummary(summary) {
  const total = countFormat.format(summary.total_global_biscuits_dunked);
  const popular = summary.most_popular_biscuit_runs > 0 ? summary.most_popular_biscuit : 'None yet';
  if (statTotal) {
    statTotal.textContent = total;
    statTotal.classList.toggle('long-total', total.length > 9);
  }
  if (statRuns) statRuns.textContent = countFormat.format(summary.completed_runs);
  if (statPopular) statPopular.textContent = popular;
  if (statPopularRuns) statPopularRuns.textContent = summary.most_popular_biscuit_runs > 0
    ? `${countFormat.format(summary.most_popular_biscuit_runs)} recorded runs`
    : 'Most popular biscuit';

  if (list) {
    const stats = [
      ['✦', 'Biscuits dunked worldwide', total, ''],
      ['◎', 'Most popular biscuit', popular, `${countFormat.format(summary.most_popular_biscuit_runs)} runs`],
      ['◷', 'Completed runs', countFormat.format(summary.completed_runs), ''],
      ['⌁', 'Average dunk life', decimalFormat.format(summary.average_dunk_life_seconds), 'seconds'],
      ['☕', 'Average dunks per run', decimalFormat.format(summary.average_dunks), 'dunks'],
      ['↓', 'Dropped in', countFormat.format(summary.dropped_in), 'biscuits'],
    ];
    const fragment = document.createDocumentFragment();
    for (const [icon, label, value, detail] of stats) {
      const row = document.createElement('div');
      row.className = 'summary-row';
      const term = document.createElement('dt');
      term.className = 'summary-label';
      const marker = document.createElement('span');
      marker.className = 'summary-icon';
      marker.setAttribute('aria-hidden', 'true');
      marker.textContent = icon;
      term.append(marker, document.createTextNode(label));
      const description = document.createElement('dd');
      description.className = 'summary-value';
      description.textContent = value;
      if (detail) {
        const note = document.createElement('small');
        note.textContent = detail;
        description.append(note);
      }
      row.append(term, description);
      fragment.append(row);
    }
    list.replaceChildren(fragment);
  }
  if (updated) updated.textContent = `Updated at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

async function loadSummary() {
  if (summaryLoading || (!list && !statTotal)) return;
  summaryLoading = true;
  refreshButtons.forEach((button) => { button.disabled = true; });
  setSummaryStatus('loading', 'Fetching totals…');
  if (summaryError) summaryError.hidden = true;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(summaryUrl, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Summary unavailable');
    renderSummary(readSummary(await response.json()));
    setSummaryStatus('ready', 'Live totals');
  } catch {
    setSummaryStatus('error', 'Temporarily unavailable');
    if (statTotal) statTotal.textContent = '—';
    if (statRuns) statRuns.textContent = '—';
    if (statPopular) statPopular.textContent = '—';
    if (statPopularRuns) statPopularRuns.textContent = 'Try again in a moment';
    if (summaryError) summaryError.hidden = false;
    if (list) {
      const message = document.createElement('div');
      message.className = 'score-empty';
      message.textContent = 'The biscuit tin is taking a tea break. Try refreshing the stats.';
      list.replaceChildren(message);
    }
    if (updated) updated.textContent = 'Totals unavailable';
  } finally {
    clearTimeout(timeout);
    summaryLoading = false;
    refreshButtons.forEach((button) => { button.disabled = false; });
  }
}

refreshButtons.forEach((button) => button.addEventListener('click', loadSummary));
loadSummary();
