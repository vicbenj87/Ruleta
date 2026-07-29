/* ══════════════════════════════════════════
   ROULETTE.JS – Canvas wheel logic
   ══════════════════════════════════════════ */

const Roulette = (() => {

  let canvas, ctx;
  let currentAngle = 0;
  let spinning = false;
  let animId = null;
  let onDoneCallback = null;

  const SLICE_COLORS = [
    '#5b21b6','#db2777','#0891b2','#b45309',
    '#15803d','#7c3aed','#9a3412'
  ];
  const TEXT_COLORS = [
    '#fde68a','#fce7f3','#cffafe','#fef3c7',
    '#dcfce7','#ede9fe','#ffedd5'
  ];

  function init(canvasEl, callback) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    onDoneCallback = callback;
    draw(currentAngle);
  }

  function draw(angle) {
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const r  = cx - 6;
    const n  = VERSES.length;
    const sliceAngle = (2 * Math.PI) / n;

    ctx.clearRect(0, 0, W, H);

    // Outer ring shadow / glow
    ctx.save();
    ctx.shadowColor = 'rgba(168,85,247,0.6)';
    ctx.shadowBlur  = 28;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(168,85,247,0.15)';
    ctx.fill();
    ctx.restore();

    for (let i = 0; i < n; i++) {
      const startA = angle + i * sliceAngle;
      const endA   = startA + sliceAngle;

      // Slice fill
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startA, endA);
      ctx.closePath();

      // Gradient per slice
      const gx = cx + (r * 0.55) * Math.cos(startA + sliceAngle / 2);
      const gy = cy + (r * 0.55) * Math.sin(startA + sliceAngle / 2);
      const grad = ctx.createRadialGradient(cx, cy, r * 0.1, gx, gy, r * 0.75);
      grad.addColorStop(0, lighten(SLICE_COLORS[i], 30));
      grad.addColorStop(1, SLICE_COLORS[i]);
      ctx.fillStyle = grad;
      ctx.fill();

      // Slice border
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Text
      ctx.save();
      const midA = startA + sliceAngle / 2;
      ctx.translate(cx, cy);
      ctx.rotate(midA);

      const ref = VERSES[i].ref;
      const parts = ref.split(' ');
      const line1 = parts.slice(0, -1).join(' ');
      const line2 = parts[parts.length - 1];
      const textX = r * 0.54;

      ctx.font = 'bold 13px Nunito, sans-serif';
      ctx.fillStyle = TEXT_COLORS[i];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur  = 4;

      if (line1) {
        ctx.fillText(line1, textX, -8);
        ctx.font = 'bold 14px Nunito, sans-serif';
        ctx.fillText(line2, textX, 10);
      } else {
        ctx.font = 'bold 14px Nunito, sans-serif';
        ctx.fillText(line2, textX, 0);
      }
      ctx.restore();
    }

    // Center circle (decorative, button is HTML overlay)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f0a2e';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Outer border ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  function spin() {
    if (spinning) return;
    spinning = true;

    const btn = document.getElementById('spin-btn');
    btn.classList.add('spinning');

    const n = VERSES.length;
    const sliceAngle = (2 * Math.PI) / n;

    // Random target slice (uniform)
    const targetSlice = Math.floor(Math.random() * n);
    // Extra spins: 5–9 full rotations + aligned to pointer (top = -π/2)
    const extraSpins  = (5 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
    // Pointer is at top (angle = -π/2). We want targetSlice to stop at top.
    // Angle to land: pointer at top means we need the center of the target slice at -π/2
    // currentAngle + targetAngle = -π/2 - (targetSlice * sliceAngle + sliceAngle/2) + some wiggle
    const wiggle = (Math.random() - 0.5) * sliceAngle * 0.6;
    const targetAngle = extraSpins
      + (-Math.PI / 2 - (targetSlice * sliceAngle + sliceAngle / 2) + wiggle - currentAngle);

    const duration = 4500 + Math.random() * 1200; // ms
    const startTime = performance.now();
    const startAngle = currentAngle;

    function easeOut(t) {
      // Cubic ease out
      return 1 - Math.pow(1 - t, 3);
    }

    function frame(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easedT = easeOut(t);
      currentAngle = startAngle + targetAngle * easedT;
      draw(currentAngle);

      if (t < 1) {
        animId = requestAnimationFrame(frame);
      } else {
        currentAngle = startAngle + targetAngle;
        draw(currentAngle);
        spinning = false;
        btn.classList.remove('spinning');
        // Determine which slice ended up at the pointer
        const selectedIdx = getSliceAtPointer(n, sliceAngle);
        if (onDoneCallback) onDoneCallback(selectedIdx);
      }
    }

    animId = requestAnimationFrame(frame);
  }

  function getSliceAtPointer(n, sliceAngle) {
    // Pointer is at angle -π/2 (top). Normalize currentAngle.
    const pointerAngle = -Math.PI / 2;
    // Which slice is at the pointer?
    let normalised = ((pointerAngle - currentAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const idx = Math.floor(normalised / sliceAngle) % n;
    return idx;
  }

  // ── Color utility ──
  function lighten(hex, amount) {
    const num = parseInt(hex.replace('#',''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `rgb(${r},${g},${b})`;
  }

  return { init, spin };
})();
