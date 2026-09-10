(() => {
  const STORE_KEY = "pair-sym-motion-v3";
  const SELECTED_KEY = "pair-motion-selected-v3";
  const BASE_SEC = 72;

  const SYMBOLS = [
    { id: "ne", label: "GOL" },
    { id: "e", label: "SOL" },
    { id: "se", label: "FOL" },
    { id: "s", label: "Hermes" },
    { id: "w", label: "Cloud" },
  ];

  const ANIMS = [
    { id: "cw", label: "Clockwise" },
    { id: "ccw", label: "Anti-clockwise" },
  ];

  const panel = document.querySelector("[data-motion-panel]");
  const toggle = document.querySelector("[data-motion-toggle]");
  const symList = document.querySelector("[data-motion-symbols]");
  const animList = document.querySelector("[data-motion-anims]");
  const speedEl = document.querySelector("[data-motion-speed]");
  const speedVal = document.querySelector("[data-motion-speed-val]");
  if (!panel || !toggle || !symList || !animList || !speedEl || !speedVal) return;

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
  let selected = "e";
  try {
    selected = localStorage.getItem(SELECTED_KEY) || "e";
  } catch {}
  if (!SYMBOLS.some((s) => s.id === selected)) selected = "e";

  const ensure = (id) => {
    if (!store[id]) store[id] = { anim: "cw", speed: 100 };
    if (store[id].anim !== "cw" && store[id].anim !== "ccw") store[id].anim = "cw";
    const sp = Number(store[id].speed);
    store[id].speed = Number.isFinite(sp) ? Math.max(25, Math.min(800, sp)) : 100;
    return store[id];
  };
  SYMBOLS.forEach((s) => ensure(s.id));

  // speed %: 100 = base 72s period; 800% = 8x faster
  const periodSec = (speedPct) => {
    const pct = Math.max(25, Math.min(800, Number(speedPct) || 100));
    return BASE_SEC / (pct / 100);
  };

  const formatPct = (pct) => Math.round(Number(pct) || 100) + "%";

  const applyToDom = (id) => {
    const cfg = ensure(id);
    const el = document.querySelector('.mark-host svg.sigil .sym[data-sym="' + id + '"]');
    if (!el) return;
    el.dataset.anim = cfg.anim;
    el.style.animationDuration = periodSec(cfg.speed) + "s";
  };

  const applyAll = () => {
    document.querySelectorAll(".mark-host svg.sigil .sym").forEach((el) => {
      const id = el.getAttribute("data-sym");
      if (!SYMBOLS.some((s) => s.id === id)) {
        el.dataset.anim = "off";
        el.style.animationDuration = "";
      }
    });
    SYMBOLS.forEach((s) => applyToDom(s.id));
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

  document.addEventListener("click", (e) => {
    if (panel.hidden) return;
    if (e.target.closest("[data-motion-panel]") || e.target.closest("[data-motion-toggle]")) return;
    setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) setOpen(false);
  });

  symList.addEventListener("click", (e) => {
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
    const btn = e.target.closest("[data-anim-pick]");
    if (!btn) return;
    const cfg = ensure(selected);
    cfg.anim = btn.getAttribute("data-anim-pick");
    writeStore(store);
    applyToDom(selected);
    renderLists();
  });

  speedEl.addEventListener("input", () => {
    const cfg = ensure(selected);
    cfg.speed = Number(speedEl.value) || 100;
    writeStore(store);
    applyToDom(selected);
    speedVal.textContent = formatPct(cfg.speed);
  });

  renderLists();
  setOpen(false);

  const tryApply = () => {
    if (document.querySelector(".mark-host svg.sigil .sym")) applyAll();
  };
  tryApply();
  document.addEventListener("pair:syms-ready", tryApply);
  const host = document.querySelector("[data-mark-host]");
  if (host) {
    new MutationObserver(tryApply).observe(host, { childList: true, subtree: true });
  }
})();
