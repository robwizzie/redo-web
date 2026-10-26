/* Revamp Web — shared site behaviour (no dependencies) */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Animated gradient band. Drawn small and upscaled by the browser,
     which gives the soft Stripe-style blend for almost no cost. */
  const BLOBS = [
    { c: [168, 200, 255], r: 0.55, x: 0.15, y: 0.2, sx: 0.07, sy: 0.05, s: 0.00011 },
    { c: [94, 148, 247], r: 0.6, x: 0.55, y: 0.35, sx: 0.12, sy: 0.08, s: 0.00009 },
    { c: [42, 95, 216], r: 0.5, x: 0.85, y: 0.65, sx: 0.08, sy: 0.12, s: 0.00013 },
    { c: [124, 214, 255], r: 0.42, x: 0.7, y: 0.1, sx: 0.1, sy: 0.06, s: 0.00016 },
    { c: [232, 240, 254], r: 0.45, x: 0.05, y: 0.85, sx: 0.05, sy: 0.08, s: 0.0001 },
    { c: [14, 31, 69], r: 0.35, x: 1.0, y: 0.9, sx: 0.06, sy: 0.05, s: 0.00012 },
  ];
  document.querySelectorAll(".band__canvas").forEach((canvas) => {
    const ctx = canvas.getContext("2d");
    const W = 96, H = 48;
    canvas.width = W; canvas.height = H;
    const draw = (t) => {
      ctx.fillStyle = "rgb(150,190,255)";
      ctx.fillRect(0, 0, W, H);
      for (const [i, b] of BLOBS.entries()) {
        const x = (b.x + Math.sin(t * b.s + i) * b.sx) * W;
        const y = (b.y + Math.cos(t * b.s * 1.3 + i * 2) * b.sy) * H;
        const r = b.r * W;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${b.c},0.95)`);
        g.addColorStop(1, `rgba(${b.c},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    };
    if (reduceMotion) { draw(0); return; }
    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    const loop = (t) => { if (visible) draw(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  });

  /* Sticky header + mobile menu */
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const btn = header.querySelector(".menu-btn");
    btn?.addEventListener("click", () => {
      const open = header.classList.toggle("menu-open");
      btn.setAttribute("aria-expanded", String(open));
    });
  }

  /* Before / after slider */
  document.querySelectorAll(".revamp__frame").forEach((frame) => {
    const range = frame.querySelector(".revamp__range");
    const set = (v) => frame.style.setProperty("--pos", v + "%");
    range.addEventListener("input", () => set(range.value));
    set(range.value);
    if (reduceMotion) return;
    // One gentle sweep on load to show it can be dragged
    let start;
    const from = 88, to = 34, dur = 1600;
    const ease = (x) => 1 - Math.pow(1 - x, 3);
    const tick = (t) => {
      start ??= t;
      const p = Math.min(1, (t - start) / dur);
      const v = from + (to - from) * ease(p);
      range.value = v; set(v);
      if (p < 1) requestAnimationFrame(tick);
    };
    setTimeout(() => requestAnimationFrame(tick), 500);
  });

  /* Care plan billing toggle */
  document.querySelectorAll("[data-billing]").forEach((toggle) => {
    const buttons = toggle.querySelectorAll("button");
    buttons.forEach((b) => b.addEventListener("click", () => {
      buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const yearly = b.dataset.mode === "yearly";
      document.querySelectorAll("[data-monthly]").forEach((el) => {
        const m = Number(el.dataset.monthly);
        el.textContent = "$" + (yearly ? Math.round((m * 10) / 12) : m);
      });
      document.querySelectorAll("[data-billing-label]").forEach((el) => {
        el.textContent = yearly ? "/mo, billed yearly" : "/mo";
      });
    }));
  });

  /* Contact form (prototype: not connected to a backend yet) */
  const form = document.querySelector("#contact-form");
  if (form) {
    const budget = form.querySelector("#budget");
    const note = form.querySelector(".budget-note");
    const syncNote = () => note.classList.toggle("show", budget.value === "small-business");
    budget.addEventListener("change", syncNote);
    syncNote();
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const name = form.querySelector("#name").value.trim().split(" ")[0] || "there";
      form.hidden = true;
      const done = document.querySelector(".form-done");
      done.querySelector("[data-name]").textContent = name;
      done.hidden = false;
      done.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });
  }

  /* Copy buttons */
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = btn.dataset.copy;
      const done = () => { btn.textContent = "Copied"; setTimeout(() => (btn.textContent = "Copy"), 1600); };
      navigator.clipboard?.writeText(text).then(done).catch(() => {
        const range = document.createRange();
        range.selectNodeContents(btn.previousElementSibling);
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
      });
    });
  });

  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
