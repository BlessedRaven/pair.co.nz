(() => {
  const CX = 447.56;
  const CY = 484.96;
  const HOTSPOTS = [
    { id: "n", x: 453.56, y: 145 },
    { id: "nw", x: 148, y: 167 },
    { id: "w", x: 91.8, y: 353 },
    { id: "sw", x: 90, y: 555 },
    { id: "s", x: 462, y: 820 },
    { id: "se", x: 672.71, y: 750.29 },
    { id: "e", x: 821.16, y: 582.19 },
    { id: "ne", x: 820.1, y: 342.59 },
  ];

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

  const wrapOrbitSyms = (orbit) => {
    const items = [];
    Array.from(orbit.children).forEach((el) => {
      let bb;
      try {
        bb = el.getBBox();
      } catch (err) {
        return;
      }
      if (!bb.width && !bb.height) return;
      items.push({
        el,
        cx: bb.x + bb.width / 2,
        cy: bb.y + bb.height / 2,
      });
    });

    const pairs = [];
    items.forEach((it, i) => {
      HOTSPOTS.forEach((h) => {
        pairs.push({ i, id: h.id, d: Math.hypot(it.cx - h.x, it.cy - h.y) });
      });
    });
    pairs.sort((a, b) => a.d - b.d);

    const usedItems = new Set();
    const usedIds = new Set();
    const itemId = new Map();
    for (const p of pairs) {
      if (usedItems.has(p.i) || usedIds.has(p.id)) continue;
      if (p.d > 220) continue;
      usedItems.add(p.i);
      usedIds.add(p.id);
      itemId.set(p.i, p.id);
    }

    items.forEach((it, i) => {
      const wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
      wrap.setAttribute("class", "sym");
      wrap.setAttribute("data-sym", itemId.get(i) || `_x${i}`);
      orbit.insertBefore(wrap, it.el);
      wrap.appendChild(it.el);
      pinOrigin(wrap);
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
    center.setAttribute("data-sym", "center");

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
