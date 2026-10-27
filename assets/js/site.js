/* Revamp Web: shared site behaviour (no dependencies). The gradient lives in gradient.js. */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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


  /* Work carousel: native scroll-snap, plus buttons, a counter and mouse drag */
  document.querySelectorAll(".carousel").forEach((root) => {
    const track = root.querySelector(".carousel__track");
    const slides = [...track.children];
    const prev = root.querySelector("[data-prev]");
    const next = root.querySelector("[data-next]");
    const count = root.querySelector(".carousel__count");
    let active = 0;
    const setActive = (i) => {
      active = i;
      slides.forEach((s, n) => s.classList.toggle("is-active", n === i));
      if (count) count.textContent = `${i + 1} of ${slides.length}`;
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === slides.length - 1;
    };
    // the slide whose left edge is nearest the snap line is the active one
    const nearest = () => {
      const pad = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
      const x = track.scrollLeft + pad;
      let best = 0, dist = Infinity;
      slides.forEach((s, n) => { const d = Math.abs(s.offsetLeft - x); if (d < dist) { dist = d; best = n; } });
      return best;
    };
    const go = (i) => {
      i = Math.max(0, Math.min(slides.length - 1, i));
      const pad = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
      track.scrollTo({ left: slides[i].offsetLeft - pad, behavior: reduceMotion ? "auto" : "smooth" });
    };
    prev?.addEventListener("click", () => go(active - 1));
    next?.addEventListener("click", () => go(active + 1));
    let raf;
    track.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setActive(nearest())); }, { passive: true });
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(active + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(active - 1); }
    });

    // Drag to scroll with a mouse (touch already scrolls natively)
    let startX = 0, startLeft = 0, moved = false, down = false;
    track.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
    });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add("is-dragging"); }
      if (moved) track.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", () => {
      if (!down) return;
      down = false;
      if (moved) { track.classList.remove("is-dragging"); go(nearest()); }
    });

    setActive(0);
    root.classList.add("is-ready");
  });

  /* Launch tiles: gauges fill when they scroll into view */
  const gaugeTiles = document.querySelectorAll("[data-gauges]");
  if (gaugeTiles.length && !reduceMotion && "IntersectionObserver" in window) {
    gaugeTiles.forEach((t) => t.classList.add("is-pre"));
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.remove("is-pre"); io.unobserve(e.target); }
    }), { threshold: 0.4 });
    gaugeTiles.forEach((t) => io.observe(t));
  }



  /* Work page: screenshot lightbox */
  const lb = document.querySelector(".lightbox");
  if (lb) {
    const img = lb.querySelector("img"), cap = lb.querySelector("p");
    document.querySelectorAll("[data-full]").forEach((btn) => btn.addEventListener("click", () => {
      img.src = btn.dataset.full; img.alt = btn.querySelector("img")?.alt || "";
      cap.textContent = btn.querySelector("figcaption")?.textContent || "";
      lb.showModal();
    }));
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.closest("button")) lb.close(); });
  }

  /* Work page: highlight the project you're looking at */
  const navLinks = [...document.querySelectorAll(".proj-nav a")];
  if (navLinks.length && "IntersectionObserver" in window) {
    const io2 = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("is-current", a.hash === "#" + e.target.id));
      document.querySelector(".proj-nav a.is-current")?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }), { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll(".proj").forEach((sec) => io2.observe(sec));
  }

  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
