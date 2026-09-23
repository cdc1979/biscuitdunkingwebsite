const list = document.querySelector('#score-list');
const updated = document.querySelector('#board-updated');
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const faces = ['🍪', '☕', '🍯', '🥮', '🫖', '🍪', '🥛', '🍩', '🍪', '🧁'];
const medals = ['✦', '✦', '✦'];
function renderScores(scores) {
  if (!list) return;
  if (!scores.length) {
    list.innerHTML = '<li class="score-empty">No dunkers just yet. Be the first to claim the mug.</li>';
    updated.textContent = 'THE FIRST SCORE IS YOURS';
    return;
  }
  list.innerHTML = scores.map((row, i) => `<li class="score-row">
    <span class="rank"><span class="medal">${medals[i] || String(i + 1).padStart(2, '0')}</span><span>#${i + 1}</span></span>
    <span class="player-cell"><span class="player-avatar">${faces[(row.id || i) % faces.length]}</span><span><span class="player-name">${escapeText(row.player)}</span><span class="player-sub">${row.dunks} ${row.dunks === 1 ? 'DUNK' : 'DUNKS'} · ${row.biscuits} BISCUITS</span></span></span>
    <span class="score-number">${Number(row.score).toLocaleString()}</span>
    <span class="score-metric">${row.biscuits}<small>BISCUITS</small></span>
    <span class="score-metric">${row.bestDip}%<small>BEST DIP</small></span>
  </li>`).join('');
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
    const response = await fetch('/api/leaderboard', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Scoreboard unavailable');
    const data = await response.json();
    renderScores(Array.isArray(data.scores) ? data.scores : []);
  } catch {
    list.innerHTML = '<li class="score-empty">The biscuit tin is taking a tea break. Try again in a moment.</li>';
    updated.textContent = 'SCORES TEMPORARILY UNAVAILABLE';
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
  let score = 0, dunks = 0, biscuits = 0, bestDip = 0, active = false, startedAt = 0, timer = 0, dip = 0, round = 0;
  const alias = `Mug-${crypto.getRandomValues(new Uint16Array(1))[0].toString(16).toUpperCase().padStart(4, '0').slice(-4)}`;
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
      score += points; dunks++; round++;
      if (dip > bestDip) bestDip = dip;
      scoreEl.textContent = score;
      dunkEl.textContent = dunks;
      biscuits++;
      biscuitEl.textContent = biscuits;
      biscuit.classList.toggle('biscuit-hero', false);
      biscuit.animate([{ transform: 'rotate(-15deg) translateY(24px)' }, { transform: 'rotate(-23deg) translateY(0)' }], { duration: 380, easing: 'ease-out' });
      setMessage(dip >= 50 && dip <= 65 ? `Golden dip! +${points} points` : `Lovely dunk! +${points} points`);
      if (score > 0 && round % 2 === 0) submitScore();
    } else {
      round++;
      biscuit.classList.add('dropped');
      setMessage('Crumbly ending! That biscuit’s gone to the bottom.');
      button.textContent = 'New biscuit';
      button.dataset.restart = 'true';
      if (dunks > 0) submitScore();
    }
    prompt.textContent = 'DIP DEPTH';
    fill.style.height = `${dip}%`;
  }
  function startDip(event) {
    if (event) event.preventDefault();
    if (button.dataset.restart === 'true') {
      score = 0; dunks = 0; biscuits = 0; bestDip = 0; round = 0;
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
  async function submitScore() {
    try {
      await fetch('/api/leaderboard', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: alias, score, dunks, bestDip, biscuits }),
      });
    } catch { /* A local run remains playable if the score service is away. */ }
  }
  button.addEventListener('pointerdown', startDip);
  window.addEventListener('pointerup', endDip);
  window.addEventListener('pointercancel', endDip);
  button.addEventListener('keydown', (event) => { if (event.key === ' ' || event.key === 'Enter') startDip(event); });
  button.addEventListener('keyup', (event) => { if (event.key === ' ' || event.key === 'Enter') endDip(); });
  button.addEventListener('click', (event) => event.preventDefault());
}
