/* ══════════════════════════════════════════
   APP.JS – Main controller
   ══════════════════════════════════════════ */

(function () {
  'use strict';

  // ── State ─────────────────────────────────
  let exercises    = [];
  let currentIdx   = 0;
  let scoreCorrect = 0;
  let scoreWrong   = 0;
  let selectedVerse = null;
  let answered     = false;

  // ── DOM references ─────────────────────────
  const screens = {
    home:      document.getElementById('screen-home'),
    exercises: document.getElementById('screen-exercises'),
    results:   document.getElementById('screen-results'),
  };

  // ── Init ──────────────────────────────────
  function init() {
    spawnParticles();
    bindButtons();

    // Init roulette
    Roulette.init(
      document.getElementById('roulette-canvas'),
      handleRouletteResult
    );

    // Spin button
    const spinBtn = document.getElementById('spin-btn');
    spinBtn.addEventListener('click', () => Roulette.spin());
    spinBtn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') Roulette.spin();
    });
  }

  // ── Buttons ───────────────────────────────
  function bindButtons() {
    document.getElementById('btn-back-home').addEventListener('click', goHome);
    document.getElementById('btn-home-from-results').addEventListener('click', goHome);
    document.getElementById('btn-retry').addEventListener('click', () => {
      if (selectedVerse) startGame(selectedVerse);
    });
  }

  // ── Screen management ─────────────────────
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goHome() {
    UI.stopTimer();
    showScreen('home');
    document.getElementById('roulette-result').classList.add('hidden');
  }

  // ── Roulette result ───────────────────────
  function handleRouletteResult(idx) {
    const verse = VERSES[idx];
    selectedVerse = verse;

    // Show result banner briefly
    const resultEl = document.getElementById('roulette-result');
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = `<h3>${verse.ref}</h3><p>${verse.text}</p>`;

    // Redirect after 1.6s
    setTimeout(() => {
      resultEl.classList.add('hidden');
      startGame(verse);
    }, 1600);
  }

  // ── Game start ────────────────────────────
  function startGame(verse) {
    selectedVerse = verse;
    exercises     = ExerciseEngine.buildAll(verse);
    currentIdx    = 0;
    scoreCorrect  = 0;
    scoreWrong    = 0;
    answered      = false;

    updateScoreDisplay();
    updateProgressDisplay();

    document.getElementById('ex-verse-ref').textContent = verse.ref;

    showScreen('exercises');
    renderCurrentExercise();
  }

  // ── Render exercise ───────────────────────
  function renderCurrentExercise() {
    answered = false;
    const ex = exercises[currentIdx];
    updateProgressDisplay();

    UI.stopTimer();

    UI.renderExercise(ex, (result) => {
      if (answered) return;
      answered = true;
      UI.stopTimer();
      handleAnswer(result);
    });

    // Timer
    if (ex.timer > 0) {
      UI.startTimer(ex.timer, () => {
        if (answered) return;
        answered = true;
        handleAnswer({ ok: false, correctAnswers: exercises[currentIdx].verseData?.cleanTokens || ['(tiempo agotado)'] });
      });
    }
  }

  // ── Handle answer ─────────────────────────
  function handleAnswer(result) {
    if (result.ok) scoreCorrect++;
    else           scoreWrong++;
    updateScoreDisplay();

    // Clamp correctAnswers for display
    const display = (result.correctAnswers || []).slice(0, 4);

    UI.showFeedback(result.ok, display, () => {
      currentIdx++;
      if (currentIdx >= exercises.length) {
        showResults();
      } else {
        renderCurrentExercise();
      }
    });
  }

  // ── Score & progress ──────────────────────
  function updateScoreDisplay() {
    document.getElementById('score-correct').textContent = scoreCorrect;
    document.getElementById('score-wrong').textContent   = scoreWrong;
  }

  function updateProgressDisplay() {
    const total = exercises.length;
    const curr  = Math.min(currentIdx + 1, total);
    document.getElementById('ex-counter').textContent = `${curr} / ${total}`;
    const pct = ((currentIdx) / total * 100).toFixed(1);
    document.getElementById('ex-progress-fill').style.width = `${pct}%`;
  }

  // ── Results ───────────────────────────────
  function showResults() {
    const total = exercises.length;
    const pct   = Math.round((scoreCorrect / total) * 100);

    document.getElementById('res-correct').textContent = scoreCorrect;
    document.getElementById('res-wrong').textContent   = scoreWrong;
    document.getElementById('res-score').textContent   = `${pct}%`;
    document.getElementById('results-verse-ref').textContent = selectedVerse.ref;
    document.getElementById('results-verse-text').textContent = selectedVerse.text;

    // Trophy emoji based on score
    const trophy = document.querySelector('.results-trophy');
    if (pct >= 90)      trophy.textContent = '🏆';
    else if (pct >= 70) trophy.textContent = '🥈';
    else if (pct >= 50) trophy.textContent = '🥉';
    else                trophy.textContent = '📖';

    showScreen('results');
  }

  // ── Particles ─────────────────────────────
  function spawnParticles() {
    const container = document.getElementById('particles');
    const colors = ['#a855f7','#ec4899','#ffd166','#14b8a6','#38bdf8','#22c55e'];
    const sizes  = [4, 6, 8, 10, 14, 18];

    for (let i = 0; i < 28; i++) {
      const dot = document.createElement('div');
      dot.className = 'particle';
      const size  = sizes[Math.floor(Math.random() * sizes.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left  = Math.random() * 100;
      const dur   = 14 + Math.random() * 20;
      const delay = Math.random() * 18;

      dot.style.cssText = `
        width:${size}px; height:${size}px;
        background:${color};
        left:${left}%;
        --dur:${dur}s; --delay:${delay}s;
        animation-delay:${delay}s;
      `;
      container.appendChild(dot);
    }
  }

  // ── Boot ──────────────────────────────────
  init();
})();
