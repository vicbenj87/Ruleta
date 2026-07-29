/* ══════════════════════════════════════════
   EXERCISES.JS – Exercise generators
   ══════════════════════════════════════════ */

const ExerciseEngine = (() => {

  // ── Helpers ──────────────────────────────
  const { shuffle, pickIndices, getFakes, isNumber, buildVerseData } = Tokenizer;

  function rand(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function pickN(arr, n) {
    const copy = [...arr];
    shuffle(copy);
    return copy.slice(0, n);
  }

  /**
   * Build verse display string with blanks replaced by underscores / tokens
   * Returns HTML string for display
   * blankedIndices: indices in cleanTokens to blank
   * showOriginalPunct: use original fullText to rebuild with blanks
   */
  function buildDisplayWithBlanks(verseData, blankedIndices, inputTag = false) {
    // Re-build from fullText replacing tokens at blankedIndices with blanks
    // We need to tokenize the fullText in sync with cleanTokens
    const { cleanTokens, fullText } = verseData;
    let tokIdx = 0;
    let html = '';
    let i = 0;

    while (i < fullText.length) {
      const ch = fullText[i];

      // Start of a token (letter or digit)?
      if (/[A-Za-zÀ-ÖØ-öø-ÿ\d]/.test(ch)) {
        // Collect full run of alphanumeric chars
        let raw = '';
        let start = i;
        while (i < fullText.length && /[A-Za-zÀ-ÖØ-öø-ÿ\d]/.test(fullText[i])) {
          raw += fullText[i];
          i++;
        }
        // Check if the next char is ':' followed by digit (verse ref like "5:1")
        // In that case, we have TWO tokens in this raw segment after tokenization
        // cleanTokens already split them; we emit them separately
        if (fullText[i] === ':' && i + 1 < fullText.length && /\d/.test(fullText[i + 1])) {
          // Emit first part (e.g. "5")
          html += emitToken(raw, tokIdx, blankedIndices, inputTag);
          tokIdx++;
          html += ':'; // keep colon for display
          i++;   // skip ':'
          // Collect second part (e.g. "1")
          let raw2 = '';
          while (i < fullText.length && /\d/.test(fullText[i])) {
            raw2 += fullText[i];
            i++;
          }
          html += emitToken(raw2, tokIdx, blankedIndices, inputTag);
          tokIdx++;
        } else {
          html += emitToken(raw, tokIdx, blankedIndices, inputTag);
          tokIdx++;
        }
      } else {
        html += escapeHtml(ch);
        i++;
      }
    }
    return html;
  }

  function emitToken(word, tokIdx, blankedIndices, inputTag) {
    if (blankedIndices.includes(tokIdx)) {
      const len = Math.max(word.length, 4);
      if (inputTag) {
        return `<input class="blank-input" data-idx="${tokIdx}" data-correct="${word}" size="${len}" autocomplete="off" spellcheck="false" placeholder="?" />`;
      } else {
        return `<span class="blank" data-idx="${tokIdx}" data-correct="${word}">${'_'.repeat(len)}</span>`;
      }
    }
    return escapeHtml(word);
  }

  function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /**
   * Build token-block spans for drag exercises
   */
  function buildTokenBlocks(cleanTokens, selectedIndices = []) {
    return cleanTokens.map((tok, i) => {
      const cls = isNumber(tok) ? 'num' : 'word';
      const isDraggable = selectedIndices.length === 0 || selectedIndices.includes(i);
      return { tok, idx: i, cls, draggable: isDraggable };
    });
  }

  // ── Exercise builders ─────────────────────

  // EX 1 – Write 1 word
  function ex_write1(vd) {
    const [bIdx] = pickIndices(vd.cleanTokens.length, 1);
    const correct = vd.cleanTokens[bIdx];
    return {
      type: 'write',
      label: 'Escribe la palabra que falta',
      instruction: 'Completa el versículo escribiendo el término que falta.',
      html: buildDisplayWithBlanks(vd, [bIdx], true),
      blankedIndices: [bIdx],
      blankedTokens: [correct],
      validate(inputs) {
        const val = inputs[0].value.trim();
        return { ok: normalize(val) === normalize(correct), correctAnswers: [correct] };
      }
    };
  }

  // EX 2 – Choose 1 word (4 options: 3 fake + 1 real)
  function ex_choose1(vd) {
    const [bIdx] = pickIndices(vd.cleanTokens.length, 1);
    const correct = vd.cleanTokens[bIdx];
    const fakes = getFakes(correct, 3);
    const options = shuffle([correct, ...fakes]);
    return {
      type: 'choice',
      label: 'Elige la opción correcta',
      instruction: 'Selecciona la palabra o número que completa el versículo.',
      html: buildDisplayWithBlanks(vd, [bIdx], false),
      options,
      correct,
      blankedIndices: [bIdx],
      validate(selected) {
        return { ok: normalize(selected) === normalize(correct), correctAnswers: [correct] };
      }
    };
  }

  // EX 3 – Drag 1 token to its place
  function ex_drag1(vd) {
    const [bIdx] = pickIndices(vd.cleanTokens.length, 1);
    return buildDragExercise(vd, [bIdx], 'Arrastra la pieza a su lugar correcto.');
  }

  // EX 4 – Find 1 intruder
  function ex_intruder1(vd) {
    return buildIntruderExercise(vd, 1, 'Haz clic sobre la palabra intrusa que NO pertenece al versículo.');
  }

  // EX 5 – True or False (synonym swap)
  function ex_tf1(vd) {
    return buildTFExercise(vd, 'Indica si el versículo está correcto o si tiene una palabra cambiada.');
  }

  // EX 6 – Write 2 words
  function ex_write2(vd) {
    return buildWriteExercise(vd, 2, 'Escribe las dos palabras o números que faltan.');
  }

  // EX 7 – Choose 2 words (5 options: 2 real + 3 fake)
  function ex_choose2(vd) {
    return buildChoose2Exercise(vd, 'Selecciona las dos palabras o números correctos.');
  }

  // EX 8 – Drag 2 tokens
  function ex_drag2(vd) {
    const chosen = pickIndices(vd.cleanTokens.length, 2);
    return buildDragExercise(vd, chosen, 'Arrastra las dos piezas a sus lugares correctos.');
  }

  // EX 9 – Find 2 intruders
  function ex_intruder2(vd) {
    return buildIntruderExercise(vd, 2, 'Elimina los dos intrusos que NO pertenecen al versículo.');
  }

  // EX 10 – True or False
  function ex_tf2(vd) {
    return buildTFExercise(vd, 'Indica si el versículo es verdadero o tiene alguna palabra cambiada.');
  }

  // EX 11 – Write 3 words (20s timer)
  function ex_write3_20(vd) {
    return buildWriteExercise(vd, 3, 'Escribe los tres elementos que faltan. ¡Tienes 20 segundos!');
  }

  // EX 12 – Choose 2 words, 5 options (20s)
  function ex_choose2_20(vd) {
    return buildChoose2Exercise(vd, '¡Con el tiempo encima! Selecciona los dos términos correctos.');
  }

  // EX 13 – Drag 3 tokens (20s)
  function ex_drag3_20(vd) {
    const chosen = pickIndices(vd.cleanTokens.length, 3);
    return buildDragExercise(vd, chosen, 'Coloca las tres piezas en su lugar. ¡20 segundos!');
  }

  // EX 14 – Find 3 intruders (20s)
  function ex_intruder3_20(vd) {
    return buildIntruderExercise(vd, 3, 'Elimina los tres intrusos antes de que se acabe el tiempo.');
  }

  // EX 15 – True or False (20s)
  function ex_tf3_20(vd) {
    return buildTFExercise(vd, '¿Verdadero o Falso? ¡Solo tienes 20 segundos!');
  }

  // EX 16 – Write 3 words (10s)
  function ex_write3_10(vd) {
    return buildWriteExercise(vd, 3, 'Escribe los tres elementos. ¡Solo 10 segundos!');
  }

  // EX 17 – Choose 2 words (10s)
  function ex_choose2_10(vd) {
    return buildChoose2Exercise(vd, 'Selecciona los dos términos correctos. ¡10 segundos!');
  }

  // EX 18 – Drag 3 tokens (10s)
  function ex_drag3_10(vd) {
    const chosen = pickIndices(vd.cleanTokens.length, 3);
    return buildDragExercise(vd, chosen, 'Arrastra las tres piezas. ¡10 segundos!');
  }

  // EX 19 – Find 3 intruders (10s)
  function ex_intruder3_10(vd) {
    return buildIntruderExercise(vd, 3, 'Elimina los tres intrusos. ¡Velocidad máxima!');
  }

  // EX 20 – True or False (10s)
  function ex_tf4_10(vd) {
    return buildTFExercise(vd, '¿El versículo es correcto? ¡10 segundos para decidir!');
  }

  // ── Shared builders ───────────────────────

  function buildWriteExercise(vd, count, instruction) {
    const blankedIndices = pickIndices(vd.cleanTokens.length, count);
    const blankedTokens = blankedIndices.map(i => vd.cleanTokens[i]);
    return {
      type: 'write',
      label: `Escribe ${count > 1 ? `las ${count} palabras` : 'la palabra'} que falta${count > 1 ? 'n' : ''}`,
      instruction,
      html: buildDisplayWithBlanks(vd, blankedIndices, true),
      blankedIndices,
      blankedTokens,
      validate(inputs) {
        let allOk = true;
        inputs.forEach((inp, i) => {
          const ok = normalize(inp.value.trim()) === normalize(blankedTokens[i]);
          if (!ok) allOk = false;
        });
        return { ok: allOk, correctAnswers: blankedTokens };
      }
    };
  }

  function buildChoose2Exercise(vd, instruction) {
    const chosen = pickIndices(vd.cleanTokens.length, 2);
    const correctTokens = chosen.map(i => vd.cleanTokens[i]);
    // 3 fakes — mix word and number fakes based on types
    const fakeWords = getFakes(correctTokens[0], 2, correctTokens);
    const fakeNum   = getFakes(correctTokens[1], 1, [...correctTokens, ...fakeWords]);
    const fakes = shuffle([...fakeWords, ...fakeNum]).slice(0, 3);
    const allOptions = shuffle([...correctTokens, ...fakes]);
    return {
      type: 'multi-choice',
      label: 'Elige los términos correctos',
      instruction,
      html: buildDisplayWithBlanks(vd, chosen, false),
      options: allOptions,
      correctTokens,
      blankedIndices: chosen,
      validate(selected) {
        const ok = selected.length === 2 &&
          correctTokens.every(c => selected.some(s => normalize(s) === normalize(c)));
        return { ok, correctAnswers: correctTokens };
      }
    };
  }

  function buildDragExercise(vd, targetIndices, instruction) {
    const { cleanTokens, fullText } = vd;
    // Build phrase tokens KEEPING punctuation from original
    // Phrase = array of {tok, origIdx, isPunct?, isSpace?}
    const phraseTokens = buildPhraseWithPunct(fullText, cleanTokens);

    // Remove target tokens from phrase
    const displaced = targetIndices.map(i => ({ tok: cleanTokens[i], origIdx: i }));

    return {
      type: 'drag',
      label: 'Arrastra la pieza a su lugar',
      instruction,
      phraseTokens,
      displaced,
      targetIndices,
      cleanTokens: [...cleanTokens],
      validate(currentOrder) {
        // currentOrder: array of cleanTokens in their current position (after drag)
        let allOk = true;
        for (let i = 0; i < targetIndices.length; i++) {
          if (normalize(currentOrder[targetIndices[i]]) !== normalize(cleanTokens[targetIndices[i]])) {
            allOk = false;
            break;
          }
        }
        return { ok: allOk, correctAnswers: displaced.map(d => d.tok) };
      }
    };
  }

  function buildIntruderExercise(vd, count, instruction) {
    const { cleanTokens } = vd;
    // Get `count` fake tokens
    const intruderFakes = [];
    const usedFakes = [];
    for (let k = 0; k < count; k++) {
      const fakePool = [
        ...FAKE_WORDS.filter(f => !cleanTokens.includes(f) && !usedFakes.includes(f)),
        ...FAKE_NUMBERS.filter(f => !cleanTokens.includes(f) && !usedFakes.includes(f))
      ];
      shuffle(fakePool);
      const fake = fakePool[0] || `intruso${k}`;
      intruderFakes.push(fake);
      usedFakes.push(fake);
    }

    // Insert intruders at random positions
    const allTokens = [...cleanTokens];
    const intruderPositions = [];
    for (const fake of intruderFakes) {
      const pos = Math.floor(Math.random() * (allTokens.length + 1));
      allTokens.splice(pos, 0, fake);
      intruderPositions.push(pos);
    }

    return {
      type: 'intruder',
      label: `Elimina ${count > 1 ? `los ${count} intrusos` : 'el intruso'}`,
      instruction,
      allTokens,
      intruderFakes,
      count,
      validate(eliminated) {
        const allFound = intruderFakes.every(f =>
          eliminated.some(e => normalize(e) === normalize(f))
        );
        const noFalsePositives = eliminated.every(e =>
          intruderFakes.some(f => normalize(f) === normalize(e))
        );
        return {
          ok: allFound && noFalsePositives && eliminated.length === count,
          correctAnswers: intruderFakes
        };
      }
    };
  }

  function buildTFExercise(vd, instruction) {
    const { cleanTokens, fullText } = vd;
    // Choose 1 random token to potentially swap
    const [tIdx] = pickIndices(cleanTokens.length, 1);
    const original = cleanTokens[tIdx];
    const fakes = getFakes(original, 3);
    const useSwap = Math.random() < 0.5;
    const replacement = useSwap ? rand(fakes) : original;

    // Rebuild fullText with replacement
    let displayText = fullText;
    if (useSwap) {
      // Replace original token in fullText
      const regex = new RegExp(`(?<![A-Za-zÀ-ÖØ-öø-ÿ])${escapeRegex(original)}(?![A-Za-zÀ-ÖØ-öø-ÿ])`, '');
      displayText = fullText.replace(regex, replacement);
    }

    const isTrue = !useSwap;
    return {
      type: 'tf',
      label: 'Verdadero o Falso',
      instruction,
      displayText,
      isTrue,
      swapped: useSwap ? { original, replacement } : null,
      validate(answer) {
        const ok = (answer === 'true') === isTrue;
        return {
          ok,
          correctAnswers: isTrue
            ? ['Verdadero — el versículo está correcto']
            : [`Falso — "${replacement}" debería ser "${original}"`]
        };
      }
    };
  }

  // ── Punct-aware phrase builder ────────────
  function buildPhraseWithPunct(fullText, cleanTokens) {
    const result = [];
    let tokIdx = 0;
    let i = 0;
    while (i < fullText.length) {
      if (/[A-Za-zÀ-ÖØ-öø-ÿ\d]/.test(fullText[i])) {
        let word = '';
        while (i < fullText.length && /[A-Za-zÀ-ÖØ-öø-ÿ\d]/.test(fullText[i])) {
          word += fullText[i++];
        }
        // Check for colon-digit (verse ref split)
        if (fullText[i] === ':' && i + 1 < fullText.length && /\d/.test(fullText[i + 1])) {
          result.push({ type: 'token', tok: word, origIdx: tokIdx });
          tokIdx++;
          result.push({ type: 'punct', tok: ':' });
          i++; // skip ':'
          let word2 = '';
          while (i < fullText.length && /\d/.test(fullText[i])) {
            word2 += fullText[i++];
          }
          result.push({ type: 'token', tok: word2, origIdx: tokIdx });
          tokIdx++;
        } else {
          result.push({ type: 'token', tok: word, origIdx: tokIdx });
          tokIdx++;
        }
      } else {
        result.push({ type: 'punct', tok: fullText[i] });
        i++;
      }
    }
    return result;
  }

  // ── String utils ──────────────────────────
  function normalize(s) {
    return s.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ── Exercise sequence ─────────────────────
  const EXERCISE_DEFS = [
    { fn: ex_write1,       timer: 0  },  // 1
    { fn: ex_choose1,      timer: 0  },  // 2
    { fn: ex_drag1,        timer: 0  },  // 3
    { fn: ex_intruder1,    timer: 0  },  // 4
    { fn: ex_tf1,          timer: 0  },  // 5
    { fn: ex_write2,       timer: 0  },  // 6
    { fn: ex_choose2,      timer: 0  },  // 7
    { fn: ex_drag2,        timer: 0  },  // 8
    { fn: ex_intruder2,    timer: 0  },  // 9
    { fn: ex_tf2,          timer: 0  },  // 10
    { fn: ex_write3_20,    timer: 20 },  // 11
    { fn: ex_choose2_20,   timer: 20 },  // 12
    { fn: ex_drag3_20,     timer: 20 },  // 13
    { fn: ex_intruder3_20, timer: 20 },  // 14
    { fn: ex_tf3_20,       timer: 20 },  // 15
    { fn: ex_write3_10,    timer: 10 },  // 16
    { fn: ex_choose2_10,   timer: 10 },  // 17
    { fn: ex_drag3_10,     timer: 10 },  // 18
    { fn: ex_intruder3_10, timer: 10 },  // 19
    { fn: ex_tf4_10,       timer: 10 },  // 20
  ];

  function buildAll(verse) {
    const vd = buildVerseData(verse);
    return EXERCISE_DEFS.map((def, i) => {
      const ex = def.fn(vd);
      ex.number = i + 1;
      ex.timer  = def.timer;
      ex.verseData = vd;
      return ex;
    });
  }

  return { buildAll, normalize };
})();
