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

  // Clockwise from top — fixed circular orbit (matches portal reading order)
  const RING_ORDER = [
    "scarab",
    "flower",
    "gol",
    "sol",
    "fol",
    "hermes",
    "ra",
    "trinity",
    "cloud",
    "pi",
  ];
  const SCARAB_SATS = ["sun", "key", "bean"];
  const ORBIT_R = 368;
  const SYM_TARGET = 92; // visual size normalize (max bbox side)

  const host = document.querySelector("[data-mark-host]");
  const mark = document.querySelector("[data-mark]");
  if (!host || !mark) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const pinOrigin = (el) => {
    try {
      const bb = el.getBBox();
      if (!bb.width && !bb.height) return;
      el.style.transformBox = "view-box";
      el.style.transformOrigin = `${bb.x + bb.width / 2}px ${bb.y + bb.height / 2}px`;
    } catch (err) {
      /* ignore */
    }
  };

  const wrapOne = (orbit, el, id, extra) => {
    const wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
    wrap.setAttribute("class", "sym");
    wrap.setAttribute("data-sym", id);
    orbit.insertBefore(wrap, el);
    if (extra && extra.before) {
      extra.before.forEach((node) => wrap.appendChild(node));
    }
    wrap.appendChild(el);
    if (extra && extra.after) {
      extra.after.forEach((node) => wrap.appendChild(node));
    }
    pinOrigin(wrap);
    return wrap;
  };

  const wrapDetached = (orbit, ref, el, id) => {
    if (!el) return null;
    const wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
    wrap.setAttribute("class", "sym");
    wrap.setAttribute("data-sym", id);
    orbit.insertBefore(wrap, ref);
    wrap.appendChild(el);
    pinOrigin(wrap);
    return wrap;
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
    const keyEl = upperKids[0] || null;
    const beanNodes = upperKids.slice(1);

    wrapDetached(orbit, cluster, scarabEl, "scarab");
    if (sunDisk) wrapDetached(orbit, cluster, sunDisk, "sun");
    if (keyEl) wrapDetached(orbit, cluster, keyEl, "key");
    if (beanNodes.length) {
      const beanWrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
      beanWrap.setAttribute("class", "sym");
      beanWrap.setAttribute("data-sym", "bean");
      orbit.insertBefore(beanWrap, cluster);
      beanNodes.forEach((n) => beanWrap.appendChild(n));
      pinOrigin(beanWrap);
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

  const centerOf = (el) => {
    const bb = el.getBBox();
    return { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2, bb };
  };

  const findSym = (id) =>
    document.querySelector('.mark-host svg.sigil .sym[data-sym="' + id + '"]');

  const translateEl = (el, dx, dy) => {
    if (!el || (!dx && !dy)) return;
    const prev = el.getAttribute("transform") || "";
    el.setAttribute("transform", (prev + " translate(" + dx + " " + dy + ")").trim());
  };

  const syncHotspot = (id, x, y) => {
    const a = document.querySelector('.hits [data-hotspot="' + id + '"]');
    if (!a) return;
    const hit = a.querySelector("circle.hit");
    const label = a.querySelector("text.hit-label");
    if (hit) {
      hit.setAttribute("cx", String(x));
      hit.setAttribute("cy", String(y));
    }
    if (label) {
      label.setAttribute("x", String(x));
      label.setAttribute("y", String(y));
    }
  };

  const layoutEvenOrbit = () => {
    const n = RING_ORDER.length;
    const startAng = -Math.PI / 2; // scarab at top

    const scarabEl = findSym("scarab");
    let scarabC = null;
    const satOffsets = [];
    if (scarabEl) {
      try {
        scarabC = centerOf(scarabEl);
        SCARAB_SATS.forEach((sid) => {
          const el = findSym(sid);
          if (!el) return;
          try {
            const c = centerOf(el);
            satOffsets.push({
              id: sid,
              el,
              ox: c.x - scarabC.x,
              oy: c.y - scarabC.y,
            });
          } catch (err) {}
        });
      } catch (err) {}
    }

    RING_ORDER.forEach((id, i) => {
      const el = findSym(id);
      if (!el) return;
      try {
        // Always measure untransformed geometry (clear prior layout transforms)
        el.removeAttribute("transform");
        const c = centerOf(el);
        const ang = startAng + (i * 2 * Math.PI) / n;
        const tx = CX + ORBIT_R * Math.cos(ang);
        const ty = CY + ORBIT_R * Math.sin(ang);
        const dx = tx - c.x;
        const dy = ty - c.y;
        // Normalize visual weight so large circles don't look cramped
        const side = Math.max(c.bb.width, c.bb.height) || SYM_TARGET;
        const s = Math.min(1.15, Math.max(0.55, SYM_TARGET / side));
        el.setAttribute(
          "transform",
          "translate(" + tx + " " + ty + ") scale(" + s + ") translate(" + -c.x + " " + -c.y + ")"
        );
        pinOrigin(el);
        syncHotspot(id, tx, ty);

        if (id === "scarab") {
          // Keep sun/key/bean stacked above scarab; fit to top + match scarab visual scale
          const topPad = 28;
          let fit = 1;
          satOffsets.forEach((sat) => {
            if (sat.oy < 0) {
              const need = -sat.oy * s;
              if (need > 0) fit = Math.min(fit, Math.max(0.35, (ty - topPad) / need));
            }
          });
          const ss = s * fit;
          satOffsets.forEach((sat) => {
            try {
              sat.el.removeAttribute("transform");
              const sc = centerOf(sat.el);
              const nx = tx + sat.ox * ss;
              const ny = ty + sat.oy * ss;
              sat.el.setAttribute(
                "transform",
                "translate(" + nx + " " + ny + ") scale(" + s + ") translate(" + -sc.x + " " + -sc.y + ")"
              );
              pinOrigin(sat.el);
              syncHotspot(sat.id, nx, ny);
            } catch (err) {}
          });
        }
      } catch (err) {}
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

    const center = document.createElementNS("http://www.w3.org/2000/svg", "g");
    center.setAttribute("class", "center");
    center.setAttribute("data-sym", "torus");

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

    svg.appendChild(orbit);
    svg.appendChild(center);
    host.innerHTML = "";
    host.appendChild(svg);
    wrapOrbitSyms(orbit);
    layoutEvenOrbit();
    pinOrigin(center);
    mark.classList.add("is-ready");
    document.dispatchEvent(new CustomEvent("pair:syms-ready"));
    if (reduced) mark.classList.add("reduced");
  };

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
