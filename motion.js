(() => {
  const STORE_KEY = "pair-sym-motion";
  const SELECTED_KEY = "pair-motion-selected";
  const BASE_SEC = 72;

  const SYMBOLS = [
    { id: "n", label: "Raven" },
    { id: "ne", label: "Flower" },
    { id: "e", label: "Torus" },
    { id: "se", label: "Nest" },
    { id: "s", label: "Fund" },
    { id: "sw", label: "Wings" },
    { id: "w", label: "Orbit" },
    { id: "nw", label: "Archive" },
  ];

  const ANIMS = [
    { id: "drift", label: "Drift" },
    { id: "reverse", label: "Reverse" },
    { id: "stationary", label: "Stationary" },
    { id: "pulse", label: "Pulse" },
    { id: "off", label: "Off" },
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

  const ensure = (id) => {
    if (!store[id]) store[id] = { anim: "drift", speed: 100 };
    return store[id];
  };
  SYMBOLS.forEach((s) => ensure(s.id));

  const periodSec = (speedPct) => {
    const mult = Math.max(0.35, Math.min(2, (Number(speedPct) || 100) / 100));
    return BASE_SEC / mult;
  };

  const applyToDom = (id) => {
    const cfg = ensure(id);
    const el = document.querySelector('.mark-host svg.sigil .sym[data-sym="' + id + '"]');
    if (!el) return;
    el.dataset.anim = cfg.anim;
    if (cfg.anim === "drift" || cfg.anim === "reverse" || cfg.anim === "pulse") {
      el.style.animationDuration = periodSec(cfg.speed) + "s";
    } else {
      el.style.animationDuration = "";
    }
  };

  const applyAll = () => {
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
    speedVal.textContent = Number((cfg.speed / 100).toFixed(2)) + "x";
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
    speedVal.textContent = Number((cfg.speed / 100).toFixed(2)) + "x";
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
