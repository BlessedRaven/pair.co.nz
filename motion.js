(() => {
  const STORE_KEY = "pair-sym-motion-v21";
  const SELECTED_KEY = "pair-motion-selected-v19";
  const RING_KEY = "pair-motion-ring-v19";
  const RING_SPIN_KEY = "pair-motion-ring-spin-v1";

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
  const readRingSpin = () => {
    try {
      const v = localStorage.getItem(RING_SPIN_KEY);
      if (v === "cw" || v === "ccw") return v;
    } catch {}
    return "off";
  };
  const writeRingSpin = (v) => {
    try {
      localStorage.setItem(RING_SPIN_KEY, v === "cw" || v === "ccw" ? v : "off");
    } catch {}
  };
  let ringSpin = readRingSpin(); // off | cw | ccw — global Motion shape spin

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
    if (!store[id]) store[id] = { anim: "off", speed: 100, colour: "off", colourSpeed: 100, size: 100, x: 0, y: 0, pinned: false, ax: 0, ay: 0, orb: false, orbFn: "shield", orbField: false };
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
    store[id].orb = !!store[id].orb;
    const ofn = store[id].orbFn;
    store[id].orbFn = ofn === "orbit" || ofn === "cloud" ? ofn : "shield";
    store[id].orbField = !!store[id].orbField;
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

  // Never spin these — they overlap neighbors in the artist layout
  const MOTION_SPIN_NEVER = new Set(["ra", "pi", "scarab", "hermes"]);
  // Soft-gated shapes may spin only when zoomed out enough if they overlay others
  const MOTION_SPIN_ZOOM_MAX = 0.82; // at or below this zoom, overlapping soft shapes may spin

  const readMarkZoom = () => {
    const raw = getComputedStyle(document.querySelector("[data-mark]") || document.documentElement)
      .getPropertyValue("--mark-zoom")
      .trim();
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 1;
  };

  const artScreenRect = (el) => {
    return withArtOnly(el, () => el.getBoundingClientRect());
  };

  const rectsOverlap = (a, b, pad) => {
    if (!a || !b) return false;
    return !(
      a.right < b.left - pad ||
      a.left > b.right + pad ||
      a.bottom < b.top - pad ||
      a.top > b.bottom + pad
    );
  };

  const shapeOverlapsNeighbor = (id, rects) => {
    const mine = rects[id];
    if (!mine) return false;
    for (const other of Object.keys(rects)) {
      if (other === id) continue;
      if (rectsOverlap(mine, rects[other], 4)) return true;
    }
    return false;
  };

  const syncMotionSpinUi = () => {
    document.documentElement.setAttribute("data-ring-spin", ringOn ? ringSpin : "off");
    document.querySelectorAll("[data-motion-menu] [data-motion-spin]").forEach((btn) => {
      const dir = btn.getAttribute("data-motion-spin");
      btn.setAttribute("aria-pressed", ringOn && ringSpin === dir ? "true" : "false");
    });
  };

  const applyMotionSpin = () => {
    const dir = ringOn && (ringSpin === "cw" || ringSpin === "ccw") ? ringSpin : "off";
    const zoom = readMarkZoom();
    const els = {};
    SYMBOLS.forEach((s) => {
      const el = findEl(s.id);
      if (el) els[s.id] = el;
    });
    const rects = {};
    Object.keys(els).forEach((id) => {
      try {
        rects[id] = artScreenRect(els[id]);
      } catch (err) {
        rects[id] = null;
      }
    });

    Object.keys(els).forEach((id) => {
      const el = els[id];
      let allow = false;
      if (dir !== "off" && !MOTION_SPIN_NEVER.has(id)) {
        const overlaps = shapeOverlapsNeighbor(id, rects);
        if (!overlaps) allow = true;
        else allow = zoom <= MOTION_SPIN_ZOOM_MAX;
      }
      if (allow) {
        el.setAttribute("data-motion-spin", dir);
        el.style.removeProperty("animation");
      } else {
        el.removeAttribute("data-motion-spin");
      }
    });
    syncMotionSpinUi();
  };

  const syncRing = () => {
    document.documentElement.setAttribute("data-ring", ringOn ? "on" : "off");
    toggle.setAttribute("aria-pressed", ringOn ? "true" : "false");
    applyMotionSpin();
  };

  const findSlot = (id) =>
    document.querySelector('.mark-host svg.sigil [data-sym-slot="' + id + '"]');

  const findHit = (id) => document.querySelector('.hits [data-hotspot="' + id + '"]');

  const orbitLayer = () => document.querySelector(".mark-host svg.sigil .orbit");
  const freeLayer = () => document.querySelector(".mark-host svg.sigil .free-layer");
  const hitsOrbit = () => document.querySelector(".hits .hits-orbit");
  const hitsFree = () => document.querySelector(".hits .hits-free");

  // Hide hit clones / orbs so bbox + screen rect match painted art (fixes Pin repel)
  const withArtOnly = (el, fn) => {
    if (!el) return fn();
    const hidden = [];
    el.querySelectorAll(".sym-shape-hit, .sym-orb, .sym-hitpad").forEach((n) => {
      hidden.push([n, n.style.display, n.getAttribute("visibility")]);
      n.style.display = "none";
      n.setAttribute("visibility", "hidden");
    });
    try {
      return fn();
    } finally {
      hidden.forEach(([n, disp, vis]) => {
        n.style.display = disp || "";
        if (vis == null) n.removeAttribute("visibility");
        else n.setAttribute("visibility", vis);
      });
    }
  };

  const artCenter = (el) => {
    return withArtOnly(el, () => {
      try {
        const bb = el.getBBox();
        return { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 };
      } catch (err) {
        return { x: 0, y: 0 };
      }
    });
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
    return withArtOnly(el, () => {
      const r = el.getBoundingClientRect();
      return svgPoint(svg, r.left + r.width / 2, r.top + r.height / 2);
    });
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

  const ORB_FIELD_COLORS = {
    shield: { inner: "rgba(140, 210, 255, 0.08)", mid: "rgba(100, 180, 255, 0.28)", edge: "rgba(80, 160, 255, 0.42)", fade: "rgba(80, 160, 255, 0)" },
    orbit: { inner: "rgba(255, 220, 140, 0.06)", mid: "rgba(255, 190, 80, 0.26)", edge: "rgba(255, 170, 50, 0.4)", fade: "rgba(255, 170, 50, 0)" },
    cloud: { inner: "rgba(200, 180, 255, 0.1)", mid: "rgba(160, 140, 255, 0.3)", edge: "rgba(130, 110, 255, 0.45)", fade: "rgba(130, 110, 255, 0)" },
  };

  const syncOrbOn = (id) => {
    const el = findEl(id);
    if (!el) return;
    const cfg = ensure(id);
    let orb = el.querySelector(":scope > .sym-orb");
    if (!cfg.orb) {
      if (orb) orb.remove();
      return;
    }
    const ns = "http://www.w3.org/2000/svg";
    if (!orb || orb.tagName.toLowerCase() !== "g") {
      if (orb) orb.remove();
      orb = document.createElementNS(ns, "g");
      orb.setAttribute("class", "sym-orb");
      const firstArt = [...el.children].find(
        (c) => !c.classList.contains("sym-shape-hit") && !c.classList.contains("sym-hitpad") && !c.classList.contains("sym-orb")
      );
      if (firstArt) el.insertBefore(orb, firstArt);
      else el.appendChild(orb);
    }

    const bb = withArtOnly(el, () => {
      try {
        return el.getBBox();
      } catch (err) {
        return { x: 0, y: 0, width: 40, height: 40 };
      }
    });
    const fn = cfg.orbFn || "shield";
    const pad = fn === "cloud" ? 1.28 : fn === "orbit" ? 1.2 : 1.14;
    const cx = bb.x + bb.width / 2;
    const cy = bb.y + bb.height / 2;
    const r = Math.max(12, (Math.max(bb.width, bb.height) / 2) * pad);

    orb.setAttribute("data-orb-fn", fn);
    orb.setAttribute("data-orb-field", cfg.orbField ? "on" : "off");

    // Optional translucent field
    let field = orb.querySelector(".sym-orb-field");
    let defs = orb.querySelector("defs");
    if (cfg.orbField) {
      const gradId = "orb-field-grad-" + id;
      if (!defs) {
        defs = document.createElementNS(ns, "defs");
        orb.insertBefore(defs, orb.firstChild);
      }
      let grad = document.getElementById(gradId);
      if (!grad || grad.parentNode !== defs) {
        defs.innerHTML = "";
        grad = document.createElementNS(ns, "radialGradient");
        grad.setAttribute("id", gradId);
        for (let i = 0; i < 4; i++) {
          grad.appendChild(document.createElementNS(ns, "stop"));
        }
        defs.appendChild(grad);
      }
      const cols = ORB_FIELD_COLORS[fn] || ORB_FIELD_COLORS.shield;
      const stops = [
        [0, cols.inner],
        [0.45, cols.mid],
        [0.78, cols.edge],
        [1, cols.fade],
      ];
      [...grad.querySelectorAll("stop")].forEach((stop, i) => {
        const [off, col] = stops[i];
        stop.setAttribute("offset", off);
        stop.setAttribute("stop-color", col);
      });
      if (!field) {
        field = document.createElementNS(ns, "circle");
        field.setAttribute("class", "sym-orb-field");
        orb.appendChild(field);
      }
      field.setAttribute("cx", cx);
      field.setAttribute("cy", cy);
      field.setAttribute("r", r);
      field.setAttribute("fill", "url(#" + gradId + ")");
    } else if (field) {
      field.remove();
      if (defs) defs.remove();
    }

    // Rim circle (always)
    let rim = orb.querySelector(".sym-orb-rim");
    if (!rim) {
      rim = document.createElementNS(ns, "circle");
      rim.setAttribute("class", "sym-orb-rim");
      orb.appendChild(rim);
    }
    rim.setAttribute("cx", cx);
    rim.setAttribute("cy", cy);
    rim.setAttribute("r", r);
  };

  const applyToDom = (id) => {
    const cfg = ensure(id);
    const el = findEl(id);
    if (!el) return;
    el.dataset.anim = cfg.anim;
    el.dataset.colour = COLOUR_IDS.has(cfg.colour) ? cfg.colour : "off";
    applyPose(id);
    syncOrbOn(id);
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

    const projectOrbBtn = document.querySelector('[data-project-pick="orb"]');
    const projectDetail = document.querySelector('[data-project-detail="orb"]');
    const anyOrb = selectedList().some((id) => ensure(id).orb);
    if (projectOrbBtn) projectOrbBtn.setAttribute("aria-selected", anyOrb ? "true" : "false");
    if (projectDetail) projectDetail.hidden = !selected.size;
    document.querySelectorAll("[data-orb-fn]").forEach((btn) => {
      const fn = btn.getAttribute("data-orb-fn");
      btn.setAttribute("aria-selected", selected.size && fn === cfg.orbFn ? "true" : "false");
    });
    const fieldBtn = document.querySelector("[data-orb-field]");
    if (fieldBtn) {
      const anyField = selectedList().some((id) => ensure(id).orbField);
      fieldBtn.setAttribute("aria-pressed", selected.size && anyField ? "true" : "false");
    }
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

  const motionMenu = document.querySelector("[data-motion-menu]");
  const motionMenuOpen = (open) => {
    if (!motionMenu || !toggle) return;
    motionMenu.hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  };

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    ringOn = !ringOn;
    if (ringOn) {
      if (typeof pinOn !== "undefined" && pinOn) setPin(false);
      restoreNativeRing();
      motionMenuOpen(true);
    } else {
      motionMenuOpen(false);
    }
    writeRing(ringOn);
    syncRing();
    applyAll();
  });

  if (motionMenu) {
    motionMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      const btn = e.target.closest("[data-motion-spin]");
      if (!btn) return;
      const dir = btn.getAttribute("data-motion-spin");
      if (dir !== "cw" && dir !== "ccw") return;
      // Toggle off if pressing the active direction
      ringSpin = ringSpin === dir ? "off" : dir;
      if (!ringOn) {
        ringOn = true;
        if (typeof pinOn !== "undefined" && pinOn) setPin(false);
        restoreNativeRing();
        writeRing(true);
      }
      writeRingSpin(ringSpin);
      syncRing();
      applyAll();
    });
  }

  document.addEventListener("click", (e) => {
    if (!motionMenu || motionMenu.hidden) return;
    if (e.target.closest("[data-motion-wrap]")) return;
    motionMenuOpen(false);
  });

  document.addEventListener("pair:zoom", () => {
    if (ringOn && ringSpin !== "off") applyMotionSpin();
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

  const selectAllBtn = document.querySelector("[data-sym-select-all]");
  const selectNoneBtn = document.querySelector("[data-sym-select-none]");
  if (selectAllBtn) {
    selectAllBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      selected = new Set(SYMBOLS.map((s) => s.id));
      writeSelected(selected);
      selected.forEach((id) => ensure(id));
      renderLists();
    });
  }
  if (selectNoneBtn) {
    selectNoneBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      selected = new Set();
      writeSelected(selected);
      renderLists();
    });
  }

  const projectList = document.querySelector("[data-project-list]");
  if (projectList) {
    projectList.addEventListener("click", (e) => {
      e.stopPropagation();
      const btn = e.target.closest("[data-project-pick]");
      if (!btn) return;
      if (btn.getAttribute("data-project-pick") !== "orb") return;
      const ids = selectedList();
      if (!ids.length) return;
      const turnOn = !ids.every((id) => ensure(id).orb);
      ids.forEach((id) => {
        const cfg = ensure(id);
        cfg.orb = turnOn;
        if (turnOn) cfg.orbFn = cfg.orbFn || "shield";
      });
      writeStore(store);
      ids.forEach((id) => applyToDom(id));
      renderLists();
    });
  }

  const orbFnList = document.querySelector("[data-orb-fn-list]");
  if (orbFnList) {
    orbFnList.addEventListener("click", (e) => {
      e.stopPropagation();
      const btn = e.target.closest("[data-orb-fn]");
      if (!btn) return;
      const fn = btn.getAttribute("data-orb-fn");
      if (fn !== "shield" && fn !== "orbit" && fn !== "cloud") return;
      const ids = selectedList();
      if (!ids.length) return;
      ids.forEach((id) => {
        const cfg = ensure(id);
        cfg.orb = true;
        cfg.orbFn = fn;
      });
      writeStore(store);
      ids.forEach((id) => applyToDom(id));
      renderLists();
      // Soft link: single Cloud-fn pick can become Cloud-orbit hub when that mode is live
      if (fn === "cloud" && ids.length === 1) {
        document.dispatchEvent(new CustomEvent("pair:orb-cloud-hub", { detail: { id: ids[0] } }));
      }
    });
  }

  const orbFieldBtn = document.querySelector("[data-orb-field]");
  if (orbFieldBtn) {
    orbFieldBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const ids = selectedList();
      if (!ids.length) return;
      const turnOn = !ids.every((id) => ensure(id).orbField);
      ids.forEach((id) => {
        const cfg = ensure(id);
        cfg.orb = true;
        cfg.orbField = turnOn;
      });
      writeStore(store);
      ids.forEach((id) => applyToDom(id));
      renderLists();
    });
  }


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
      syncOrbOn(id);
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

  const doFullReset = () => {
    store = {};
    SYMBOLS.forEach((s) => {
      restoreToOrbit(s.id);
      store[s.id] = { anim: "off", speed: 100, colour: "off", colourSpeed: 100, size: 100, x: 0, y: 0, pinned: false, ax: 0, ay: 0, orb: false, orbFn: "shield", orbField: false };
    });
    document.querySelectorAll(".mark-host svg.sigil .sym-orb").forEach((n) => n.remove());
    writeStore(store);
    selected = new Set();
    writeSelected(selected);
    ringOn = false;
    writeRing(false);
    ringSpin = "off";
    writeRingSpin("off");
    setPin(false);
    applyAll();
    renderLists();
  };
  document.querySelectorAll("[data-motion-reset]").forEach((resetBtn) => {
    resetBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      doFullReset();
    });
  });


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

  // —— Pin: optional Repel / Stack. Orbit: separate multi-hub mode ——
  const SVG_CX = 447.56;
  const SVG_CY = 484.96;
  const REPEL_PAD = 1.12;
  const ORBIT_GAP = 36;
  const ORBIT_PERIOD = 60;

  let pinOn = false;
  let repelOn = false; // Stack is default; Repel is optional
  let orbitModeOn = false;
  let drag = null;
  // moonOf[moonId] = hubId — multiple hubs, many moons; Torus never a moon
  let moonOf = {};
  let activeHubId = null; // hub selected for assigning orbiters
  let attractors = {}; // hubId -> true (double-click / Pin Attract)
  let pinAttractOn = false;
  let harmonyOn = false; // site-wide no-overlap
  let harmonyRaf = 0;
  const ATTRACT_RANGE = 4.2; // pull radius = hub artRadius * this + pad
  const ATTRACT_PAD = 70;
  // per-hub ring state
  let hubRing = {}; // hubId -> { ids: [], radius, phase }
  let orbitRaf = 0;
  let orbitLastTs = 0;

  const pinBtn = document.querySelector("[data-motion-pin]");
  const pinMenu = document.querySelector("[data-pin-menu]");
  const repelBtn = document.querySelector("[data-pin-repel]");
  const stackBtn = document.querySelector("[data-pin-stack]");
  const pinLayoutResetBtn = document.querySelector("[data-pin-layout-reset]");
  const attractBtn = document.querySelector("[data-pin-attract]");
  const orbitBtn = document.querySelector("[data-orbit-toggle]");
  const harmonyBtn = document.querySelector("[data-harmony-toggle]");
  const orbitMenu = document.querySelector("[data-orbit-menu]");
  const orbitClearBtn = document.querySelector("[data-orbit-clear]");

  const pinMenuOpen = (open) => {
    if (!pinMenu || !pinBtn) return;
    pinMenu.hidden = !open;
    pinBtn.setAttribute("aria-expanded", open ? "true" : "false");
  };
  const orbitMenuOpen = (open) => {
    if (!orbitMenu || !orbitBtn) return;
    orbitMenu.hidden = !open;
    orbitBtn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  const syncPinUi = () => {
    if (pinBtn) pinBtn.setAttribute("aria-pressed", pinOn ? "true" : "false");
    document.documentElement.setAttribute("data-pin", pinOn ? "on" : "off");
    if (repelBtn) repelBtn.setAttribute("aria-pressed", repelOn ? "true" : "false");
    if (stackBtn) stackBtn.setAttribute("aria-pressed", !repelOn && !pinAttractOn ? "true" : "false");
    if (attractBtn) attractBtn.setAttribute("aria-pressed", pinAttractOn ? "true" : "false");
  };

  const syncOrbitUi = () => {
    if (orbitBtn) orbitBtn.setAttribute("aria-pressed", orbitModeOn ? "true" : "false");
    document.documentElement.setAttribute("data-orbit-mode", orbitModeOn ? "on" : "off");
    document.documentElement.setAttribute("data-cloud-orbit", orbitModeOn ? "on" : "off"); // legacy tap gate in app.js
    document.querySelectorAll(".mark-host svg.sigil [data-orbit-active-hub]").forEach((el) => {
      el.removeAttribute("data-orbit-active-hub");
    });
    if (orbitModeOn && activeHubId) {
      const el = findEl(activeHubId);
      if (el) el.setAttribute("data-orbit-active-hub", "true");
    }
  };

  const artRadius = (id) => {
    const el = findEl(id);
    if (!el) return 40;
    return withArtOnly(el, () => {
      try {
        const bb = el.getBBox();
        const scale = clampSize(ensure(id).size) / 100;
        return (Math.max(bb.width, bb.height) / 2) * scale;
      } catch (err) {
        return 40;
      }
    });
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

  const isOrbitBody = (id) => {
    if (!orbitModeOn) return false;
    if (moonOf[id]) return true;
    return Object.keys(moonOf).some((m) => moonOf[m] === id);
  };

  const resolveRepel = (priorityId) => {
    // Harmony = site-wide no overlap. Orbit also separates. Else Pin+Repel only.
    if (harmonyOn || orbitModeOn) {
      /* forced */
    } else if (!repelOn || !pinOn) {
      return;
    }
    const ids = SYMBOLS.map((s) => s.id).filter((id) => findEl(id));
    ids.forEach((id) => {
      if (!ensure(id).pinned) ensurePinnedAtWorld(id);
    });
    for (let pass = 0; pass < 5; pass++) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = ids[i];
          const b = ids[j];
          // Don't shove moons off their assigned rings
          if (orbitModeOn && isOrbitBody(a) && isOrbitBody(b)) {
            const ha = moonOf[a] || a;
            const hb = moonOf[b] || b;
            if (ha === hb) continue;
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
          let wa = 1;
          let wb = 1;
          if (priorityId === a) {
            wa = 0.05;
            wb = 1.95;
          } else if (priorityId === b) {
            wa = 1.95;
            wb = 0.05;
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

  const clearOrbitMarks = () => {
    document.querySelectorAll(".mark-host svg.sigil [data-cloud-hub], .mark-host svg.sigil [data-cloud-moon]").forEach((el) => {
      el.removeAttribute("data-cloud-hub");
      el.removeAttribute("data-cloud-moon");
      el.style.removeProperty("--tidal-rot");
    });
  };

  const stopOrbitEngine = () => {
    if (orbitRaf) {
      cancelAnimationFrame(orbitRaf);
      orbitRaf = 0;
    }
    orbitLastTs = 0;
    clearOrbitMarks();
  };

  const moonsOfHub = (hub) =>
    Object.keys(moonOf)
      .filter((m) => moonOf[m] === hub)
      .sort();

  const fitRingRadius = (hub, moons) => {
    const hubR = artRadius(hub);
    if (!moons.length) return 0;
    const moonRs = moons.map((id) => artRadius(id));
    const maxMoonR = Math.max.apply(null, moonRs);
    const meanMoonR = moonRs.reduce((a, b) => a + b, 0) / moonRs.length;
    const n = moons.length;
    const sizePad = 1.2;
    // Clear hub body + moon body; chord spacing uses max moon so big symbols don't clip
    const clearHub = hubR + maxMoonR * sizePad + ORBIT_GAP;
    const sinHalf = Math.sin(Math.PI / Math.max(n, 1));
    const clearMoons = sinHalf > 0.001 ? (maxMoonR * sizePad * REPEL_PAD) / sinHalf : clearHub;
    // Slight bias for size variance (spread when moons differ a lot)
    const variance = Math.max(0, maxMoonR - meanMoonR) * 0.35;
    let radius = Math.max(clearHub, clearMoons) + variance;
    const hubCfg = ensure(hub);
    for (let grow = 0; grow < 10; grow++) {
      let clash = false;
      for (let i = 0; i < n; i++) {
        const ang = (hubRing[hub] && hubRing[hub].phase) || -Math.PI / 2;
        const a = ang + (i * 2 * Math.PI) / n;
        const mx = hubCfg.ax + Math.cos(a) * radius;
        const my = hubCfg.ay + Math.sin(a) * radius;
        const mr = moonRs[i];
        SYMBOLS.forEach((s) => {
          if (s.id === hub || moons.indexOf(s.id) >= 0) return;
          if (!findEl(s.id)) return;
          const other = ensure(s.id);
          const need = (mr + artRadius(s.id)) * REPEL_PAD * 1.05;
          if (Math.hypot(other.ax - mx, other.ay - my) < need) clash = true;
        });
      }
      if (!clash) break;
      radius *= 1.1;
    }
    return radius;
  };

  const attractRadius = (hub) => artRadius(hub) * ATTRACT_RANGE + ATTRACT_PAD;

  const syncAttractorWave = (hub) => {
    const el = findEl(hub);
    if (!el) return;
    const ns = "http://www.w3.org/2000/svg";
    let wave = el.querySelector(":scope > .orbit-wave");
    const on = !!attractors[hub];
    el.setAttribute("data-attractor", on ? "true" : "false");
    if (!on) {
      if (wave) wave.remove();
      return;
    }
    if (!wave) {
      wave = document.createElementNS(ns, "circle");
      wave.setAttribute("class", "orbit-wave");
      el.insertBefore(wave, el.firstChild);
    }
    const bb = withArtOnly(el, () => {
      try {
        return el.getBBox();
      } catch (err) {
        return { x: 0, y: 0, width: 40, height: 40 };
      }
    });
    const cx = bb.x + bb.width / 2;
    const cy = bb.y + bb.height / 2;
    const r = attractRadius(hub) / Math.max(clampSize(ensure(hub).size) / 100, 0.25);
    // attractRadius is in world-ish units matching artRadius*scale; wave is in local art space
    const localR = Math.max(bb.width, bb.height) / 2 * ATTRACT_RANGE + ATTRACT_PAD * 0.15;
    wave.setAttribute("cx", cx);
    wave.setAttribute("cy", cy);
    wave.setAttribute("r", localR);
  };

  const pullIntoOrbit = (hub) => {
    if (!hub || !findEl(hub)) return;
    if (moonOf[hub]) delete moonOf[hub];
    ensurePinnedAtWorld(hub);
    const hubCfg = ensure(hub);
    const reach = attractRadius(hub);
    const hubR = artRadius(hub);
    SYMBOLS.forEach((s) => {
      if (s.id === hub) return;
      if (s.id === "torus") return; // never a moon
      if (attractors[s.id]) return; // other attractors stay hubs
      if (!findEl(s.id)) return;
      ensurePinnedAtWorld(s.id);
      const cfg = ensure(s.id);
      const d = Math.hypot(cfg.ax - hubCfg.ax, cfg.ay - hubCfg.ay);
      const r = artRadius(s.id);
      // Pull if inside attract radius OR smaller than hub (old Cloud-style)
      if (d <= reach || r < hubR * 0.98) {
        const cur = moonOf[s.id];
        if (cur && cur !== hub && findEl(cur)) {
          const other = ensure(cur);
          const dOther = Math.hypot(cfg.ax - other.ax, cfg.ay - other.ay);
          if (dOther + 8 < d) return;
        }
        // free this moon if it was a hub for others
        Object.keys(moonOf).forEach((m) => {
          if (moonOf[m] === s.id) delete moonOf[m];
        });
        moonOf[s.id] = hub;
      }
    });
    activeHubId = hub;
    syncAttractorWave(hub);
  };

  const toggleAttractor = (id) => {
    if (!id || !findEl(id)) return;
    if (attractors[id]) {
      delete attractors[id];
      // release moons of this hub
      Object.keys(moonOf).forEach((m) => {
        if (moonOf[m] === id) delete moonOf[m];
      });
      if (activeHubId === id) activeHubId = null;
      syncAttractorWave(id);
      if (!Object.keys(attractors).length && !pinAttractOn) {
        // keep orbit mode if user wants; just rebuild
        rebuildAllOrbits();
      } else {
        rebuildAllOrbits();
      }
      syncOrbitUi();
      return;
    }
    // turn on attractor
    if (moonOf[id]) delete moonOf[id];
    attractors[id] = true;
    activeHubId = id;
    if (!orbitModeOn) setOrbitMode(true);
    pullIntoOrbit(id);
    rebuildAllOrbits();
    Object.keys(attractors).forEach(syncAttractorWave);
    syncOrbitUi();
  };

  const layoutHubRing = (hub) => {
    const st = hubRing[hub];
    if (!st || !st.ids.length) return;
    const hubCfg = ensurePinnedAtWorld(hub);
    const elHub = findEl(hub);
    if (elHub) elHub.setAttribute("data-cloud-hub", "true");
    const n = st.ids.length;
    st.ids.forEach((id, i) => {
      if (drag && drag.id === id) return;
      const ang = st.phase + (i * 2 * Math.PI) / n;
      const cfg = ensure(id);
      cfg.ax = hubCfg.ax + Math.cos(ang) * st.radius;
      cfg.ay = hubCfg.ay + Math.sin(ang) * st.radius;
      cfg.pinned = true;
      placeAbs(id);
      const el = findEl(id);
      if (el) {
        el.setAttribute("data-cloud-moon", "true");
        el.style.setProperty("--tidal-rot", ang + Math.PI / 2 + "rad");
      }
    });
  };

  const rebuildAllOrbits = () => {
    clearOrbitMarks();
    const hubs = [...new Set(Object.values(moonOf))];
    const next = {};
    hubs.forEach((hub) => {
      if (!findEl(hub)) return;
      const ids = moonsOfHub(hub).filter((id) => id !== "torus" && findEl(id));
      const prev = hubRing[hub];
      const phase = prev && Number.isFinite(prev.phase) ? prev.phase : -Math.PI / 2;
      next[hub] = { ids, phase, radius: 0 };
      hubRing[hub] = next[hub];
      next[hub].radius = fitRingRadius(hub, ids);
      ensurePinnedAtWorld(hub);
      layoutHubRing(hub);
    });
    hubRing = next;
    writeStore(store);
    Object.keys(attractors).forEach(syncAttractorWave);
    // remove waves from non-attractors
    SYMBOLS.forEach((s) => {
      if (!attractors[s.id]) {
        const el = findEl(s.id);
        if (el) {
          const w = el.querySelector(":scope > .orbit-wave");
          if (w) w.remove();
          el.removeAttribute("data-attractor");
        }
      }
    });
    syncOrbitUi();
  };

  const tickOrbit = (ts) => {
    if (!orbitModeOn) {
      stopOrbitEngine();
      return;
    }
    if (!orbitLastTs) orbitLastTs = ts;
    const dt = Math.min(0.05, (ts - orbitLastTs) / 1000);
    orbitLastTs = ts;
    const omega = (Math.PI * 2) / ORBIT_PERIOD;
    Object.keys(hubRing).forEach((hub) => {
      const st = hubRing[hub];
      if (!st || !st.ids.length) return;
      const draggingHub = drag && drag.id === hub;
      const draggingMoon = drag && st.ids.indexOf(drag.id) >= 0;
      if (!draggingHub && !draggingMoon) {
        st.phase += omega * dt;
      }
      layoutHubRing(hub);
    });
    orbitRaf = requestAnimationFrame(tickOrbit);
  };

  const startOrbitEngine = () => {
    if (orbitRaf) cancelAnimationFrame(orbitRaf);
    orbitLastTs = 0;
    rebuildAllOrbits();
    orbitRaf = requestAnimationFrame(tickOrbit);
  };

  // Old Cloud behaviour: one hub, every other (non-Torus) shape on a clean ring
  const setOrbitHubCloudStyle = (hub) => {
    if (!hub || !findEl(hub)) hub = findEl("cloud") ? "cloud" : SYMBOLS[0].id;
    moonOf = {};
    attractors = {};
    attractors[hub] = true;
    activeHubId = hub;
    ensurePinnedAtWorld(hub);
    SYMBOLS.forEach((s) => {
      if (s.id === hub) return;
      if (s.id === "torus") return; // Torus never orbits others
      if (!findEl(s.id)) return;
      ensurePinnedAtWorld(s.id);
      moonOf[s.id] = hub;
    });
    rebuildAllOrbits();
    syncAttractorWave(hub);
    syncOrbitUi();
  };

  const setOrbitMode = (on) => {
    orbitModeOn = !!on;
    if (orbitModeOn) {
      if (ringOn) {
        ringOn = false;
        writeRing(false);
        syncRing();
      }
      SYMBOLS.forEach((s) => ensurePinnedAtWorld(s.id));
      const pick =
        (selected && selected.size === 1 && [...selected][0]) ||
        activeHubId ||
        "cloud";
      const hub = findEl(pick) ? pick : findEl("cloud") ? "cloud" : "torus";
      setOrbitHubCloudStyle(hub);
      startOrbitEngine();
      orbitMenuOpen(true);
    } else {
      stopOrbitEngine();
      clearOrbits();
      orbitMenuOpen(false);
    }
    syncOrbitUi();
  };

  const syncHarmonyUi = () => {
    document.documentElement.setAttribute("data-harmony", harmonyOn ? "on" : "off");
    if (harmonyBtn) harmonyBtn.setAttribute("aria-pressed", harmonyOn ? "true" : "false");
  };

  const tickHarmony = () => {
    if (!harmonyOn) {
      harmonyRaf = 0;
      return;
    }
    // Pin everyone so separation has ax/ay
    SYMBOLS.forEach((s) => {
      if (findEl(s.id) && !ensure(s.id).pinned) ensurePinnedAtWorld(s.id);
    });
    resolveRepel(null);
    // Keep orbit rings after pushes (hubs may have moved)
    if (orbitModeOn) {
      Object.keys(hubRing).forEach((hub) => {
        if (hubRing[hub]) {
          hubRing[hub].radius = fitRingRadius(hub, hubRing[hub].ids || []);
          layoutHubRing(hub);
        }
      });
    }
    harmonyRaf = requestAnimationFrame(tickHarmony);
  };

  const setHarmony = (on) => {
    harmonyOn = !!on;
    syncHarmonyUi();
    if (harmonyOn) {
      if (!harmonyRaf) harmonyRaf = requestAnimationFrame(tickHarmony);
    } else if (harmonyRaf) {
      cancelAnimationFrame(harmonyRaf);
      harmonyRaf = 0;
    }
  };

  const clearOrbits = () => {
    moonOf = {};
    hubRing = {};
    activeHubId = null;
    Object.keys(attractors).forEach((id) => {
      delete attractors[id];
      syncAttractorWave(id);
    });
    attractors = {};
    pinAttractOn = false;
    clearOrbitMarks();
    if (orbitModeOn) rebuildAllOrbits();
    syncPinUi();
    syncOrbitUi();
  };

  const assignHub = (id) => {
    if (!id || !findEl(id)) return;
    // If it was a moon, free it first
    if (moonOf[id]) delete moonOf[id];
    activeHubId = id;
    ensurePinnedAtWorld(id);
    if (!orbitModeOn) setOrbitMode(true);
    else {
      rebuildAllOrbits();
      syncOrbitUi();
    }
  };

  const assignMoon = (moonId, hubId) => {
    if (!moonId || !hubId || moonId === hubId) return;
    if (moonId === "torus") return; // Torus cannot orbit others
    if (!findEl(moonId) || !findEl(hubId)) return;
    // Hub cannot also be a moon of someone else
    if (moonOf[hubId]) delete moonOf[hubId];
    // Remove moon from being a hub's... moons stay; if moon was a hub, its moons need reassign? free them
    Object.keys(moonOf).forEach((m) => {
      if (moonOf[m] === moonId) delete moonOf[m];
    });
    moonOf[moonId] = hubId;
    activeHubId = hubId;
    ensurePinnedAtWorld(hubId);
    ensurePinnedAtWorld(moonId);
    if (!orbitModeOn) setOrbitMode(true);
    else rebuildAllOrbits();
    syncOrbitUi();
  };

  const freeOrbitRole = (id) => {
    if (!id) return;
    if (moonOf[id]) delete moonOf[id];
    Object.keys(moonOf).forEach((m) => {
      if (moonOf[m] === id) delete moonOf[m];
    });
    if (activeHubId === id) activeHubId = null;
    rebuildAllOrbits();
    syncOrbitUi();
  };

  const syncCloudFlag = () => {};

  document.addEventListener("pair:orb-cloud-hub", (e) => {
    const id = e.detail && e.detail.id;
    if (!id) return;
    assignHub(id);
  });

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
    } else {
      SYMBOLS.forEach((s) => ensurePinnedAtWorld(s.id));
      writeStore(store);
      if (repelOn) resolveRepel(null);
    }
    syncPinUi();
  };

  setPin(false);
  syncPinUi();
  syncOrbitUi();

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
      setRepel(true);
      applyAll();
    });
  }

  if (stackBtn) {
    stackBtn.addEventListener("click", (e) => {
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
      pinAttractOn = false;
      setRepel(false);
      applyAll();
    });
  }

  if (attractBtn) {
    attractBtn.addEventListener("click", (e) => {
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
      pinAttractOn = !pinAttractOn;
      if (pinAttractOn) {
        setRepel(true); // attract uses separation like old Cloud
        const pick =
          (selected && selected.size === 1 && [...selected][0]) ||
          activeHubId ||
          "cloud";
        const hub = findEl(pick) ? pick : "cloud";
        if (!attractors[hub]) toggleAttractor(hub);
        else {
          pullIntoOrbit(hub);
          rebuildAllOrbits();
        }
      } else {
        // release pin-attract hubs that aren't manually needed — clear all attractors from pin attract
        clearOrbits();
        setOrbitMode(false);
      }
      syncPinUi();
      applyAll();
    });
  }

  // Double-click shape → toggle attractor (Orbit / Pin Attract)
  document.addEventListener(
    "dblclick",
    (e) => {
      const el = e.target.closest(".mark-host svg.sigil .sym, .mark-host svg.sigil .center");
      if (!el) return;
      const id = el.getAttribute("data-sym");
      if (!SYMBOLS.some((s) => s.id === id)) return;
      e.preventDefault();
      e.stopPropagation();
      // Double-click always Cloud-style: this shape becomes the hub
      if (!orbitModeOn) setOrbitMode(true);
      setOrbitHubCloudStyle(id);
      applyAll();
    },
    true
  );

  if (orbitBtn) {
    orbitBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const next = !orbitModeOn;
      if (next && ringOn) {
        ringOn = false;
        writeRing(false);
        syncRing();
      }
      setOrbitMode(next);
      applyAll();
    });
  }

  if (harmonyBtn) {
    harmonyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setHarmony(!harmonyOn);
    });
  }
  syncHarmonyUi();

  if (orbitClearBtn) {
    orbitClearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      clearOrbits();
      applyAll();
    });
  }

  if (pinLayoutResetBtn) {
    pinLayoutResetBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setOrbitMode(false);
      clearOrbits();
      SYMBOLS.forEach((s) => {
        restoreToOrbit(s.id);
        store[s.id] = {
          anim: (store[s.id] && store[s.id].anim) || "off",
          speed: (store[s.id] && store[s.id].speed) || 100,
          colour: (store[s.id] && store[s.id].colour) || "off",
          colourSpeed: (store[s.id] && store[s.id].colourSpeed) || 100,
          size: 100,
          x: 0,
          y: 0,
          pinned: false,
          ax: 0,
          ay: 0,
          orb: false,
          orbFn: "shield",
          orbField: false,
        };
      });
      writeStore(store);
      applyAll();
      renderLists();
    });
  }

  document.addEventListener("click", (e) => {
    if (pinMenu && !pinMenu.hidden && !e.target.closest("[data-pin-wrap]")) pinMenuOpen(false);
    if (orbitMenu && !orbitMenu.hidden && !e.target.closest("[data-orbit-wrap]")) orbitMenuOpen(false);
  });

  const cloudMenu = document.querySelector("[data-cloud-shape-menu]");
  let cloudMenuSym = null;
  const cloudMenuOpen = (open, id, clientX, clientY) => {
    if (!cloudMenu) return;
    cloudMenu.hidden = !open;
    cloudMenuSym = open ? id : null;
    if (open && Number.isFinite(clientX) && Number.isFinite(clientY)) {
      const pad = 8;
      const x = Math.min(window.innerWidth - 180, Math.max(pad, clientX + 6));
      const y = Math.min(window.innerHeight - 160, Math.max(pad, clientY + 6));
      cloudMenu.style.left = x + "px";
      cloudMenu.style.top = y + "px";
    }
    // enable/disable Orbit selected hub button
    const orbitHubBtn = cloudMenu.querySelector('[data-cloud-act="orbit-hub"]');
    if (orbitHubBtn) {
      const ok = !!(activeHubId && id !== activeHubId && id !== "torus");
      orbitHubBtn.disabled = !ok;
      orbitHubBtn.style.opacity = ok ? "1" : "0.4";
    }
    document.documentElement.setAttribute("data-cloud-menu", open ? "on" : "off");
  };

  const resetOneShape = (id) => {
    if (!id) return;
    freeOrbitRole(id);
    restoreToOrbit(id);
    store[id] = {
      anim: (store[id] && store[id].anim) || "off",
      speed: (store[id] && store[id].speed) || 100,
      colour: (store[id] && store[id].colour) || "off",
      colourSpeed: (store[id] && store[id].colourSpeed) || 100,
      size: 100,
      x: 0,
      y: 0,
      pinned: false,
      ax: 0,
      ay: 0,
      orb: false,
      orbFn: "shield",
      orbField: false,
    };
    writeStore(store);
    applyAll();
    renderLists();
  };

  if (cloudMenu) {
    cloudMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      const btn = e.target.closest("[data-cloud-act]");
      if (!btn || btn.disabled) return;
      const act = btn.getAttribute("data-cloud-act");
      const id = cloudMenuSym;
      cloudMenuOpen(false);
      if (act === "hub" && id) assignHub(id);
      else if (act === "orbit-hub" && id && activeHubId) assignMoon(id, activeHubId);
      else if (act === "free" && id) freeOrbitRole(id);
      else if (act === "reset-shape" && id) resetOneShape(id);
      applyAll();
    });
    document.addEventListener("click", (e) => {
      if (!cloudMenu || cloudMenu.hidden) return;
      if (e.target.closest("[data-cloud-shape-menu]")) return;
      cloudMenuOpen(false);
    });
  }

  // Shape drag is native site-wide (same feel as Pin). Pin only adds repel/orbit/reset.
  const canvasDragOn = () => true;

  const onPointerDown = (e) => {
    // Zoom mode owns empty-space gestures; still allow grabbing a shape
    if (document.documentElement.getAttribute("data-zoom-mode") === "on") {
      const maybe = e.target.closest(".mark-host svg.sigil .sym, .mark-host svg.sigil .center");
      if (!maybe) return;
    }
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

    if (orbitModeOn) {
      const hub = moonOf[drag.id] ? moonOf[drag.id] : drag.id;
      if (hubRing[hub]) layoutHubRing(hub);
      // if dragging a hub, layout its ring
      if (hubRing[drag.id]) layoutHubRing(drag.id);
    }

    if (harmonyOn || orbitModeOn || (repelOn && pinOn)) resolveRepel(drag.id);
    writeStore(store);
  };

  const onPointerUp = (e) => {
    if (!drag) return;
    const id = drag.id;
    const wasTap = !drag.moved;
    drag = null;
    if (orbitModeOn) {
      if (wasTap) {
        // Tap = make this the Cloud-style hub (everything orbits it)
        setOrbitHubCloudStyle(id);
      } else {
        // Snap moon angle from drop position
        const hub = moonOf[id];
        if (hub && hubRing[hub]) {
          const st = hubRing[hub];
          const h = ensure(hub);
          const cfg = ensure(id);
          const dropAng = Math.atan2(cfg.ay - h.ay, cfg.ax - h.ax);
          const idx = st.ids.indexOf(id);
          const n = st.ids.length;
          if (n > 0 && idx >= 0) {
            st.phase = dropAng - (idx * 2 * Math.PI) / n;
          }
        }
        rebuildAllOrbits();
      }
      if (!orbitRaf) orbitRaf = requestAnimationFrame(tickOrbit);
    } else if (repelOn && pinOn) {
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
