(() => {
  const STORE_KEY = "pair-sym-motion-v11";
  const SELECTED_KEY = "pair-motion-selected-v11";
  const RING_KEY = "pair-motion-ring-v11";

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
    { id: "vibe", label: "Colour" },
  ];

  const panel = document.querySelector("[data-motion-panel]");
  const toggle = document.querySelector("[data-motion-toggle]");
  const symbolOpen = document.querySelector('[data-panel-open="symbol"]');
  const symList = document.querySelector("[data-motion-symbols]");
  const animList = document.querySelector("[data-motion-anims]");
  const speedEl = document.querySelector("[data-motion-speed]");
  const speedVal = document.querySelector("[data-motion-speed-val]");
  const colourSpeedEl = document.querySelector("[data-motion-colour-speed]");
  const colourSpeedVal = document.querySelector("[data-motion-colour-speed-val]");
  const sizeEl = document.querySelector("[data-motion-size]");
  const sizeVal = document.querySelector("[data-motion-size-val]");
  const colourList = document.querySelector("[data-motion-colours]");
  if (!panel || !toggle || !symList || !animList || !speedEl || !speedVal || !colourList || !colourSpeedEl || !colourSpeedVal || !sizeEl || !sizeVal) return;

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

  const readSelected = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(SELECTED_KEY) || "[]");
      if (Array.isArray(raw) && raw.length) {
        return new Set(raw.filter((id) => SYMBOLS.some((s) => s.id === id)));
      }
    } catch {}
    return new Set();
  };

  const writeSelected = (set) => {
    try {
      localStorage.setItem(SELECTED_KEY, JSON.stringify([...set]));
    } catch {}
  };

  const readRing = () => {
    try {
      return localStorage.getItem(RING_KEY) === "on";
    } catch {
      return false;
    }
  };

  const writeRing = (on) => {
    try {
      localStorage.setItem(RING_KEY, on ? "on" : "off");
    } catch {}
  };

  let store = readStore();
  let selected = readSelected();
  let ringOn = readRing();

  const clampPct = (sp) => {
    let n = Number(sp);
    if (!Number.isFinite(n)) n = 100;
    if (n > 100) n = Math.round(n / 2);
    return Math.max(1, Math.min(100, Math.round(n)));
  };

  const clampSize = (sp) => {
    let n = Number(sp);
    if (!Number.isFinite(n)) n = 100;
    return Math.max(25, Math.min(200, Math.round(n)));
  };

  const ensure = (id) => {
    if (!store[id]) store[id] = { anim: "off", speed: 100, colour: "off", colourSpeed: 100, size: 100 };
    const a = store[id].anim;
    if (a !== "cw" && a !== "ccw" && a !== "off") store[id].anim = "off";
    if (store[id].colour !== "vibe") store[id].colour = "off";
    store[id].speed = clampPct(store[id].speed);
    store[id].colourSpeed = clampPct(store[id].colourSpeed == null ? 100 : store[id].colourSpeed);
    store[id].size = clampSize(store[id].size == null ? 100 : store[id].size);
    return store[id];
  };
  SYMBOLS.forEach((s) => ensure(s.id));

  const periodSec = (speedPct) => {
    const pct = clampPct(speedPct);
    return Math.max(0.35, 75 / pct);
  };

  // Colour cycle: slower curve so 100% ≈ 8s, 50% ≈ 16s, 1% ≈ soft crawl
  const glowPeriodSec = (speedPct) => {
    const pct = clampPct(speedPct);
    return Math.max(1.2, 48 / pct);
  };

  const formatPct = (pct) => clampPct(pct) + "%";

  const findEl = (id) => {
    if (id === "torus") {
      return document.querySelector('.mark-host svg.sigil .center[data-sym="torus"]');
    }
    return document.querySelector('.mark-host svg.sigil .sym[data-sym="' + id + '"]');
  };

  const syncRing = () => {
    document.documentElement.setAttribute("data-ring", ringOn ? "on" : "off");
    toggle.setAttribute("aria-pressed", ringOn ? "true" : "false");
  };

  const applyToDom = (id) => {
    const cfg = ensure(id);
    const el = findEl(id);
    if (!el) return;
    el.dataset.anim = cfg.anim;
    el.dataset.colour = cfg.colour === "vibe" ? "vibe" : "off";
    el.style.animation = "";
    el.style.animationDuration = "";
    el.style.setProperty("--sym-scale", String(clampSize(cfg.size) / 100));
    if (cfg.anim === "off" && cfg.colour !== "vibe") {
      el.style.animation = "none";
      el.style.removeProperty("--spin-dur");
      el.style.removeProperty("--glow-dur");
      return;
    }
    if (cfg.anim !== "off") {
      el.style.setProperty("--spin-dur", periodSec(cfg.speed) + "s");
    } else {
      el.style.removeProperty("--spin-dur");
    }
    if (cfg.colour === "vibe") {
      el.style.setProperty("--glow-dur", glowPeriodSec(cfg.colourSpeed) + "s");
    } else {
      el.style.removeProperty("--glow-dur");
    }
    el.style.setProperty("--sym-scale", String(clampSize(cfg.size) / 100));
  };

  const applyAll = () => {
    document.querySelectorAll(".mark-host svg.sigil .sym, .mark-host svg.sigil .center").forEach((el) => {
      const id = el.getAttribute("data-sym");
      if (!SYMBOLS.some((s) => s.id === id)) {
        el.dataset.anim = "off";
        el.dataset.colour = "off";
        el.style.animation = "none";
      }
    });
    SYMBOLS.forEach((s) => applyToDom(s.id));
    syncRing();
  };

  const selectedList = () => [...selected];

  const primaryCfg = () => {
    const ids = selectedList();
    if (!ids.length) return { anim: "off", speed: 100, colour: "off", colourSpeed: 100, size: 100 };
    return ensure(ids[ids.length - 1]);
  };

  const renderLists = () => {
    const cfg = primaryCfg();
    symList.innerHTML = SYMBOLS.map(function (s) {
      const on = selected.has(s.id);
      return (
        '<button type="button" role="option" class="motion-opt" data-sym-pick="' +
        s.id +
        '" aria-selected="' +
        (on ? "true" : "false") +
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
    colourList.innerHTML = COLOURS.map(function (c) {
      return (
        '<button type="button" role="option" class="motion-opt" data-colour-pick="' +
        c.id +
        '" aria-selected="' +
        (c.id === cfg.colour ? "true" : "false") +
        '">' +
        c.label +
        "</button>"
      );
    }).join("");
    sizeEl.value = String(cfg.size);
    sizeVal.textContent = clampSize(cfg.size) + "%";
    sizeEl.disabled = !selected.size;
    speedEl.value = String(cfg.speed);
    speedVal.textContent = formatPct(cfg.speed);
    speedEl.disabled = !selected.size || cfg.anim === "off";
    colourSpeedEl.value = String(cfg.colourSpeed);
    colourSpeedVal.textContent = formatPct(cfg.colourSpeed);
    colourSpeedEl.disabled = !selected.size || cfg.colour !== "vibe";
  };

  const setPanelOpen = (open) => {
    panel.hidden = !open;
    if (symbolOpen) {
      symbolOpen.setAttribute("aria-pressed", open ? "true" : "false");
      symbolOpen.setAttribute("aria-expanded", open ? "true" : "false");
    }
  };

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    ringOn = !ringOn;
    writeRing(ringOn);
    syncRing();
  });

  if (symbolOpen) {
    symbolOpen.addEventListener("click", (e) => {
      e.stopPropagation();
      setPanelOpen(panel.hidden);
    });
  }

  document.addEventListener("click", (e) => {
    if (panel.hidden) return;
    if (
      e.target.closest("[data-motion-panel]") ||
      e.target.closest("[data-panel-open]") ||
      e.target.closest("[data-motion-toggle]")
    ) {
      return;
    }
    setPanelOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) setPanelOpen(false);
  });

  symList.addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = e.target.closest("[data-sym-pick]");
    if (!btn) return;
    const id = btn.getAttribute("data-sym-pick");
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    writeSelected(selected);
    ensure(id);
    renderLists();
  });

  const forSelected = (fn) => {
    const ids = selectedList();
    if (!ids.length) return;
    ids.forEach((id) => {
      ensure(id);
      fn(id, store[id]);
    });
    writeStore(store);
    ids.forEach((id) => applyToDom(id));
    renderLists();
  };

  animList.addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = e.target.closest("[data-anim-pick]");
    if (!btn) return;
    const anim = btn.getAttribute("data-anim-pick");
    forSelected((id, cfg) => {
      cfg.anim = anim;
    });
  });

  colourList.addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = e.target.closest("[data-colour-pick]");
    if (!btn) return;
    const colour = btn.getAttribute("data-colour-pick") === "vibe" ? "vibe" : "off";
    forSelected((id, cfg) => {
      cfg.colour = colour;
    });
  });

  sizeEl.addEventListener("input", () => {
    const size = clampSize(sizeEl.value);
    forSelected((id, cfg) => {
      cfg.size = size;
    });
    sizeVal.textContent = size + "%";
  });

  speedEl.addEventListener("input", () => {
    const speed = clampPct(speedEl.value);
    forSelected((id, cfg) => {
      cfg.speed = speed;
    });
    speedVal.textContent = formatPct(speed);
  });

  colourSpeedEl.addEventListener("input", () => {
    const colourSpeed = clampPct(colourSpeedEl.value);
    forSelected((id, cfg) => {
      cfg.colourSpeed = colourSpeed;
    });
    colourSpeedVal.textContent = formatPct(colourSpeed);
  });

  const resetBtn = document.querySelector("[data-motion-reset]");
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      store = {};
      SYMBOLS.forEach((s) => {
        store[s.id] = { anim: "off", speed: 100, colour: "off", colourSpeed: 100, size: 100 };
      });
      writeStore(store);
      selected = new Set();
      writeSelected(selected);
      ringOn = false;
      writeRing(false);
      applyAll();
      renderLists();
    });
  }

  document.documentElement.setAttribute("data-colour", "off");
  renderLists();
  setPanelOpen(false);
  syncRing();

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
