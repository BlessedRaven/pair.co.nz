(() => {
  const STORE_KEY = "pair-sym-motion-v7";
  const SELECTED_KEY = "pair-motion-selected-v7";

  const SYMBOLS = [
    { id: "gol", label: "GOL" },
    { id: "flower", label: "Flower" },
    { id: "sol", label: "SOL" },
    { id: "fol", label: "FOL" },
    { id: "hermes", label: "Hermes" },
    { id: "cloud", label: "Cloud" },
    { id: "trinity", label: "Trinity" },
    { id: "pi", label: "Pi" },
    { id: "ra", label: "Ra" },
    { id: "scarab", label: "Scarab" },
    { id: "sun", label: "Sun" },
    { id: "key", label: "Key" },
    { id: "bean", label: "Bean" },
    { id: "torus", label: "Torus" },
  ];

  const ANIMS = [
    { id: "off", label: "None" },
    { id: "cw", label: "Clockwise" },
    { id: "ccw", label: "Anti-clockwise" },
  ];

  const COLOURS = [
    { id: "off", label: "None" },
    { id: "vibe", label: "Vibe" },
  ];
  const COLOUR_KEY = "pair-colour";

  const panel = document.querySelector("[data-motion-panel]");
  const toggle = document.querySelector("[data-motion-toggle]");
  const symList = document.querySelector("[data-motion-symbols]");
  const animList = document.querySelector("[data-motion-anims]");
  const speedEl = document.querySelector("[data-motion-speed]");
  const speedVal = document.querySelector("[data-motion-speed-val]");
  const colourList = document.querySelector("[data-motion-colours]");
  if (!panel || !toggle || !symList || !animList || !speedEl || !speedVal || !colourList) return;

  panel.addEventListener("click", (e) => e.stopPropagation());
  panel.addEventListener("pointerdown", (e) => e.stopPropagation());

  const readStore = () => {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {};
    } catch {
      return {};
    }
  };

  const writeStore = (store) => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch {}
  };

  let store = readStore();
  let selected = "torus";
  try {
    selected = localStorage.getItem(SELECTED_KEY) || "torus";
  } catch {}
  if (!SYMBOLS.some((s) => s.id === selected)) selected = "torus";

  const ensure = (id) => {
    if (!store[id]) store[id] = { anim: "off", speed: 100 };
    const a = store[id].anim;
    if (a !== "cw" && a !== "ccw" && a !== "off") store[id].anim = "off";
    let sp = Number(store[id].speed);
    if (!Number.isFinite(sp)) sp = 100;
    if (sp > 100) sp = Math.round(sp / 2);
    store[id].speed = Math.max(1, Math.min(100, Math.round(sp)));
    return store[id];
  };
  SYMBOLS.forEach((s) => ensure(s.id));

  const periodSec = (speedPct) => {
    const pct = Math.max(1, Math.min(100, Number(speedPct) || 100));
    return Math.max(0.35, 75 / pct);
  };

  const formatPct = (pct) => Math.round(Number(pct) || 100) + "%";

  const findEl = (id) => {
    if (id === "torus") {
      return document.querySelector('.mark-host svg.sigil .center[data-sym="torus"]');
    }
    return document.querySelector('.mark-host svg.sigil .sym[data-sym="' + id + '"]');
  };

  const anySpinning = () => SYMBOLS.some((s) => ensure(s.id).anim !== "off");

  const syncRing = () => {
    // Whole-ring orbit only while something is intentionally spinning
    document.documentElement.setAttribute("data-ring", anySpinning() ? "on" : "off");
  };

  const applyToDom = (id) => {
    const cfg = ensure(id);
    const el = findEl(id);
    if (!el) return;
    el.dataset.anim = cfg.anim;
    if (cfg.anim === "off") {
      el.style.animationDuration = "";
      el.style.animation = "none";
    } else {
      el.style.animation = "";
      el.style.animationDuration = periodSec(cfg.speed) + "s";
    }
  };

  const applyAll = () => {
    document.querySelectorAll(".mark-host svg.sigil .sym").forEach((el) => {
      const id = el.getAttribute("data-sym");
      if (!SYMBOLS.some((s) => s.id === id)) {
        el.dataset.anim = "off";
        el.style.animation = "none";
        el.style.animationDuration = "";
      }
    });
    SYMBOLS.forEach((s) => applyToDom(s.id));
    syncRing();
  };

  const readColour = () => {
    try {
      return localStorage.getItem(COLOUR_KEY) === "vibe" ? "vibe" : "off";
    } catch {
      return "off";
    }
  };

  const applyColour = (colour) => {
    const c = colour === "vibe" ? "vibe" : "off";
    document.documentElement.setAttribute("data-colour", c);
    try {
      localStorage.setItem(COLOUR_KEY, c);
    } catch {}
    colourList.querySelectorAll("[data-colour-pick]").forEach((btn) => {
      btn.setAttribute("aria-selected", btn.getAttribute("data-colour-pick") === c ? "true" : "false");
    });
  };

  const renderLists = () => {
    const cfg = ensure(selected);
    symList.innerHTML = SYMBOLS.map(function (s) {
      return (
        '<button type="button" role="option" class="motion-opt" data-sym-pick="' +
        s.id +
        '" aria-selected="' +
        (s.id === selected ? "true" : "false") +
        '">' +
        s.label +
        "</button>"
      );
    }).join("");
    animList.innerHTML = ANIMS.map(function (a) {
      return (
        '<button type="button" role="option" class="motion-opt" data-anim-pick="' +
        a.id +
        '" aria-selected="' +
        (a.id === cfg.anim ? "true" : "false") +
        '">' +
        a.label +
        "</button>"
      );
    }).join("");
    speedEl.value = String(cfg.speed);
    speedVal.textContent = formatPct(cfg.speed);
    speedEl.disabled = cfg.anim === "off";
    const colour = readColour();
    colourList.innerHTML = COLOURS.map(function (c) {
      return (
        '<button type="button" role="option" class="motion-opt" data-colour-pick="' +
        c.id +
        '" aria-selected="' +
        (c.id === colour ? "true" : "false") +
        '">' +
        c.label +
        "</button>"
      );
    }).join("");
  };

  const setOpen = (open) => {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-pressed", open ? "true" : "false");
  };

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(panel.hidden);
  });

  document.querySelectorAll("[data-panel-open]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const section = btn.getAttribute("data-panel-open");
      setOpen(true);
      document.querySelectorAll("[data-panel-open]").forEach((b) => {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      const el = panel.querySelector('[data-panel-section="' + section + '"]');
      if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      panel.querySelectorAll("[data-panel-section]").forEach((s) => {
        s.classList.toggle("is-focus", s.getAttribute("data-panel-section") === section);
      });
    });
  });

  document.addEventListener("click", (e) => {
    if (panel.hidden) return;
    if (e.target.closest("[data-motion-panel]") || e.target.closest("[data-motion-toggle]")) return;
    setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) setOpen(false);
  });

  symList.addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = e.target.closest("[data-sym-pick]");
    if (!btn) return;
    selected = btn.getAttribute("data-sym-pick");
    try {
      localStorage.setItem(SELECTED_KEY, selected);
    } catch {}
    ensure(selected);
    renderLists();
  });

  animList.addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = e.target.closest("[data-anim-pick]");
    if (!btn) return;
    const cfg = ensure(selected);
    cfg.anim = btn.getAttribute("data-anim-pick");
    writeStore(store);
    applyToDom(selected);
    syncRing();
    renderLists();
  });

  colourList.addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = e.target.closest("[data-colour-pick]");
    if (!btn) return;
    applyColour(btn.getAttribute("data-colour-pick"));
  });

  document.addEventListener("pair:colour-changed", () => {
    renderLists();
  });

  speedEl.addEventListener("input", () => {
    const cfg = ensure(selected);
    cfg.speed = Number(speedEl.value) || 100;
    writeStore(store);
    applyToDom(selected);
    speedVal.textContent = formatPct(cfg.speed);
  });

  const resetBtn = document.querySelector("[data-motion-reset]");
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      store = {};
      SYMBOLS.forEach((s) => {
        store[s.id] = { anim: "off", speed: 100 };
      });
      writeStore(store);
      selected = "torus";
      try {
        localStorage.setItem(SELECTED_KEY, selected);
      } catch {}
      applyAll();
      renderLists();
    });
  }

  // Start from a clean stopped state until user opts in
  document.documentElement.setAttribute("data-ring", "off");
  applyColour(readColour());
  renderLists();
  setOpen(false);

  const tryApply = () => {
    if (document.querySelector(".mark-host svg.sigil .sym, .mark-host svg.sigil .center")) {
      applyAll();
    }
  };
  tryApply();
  document.addEventListener("pair:syms-ready", tryApply);
  const host = document.querySelector("[data-mark-host]");
  if (host) {
    new MutationObserver(tryApply).observe(host, { childList: true, subtree: true });
  }
})();
