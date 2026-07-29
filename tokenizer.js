/* ══════════════════════════════════════════
   TOKENIZER.JS – Text processing utils
   ══════════════════════════════════════════ */

const Tokenizer = (() => {

  /**
   * Build full text = "Ref Text" (reference + verse text)
   * Returns { fullText, cleanTokens, originalText }
   * cleanTokens: array without punctuation/symbols, used for exercises
   * originalText: the reference + verse text for display (with original punctuation)
   */
  function buildVerseData(verse) {
    // Full reference string → clean tokens (book can be "Romanos", "2 Corintios", etc.)
    const fullText = `${verse.ref} ${verse.text}`;
    const cleanTokens = tokenize(fullText);
    return {
      fullText,
      cleanTokens,
      originalText: verse.text,
      ref: verse.ref
    };
  }

  /**
   * Remove punctuation and split by spaces → string[]
   * Special case: colons between digits (e.g. "5:1") are treated as separators
   */
  function tokenize(str) {
    // Replace colons between digits with a space (handles verse refs like 5:1, 119:105)
    let clean = str.replace(/(\d):(\d)/g, '$1 $2');
    // Remove ALL punctuation / symbols except word chars, digits, spaces
    // Keep diacritics (Spanish accented chars)
    clean = clean.replace(/[.,;:¿?¡!"""''()\[\]{}…–—\/\\*#@&^%$+=~`|<>]/g, '');
    return clean.split(/\s+/).filter(t => t.length > 0);
  }

  /**
   * Is a token numeric?
   */
  function isNumber(token) {
    return /^\d+$/.test(token);
  }

  /**
   * Get N distinct random fake tokens of the correct type
   * (word fakes for word tokens, number fakes for number tokens)
   */
  function getFakes(token, count, alreadyUsed = []) {
    const pool = isNumber(token) ? [...FAKE_NUMBERS] : [...FAKE_WORDS];
    const available = pool.filter(f => !alreadyUsed.includes(f) && f !== token);
    shuffle(available);
    return available.slice(0, count);
  }

  /**
   * Get N fakes matching the same numeric/word type
   * Used when picking fakes that are all the same type as the token
   */
  function getFakesForTokens(tokens, count, alreadyUsed = []) {
    const hasNum  = tokens.some(isNumber);
    const hasWord = tokens.some(t => !isNumber(t));

    let pool = [];
    if (hasNum)  pool = pool.concat(FAKE_NUMBERS.filter(f => !alreadyUsed.includes(f)));
    if (hasWord) pool = pool.concat(FAKE_WORDS.filter(f => !alreadyUsed.includes(f) && !tokens.includes(f)));
    shuffle(pool);
    return pool.slice(0, count);
  }

  /**
   * Fisher-Yates shuffle (in-place)
   */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Pick N distinct random indices from [0, max)
   */
  function pickIndices(max, count) {
    const indices = Array.from({ length: max }, (_, i) => i);
    shuffle(indices);
    return indices.slice(0, Math.min(count, max));
  }

  /**
   * Rebuild display text from tokens keeping original punctuation around tokens.
   * For display in "verdadero o falso" we reconstruct from original fullText
   * swapping certain tokens.
   * We do a word-by-word replacement using the cleanToken array as a guide.
   */
  function reconstructWithSwap(cleanTokens, fullText, swapMap) {
    // swapMap: { originalIndex → replacementString }
    let result = fullText;
    // We'll replace tokens in their original text positions carefully
    // Simpler approach: rebuild from clean tokens with swaps, then rejoin
    const rebuilt = cleanTokens.map((tok, i) => swapMap[i] !== undefined ? swapMap[i] : tok);
    // Now re-insert punctuation from original
    return reinsertPunctuation(fullText, cleanTokens, rebuilt);
  }

  /**
   * Re-insert original punctuation when rebuilding display text.
   * Strategy: scan fullText, match each "word" (non-punctuation run) to its clean token,
   * and replace it with the rebuilt token.
   */
  function reinsertPunctuation(fullText, origTokens, newTokens) {
    let tokenIdx = 0;
    // Split preserving delimiters
    const result = fullText.replace(/([A-Za-zÀ-ÖØ-öø-ÿ\d]+)/g, (match) => {
      if (tokenIdx < origTokens.length && origTokens[tokenIdx] === match) {
        const replacement = newTokens[tokenIdx] !== undefined ? newTokens[tokenIdx] : match;
        tokenIdx++;
        return replacement;
      }
      return match;
    });
    return result;
  }

  return {
    buildVerseData,
    tokenize,
    isNumber,
    getFakes,
    getFakesForTokens,
    shuffle,
    pickIndices,
    reconstructWithSwap
  };
})();
