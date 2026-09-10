(() => {
  const STORE_KEY = "pair-sym-motion-v19";
  const SELECTED_KEY = "pair-motion-selected-v19";
  const RING_KEY = "pair-motion-ring-v19";

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
    { id: "wave", label: "Wave" },
    { id: "torus", label: "Torus" },
  ];

  const ANIMS = [
    { id: "off", label: "None" },
    { id: "cw", label: "Clockwise" },
    { id: "ccw", label: "Anti-clockwise" },
  ];

  const COLOURS = [
    { id: "off", label: "None" },
    { id: "vibe", label: "Multicolour" },
    { id: "red", label: "Red" },
    { id: "orange", label: "Orange" },
    { id: "yellow", label: "Yellow" },
    { id: "green", label: "Green" },
    { id: "blue", label: "Blue" },
    { id: "indigo", label: "Indigo" },
    { id: "violet", label: "Violet" },
  ];
  const COLOUR_IDS = new Set(COLOURS.map((c) => c.id));

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
    if (!store[id]) store[id] = { anim: "off", speed: 100, colour: "off", colourSpeed: 100, size: 100, x: 0, y: 0, pinned: false, ax: 0, ay: 0 };
    const a = store[id].anim;
    if (a !== "cw" && a !== "ccw" && a !== "off") store[id].anim = "off";
    if (!COLOUR_IDS.has(store[id].colour)) store[id].colour = "off";
    store[id].speed = clampPct(store[id].speed);
    store[id].colourSpeed = clampPct(store[id].colourSpeed == null ? 100 : store[id].colourSpeed);
    store[id].size = clampSize(store[id].size == null ? 100 : store[id].size);
    let x = Number(store[id].x);
    let y = Number(store[id].y);
    store[id].x = Number.isFinite(x) ? x : 0;
    store[id].y = Number.isFinite(y) ? y : 0;
    store[id].pinned = !!store[id].pinned;
    let ax = Number(store[id].ax);
    let ay = Number(store[id].ay);
    store[id].ax = Number.isFinite(ax) ? ax : 0;
    store[id].ay = Number.isFinite(ay) ? ay : 0;
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

  const findSlot = (id) =>
    document.querySelector('.mark-host svg.sigil [data-sym-slot="' + id + '"]');

  const findHit = (id) => document.querySelector('.hits [data-hotspot="' + id + '"]');

  const orbitLayer = () => document.querySelector(".mark-host svg.sigil .orbit");
  const freeLayer = () => document.querySelector(".mark-host svg.sigil .free-layer");
  const hitsOrbit = () => document.querySelector(".hits .hits-orbit");
  const hitsFree = () => document.querySelector(".hits .hits-free");

  const artCenter = (el) => {
    try {
      const bb = el.getBBox();
      return { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 };
    } catch (err) {
      return { x: 0, y: 0 };
    }
  };

  const svgPoint = (svg, clientX, clientY) => {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    return pt.matrixTransform(ctm.inverse());
  };

  const worldCenter = (el) => {
    const svg = el.ownerSVGElement;
    if (!svg) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return svgPoint(svg, r.left + r.width / 2, r.top + r.height / 2);
  };

  const setSlotAbs = (slot, el, ax, ay) => {
    const c = artCenter(el);
    slot.setAttribute("transform", "translate(" + (ax - c.x) + " " + (ay - c.y) + ")");
  };

  // Detach from orbit into free-layer so Motion no longer carries it
  const releaseToFree = (id) => {
    const el = findEl(id);
    const slot = findSlot(id);
    const free = freeLayer();
    if (!el || !slot || !free) return;
    const cfg = ensure(id);
    if (slot.parentNode !== free) {
      const w = worldCenter(el);
      cfg.pinned = true;
      cfg.ax = w.x;
      cfg.ay = w.y;
      free.appendChild(slot);
    }
    setSlotAbs(slot, el, cfg.ax, cfg.ay);
    const hit = findHit(id);
    const hf = hitsFree();
    if (hit && hf && hit.parentNode !== hf) {
      hf.appendChild(hit);
    }
    if (hit) {
      const c = artCenter(el);
      // hotspot uses its own circle center — translate so hit center ~= ax,ay
      const hc = hit.querySelector("circle.hit");
      if (hc) {
        const hx = Number(hc.getAttribute("cx")) || 0;
        const hy = Number(hc.getAttribute("cy")) || 0;
        hit.setAttribute("transform", "translate(" + (cfg.ax - hx) + " " + (cfg.ay - hy) + ")");
      }
    }
  };

  const restoreToOrbit = (id) => {
    const slot = findSlot(id);
    const orbit = orbitLayer();
    const hit = findHit(id);
    const ho = hitsOrbit();
    if (slot && orbit && id !== "torus" && slot.parentNode !== orbit) {
      orbit.appendChild(slot);
    }
    if (slot) slot.removeAttribute("transform");
    if (hit && ho && id !== "torus" && hit.parentNode !== ho) {
      ho.appendChild(hit);
    }
    if (hit) hit.removeAttribute("transform");
    const cfg = ensure(id);
    cfg.pinned = false;
    cfg.ax = 0;
    cfg.ay = 0;
    cfg.x = 0;
    cfg.y = 0;
  };

  const applyPose = (id) => {
    const cfg = ensure(id);
    const el = findEl(id);
    const slot = findSlot(id);
    if (el) {
      el.style.setProperty("--sym-scale", String(clampSize(cfg.size) / 100));
      el.style.removeProperty("--sym-x");
      el.style.removeProperty("--sym-y");
    }
    if (!slot || !el) return;
    // Motion (ring) needs artist SVG seats inside .orbit — never free-layer transforms
    if (ringOn) {
      if (id !== "torus") {
        const orbit = orbitLayer();
        const ho = hitsOrbit();
        if (orbit && slot.parentNode !== orbit) orbit.appendChild(slot);
        const hit = findHit(id);
        if (hit && ho && hit.parentNode !== ho) ho.appendChild(hit);
        if (hit) hit.removeAttribute("transform");
      }
      slot.removeAttribute("transform");
      return;
    }
    if (cfg.pinned) {
      releaseToFree(id);
      setSlotAbs(slot, el, cfg.ax, cfg.ay);
      const hit = findHit(id);
      if (hit) {
        const hc = hit.querySelector("circle.hit");
        if (hc) {
          const hx = Number(hc.getAttribute("cx")) || 0;
          const hy = Number(hc.getAttribute("cy")) || 0;
          hit.setAttribute("transform", "translate(" + (cfg.ax - hx) + " " + (cfg.ay - hy) + ")");
        }
      }
    } else if (id === "torus" && (cfg.x || cfg.y)) {
      slot.setAttribute("transform", "translate(" + cfg.x + " " + cfg.y + ")");
    } else {
      slot.removeAttribute("transform");
      const hit = findHit(id);
      if (hit) hit.removeAttribute("transform");
    }
  };

  const applyToDom = (id) => {
    const cfg = ensure(id);
    const el = findEl(id);
    if (!el) return;
    el.dataset.anim = cfg.anim;
    el.dataset.colour = COLOUR_IDS.has(cfg.colour) ? cfg.colour : "off";
    applyPose(id);
    if (cfg.anim === "off" && cfg.colour !== "vibe") {
      el.style.animation = "none";
      el.style.removeProperty("--spin-dur");
      el.style.removeProperty("--glow-dur");
      return;
    }
    el.style.animation = "";
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

  const restoreNativeRing = () => {
    SYMBOLS.forEach((s) => {
      restoreToOrbit(s.id);
      const cfg = ensure(s.id);
      cfg.pinned = false;
      cfg.ax = 0;
      cfg.ay = 0;
      cfg.x = 0;
      cfg.y = 0;
    });
    writeStore(store);
  };

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    ringOn = !ringOn;
    if (ringOn) {
      if (typeof pinOn !== "undefined" && pinOn) setPin(false);
      restoreNativeRing();
    }
    writeRing(ringOn);
    syncRing();
    applyAll();
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
    const raw = btn.getAttribute("data-colour-pick") || "off";
    const colour = COLOUR_IDS.has(raw) ? raw : "off";
    forSelected((id, cfg) => {
      cfg.colour = colour;
    });
  });

  sizeEl.addEventListener("input", () => {
    const size = clampSize(sizeEl.value);
    const ids = selectedList();
    if (!ids.length) return;
    ids.forEach((id) => {
      ensure(id);
      store[id].size = size;
      applyPose(id);
    });
    writeStore(store);
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
        restoreToOrbit(s.id);
        store[s.id] = { anim: "off", speed: 100, colour: "off", colourSpeed: 100, size: 100, x: 0, y: 0, pinned: false, ax: 0, ay: 0 };
      });
      writeStore(store);
      selected = new Set();
      writeSelected(selected);
      ringOn = false;
      writeRing(false);
      setPin(false);
      applyAll();
      renderLists();
    });
  }


  // Pause Blessed Raven orbit while hovering a symbol (same as blessedraven.com)
  const markEl = document.querySelector("[data-mark]");
  if (markEl) {
    markEl.addEventListener("pointerover", (e) => {
      if (e.target.closest(".sym, .center")) markEl.classList.add("is-hovering");
    });
    markEl.addEventListener("pointerout", (e) => {
      if (!e.relatedTarget || !markEl.contains(e.relatedTarget)) markEl.classList.remove("is-hovering");
      else if (!e.relatedTarget.closest(".sym, .center")) markEl.classList.remove("is-hovering");
    });
  }

  // Pin mode: Free drag (+ magnetic repel) or Orbit (gravity hub + moons)
  const SVG_CX = 447.56;
  const SVG_CY = 484.96;
  const ORBIT_R = 290;
  const MIN_SEP = 92;
  const ORBIT_PERIOD_MS = 70000; // ~70s full revolution

  let pinOn = false;
  let pinMode = "free"; // free | orbit
  let hubId = null;
  let moonAngles = new Map(); // id -> radians
  let moonRadii = new Map(); // id -> radius
  let orbitRaf = 0;
  let orbitLastTs = 0;
  let drag = null;

  const pinBtn = document.querySelector("[data-motion-pin]");
  const pinMenu = document.querySelector("[data-pin-menu]");
  const pinModeBtns = () => document.querySelectorAll("[data-pin-mode]");

  const placeAbs = (id) => {
    const el = findEl(id);
    const slot = findSlot(id);
    if (!el || !slot) return;
    const cfg = ensure(id);
    cfg.pinned = true;
    releaseToFree(id);
    setSlotAbs(slot, el, cfg.ax, cfg.ay);
    const hit = findHit(id);
    if (hit) {
      const hc = hit.querySelector("circle.hit");
      if (hc) {
        const hx = Number(hc.getAttribute("cx")) || 0;
        const hy = Number(hc.getAttribute("cy")) || 0;
        hit.setAttribute("transform", "translate(" + (cfg.ax - hx) + " " + (cfg.ay - hy) + ")");
      }
    }
  };

  const ensurePinnedAtWorld = (id) => {
    const el = findEl(id);
    if (!el) return null;
    const cfg = ensure(id);
    if (!cfg.pinned || !(cfg.ax || cfg.ay)) {
      try {
        const w = worldCenter(el);
        cfg.ax = w.x;
        cfg.ay = w.y;
      } catch (err) {
        cfg.ax = SVG_CX;
        cfg.ay = SVG_CY;
      }
    }
    cfg.pinned = true;
    placeAbs(id);
    return cfg;
  };

  const clearHubMarks = () => {
    document.querySelectorAll(".mark-host svg.sigil [data-gravity-hub]").forEach((el) => {
      el.removeAttribute("data-gravity-hub");
    });
  };

  const markHub = (id) => {
    clearHubMarks();
    const el = findEl(id);
    if (el) el.setAttribute("data-gravity-hub", "true");
  };

  const stopOrbitLoop = () => {
    if (orbitRaf) {
      cancelAnimationFrame(orbitRaf);
      orbitRaf = 0;
    }
    orbitLastTs = 0;
  };

  const syncPinOrbitAttr = () => {
    document.documentElement.setAttribute(
      "data-pin-orbit",
      pinOn && pinMode === "orbit" ? "on" : "off"
    );
  };

  const pinMenuOpen = (open) => {
    if (!pinMenu || !pinBtn) return;
    pinMenu.hidden = !open;
    pinBtn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  const syncPinModeBtns = () => {
    pinModeBtns().forEach((btn) => {
      const m = btn.getAttribute("data-pin-mode");
      btn.setAttribute("aria-pressed", m === pinMode ? "true" : "false");
    });
  };

  const applyRepelFrom = (srcId, sx, sy) => {
    SYMBOLS.forEach((s) => {
      if (s.id === srcId) return;
      if (hubId && s.id === hubId && pinMode === "orbit") return; // hub stays put unless dragged
      const el = findEl(s.id);
      if (!el) return;
      const cfg = ensure(s.id);
      if (!cfg.pinned) ensurePinnedAtWorld(s.id);
      let dx = cfg.ax - sx;
      let dy = cfg.ay - sy;
      let d = Math.hypot(dx, dy);
      if (d < 0.001) {
        dx = 0.01;
        dy = 0;
        d = 0.01;
      }
      if (d >= MIN_SEP) return;
      const push = (MIN_SEP - d) * 0.65;
      cfg.ax = Math.round((cfg.ax + (dx / d) * push) * 10) / 10;
      cfg.ay = Math.round((cfg.ay + (dy / d) * push) * 10) / 10;
      cfg.pinned = true;
      placeAbs(s.id);
      if (pinMode === "orbit" && s.id !== hubId && moonAngles.has(s.id)) {
        const hx = ensure(hubId).ax;
        const hy = ensure(hubId).ay;
        moonAngles.set(s.id, Math.atan2(cfg.ay - hy, cfg.ax - hx));
        moonRadii.set(s.id, Math.max(120, Math.hypot(cfg.ax - hx, cfg.ay - hy)));
      }
    });
  };

  const seedOrbitFromHub = (id) => {
    hubId = id;
    markHub(id);
    const hubCfg = ensurePinnedAtWorld(id);
    if (!hubCfg) return;
    const hx = hubCfg.ax;
    const hy = hubCfg.ay;
    moonAngles.clear();
    moonRadii.clear();
    const moons = SYMBOLS.map((s) => s.id).filter((mid) => mid !== id && findEl(mid));
    // Capture current angles, then ease toward even spacing
    const infos = moons.map((mid) => {
      const cfg = ensurePinnedAtWorld(mid);
      return {
        id: mid,
        ang: Math.atan2(cfg.ay - hy, cfg.ax - hx),
      };
    });
    infos.sort((a, b) => a.ang - b.ang);
    const n = Math.max(1, infos.length);
    const startAng = -Math.PI / 2;
    infos.forEach((info, i) => {
      const target = startAng + (i * 2 * Math.PI) / n;
      moonAngles.set(info.id, target);
      moonRadii.set(info.id, ORBIT_R);
      const cfg = ensure(info.id);
      cfg.ax = hx + Math.cos(target) * ORBIT_R;
      cfg.ay = hy + Math.sin(target) * ORBIT_R;
      cfg.pinned = true;
      placeAbs(info.id);
    });
    writeStore(store);
  };

  const tickOrbit = (ts) => {
    if (!pinOn || pinMode !== "orbit" || !hubId) {
      stopOrbitLoop();
      return;
    }
    if (!orbitLastTs) orbitLastTs = ts;
    const dt = Math.min(0.05, (ts - orbitLastTs) / 1000);
    orbitLastTs = ts;
    const hubCfg = ensure(hubId);
    const hx = hubCfg.ax;
    const hy = hubCfg.ay;
    const omega = (Math.PI * 2) / (ORBIT_PERIOD_MS / 1000);
    const draggingId = drag ? drag.id : null;
    moonAngles.forEach((ang, id) => {
      if (id === draggingId) return;
      const r = moonRadii.get(id) || ORBIT_R;
      const next = ang + omega * dt;
      moonAngles.set(id, next);
      const cfg = ensure(id);
      cfg.ax = hx + Math.cos(next) * r;
      cfg.ay = hy + Math.sin(next) * r;
      cfg.pinned = true;
      placeAbs(id);
    });
    orbitRaf = requestAnimationFrame(tickOrbit);
  };

  const startOrbitLoop = () => {
    stopOrbitLoop();
    if (!pinOn || pinMode !== "orbit" || !hubId) return;
    orbitLastTs = 0;
    orbitRaf = requestAnimationFrame(tickOrbit);
  };

  const setPinMode = (mode) => {
    pinMode = mode === "orbit" ? "orbit" : "free";
    syncPinModeBtns();
    syncPinOrbitAttr();
    if (pinMode === "orbit") {
      // Default hub: torus if present, else first symbol; arrange moons
      const prefer = findEl("torus") ? "torus" : (SYMBOLS[0] && SYMBOLS[0].id);
      if (prefer) seedOrbitFromHub(prefer);
      startOrbitLoop();
    } else {
      stopOrbitLoop();
      clearHubMarks();
      hubId = null;
      moonAngles.clear();
      moonRadii.clear();
    }
  };

  const setPin = (on) => {
    pinOn = !!on;
    document.documentElement.setAttribute("data-pin", pinOn ? "on" : "off");
    if (pinBtn) pinBtn.setAttribute("aria-pressed", pinOn ? "true" : "false");
    if (!pinOn) {
      pinMenuOpen(false);
      stopOrbitLoop();
      clearHubMarks();
      hubId = null;
      moonAngles.clear();
      moonRadii.clear();
      pinMode = "free";
      syncPinModeBtns();
      syncPinOrbitAttr();
    } else {
      syncPinOrbitAttr();
      if (pinMode === "orbit") {
        if (!hubId) setPinMode("orbit");
        else startOrbitLoop();
      }
    }
  };

  setPin(false);
  syncPinModeBtns();
  syncPinOrbitAttr();

  if (pinBtn) {
    pinBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const next = !pinOn;
      if (next && ringOn) {
        ringOn = false;
        writeRing(false);
        syncRing();
      }
      setPin(next);
      if (next) {
        pinMenuOpen(true);
        // freeze seats into free-layer at current world poses for easy drag
        SYMBOLS.forEach((s) => ensurePinnedAtWorld(s.id));
        writeStore(store);
      }
      applyAll();
    });
  }

  pinModeBtns().forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!pinOn) {
        if (ringOn) {
          ringOn = false;
          writeRing(false);
          syncRing();
        }
        setPin(true);
        SYMBOLS.forEach((s) => ensurePinnedAtWorld(s.id));
        writeStore(store);
      }
      setPinMode(btn.getAttribute("data-pin-mode"));
      pinMenuOpen(true);
      applyAll();
    });
  });

  document.addEventListener("click", (e) => {
    if (!pinMenu || pinMenu.hidden) return;
    if (e.target.closest("[data-pin-wrap]")) return;
    pinMenuOpen(false);
  });

  const onPointerDown = (e) => {
    if (!pinOn) return;
    const el = e.target.closest(".mark-host svg.sigil .sym, .mark-host svg.sigil .center");
    if (!el) return;
    const id = el.getAttribute("data-sym");
    if (!SYMBOLS.some((s) => s.id === id)) return;
    e.preventDefault();
    e.stopPropagation();
    const svg = el.ownerSVGElement;
    const p = svgPoint(svg, e.clientX, e.clientY);
    ensurePinnedAtWorld(id);
    const cfg = ensure(id);
    drag = {
      id,
      el,
      svg,
      lastX: p.x,
      lastY: p.y,
      startX: p.x,
      startY: p.y,
      moved: false,
      pointerId: e.pointerId,
    };
    selected = new Set([id]);
    writeSelected(selected);
    writeStore(store);
    renderLists();
    try {
      el.setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const onPointerMove = (e) => {
    if (!drag) return;
    e.preventDefault();
    const p = svgPoint(drag.svg, e.clientX, e.clientY);
    const dx = p.x - drag.lastX;
    const dy = p.y - drag.lastY;
    if (Math.hypot(p.x - drag.startX, p.y - drag.startY) > 4) drag.moved = true;
    drag.lastX = p.x;
    drag.lastY = p.y;
    const cfg = ensure(drag.id);
    cfg.pinned = true;
    cfg.ax = Math.round((cfg.ax + dx) * 10) / 10;
    cfg.ay = Math.round((cfg.ay + dy) * 10) / 10;
    placeAbs(drag.id);
    applyRepelFrom(drag.id, cfg.ax, cfg.ay);

    if (pinMode === "orbit" && hubId) {
      if (drag.id === hubId) {
        // hub moves — moons keep angles/radii relative
        const hx = cfg.ax;
        const hy = cfg.ay;
        moonAngles.forEach((ang, mid) => {
          const r = moonRadii.get(mid) || ORBIT_R;
          const mcfg = ensure(mid);
          mcfg.ax = hx + Math.cos(ang) * r;
          mcfg.ay = hy + Math.sin(ang) * r;
          mcfg.pinned = true;
          placeAbs(mid);
        });
      } else if (moonAngles.has(drag.id) || drag.id !== hubId) {
        const hx = ensure(hubId).ax;
        const hy = ensure(hubId).ay;
        moonAngles.set(drag.id, Math.atan2(cfg.ay - hy, cfg.ax - hx));
        moonRadii.set(drag.id, Math.max(110, Math.hypot(cfg.ax - hx, cfg.ay - hy)));
      }
    }
    writeStore(store);
  };

  const onPointerUp = (e) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    // Click without much move in Orbit mode → set gravity hub
    if (pinMode === "orbit" && !d.moved) {
      seedOrbitFromHub(d.id);
      startOrbitLoop();
    } else if (pinMode === "orbit" && hubId && d.id !== hubId) {
      // snap radius gently toward ring after drag
      const hx = ensure(hubId).ax;
      const hy = ensure(hubId).ay;
      const cfg = ensure(d.id);
      const ang = Math.atan2(cfg.ay - hy, cfg.ax - hx);
      const r = Math.max(110, Math.min(420, Math.hypot(cfg.ax - hx, cfg.ay - hy)));
      moonAngles.set(d.id, ang);
      moonRadii.set(d.id, r);
      if (!orbitRaf) startOrbitLoop();
    }
    writeStore(store);
  };

  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("pointermove", onPointerMove, true);
  document.addEventListener("pointerup", onPointerUp, true);
  document.addEventListener("pointercancel", onPointerUp, true);

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
