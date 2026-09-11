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
    if (!Number.isFinite(n)) n = 1;
    if (n > 100) n = Math.round(n / 2);
    return Math.max(1, Math.min(100, Math.round(n)));
  };

  // Internal size 100 = artist default (UI shows 0%). Range 100–200 → UI 0–100.
  const clampSize = (sp) => {
    let n = Number(sp);
    if (!Number.isFinite(n)) n = 100;
    return Math.max(100, Math.min(200, Math.round(n)));
  };
  const sizeToDisplay = (size) => Math.max(0, Math.min(100, clampSize(size) - 100));
  const displayToSize = (disp) => clampSize(100 + Number(disp));

  // Per-symbol spin period multiplier (wave faster, torus a touch slower than 1%)
  const SPEED_MULT = { wave: 1.85, torus: 0.8 };

  const defaultCfgFor = (id) => {
    const base = {
      anim: "off",
      speed: 1,
      colour: "off",
      colourSpeed: 1,
      size: 100,
      x: 0,
      y: 0,
      pinned: false,
      ax: 0,
      ay: 0,
      orb: false,
      orbFn: "shield",
      orbFns: ["shield"],
      orbField: false,
    };
    if (id === "flower") {
      base.anim = "cw";
      base.speed = 1;
    } else if (id === "hermes") {
      base.anim = "cw";
      base.speed = 100;
    } else if (id === "torus") {
      base.anim = "cw";
      base.speed = 1;
    } else if (id === "sun") {
      base.anim = "cw";
      base.speed = 100;
      base.colour = "red";
      base.orb = true;
      base.orbFns = ["shield", "cloud"];
      base.orbFn = "shield";
      base.orbField = true;
    } else if (id === "key") {
      base.anim = "cw";
      base.speed = 100;
    } else if (id === "wave") {
      base.anim = "cw";
      base.speed = 100;
    }
    return base;
  };

  const ensure = (id) => {
    if (!store[id]) store[id] = defaultCfgFor(id);
    const a = store[id].anim;
    if (a !== "cw" && a !== "ccw" && a !== "off") store[id].anim = "off";
    if (!COLOUR_IDS.has(store[id].colour)) store[id].colour = "off";
    store[id].speed = clampPct(store[id].speed == null ? 1 : store[id].speed);
    store[id].colourSpeed = clampPct(store[id].colourSpeed == null ? 1 : store[id].colourSpeed);
    // Migrate old saves where default size was shown as 100%
    let sz = store[id].size;
    if (sz == null) sz = 100;
    // Old range allowed <100; fold up to new floor
    if (Number(sz) < 100 && Number(sz) >= 25) {
      /* keep shrunk legacy as display-relative: treat as 100 (0% UI) */
      sz = 100;
    }
    store[id].size = clampSize(sz);
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
    store[id].orbField = !!store[id].orbField;
    // Multi orb functions
    let fns = store[id].orbFns;
    if (!Array.isArray(fns) || !fns.length) {
      const ofn = store[id].orbFn;
      fns = [ofn === "orbit" || ofn === "cloud" ? ofn : "shield"];
    }
    fns = fns.filter((f) => f === "shield" || f === "orbit" || f === "cloud");
    if (!fns.length) fns = ["shield"];
    store[id].orbFns = [...new Set(fns)];
    store[id].orbFn = store[id].orbFns[0];
    return store[id];
  };
  SYMBOLS.forEach((s) => ensure(s.id));

  const periodSec = (speedPct, id) => {
    const pct = clampPct(speedPct);
    const mult = (id && SPEED_MULT[id]) || 1;
    return Math.max(0.28, 75 / (pct * mult));
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
    const fns = cfg.orbFns && cfg.orbFns.length ? cfg.orbFns : [cfg.orbFn || "shield"];
    const primary = fns[0] || "shield";
    let cx = bb.x + bb.width / 2;
    let cy = bb.y + bb.height / 2;
    let baseR = Math.max(12, Math.max(bb.width, bb.height) / 2);
    // Trinity: circumcircle fitted to the three lobe tips (viewBox-calibrated)
    if (id === "trinity") {
      cx = 82.513;
      cy = 576.497;
      baseR = 93.4;
    }
    orb.setAttribute("data-orb-fn", fns.join(" "));
    orb.setAttribute("data-orb-field", cfg.orbField ? "on" : "off");

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
        for (let i = 0; i < 4; i++) grad.appendChild(document.createElementNS(ns, "stop"));
        defs.appendChild(grad);
      }
      const cols = ORB_FIELD_COLORS[primary] || ORB_FIELD_COLORS.shield;
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
      const fieldPad = fns.indexOf("cloud") >= 0 ? 1.28 : fns.indexOf("orbit") >= 0 ? 1.2 : 1.14;
      field.setAttribute("cx", cx);
      field.setAttribute("cy", cy);
      field.setAttribute("r", baseR * fieldPad);
      field.setAttribute("fill", "url(#" + gradId + ")");
    } else if (field) {
      field.remove();
      if (defs) defs.remove();
    }

    // One rim per active orb function (multi-select)
    orb.querySelectorAll(".sym-orb-rim").forEach((n) => n.remove());
    const padFor = (fn) => (fn === "cloud" ? 1.28 : fn === "orbit" ? 1.22 : 1.0);
    fns.forEach((fn, i) => {
      const rim = document.createElementNS(ns, "circle");
      rim.setAttribute("class", "sym-orb-rim");
      rim.setAttribute("data-orb-rim", fn);
      rim.setAttribute("cx", cx);
      rim.setAttribute("cy", cy);
      // Trinity shield rim kisses the three tips (pad ~1)
      const pad = id === "trinity" && fn === "shield" ? 1.0 : padFor(fn);
      rim.setAttribute("r", baseR * pad + i * 2.5);
      orb.appendChild(rim);
    });
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
      el.style.setProperty("--spin-dur", periodSec(cfg.speed, id) + "s");
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
    if (!ids.length) return { anim: "off", speed: 1, colour: "off", colourSpeed: 1, size: 100, orb: false, orbFns: ["shield"], orbField: false };
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
    const sizeDisp = sizeToDisplay(cfg.size);
    sizeEl.value = String(cfg.size);
    sizeVal.value = String(sizeDisp);
    sizeEl.disabled = !selected.size;
    sizeVal.disabled = !selected.size;
    speedEl.value = String(cfg.speed);
    speedVal.value = String(clampPct(cfg.speed));
    speedEl.disabled = !selected.size || cfg.anim === "off";
    speedVal.disabled = !selected.size || cfg.anim === "off";
    colourSpeedEl.value = String(cfg.colourSpeed);
    colourSpeedVal.value = String(clampPct(cfg.colourSpeed));
    // Colour speed applies to vibe cycle; still editable whenever a colour is on
    colourSpeedEl.disabled = !selected.size || cfg.colour === "off";
    colourSpeedVal.disabled = !selected.size || cfg.colour === "off";

    const projectOrbBtn = document.querySelector('[data-project-pick="orb"]');
    const projectDetail = document.querySelector('[data-project-detail="orb"]');
    const anyOrb = selectedList().some((id) => ensure(id).orb);
    if (projectOrbBtn) projectOrbBtn.setAttribute("aria-selected", anyOrb ? "true" : "false");
    if (projectDetail) projectDetail.hidden = !selected.size;
    document.querySelectorAll("[data-orb-fn]").forEach((btn) => {
      const fn = btn.getAttribute("data-orb-fn");
      const on = selected.size && selectedList().some((id) => (ensure(id).orbFns || []).indexOf(fn) >= 0);
      btn.setAttribute("aria-selected", on ? "true" : "false");
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
      // Toggle: if every selected already has fn → remove; else add
      const allHave = ids.every((id) => (ensure(id).orbFns || []).indexOf(fn) >= 0);
      ids.forEach((id) => {
        const cfg = ensure(id);
        let fns = Array.isArray(cfg.orbFns) ? cfg.orbFns.slice() : [cfg.orbFn || "shield"];
        if (allHave) fns = fns.filter((f) => f !== fn);
        else if (fns.indexOf(fn) < 0) fns.push(fn);
        if (!fns.length) {
          cfg.orb = false;
          cfg.orbFns = ["shield"];
          cfg.orbFn = "shield";
        } else {
          cfg.orb = true;
          cfg.orbFns = fns;
          cfg.orbFn = fns[0];
        }
      });
      writeStore(store);
      ids.forEach((id) => applyToDom(id));
      renderLists();
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
      // Re-click same colour → off (smooth toggle). "None" always clears.
      if (colour === "off") cfg.colour = "off";
      else if (cfg.colour === colour) cfg.colour = "off";
      else cfg.colour = colour;
    });
  });

  const applySizeToSelected = (size) => {
    const ids = selectedList();
    if (!ids.length) return;
    ids.forEach((id) => {
      ensure(id);
      store[id].size = size;
      applyPose(id);
      syncOrbOn(id);
    });
    writeStore(store);
    sizeEl.value = String(size);
    sizeVal.value = String(sizeToDisplay(size));
  };

  sizeEl.addEventListener("input", () => {
    applySizeToSelected(clampSize(sizeEl.value));
  });
  sizeVal.addEventListener("change", () => {
    let n = Number(sizeVal.value);
    if (!Number.isFinite(n)) n = 0;
    n = Math.max(0, Math.min(100, Math.round(n)));
    applySizeToSelected(displayToSize(n));
  });

  speedEl.addEventListener("input", () => {
    const speed = clampPct(speedEl.value);
    forSelected((id, cfg) => {
      cfg.speed = speed;
    });
    speedVal.value = String(speed);
  });
  speedVal.addEventListener("change", () => {
    const speed = clampPct(speedVal.value);
    forSelected((id, cfg) => {
      cfg.speed = speed;
    });
    speedEl.value = String(speed);
    speedVal.value = String(speed);
  });

  colourSpeedEl.addEventListener("input", () => {
    const colourSpeed = clampPct(colourSpeedEl.value);
    forSelected((id, cfg) => {
      cfg.colourSpeed = colourSpeed;
    });
    colourSpeedVal.value = String(colourSpeed);
  });
  colourSpeedVal.addEventListener("change", () => {
    const colourSpeed = clampPct(colourSpeedVal.value);
    forSelected((id, cfg) => {
      cfg.colourSpeed = colourSpeed;
    });
    colourSpeedEl.value = String(colourSpeed);
    colourSpeedVal.value = String(colourSpeed);
  });

  const doFullReset = () => {
    store = {};
    SYMBOLS.forEach((s) => {
      restoreToOrbit(s.id);
      store[s.id] = defaultCfgFor(s.id);
    });
    document.querySelectorAll(".mark-host svg.sigil .sym-orb").forEach((n) => n.remove());
    writeStore(store);
    selected = new Set();
    writeSelected(selected);
    ringOn = false;
    writeRing(false);
    ringSpin = "off";
    writeRingSpin("off");
    repelOn = false;
    setPin(false);
    syncPinUi();
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

  // —— Pin: fluid drag + optional hard repel + Cloud-orbit prototype ——
  const SVG_CX = 447.56;
  const SVG_CY = 484.96;
  const CLOUD_ID = "cloud";
  const REPEL_PAD = 1.12; // radii must not overlap (extra padding)
  const CLOUD_ORBIT_GAP = 36;
  const CLOUD_ORBIT_PERIOD = 60; // seconds for one clean revolution (rigid ring)
  const ORBIT_RING_MIN = 160;
  const ORBIT_RING_MAX = 310; // keep moons on-canvas around SVG center

  let pinOn = false;
  let repelOn = false;
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
  const pinLayoutResetBtn = document.querySelector("[data-pin-layout-reset]");

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

  // Hard separation: no two symbols may touch/overlay when repel is on
  const resolveRepel = (priorityId) => {
    // Repel stays a Pin tool; shape drag itself is always available
    if (!repelOn) return;
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

  let cloudForceAll = false; // All shapes on ring (ignore size gate)
  let orbitShuffle = false; // Random matrix reorders moon slots

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
    const moons = [];
    SYMBOLS.forEach((s) => {
      if (s.id === hubId) return;
      if (!findEl(s.id)) return;
      const r = artRadius(s.id);
      if (cloudForceAll || r < hubR * 1.05) moons.push({ id: s.id, r });
    });
    if (!orbitShuffle) {
      moons.sort((a, b) => a.r - b.r || a.id.localeCompare(b.id));
    } else {
      // Fisher–Yates — Random matrix order
      for (let i = moons.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = moons[i];
        moons[i] = moons[j];
        moons[j] = tmp;
      }
    }
    ringIds = moons.map((m) => m.id);
    const n = ringIds.length;
    if (!n) {
      ringRadius = 0;
      writeStore(store);
      return;
    }

    const radii = moons.map((m) => m.r).sort((a, b) => a - b);
    const maxMoonR = radii[radii.length - 1];
    const midMoonR = radii[Math.floor(radii.length / 2)];
    // Prefer mid-size for chord spacing so a huge Torus moon doesn't explode the ring
    const clearHub = hubR + midMoonR + CLOUD_ORBIT_GAP;
    const sinHalf = Math.sin(Math.PI / n);
    const clearMoons = sinHalf > 0.001 ? (midMoonR * REPEL_PAD) / sinHalf : clearHub;
    let R = Math.max(clearHub, clearMoons, ORBIT_RING_MIN);
    // Soft floor so the largest moon still clears the hub a bit
    R = Math.max(R, hubR + Math.min(maxMoonR, 90) + CLOUD_ORBIT_GAP);
    ringRadius = Math.min(ORBIT_RING_MAX, R);

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

  const startCloudOrbit = (opts) => {
    if (cloudRaf) cancelAnimationFrame(cloudRaf);
    cloudLastTs = 0;
    if (!hubId || !findEl(hubId)) hubId = CLOUD_ID;
    if (!(opts && opts.keepPhase)) ringPhase = -Math.PI / 2;
    rebuildCloudMoons();
    cloudRaf = requestAnimationFrame(tickCloudOrbit);
  };

  // Park hub at SVG stage center so the ring always matches the screenshot look
  const centerHubAtStage = (id) => {
    const cfg = ensurePinnedAtWorld(id);
    cfg.ax = SVG_CX;
    cfg.ay = SVG_CY;
    cfg.pinned = true;
    placeAbs(id);
    return cfg;
  };

  const startOrbitAround = (id, opts) => {
    const forceAll = opts && opts.forceAll !== undefined ? !!opts.forceAll : true;
    const center = opts && opts.center !== undefined ? !!opts.center : true;
    const shuffle = !!(opts && opts.shuffle);
    const keepPhase = !!(opts && opts.keepPhase);
    if (!id || !findEl(id)) return;
    if (ringOn) {
      ringOn = false;
      writeRing(false);
      syncRing();
    }
    if (!pinOn) {
      pinOn = true;
      SYMBOLS.forEach((s) => ensurePinnedAtWorld(s.id));
    }
    hubId = id;
    cloudForceAll = forceAll;
    orbitShuffle = shuffle;
    cloudOrbitOn = true;
    if (center) centerHubAtStage(id);
    else ensurePinnedAtWorld(id);
    if (!forceAll) {
      rebuildCloudMoons();
      if (ringIds.length < 3) {
        cloudForceAll = true;
      }
    }
    startCloudOrbit({ keepPhase: keepPhase });
    orbitShuffle = false; // one-shot shuffle
    syncPinUi();
  };

  const setCloudOrbit = (on) => {
    cloudOrbitOn = !!on;
    if (cloudOrbitOn) {
      // Sandbox → Orbit: start a clean centered ring (Cloud hub, everyone on it)
      const hub = hubId && findEl(hubId) ? hubId : CLOUD_ID;
      startOrbitAround(hub, { forceAll: true, center: true, shuffle: false });
    } else {
      stopCloudOrbit();
      cloudForceAll = false;
      orbitShuffle = false;
    }
    syncPinUi();
  };

  const randomOrbit = () => {
    const ids = SYMBOLS.map((s) => s.id).filter((id) => findEl(id));
    if (!ids.length) return;
    // Prefer mid-size hubs so the centered look stays balanced (still random)
    const scored = ids.map((id) => ({ id: id, r: artRadius(id) }));
    scored.sort((a, b) => a.r - b.r);
    // Pick from middle 60% of sizes — avoids tiny bean or giant torus as hub too often
    const lo = Math.max(0, Math.floor(scored.length * 0.2));
    const hi = Math.max(lo + 1, Math.ceil(scored.length * 0.8));
    const pool = scored.slice(lo, hi);
    const hub = pool[Math.floor(Math.random() * pool.length)].id;
    ringPhase = Math.random() * Math.PI * 2;
    startOrbitAround(hub, {
      forceAll: true,
      center: true,
      shuffle: true,
      keepPhase: true,
    });
    pinMenuOpen(true);
    applyAll();
  };

  document.addEventListener("pair:orb-cloud-hub", (e) => {
    const id = e.detail && e.detail.id;
    if (!id || !findEl(id)) return;
    if (!cloudOrbitOn) return;
    hubId = id;
    ensurePinnedAtWorld(id);
    rebuildCloudMoons();
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
      cloudOrbitOn = false;
      stopCloudOrbit();
      // Leaving Sandbox never leaves Repel latched for the next enter
      repelOn = false;
    } else {
      // Freeze at current artist seats — never auto-run Repel on enter
      SYMBOLS.forEach((s) => ensurePinnedAtWorld(s.id));
      writeStore(store);
      // Orbit armed keeps normal seats until double-click / Random starts a hub
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
      // Repel is independent of Sandbox menu — never auto-enter Sandbox
      setRepel(!repelOn);
      applyAll();
    });
  }

  const randomBtn = document.querySelector("[data-pin-orbit-random]");
  if (randomBtn) {
    randomBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      randomOrbit();
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

  // Pin → Reset: put every symbol back to artist baseline seats
  if (pinLayoutResetBtn) {
    pinLayoutResetBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setCloudOrbit(false);
      stopCloudOrbit();
      cloudForceAll = false;
      repelOn = false;
      hubId = CLOUD_ID;
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
      syncPinUi();
      applyAll();
      renderLists();
    });
  }

  document.addEventListener("click", (e) => {
    if (!pinMenu || pinMenu.hidden) return;
    if (e.target.closest("[data-pin-wrap]")) return;
    pinMenuOpen(false);
  });

  // Cloud orbit: tap a shape → action menu (hub / reset shape / reset / all shapes)
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
    document.documentElement.setAttribute("data-cloud-menu", open ? "on" : "off");
  };

  const resetOneShape = (id) => {
    if (!id) return;
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
    };
    writeStore(store);
    if (cloudOrbitOn) {
      ensurePinnedAtWorld(id);
      rebuildCloudMoons();
    }
    applyAll();
    renderLists();
  };

  const resetAllShapes = () => {
    setCloudOrbit(false);
    stopCloudOrbit();
    cloudForceAll = false;
    repelOn = false;
    hubId = CLOUD_ID;
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
  };

  if (cloudMenu) {
    cloudMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      const btn = e.target.closest("[data-cloud-act]");
      if (!btn) return;
      const act = btn.getAttribute("data-cloud-act");
      const id = cloudMenuSym;
      cloudMenuOpen(false);
      if (act === "hub" && id) {
        startOrbitAround(id, { forceAll: false });
        applyAll();
      } else if (act === "reset-shape" && id) {
        resetOneShape(id);
      } else if (act === "reset-all") {
        resetAllShapes();
      } else if (act === "all-shapes") {
        const hub = hubId && findEl(hubId) ? hubId : CLOUD_ID;
        startOrbitAround(hub, { forceAll: true });
        applyAll();
      }
    });
    document.addEventListener("click", (e) => {
      if (!cloudMenu || cloudMenu.hidden) return;
      if (e.target.closest("[data-cloud-shape-menu]")) return;
      cloudMenuOpen(false);
    });
  }


  // Double-click a shape → start / retarget Orbit hub (default seats stay until this or Random)
  document.addEventListener(
    "dblclick",
    (e) => {
      const el = e.target.closest(".mark-host svg.sigil .sym, .mark-host svg.sigil .center");
      if (!el) return;
      const id = el.getAttribute("data-sym");
      if (!id || !SYMBOLS.some((s) => s.id === id)) return;
      e.preventDefault();
      e.stopPropagation();
      startOrbitAround(id, { forceAll: false });
      pinMenuOpen(true);
      applyAll();
    },
    true
  );

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

    if (cloudOrbitOn && drag.id === hubId) {
      layoutRing();
    }
    // While dragging a moon, allow free move; ring snaps even again on release

    if (repelOn) resolveRepel(drag.id);
    writeStore(store);
  };

  const onPointerUp = (e) => {
    if (!drag) return;
    const id = drag.id;
    const wasTap = !drag.moved;
    drag = null;
    if (cloudOrbitOn) {
      if (wasTap) {
        // Tap in Cloud mode → shape actions (hub / reset / all)
        cloudMenuOpen(true, id, e && e.clientX, e && e.clientY);
      } else {
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
      }
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

  try {
    if (localStorage.getItem("pair-sym-defaults-v73") !== "1") {
      const ids = SYMBOLS.map((s) => s.id);
      const allOld = ids.every((id) => {
        const c = store[id];
        return c && Number(c.speed) === 100 && Number(c.colourSpeed) === 100;
      });
      if (allOld) {
        ids.forEach((id) => {
          store[id] = defaultCfgFor(id);
        });
        writeStore(store);
      }
      localStorage.setItem("pair-sym-defaults-v73", "1");
    }
  } catch (err) {}

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
