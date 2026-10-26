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

  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
