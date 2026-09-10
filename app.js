(() => {
  const CX = 447.56;
  const CY = 484.96;

  // Orbit children after center is peeled off — fixed SVG order
  // svg kids: 0 center, 1 GOL, 2 Flower, 3 SOL, 4 Trinity, 5 Cloud, 6 Pi, 7 Ra(eye), 8 Hermes, 9 ScarabCluster, 10 FOL
  const ORBIT_IDS = [
    "gol",
    "flower",
    "sol",
    "trinity",
    "cloud",
    "pi",
    "ra",
    "hermes",
    "scarab-cluster",
    "fol",
  ];

  const host = document.querySelector("[data-mark-host]");
  const mark = document.querySelector("[data-mark]");
  if (!host || !mark) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Spin/size origin only — position offsets live on outer .sym-slot
  const pinOrigin = (el) => {
    try {
      const bb = el.getBBox();
      if (!bb.width && !bb.height) return;
      el.style.transformBox = "fill-box";
      el.style.transformOrigin = "center";
    } catch (err) {
      /* ignore */
    }
  };

  const makeSlot = (id) => {
    const slot = document.createElementNS("http://www.w3.org/2000/svg", "g");
    slot.setAttribute("class", "sym-slot");
    slot.setAttribute("data-sym-slot", id);
    return slot;
  };

  const wrapOne = (orbit, el, id) => {
    const slot = makeSlot(id);
    const wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
    wrap.setAttribute("class", "sym");
    wrap.setAttribute("data-sym", id);
    orbit.insertBefore(slot, el);
    slot.appendChild(wrap);
    wrap.appendChild(el);
    pinOrigin(wrap);
    return wrap;
  };

  const wrapDetached = (orbit, ref, el, id) => {
    if (!el) return null;
    const slot = makeSlot(id);
    const wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
    wrap.setAttribute("class", "sym");
    wrap.setAttribute("data-sym", id);
    orbit.insertBefore(slot, ref);
    slot.appendChild(wrap);
    wrap.appendChild(el);
    pinOrigin(wrap);
    return wrap;
  };

  const midY = (el) => {
    try {
      const bb = el.getBBox();
      return bb.y + bb.height / 2;
    } catch (err) {
      return 9999;
    }
  };

  const splitScarabCluster = (orbit, cluster) => {
    const parts = Array.from(cluster.children);
    if (parts.length < 2) {
      wrapOne(orbit, cluster, "scarab");
      return;
    }
    const bodyWrap = parts[0];
    const upperWrap = parts[1];
    const bodyKids = Array.from(bodyWrap.children || []);
    const scarabEl = bodyKids.find((k) => k.tagName.toLowerCase() === "g") || bodyWrap;
    const sunDisk = bodyKids.find((k) => k.tagName.toLowerCase() === "circle") || null;
    const upperKids = Array.from(upperWrap.children || []);
    const keyGroup = upperKids[0] || null;
    // upperKids[1], [2] are the side waves (previously mislabeled bean)
    const waveNodes = upperKids.slice(1);

    wrapDetached(orbit, cluster, scarabEl, "scarab");
    if (sunDisk) wrapDetached(orbit, cluster, sunDisk, "sun");

    // Peel true bean out of key group (top tip geometry), keep shaft as key
    let beanNodes = [];
    if (keyGroup) {
      const keyKids = Array.from(keyGroup.children || []);
      keyKids.forEach((n) => {
        if (midY(n) < 30) beanNodes.push(n);
      });
      beanNodes.forEach((n) => {
        if (n.parentNode) n.parentNode.removeChild(n);
      });
      wrapDetached(orbit, cluster, keyGroup, "key");
    }

    if (beanNodes.length) {
      const slot = makeSlot("bean");
      const wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
      wrap.setAttribute("class", "sym");
      wrap.setAttribute("data-sym", "bean");
      orbit.insertBefore(slot, cluster);
      slot.appendChild(wrap);
      beanNodes.forEach((n) => wrap.appendChild(n));
      pinOrigin(wrap);
    }

    if (waveNodes.length) {
      const slot = makeSlot("wave");
      const wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
      wrap.setAttribute("class", "sym");
      wrap.setAttribute("data-sym", "wave");
      orbit.insertBefore(slot, cluster);
      slot.appendChild(wrap);
      waveNodes.forEach((n) => wrap.appendChild(n));
      pinOrigin(wrap);
    }

    if (cluster.parentNode) cluster.parentNode.removeChild(cluster);
  };

  const wrapOrbitSyms = (orbit) => {
    const children = Array.from(orbit.children);
    children.forEach((el, i) => {
      const id = ORBIT_IDS[i] || `_x${i}`;
      if (id === "scarab-cluster") {
        splitScarabCluster(orbit, el);
        return;
      }
      // Flower stays free-standing — no guide circle
      wrapOne(orbit, el, id);
    });
  };

  const mount = async () => {
    let raw;
    try {
      const res = await fetch("assets/landing-hub.svg", { cache: "force-cache" });
      if (!res.ok) throw new Error("svg missing");
      raw = await res.text();
    } catch (err) {
      console.warn("[pair-portal]", err);
      host.innerHTML =
        '<img class="sigil-fallback" src="assets/landing-hub.svg" alt="PAIR sigil" width="924" height="886" draggable="false" />';
      mark.classList.add("is-ready");
      return;
    }

    const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
    const src = doc.querySelector("svg");
    if (!src || src.querySelector("parsererror")) {
      host.innerHTML =
        '<img class="sigil-fallback" src="assets/landing-hub.svg" alt="PAIR sigil" width="924" height="886" draggable="false" />';
      mark.classList.add("is-ready");
      return;
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "sigil");
    svg.setAttribute("viewBox", src.getAttribute("viewBox") || "0 0 923.86 886.31");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "PAIR portal sigil");
    svg.setAttribute("focusable", "false");

    const defs = src.querySelector("defs");
    if (defs) svg.appendChild(document.importNode(defs, true));

    // Torus also gets a slot so Pin offsets don't fight scale/spin
    const centerSlot = makeSlot("torus");
    const center = document.createElementNS("http://www.w3.org/2000/svg", "g");
    center.setAttribute("class", "center");
    center.setAttribute("data-sym", "torus");
    centerSlot.appendChild(center);

    const orbit = document.createElementNS("http://www.w3.org/2000/svg", "g");
    orbit.setAttribute("class", "orbit");
    orbit.setAttribute("style", `transform-origin: ${CX}px ${CY}px; transform-box: view-box;`);

    const kids = Array.from(src.children).filter((el) => el.tagName.toLowerCase() !== "defs");
    let sawCenter = false;
    kids.forEach((el) => {
      const node = document.importNode(el, true);
      if (!sawCenter && el.tagName.toLowerCase() === "g") {
        center.appendChild(node);
        sawCenter = true;
      } else {
        orbit.appendChild(node);
      }
    });

    const free = document.createElementNS("http://www.w3.org/2000/svg", "g");
    free.setAttribute("class", "free-layer");

    svg.appendChild(orbit);
    svg.appendChild(free);
    svg.appendChild(centerSlot);
    host.innerHTML = "";
    host.appendChild(svg);
    wrapOrbitSyms(orbit);
    pinOrigin(center);
    // Invisible hit pads so thin paths (cloud/hermes/ra) and dense scarab drag easily
    document.querySelectorAll(".sym, .center").forEach((wrap) => {
      try {
        if (wrap.querySelector(".sym-hitpad")) return;
        const bb = wrap.getBBox();
        const cx = bb.x + bb.width / 2;
        const cy = bb.y + bb.height / 2;
        const r = Math.max(52, Math.max(bb.width, bb.height) * 0.58);
        const pad = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pad.setAttribute("class", "sym-hitpad");
        pad.setAttribute("cx", String(cx));
        pad.setAttribute("cy", String(cy));
        pad.setAttribute("r", String(r));
        pad.setAttribute("fill", "transparent");
        pad.setAttribute("stroke", "none");
        pad.style.pointerEvents = "all";
        wrap.insertBefore(pad, wrap.firstChild);
      } catch (err) {
        /* ignore */
      }
    });
    mark.classList.add("is-ready");
    document.dispatchEvent(new CustomEvent("pair:syms-ready"));
    if (reduced) mark.classList.add("reduced");
  };

  // Zoom: wheel (if available) + Zoom-mode click-drag on empty space
  const ZOOM_KEY = "pair-mark-zoom-v1";
  const ZOOM_INV_KEY = "pair-mark-zoom-invert-v1";
  const ZOOM_MIN = 0.28;
  const ZOOM_MAX = 2.4;
  const readZoom = () => {
    try {
      const n = Number(localStorage.getItem(ZOOM_KEY));
      if (Number.isFinite(n) && n >= ZOOM_MIN && n <= ZOOM_MAX) return n;
    } catch {}
    return 1;
  };
  let markZoom = readZoom();
  let zoomMode = false;
  let zoomInvert = false;
  try {
    zoomInvert = localStorage.getItem(ZOOM_INV_KEY) === "1";
  } catch {}
  let zoomDrag = null;

  const zoomBtn = document.querySelector("[data-zoom-toggle]");
  const zoomMenu = document.querySelector("[data-zoom-menu]");
  const zoomInvertBtn = document.querySelector("[data-zoom-invert]");
  const zoomResetBtn = document.querySelector("[data-zoom-reset]");
  const sandboxBtn = document.querySelector("[data-sandbox-toggle]");

  const applyZoom = () => {
    mark.style.setProperty("--mark-zoom", String(markZoom));
    try {
      localStorage.setItem(ZOOM_KEY, String(markZoom));
    } catch {}
  };

  const setZoomMode = (on) => {
    zoomMode = !!on;
    document.documentElement.setAttribute("data-zoom-mode", zoomMode ? "on" : "off");
    if (zoomBtn) {
      zoomBtn.setAttribute("aria-pressed", zoomMode ? "true" : "false");
      zoomBtn.setAttribute("aria-expanded", zoomMode && zoomMenu && !zoomMenu.hidden ? "true" : "false");
    }
  };

  const zoomMenuOpen = (open) => {
    if (!zoomMenu || !zoomBtn) return;
    zoomMenu.hidden = !open;
    zoomBtn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  const syncZoomInvertUi = () => {
    if (zoomInvertBtn) zoomInvertBtn.setAttribute("aria-pressed", zoomInvert ? "true" : "false");
  };

  applyZoom();
  setZoomMode(false);
  syncZoomInvertUi();

  if (zoomBtn) {
    zoomBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const next = !zoomMode;
      setZoomMode(next);
      if (next) zoomMenuOpen(true);
      else zoomMenuOpen(false);
    });
  }
  if (zoomInvertBtn) {
    zoomInvertBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      zoomInvert = !zoomInvert;
      try {
        localStorage.setItem(ZOOM_INV_KEY, zoomInvert ? "1" : "0");
      } catch {}
      syncZoomInvertUi();
    });
  }
  if (zoomResetBtn) {
    zoomResetBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      markZoom = 1;
      applyZoom();
    });
  }
  document.addEventListener("click", (e) => {
    if (!zoomMenu || zoomMenu.hidden) return;
    if (e.target.closest("[data-zoom-wrap]")) return;
    zoomMenuOpen(false);
  });

  // Drag zoom when Zoom mode is locked on (empty space / not a symbol or hotspot)
  mark.addEventListener("pointerdown", (e) => {
    if (!zoomMode) return;
    if (e.target.closest("a.hotspot, .sym, .center, [data-motion-panel], header")) return;
    e.preventDefault();
    zoomDrag = { y0: e.clientY, z0: markZoom, pid: e.pointerId };
    try {
      mark.setPointerCapture(e.pointerId);
    } catch (err) {}
  });
  mark.addEventListener("pointermove", (e) => {
    if (!zoomDrag) return;
    e.preventDefault();
    const dy = e.clientY - zoomDrag.y0;
    // default: drag down = zoom in, drag up = zoom out
    const signed = zoomInvert ? -dy : dy;
    const factor = Math.exp(signed * 0.0045);
    markZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomDrag.z0 * factor));
    if (Math.abs(markZoom - 1) < 0.015) markZoom = 1;
    applyZoom();
  });
  const endZoomDrag = () => {
    zoomDrag = null;
  };
  mark.addEventListener("pointerup", endZoomDrag);
  mark.addEventListener("pointercancel", endZoomDrag);

  mark.addEventListener(
    "wheel",
    (e) => {
      if (e.target.closest("[data-motion-panel], .motion-panel, header, .themes")) return;
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.111111;
      markZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, markZoom * factor));
      if (Math.abs(markZoom - 1) < 0.02) markZoom = 1;
      applyZoom();
    },
    { passive: false }
  );

  // Sandbox framing toggle (play / experiment face of the hub)
  let sandboxOn = false;
  try {
    sandboxOn = localStorage.getItem("pair-sandbox-v1") === "1";
  } catch {}
  const setSandbox = (on) => {
    sandboxOn = !!on;
    document.documentElement.setAttribute("data-sandbox", sandboxOn ? "on" : "off");
    if (sandboxBtn) sandboxBtn.setAttribute("aria-pressed", sandboxOn ? "true" : "false");
    const tag = document.getElementById("tagline");
    if (tag) {
      tag.textContent = sandboxOn
        ? "Symbol sandbox — play & experiment"
        : "Each node is its own coin";
    }
    try {
      localStorage.setItem("pair-sandbox-v1", sandboxOn ? "1" : "0");
    } catch {}
  };
  setSandbox(sandboxOn);
  if (sandboxBtn) {
    sandboxBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setSandbox(!sandboxOn);
    });
  }

  fetch("coins.json")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data?.site?.tagline) return;
      const el = document.getElementById("tagline");
      if (el) el.textContent = data.site.tagline;
    })
    .catch(() => {});

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
