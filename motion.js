(() => {
  const STORE_KEY = "pair-sym-motion-v16";
  const SELECTED_KEY = "pair-motion-selected-v16";
  const RING_KEY = "pair-motion-ring-v16";

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
    if (!store[id]) store[id] = { anim: "off", speed: 100, colour: "off", colourSpeed: 100, size: 100, x: 0, y: 0, pinned: false, ax: 0, ay: 0 };
    const a = store[id].anim;
    if (a !== "cw" && a !== "ccw" && a !== "off") store[id].anim = "off";
    if (store[id].colour !== "vibe") store[id].colour = "off";
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
      // rare: unpinned torus nudge
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
    el.dataset.colour = cfg.colour === "vibe" ? "vibe" : "off";
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
      if (freeOrbitOn) setFreeOrbit(false);
      setPin(false);
      applyAll();
      renderLists();
    });
  }


  // Orbit mode: uniformly orbit free-agent symbols around whichever is in the center
  const SVG_CX = 447.56;
  const SVG_CY = 484.96;
  let freeOrbitOn = false;
  let freeOrbitCenterId = null;
  const orbitBtn = document.querySelector("[data-motion-orbit]");

  const ensureSpinGroup = (parent, cls) => {
    let g = parent && parent.querySelector(":scope > ." + cls);
    if (!g) {
      g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", cls);
      if (parent) parent.appendChild(g);
    }
    return g;
  };

  const tearDownFreeOrbit = () => {
    const spin = document.querySelector(".mark-host svg.sigil .live-orbit-spin");
    const hitSpin = document.querySelector(".hits .hits-live-orbit-spin");
    const free = freeLayer();
    const hf = hitsFree();
    const ids = [];
    if (spin) {
      Array.from(spin.querySelectorAll("[data-sym-slot]")).forEach((slot) => {
        const id = slot.getAttribute("data-sym-slot");
        ids.push(id);
        const el = findEl(id);
        if (el) {
          const w = worldCenter(el);
          const cfg = ensure(id);
          cfg.pinned = true;
          cfg.ax = w.x;
          cfg.ay = w.y;
        }
        if (free) free.appendChild(slot);
      });
      spin.remove();
    }
    if (hitSpin) {
      Array.from(hitSpin.querySelectorAll("[data-hotspot]")).forEach((hit) => {
        if (hf) hf.appendChild(hit);
      });
      hitSpin.remove();
    }
    ids.forEach((id) => applyPose(id));
    if (freeOrbitCenterId) applyPose(freeOrbitCenterId);
    freeOrbitCenterId = null;
    document.documentElement.setAttribute("data-free-orbit", "off");
  };

  const startFreeOrbit = () => {
    tearDownFreeOrbit();
    // Snapshot every symbol into free agents at current world position
    SYMBOLS.forEach((s) => {
      const el = findEl(s.id);
      if (!el) return;
      const w = worldCenter(el);
      const cfg = ensure(s.id);
      cfg.pinned = true;
      cfg.ax = w.x;
      cfg.ay = w.y;
      releaseToFree(s.id);
      applyPose(s.id);
    });
    writeStore(store);

    // Center = symbol closest to SVG portal center
    let best = null;
    let bestD = Infinity;
    SYMBOLS.forEach((s) => {
      if (!findEl(s.id)) return;
      const cfg = ensure(s.id);
      const d = (cfg.ax - SVG_CX) * (cfg.ax - SVG_CX) + (cfg.ay - SVG_CY) * (cfg.ay - SVG_CY);
      if (d < bestD) {
        bestD = d;
        best = s.id;
      }
    });
    if (!best) return;
    freeOrbitCenterId = best;
    const cc = ensure(best);

    const others = SYMBOLS.map((s) => s.id).filter((id) => id !== best && findEl(id));
    const infos = others
      .map((id) => {
        const cfg = ensure(id);
        const dx = cfg.ax - cc.ax;
        const dy = cfg.ay - cc.ay;
        return { id, ang: Math.atan2(dy, dx), r: Math.hypot(dx, dy) || 220 };
      })
      .sort((a, b) => a.ang - b.ang);
    if (!infos.length) return;

    const Ravg = infos.reduce((s, i) => s + i.r, 0) / infos.length;
    const R = Math.max(160, Math.min(380, Ravg));
    const startAng = infos[0].ang;
    const n = infos.length;

    const free = freeLayer();
    const hf = hitsFree();
    if (!free) return;
    const spin = ensureSpinGroup(free, "live-orbit-spin");
    spin.style.transformOrigin = cc.ax + "px " + cc.ay + "px";
    const hitSpin = hf ? ensureSpinGroup(hf, "hits-live-orbit-spin") : null;
    if (hitSpin) hitSpin.style.transformOrigin = cc.ax + "px " + cc.ay + "px";

    infos.forEach((info, i) => {
      const ang = startAng + (i * 2 * Math.PI) / n;
      const ax = cc.ax + R * Math.cos(ang);
      const ay = cc.ay + R * Math.sin(ang);
      const cfg = ensure(info.id);
      cfg.pinned = true;
      cfg.ax = ax;
      cfg.ay = ay;
      const slot = findSlot(info.id);
      const el = findEl(info.id);
      if (slot && el) {
        spin.appendChild(slot);
        setSlotAbs(slot, el, ax, ay);
      }
      const hit = findHit(info.id);
      if (hit && hitSpin) {
        hitSpin.appendChild(hit);
        const hc = hit.querySelector("circle.hit");
        if (hc) {
          const hx = Number(hc.getAttribute("cx")) || 0;
          const hy = Number(hc.getAttribute("cy")) || 0;
          hit.setAttribute("transform", "translate(" + (ax - hx) + " " + (ay - hy) + ")");
        }
      }
    });

    // Center stays fixed in free-layer
    applyPose(best);
    writeStore(store);
    document.documentElement.setAttribute("data-free-orbit", "on");
  };

  const setFreeOrbit = (on) => {
    freeOrbitOn = !!on;
    if (orbitBtn) orbitBtn.setAttribute("aria-pressed", freeOrbitOn ? "true" : "false");
    if (freeOrbitOn) {
      // Free-layout orbit replaces legacy Motion ring
      if (ringOn) {
        ringOn = false;
        writeRing(false);
        syncRing();
      }
      if (pinOn) setPin(false);
      startFreeOrbit();
    } else {
      tearDownFreeOrbit();
    }
  };

  if (orbitBtn) {
    orbitBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setFreeOrbit(!freeOrbitOn);
    });
  }

    // Pin mode (top bar): drag any symbol — free agent, stays where dropped
  let pinOn = false;
  const pinBtn = document.querySelector("[data-motion-pin]");
  const setPin = (on) => {
    pinOn = !!on;
    document.documentElement.setAttribute("data-pin", pinOn ? "on" : "off");
    if (pinBtn) pinBtn.setAttribute("aria-pressed", pinOn ? "true" : "false");
  };
  setPin(false);
  if (pinBtn) {
    pinBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const next = !pinOn;
      if (next && freeOrbitOn) setFreeOrbit(false);
      setPin(next);
    });
  }

  let drag = null;
  const onPointerDown = (e) => {
    if (!pinOn) return;
    const el = e.target.closest(".mark-host svg.sigil .sym, .mark-host svg.sigil .center");
    if (!el) return;
    const id = el.getAttribute("data-sym");
    // hitpad is inside .sym — already covered by closest(.sym)
    if (!SYMBOLS.some((s) => s.id === id)) return;
    e.preventDefault();
    e.stopPropagation();
    const svg = el.ownerSVGElement;
    const p = svgPoint(svg, e.clientX, e.clientY);
    releaseToFree(id);
    const cfg = ensure(id);
    drag = { id, el, svg, lastX: p.x, lastY: p.y };
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
    drag.lastX = p.x;
    drag.lastY = p.y;
    const cfg = ensure(drag.id);
    cfg.pinned = true;
    cfg.ax = Math.round((cfg.ax + dx) * 10) / 10;
    cfg.ay = Math.round((cfg.ay + dy) * 10) / 10;
    writeStore(store);
    applyPose(drag.id);
  };
  const onPointerUp = () => {
    drag = null;
  };
  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("pointermove", onPointerMove, true);
  document.addEventListener("pointerup", onPointerUp, true);
  document.addEventListener("pointercancel", onPointerUp, true);

  document.documentElement.setAttribute("data-colour", "off");
  document.documentElement.setAttribute("data-free-orbit", "off");
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
