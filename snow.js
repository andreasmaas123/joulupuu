// Õrn lumesadu taustaks. Ei sega kasutamist (pointer-events: none) ja jääb ära,
// kui kasutaja on opsüsteemis vähendatud liikumise valiku sisse lülitanud.
(function () {
  const canvas = document.getElementById('snow');
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, flakes = [];

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(90, (w * h) / 16000));
    flakes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.8 + Math.random() * 2.2,
      v: 0.25 + Math.random() * 0.7,   // kukkumiskiirus
      d: Math.random() * Math.PI * 2,  // kõikumise faas
    }));
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (const f of flakes) {
      f.y += f.v;
      f.d += 0.01;
      f.x += Math.sin(f.d) * 0.3;
      if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.25 + f.r * 0.15})`;
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  resize();
  tick();
})();
