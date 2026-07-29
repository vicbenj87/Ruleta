/* ══════════════════════════════════════════
   UI.JS – Card rendering & interaction
   ══════════════════════════════════════════ */

const UI = (() => {

  const { normalize } = ExerciseEngine;
  let _onSubmit = null;  // callback(result)

  // ── Main renderer ─────────────────────────
  function renderExercise(ex, onSubmit) {
    _onSubmit = onSubmit;
    const area = document.getElementById('card-area');
    area.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'ex-card';

    const labelEl = document.createElement('div');
    labelEl.className = 'ex-card-label';
    labelEl.textContent = `Ejercicio ${ex.number} · ${ex.label}`;
    card.appendChild(labelEl);

    const instrEl = document.createElement('div');
    instrEl.className = 'ex-card-instruction';
    instrEl.textContent = ex.instruction;
    card.appendChild(instrEl);

    switch (ex.type) {
      case 'write':       renderWrite(card, ex); break;
      case 'choice':      renderChoice(card, ex); break;
      case 'multi-choice':renderMultiChoice(card, ex); break;
      case 'drag':        renderDrag(card, ex); break;
      case 'intruder':    renderIntruder(card, ex); break;
      case 'tf':          renderTF(card, ex); break;
    }

    area.appendChild(card);

    // Focus first input
    const firstInput = card.querySelector('input');
    if (firstInput) setTimeout(() => firstInput.focus(), 80);
  }

  // ── WRITE ─────────────────────────────────
  function renderWrite(card, ex) {
    const verseEl = document.createElement('div');
    verseEl.className = 'verse-display';
    verseEl.innerHTML = ex.html;
    card.appendChild(verseEl);

    const btn = makeSubmitBtn('Comprobar');
    card.appendChild(btn);

    const inputs = [...verseEl.querySelectorAll('.blank-input')];

    // Submit on Enter
    inputs.forEach(inp => {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') btn.click();
      });
    });

    btn.addEventListener('click', () => {
      if (inputs.some(i => i.value.trim() === '')) return;
      const result = ex.validate(inputs);
      lockInputs(inputs, result.ok, ex.blankedTokens);
      btn.disabled = true;
      _onSubmit(result);
    });
  }

  function lockInputs(inputs, ok, correctTokens) {
    inputs.forEach((inp, i) => {
      const correct = normalize(inp.value.trim()) === normalize(correctTokens[i]);
      inp.className = 'blank-input ' + (correct ? 'correct' : 'wrong');
      inp.disabled = true;
    });
  }

  // ── CHOICE (1 answer) ─────────────────────
  function renderChoice(card, ex) {
    const verseEl = document.createElement('div');
    verseEl.className = 'verse-display';
    verseEl.innerHTML = ex.html;
    card.appendChild(verseEl);

    const grid = document.createElement('div');
    grid.className = 'options-grid';
    card.appendChild(grid);

    ex.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (grid.dataset.answered) return;
        grid.dataset.answered = '1';
        const result = ex.validate(opt);
        btn.classList.add(result.ok ? 'selected-correct' : 'selected-wrong');
        // Show correct if wrong
        if (!result.ok) {
          grid.querySelectorAll('.option-btn').forEach(b => {
            if (normalize(b.textContent) === normalize(ex.correct)) {
              b.classList.add('selected-correct');
            }
          });
        }
        grid.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
        _onSubmit(result);
      });
      grid.appendChild(btn);
    });
  }

  // ── MULTI-CHOICE (2 answers) ──────────────
  function renderMultiChoice(card, ex) {
    const verseEl = document.createElement('div');
    verseEl.className = 'verse-display';
    verseEl.innerHTML = ex.html;
    card.appendChild(verseEl);

    const instrSub = document.createElement('div');
    instrSub.style.cssText = 'font-size:.82rem;color:var(--c-text-dim);font-weight:700;';
    instrSub.textContent = 'Selecciona 2 opciones correctas';
    card.appendChild(instrSub);

    const grid = document.createElement('div');
    grid.className = 'options-grid';
    card.appendChild(grid);

    const selected = new Set();

    ex.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (grid.dataset.answered) return;
        if (selected.has(opt)) {
          selected.delete(opt);
          btn.classList.remove('selected-correct');
        } else {
          selected.add(opt);
          btn.classList.add('selected-correct');
        }
        if (selected.size === 2) {
          grid.dataset.answered = '1';
          const result = ex.validate([...selected]);
          // Visual feedback
          grid.querySelectorAll('.option-btn').forEach(b => {
            const isCorrect = ex.correctTokens.some(c => normalize(c) === normalize(b.textContent));
            const wasSelected = selected.has(b.textContent);
            b.disabled = true;
            if (isCorrect) b.classList.add('selected-correct');
            else if (wasSelected) { b.classList.remove('selected-correct'); b.classList.add('selected-wrong'); }
          });
          _onSubmit(result);
        }
      });
      grid.appendChild(btn);
    });

    // Submit button for safety
    const btn = makeSubmitBtn('Verificar selección');
    btn.style.marginTop = '6px';
    card.appendChild(btn);
    btn.addEventListener('click', () => {
      if (grid.dataset.answered || selected.size === 0) return;
      grid.dataset.answered = '1';
      const result = ex.validate([...selected]);
      grid.querySelectorAll('.option-btn').forEach(b => {
        const isCorrect = ex.correctTokens.some(c => normalize(c) === normalize(b.textContent));
        const wasSelected = selected.has(b.textContent);
        b.disabled = true;
        if (isCorrect) b.classList.add('selected-correct');
        else if (wasSelected) { b.classList.remove('selected-correct'); b.classList.add('selected-wrong'); }
      });
      btn.disabled = true;
      _onSubmit(result);
    });
  }

  // ── DRAG ──────────────────────────────────
  function renderDrag(card, ex) {
    // Phrase area
    const phraseLabel = document.createElement('div');
    phraseLabel.className = 'tray-label';
    phraseLabel.textContent = 'Versículo — arrastra la pieza al lugar correcto';
    card.appendChild(phraseLabel);

    const phraseEl = document.createElement('div');
    phraseEl.className = 'token-phrase';
    phraseEl.id = 'drag-phrase';
    card.appendChild(phraseEl);

    // Tray
    const trayLabel = document.createElement('div');
    trayLabel.className = 'tray-label';
    trayLabel.style.marginTop = '12px';
    trayLabel.textContent = 'Piezas disponibles';
    card.appendChild(trayLabel);

    const trayEl = document.createElement('div');
    trayEl.className = 'token-tray';
    trayEl.id = 'drag-tray';
    card.appendChild(trayEl);

    // Submit
    const btn = makeSubmitBtn('Verificar posición');
    card.appendChild(btn);

    // State: working copy of cleanTokens (without displaced ones)
    // phraseTokens has ALL tokens + punct markers
    // We build from ex.cleanTokens removing displaced indices
    const { cleanTokens, targetIndices, displaced, phraseTokens } = ex;
    // currentTokens: cleanTokens with displaced removed (compacted)
    // We track positions as an array
    let currentTokens = cleanTokens.map((tok, i) => ({
      tok,
      origIdx: i,
      isDisplaced: targetIndices.includes(i)
    })).filter(t => !t.isDisplaced).map(t => t.tok);

    // Tray tokens (displaced)
    const trayTokens = displaced.map(d => d.tok);

    // Dragging state
    let draggedTok = null;
    let draggedFrom = null; // 'phrase' or 'tray'
    let draggedIndex = null;

    function rebuildPhrase() {
      phraseEl.innerHTML = '';
      phraseEl.appendChild(makeDropZone(0));
      currentTokens.forEach((tok, idx) => {
        const block = makeTokenBlock(tok, idx, 'phrase');
        phraseEl.appendChild(block);
        phraseEl.appendChild(makeDropZone(idx + 1));
      });
    }

    function rebuildTray() {
      trayEl.innerHTML = '';
      trayTokens.forEach((tok, idx) => {
        const block = makeTokenBlock(tok, idx, 'tray');
        trayEl.appendChild(block);
      });
      // Auto-submit when all tokens placed
      if (trayTokens.length === 0 && !btn.disabled) {
        setTimeout(() => { if (!btn.disabled) btn.click(); }, 700);
      }
    }

    function makeTokenBlock(tok, idx, source) {
      const div = document.createElement('div');
      div.className = 'token-block ' + (Tokenizer.isNumber(tok) ? 'num' : 'word');
      div.textContent = tok;
      div.draggable = true;

      div.addEventListener('dragstart', e => {
        draggedTok = tok;
        draggedFrom = source;
        draggedIndex = idx;
        div.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      div.addEventListener('dragend', () => {
        div.classList.remove('dragging');
      });
      return div;
    }

    function makeDropZone(insertIdx) {
      const dz = document.createElement('div');
      dz.className = 'drop-zone';
      dz.dataset.insertIdx = insertIdx;

      dz.addEventListener('dragover', e => {
        e.preventDefault();
        dz.classList.add('active');
      });
      dz.addEventListener('dragleave', () => dz.classList.remove('active'));
      dz.addEventListener('drop', e => {
        e.preventDefault();
        dz.classList.remove('active');
        if (draggedTok === null) return;
        const insertAt = parseInt(dz.dataset.insertIdx);

        if (draggedFrom === 'phrase') {
          // Remove from phrase first
          currentTokens.splice(draggedIndex, 1);
          const newInsert = draggedIndex < insertAt ? insertAt - 1 : insertAt;
          currentTokens.splice(newInsert, 0, draggedTok);
        } else {
          // From tray
          trayTokens.splice(draggedIndex, 1);
          currentTokens.splice(insertAt, 0, draggedTok);
        }

        draggedTok = null;
        draggedFrom = null;
        draggedIndex = null;
        rebuildPhrase();
        rebuildTray();
      });
      return dz;
    }

    // Tray also accepts drops back
    trayEl.addEventListener('dragover', e => { e.preventDefault(); trayEl.style.borderColor = 'var(--c-purple)'; });
    trayEl.addEventListener('dragleave', () => { trayEl.style.borderColor = ''; });
    trayEl.addEventListener('drop', e => {
      e.preventDefault();
      trayEl.style.borderColor = '';
      if (draggedTok === null) return;
      if (draggedFrom === 'phrase') {
        currentTokens.splice(draggedIndex, 1);
        trayTokens.push(draggedTok);
      }
      draggedTok = null;
      draggedFrom = null;
      draggedIndex = null;
      rebuildPhrase();
      rebuildTray();
    });

    rebuildPhrase();
    rebuildTray();

    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      btn.disabled = true;
      const finalOrder = [...currentTokens, ...trayTokens];
      const result = ex.validate(finalOrder);
      _onSubmit(result);
    });
  }

  // ── INTRUDER ──────────────────────────────
  function renderIntruder(card, ex) {
    const phraseEl = document.createElement('div');
    phraseEl.className = 'intruder-phrase';
    card.appendChild(phraseEl);

    const btn = makeSubmitBtn('Confirmar selección');
    card.appendChild(btn);

    const eliminated = [];

    ex.allTokens.forEach((tok, i) => {
      const span = document.createElement('span');
      span.className = 'intruder-token ' + (Tokenizer.isNumber(tok) ? 'num' : 'word');
      span.textContent = tok;
      span.dataset.tok = tok;

      span.addEventListener('click', () => {
        if (phraseEl.dataset.answered) return;
        if (span.classList.contains('eliminated')) {
          // Toggle off
          span.classList.remove('eliminated');
          const idx = eliminated.indexOf(tok);
          if (idx > -1) eliminated.splice(idx, 1);
        } else {
          span.classList.add('eliminated');
          eliminated.push(tok);
        }
        // Auto-submit when required count reached
        if (eliminated.length >= ex.count) {
          phraseEl.dataset.answered = '1';
          const result = ex.validate(eliminated);
          btn.disabled = true;
          // Visual: mark correct/wrong eliminations
          phraseEl.querySelectorAll('.intruder-token').forEach(s => {
            const isFake = ex.intruderFakes.some(f => normalize(f) === normalize(s.dataset.tok));
            const wasElim = eliminated.some(e => normalize(e) === normalize(s.dataset.tok));
            if (wasElim && !isFake) s.classList.add('wrong-elim');
          });
          _onSubmit(result);
        }
      });
      phraseEl.appendChild(span);
    });

    btn.addEventListener('click', () => {
      if (phraseEl.dataset.answered || eliminated.length === 0) return;
      phraseEl.dataset.answered = '1';
      const result = ex.validate(eliminated);
      btn.disabled = true;
      _onSubmit(result);
    });
  }

  // ── TRUE / FALSE ──────────────────────────
  function renderTF(card, ex) {
    const verseEl = document.createElement('div');
    verseEl.className = 'tf-verse';
    verseEl.textContent = ex.displayText;
    card.appendChild(verseEl);

    const tfRow = document.createElement('div');
    tfRow.className = 'tf-buttons';
    card.appendChild(tfRow);

    ['true', 'false'].forEach(val => {
      const btn = document.createElement('button');
      btn.className = 'tf-btn ' + (val === 'true' ? 'true-btn' : 'false-btn');
      btn.textContent = val === 'true' ? '✓ Verdadero' : '✗ Falso';
      btn.addEventListener('click', () => {
        if (tfRow.dataset.answered) return;
        tfRow.dataset.answered = '1';
        const result = ex.validate(val);
        tfRow.querySelectorAll('.tf-btn').forEach(b => b.disabled = true);
        btn.style.transform = 'scale(1.06)';
        _onSubmit(result);
      });
      tfRow.appendChild(btn);
    });
  }

  // ── Helper: submit button ─────────────────
  function makeSubmitBtn(label) {
    const btn = document.createElement('button');
    btn.className = 'btn-submit';
    btn.textContent = label;
    return btn;
  }

  // ── Feedback overlay ──────────────────────
  function showFeedback(ok, correctAnswers, onDone) {
    const overlay = document.getElementById('feedback-overlay');
    const icon    = document.getElementById('feedback-icon');
    const msg     = document.getElementById('feedback-msg');
    const ans     = document.getElementById('feedback-answer');

    overlay.classList.remove('hidden');
    icon.textContent = ok ? '🎉' : '😅';
    msg.textContent  = ok ? '¡Correcto!' : 'Incorrecto';
    msg.className    = 'feedback-msg ' + (ok ? 'correct' : 'wrong');
    ans.innerHTML    = ok
      ? '<strong>¡Muy bien!</strong> Sigue así.'
      : `Respuesta correcta: <strong>${correctAnswers.join(', ')}</strong>`;

    // Launch confetti if correct
    if (ok) spawnConfetti();

    setTimeout(() => {
      overlay.classList.add('hidden');
      onDone();
    }, 2200);
  }

  // ── Confetti ──────────────────────────────
  function spawnConfetti() {
    const box = document.getElementById('feedback-box');
    const colors = ['#ffd166','#ec4899','#a855f7','#14b8a6','#22c55e','#f97316'];
    for (let i = 0; i < 18; i++) {
      const dot = document.createElement('div');
      dot.style.cssText = `
        position:absolute;width:8px;height:8px;border-radius:50%;
        background:${colors[i % colors.length]};
        top:50%;left:${10 + Math.random() * 80}%;
        animation: confettiDrop ${0.6 + Math.random() * 0.8}s ease forwards;
        animation-delay:${Math.random() * 0.3}s;
        pointer-events:none;
      `;
      box.appendChild(dot);
      setTimeout(() => dot.remove(), 1400);
    }
  }

  // ── Timer ─────────────────────────────────
  let timerInterval = null;
  const FULL_DASH = 188.5;

  function startTimer(seconds, onExpired) {
    stopTimer();
    const wrap = document.getElementById('timer-wrap');
    const ring = document.getElementById('timer-ring');
    const num  = document.getElementById('timer-num');
    wrap.classList.remove('hidden');
    ring.classList.remove('urgent');
    ring.style.strokeDashoffset = '0';
    num.textContent = seconds;

    let remaining = seconds;
    timerInterval = setInterval(() => {
      remaining--;
      num.textContent = remaining;
      const pct = remaining / seconds;
      ring.style.strokeDashoffset = ((1 - pct) * FULL_DASH).toString();
      if (remaining <= 5) {
        ring.classList.add('urgent');
        num.style.color = 'var(--c-red)';
        num.style.animation = 'timerPulse .5s ease infinite';
      }
      if (remaining <= 0) {
        stopTimer();
        onExpired();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    const wrap = document.getElementById('timer-wrap');
    const num  = document.getElementById('timer-num');
    wrap.classList.add('hidden');
    if (num) { num.style.color = ''; num.style.animation = ''; }
  }

  return { renderExercise, showFeedback, startTimer, stopTimer };
})();
