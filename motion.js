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

  // —— Pin: fluid drag + optional hard repel + Cloud-orbit prototype ——
  const SVG_CX = 447.56;
  const SVG_CY = 484.96;
  const CLOUD_ID = "cloud";
  const REPEL_PAD = 1.12; // radii must not overlap (extra padding)
  const CLOUD_ORBIT_GAP = 36;
  const CLOUD_ORBIT_PERIOD = 60; // seconds for one clean revolution (rigid ring)

  let pinOn = false;
  let repelOn = true;
  let cloudOrbitOn = false;
  let drag = null;
  // hubId is Cloud for now; later any selected symbol can become the hub
  let hubId = CLOUD_ID;
  let ringIds = []; // moons in even angular order
  let ringRadius = 0; // single shared radius — perfect circle
  let ringPhase = -Math.PI / 2; // shared rotation phase
  let cloudRaf = 0;
  let cloudLastTs = 0;

  const pinBtn = document.querySelector("[data-motion-pin]");
  const pinMenu = document.querySelector("[data-pin-menu]");
  const repelBtn = document.querySelector("[data-pin-repel]");
  const cloudOrbitBtn = document.querySelector("[data-pin-cloud-orbit]");

  const pinMenuOpen = (open) => {
    if (!pinMenu || !pinBtn) return;
    pinMenu.hidden = !open;
    pinBtn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  const syncPinUi = () => {
    if (pinBtn) pinBtn.setAttribute("aria-pressed", pinOn ? "true" : "false");
    document.documentElement.setAttribute("data-pin", pinOn ? "on" : "off");
    if (repelBtn) repelBtn.setAttribute("aria-pressed", repelOn ? "true" : "false");
    if (cloudOrbitBtn) cloudOrbitBtn.setAttribute("aria-pressed", cloudOrbitOn ? "true" : "false");
    document.documentElement.setAttribute("data-cloud-orbit", cloudOrbitOn && pinOn ? "on" : "off");
  };

  const artRadius = (id) => {
    const el = findEl(id);
    if (!el) return 40;
    try {
      const bb = el.getBBox();
      const scale = clampSize(ensure(id).size) / 100;
      return (Math.max(bb.width, bb.height) / 2) * scale;
    } catch (err) {
      return 40;
    }
  };

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
    if (!cfg.pinned) {
      try {
        const w = worldCenter(el);
        cfg.ax = w.x;
        cfg.ay = w.y;
      } catch (err) {
        cfg.ax = SVG_CX;
        cfg.ay = SVG_CY;
      }
      cfg.pinned = true;
    }
    placeAbs(id);
    return cfg;
  };

  // Hard separation: no two symbols may touch/overlay when repel is on
  const resolveRepel = (priorityId) => {
    if (!repelOn || !pinOn) return;
    const ids = SYMBOLS.map((s) => s.id).filter((id) => findEl(id));
    ids.forEach((id) => {
      if (!ensure(id).pinned) ensurePinnedAtWorld(id);
    });
    // Multiple passes so chains settle
    for (let pass = 0; pass < 5; pass++) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = ids[i];
          const b = ids[j];
          // Rigid cloud-orbit ring owns spacing — don't shove moons off the circle
          if (cloudOrbitOn) {
            const onRing = (id) => id === hubId || ringIds.indexOf(id) >= 0;
            if (onRing(a) && onRing(b)) continue;
          }
          const ca = ensure(a);
          const cb = ensure(b);
          const need = (artRadius(a) + artRadius(b)) * REPEL_PAD;
          let dx = cb.ax - ca.ax;
          let dy = cb.ay - ca.ay;
          let d = Math.hypot(dx, dy);
          if (d < 0.001) {
            dx = 0.01;
            dy = 0;
            d = 0.01;
          }
          if (d >= need) continue;
          const push = (need - d) / 2;
          const ux = dx / d;
          const uy = dy / d;
          // Keep priority (dragged / cloud hub) more fixed
          let wa = 1;
          let wb = 1;
          if (priorityId === a) {
            wa = 0.05;
            wb = 1.95;
          } else if (priorityId === b) {
            wa = 1.95;
            wb = 0.05;
          } else if (cloudOrbitOn && a === hubId) {
            wa = 0.1;
            wb = 1.9;
          } else if (cloudOrbitOn && b === hubId) {
            wa = 1.9;
            wb = 0.1;
          }
          const sum = wa + wb;
          ca.ax = Math.round((ca.ax - ux * push * (wa / sum) * 2) * 10) / 10;
          ca.ay = Math.round((ca.ay - uy * push * (wa / sum) * 2) * 10) / 10;
          cb.ax = Math.round((cb.ax + ux * push * (wb / sum) * 2) * 10) / 10;
          cb.ay = Math.round((cb.ay + uy * push * (wb / sum) * 2) * 10) / 10;
          ca.pinned = true;
          cb.pinned = true;
        }
      }
    }
    ids.forEach((id) => placeAbs(id));
  };

  const stopCloudOrbit = () => {
    if (cloudRaf) {
      cancelAnimationFrame(cloudRaf);
      cloudRaf = 0;
    }
    cloudLastTs = 0;
    ringIds = [];
    ringRadius = 0;
    document.querySelectorAll(".mark-host svg.sigil [data-cloud-hub]").forEach((el) => {
      el.removeAttribute("data-cloud-hub");
      el.style.removeProperty("--tidal-rot");
    });
    document.querySelectorAll(".mark-host svg.sigil [data-cloud-moon]").forEach((el) => {
      el.removeAttribute("data-cloud-moon");
      el.style.removeProperty("--tidal-rot");
    });
  };

  const layoutRing = () => {
    const hub = ensure(hubId);
    const n = ringIds.length;
    if (!n || !ringRadius) return;
    ringIds.forEach((id, i) => {
      if (drag && drag.id === id) return;
      const ang = ringPhase + (i * 2 * Math.PI) / n;
      const cfg = ensure(id);
      cfg.ax = hub.ax + Math.cos(ang) * ringRadius;
      cfg.ay = hub.ay + Math.sin(ang) * ringRadius;
      cfg.pinned = true;
      placeAbs(id);
      const el = findEl(id);
      if (el) {
        el.setAttribute("data-cloud-moon", "true");
        el.style.setProperty("--tidal-rot", ang + Math.PI / 2 + "rad");
      }
    });
  };

  const rebuildCloudMoons = () => {
    const hubEl = findEl(hubId);
    if (!hubEl) return;
    const hub = ensurePinnedAtWorld(hubId);
    hubEl.setAttribute("data-cloud-hub", "true");
    document.querySelectorAll(".mark-host svg.sigil [data-cloud-moon]").forEach((el) => {
      el.removeAttribute("data-cloud-moon");
      el.style.removeProperty("--tidal-rot");
    });

    const hubR = artRadius(hubId);
    const smaller = [];
    SYMBOLS.forEach((s) => {
      if (s.id === hubId) return;
      if (!findEl(s.id)) return;
      const r = artRadius(s.id);
      if (r < hubR * 0.98) smaller.push({ id: s.id, r });
    });
    // Stable order by size then id — even slots around the circle
    smaller.sort((a, b) => a.r - b.r || a.id.localeCompare(b.id));
    ringIds = smaller.map((m) => m.id);
    const n = ringIds.length;
    if (!n) {
      ringRadius = 0;
      writeStore(store);
      return;
    }

    const maxMoonR = Math.max.apply(null, smaller.map((m) => m.r));
    // Fit: clear of hub, and even chord spacing so moons never overlap
    const clearHub = hubR + maxMoonR + CLOUD_ORBIT_GAP;
    const sinHalf = Math.sin(Math.PI / n);
    const clearMoons = sinHalf > 0.001 ? (maxMoonR * REPEL_PAD) / sinHalf : clearHub;
    ringRadius = Math.max(clearHub, clearMoons);

    // Keep current phase; just snap onto perfect even angles
    layoutRing();
    writeStore(store);
  };

  const tickCloudOrbit = (ts) => {
    if (!pinOn || !cloudOrbitOn) {
      stopCloudOrbit();
      return;
    }
    if (!cloudLastTs) cloudLastTs = ts;
    const dt = Math.min(0.05, (ts - cloudLastTs) / 1000);
    cloudLastTs = ts;

    // Rigid ring: one shared omega — perfect spacing stays perfect
    if (!(drag && (drag.id === hubId || ringIds.indexOf(drag.id) >= 0))) {
      const omega = (Math.PI * 2) / CLOUD_ORBIT_PERIOD;
      ringPhase += omega * dt;
      layoutRing();
    } else if (drag && drag.id === hubId) {
      // Hub moving — moons stay locked relative via layoutRing
      layoutRing();
    }
    cloudRaf = requestAnimationFrame(tickCloudOrbit);
  };

  const startCloudOrbit = () => {
    if (cloudRaf) cancelAnimationFrame(cloudRaf);
    cloudLastTs = 0;
    hubId = CLOUD_ID; // prototype hub; later: selected symbol
    ringPhase = -Math.PI / 2;
    rebuildCloudMoons();
    cloudRaf = requestAnimationFrame(tickCloudOrbit);
  };

  const setCloudOrbit = (on) => {
    cloudOrbitOn = !!on;
    if (cloudOrbitOn) {
      if (!pinOn) {
        // force pin on
        pinOn = true;
        if (ringOn) {
          ringOn = false;
          writeRing(false);
          syncRing();
        }
        SYMBOLS.forEach((s) => ensurePinnedAtWorld(s.id));
      }
      startCloudOrbit();
    } else {
      stopCloudOrbit();
    }
    syncPinUi();
  };

  const setRepel = (on) => {
    repelOn = !!on;
    syncPinUi();
    if (repelOn && pinOn) {
      resolveRepel(drag ? drag.id : null);
      writeStore(store);
    }
  };

  const setPin = (on) => {
    pinOn = !!on;
    if (!pinOn) {
      pinMenuOpen(false);
      cloudOrbitOn = false;
      stopCloudOrbit();
    } else {
      SYMBOLS.forEach((s) => ensurePinnedAtWorld(s.id));
      writeStore(store);
      if (repelOn) resolveRepel(null);
      if (cloudOrbitOn) startCloudOrbit();
    }
    syncPinUi();
  };

  setPin(false);
  syncPinUi();

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
      if (next) pinMenuOpen(true);
      applyAll();
    });
  }

  if (repelBtn) {
    repelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!pinOn) {
        if (ringOn) {
          ringOn = false;
          writeRing(false);
          syncRing();
        }
        setPin(true);
        pinMenuOpen(true);
      }
      setRepel(!repelOn);
      applyAll();
    });
  }

  if (cloudOrbitBtn) {
    cloudOrbitBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!pinOn) {
        if (ringOn) {
          ringOn = false;
          writeRing(false);
          syncRing();
        }
        setPin(true);
        pinMenuOpen(true);
      }
      setCloudOrbit(!cloudOrbitOn);
      applyAll();
    });
  }

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
    drag = {
      id,
      el,
      svg,
      lastX: p.x,
      lastY: p.y,
      moved: false,
      startX: p.x,
      startY: p.y,
    };
    selected = new Set([id]);
    writeSelected(selected);
    renderLists();
    try {
      el.setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const onPointerMove = (e) => {
    if (!drag) return;
    e.preventDefault();
    const p = svgPoint(drag.svg, e.clientX, e.clientY);
    if (Math.hypot(p.x - drag.startX, p.y - drag.startY) > 3) drag.moved = true;
    const dx = p.x - drag.lastX;
    const dy = p.y - drag.lastY;
    drag.lastX = p.x;
    drag.lastY = p.y;
    const cfg = ensure(drag.id);
    cfg.pinned = true;
    cfg.ax = Math.round((cfg.ax + dx) * 10) / 10;
    cfg.ay = Math.round((cfg.ay + dy) * 10) / 10;
    placeAbs(drag.id);

    if (cloudOrbitOn && drag.id === hubId) {
      layoutRing();
    }
    // While dragging a moon, allow free move; ring snaps even again on release

    if (repelOn) resolveRepel(drag.id);
    writeStore(store);
  };

  const onPointerUp = () => {
    if (!drag) return;
    const id = drag.id;
    drag = null;
    if (cloudOrbitOn) {
      // Snap back to perfect even circular spacing (phase from drop angle if a moon was dragged)
      if (id !== hubId && ringIds.indexOf(id) >= 0) {
        const hub = ensure(hubId);
        const cfg = ensure(id);
        const dropAng = Math.atan2(cfg.ay - hub.ay, cfg.ax - hub.ax);
        const idx = ringIds.indexOf(id);
        const n = ringIds.length;
        if (n > 0 && idx >= 0) {
          ringPhase = dropAng - (idx * 2 * Math.PI) / n;
        }
      }
      rebuildCloudMoons();
      if (!cloudRaf) cloudRaf = requestAnimationFrame(tickCloudOrbit);
    } else if (repelOn) {
      resolveRepel(id);
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
