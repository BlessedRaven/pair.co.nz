(() => {
  const CX = 447.56;
  const CY = 484.96;
  const host = document.querySelector("[data-mark-host]");
  const mark = document.querySelector("[data-mark]");
  if (!host || !mark) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Hotspot centers (viewBox) — used to bind SVG pieces to nodes
  const anchors = {
    center: [447.56, 484.96],
    bean: [452.5, 28],
    key: [452.5, 78],
    sun: [452.5, 118],
    n: [453.56, 145],
    nw: [148, 167],
    w: [91.8, 353],
    sw: [90, 555],
    s: [462, 820],
    se: [672.71, 750.29],
    e: [821.16, 582.19],
    ne: [820.1, 342.59],
  };

  // Unique motion class per node
  const motion = {
    center: "sym-pulse",
    bean: "sym-vanish",
    key: "sym-flutter",
    sun: "sym-ripple",
    n: "sym-flutter",
    nw: "sym-ghost",
    w: "sym-shear",
    sw: "sym-flutter",
    s: "sym-wave",
    se: "sym-drip",
    e: "sym-shimmer",
    ne: "sym-ripple",
  };

  const nearest = (x, y) => {
    let best = "center";
    let bd = Infinity;
    for (const [id, [ax, ay]] of Object.entries(anchors)) {
      const d = (x - ax) ** 2 + (y - ay) ** 2;
      if (d < bd) {
        bd = d;
        best = id;
      }
    }
    return best;
  };

  const tagSymbols = (svg) => {
    // Prefer direct graphical children of center/orbit wrappers, else svg children
    const pools = [];
    const center = svg.querySelector(":scope > .center");
    const orbit = svg.querySelector(":scope > .orbit");
    if (center) pools.push(...Array.from(center.children));
    if (orbit) pools.push(...Array.from(orbit.children));
    if (!pools.length) {
      pools.push(
        ...Array.from(svg.children).filter((el) => el.tagName.toLowerCase() !== "defs")
      );
    }

    const claimed = new Map(); // id -> element with smallest area among matches? keep list
    const buckets = Object.fromEntries(Object.keys(anchors).map((k) => [k, []]));

    pools.forEach((el, idx) => {
      let box;
      try {
        box = el.getBBox();
      } catch {
        return;
      }
      if (!box || !(box.width || box.height)) return;
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      const id = nearest(cx, cy);
      el.setAttribute("data-sym", id);
      el.classList.add("sym");
      // transform origin at own center for local motion
      el.style.transformBox = "fill-box";
      el.style.transformOrigin = "center";
      buckets[id].push({ el, area: box.width * box.height, cx, cy });
    });

    // If multiple pieces map to same hotspot, keep them — all animate together as that symbol cluster
    return buckets;
  };

  const clearHot = (svg) => {
    svg.querySelectorAll(".sym.is-hot").forEach((el) => {
      el.classList.remove("is-hot");
      Object.values(motion).forEach((c) => el.classList.remove(c));
    });
  };

  const heat = (svg, id) => {
    clearHot(svg);
    const cls = motion[id] || "sym-ripple";
    svg.querySelectorAll(`.sym[data-sym="${id}"]`).forEach((el) => {
      el.classList.add("is-hot", cls);
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
    svg.setAttribute("class", "sigil sigil-base");
    svg.setAttribute("viewBox", src.getAttribute("viewBox") || "0 0 923.86 886.31");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "PAIR portal sigil");
    svg.setAttribute("focusable", "false");

    const defs = src.querySelector("defs");
    if (defs) svg.appendChild(document.importNode(defs, true));

    const center = document.createElementNS("http://www.w3.org/2000/svg", "g");
    center.setAttribute("class", "center");
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
    // Also promote loose paths under orbit
    svg.appendChild(orbit);
    svg.appendChild(center);

    host.innerHTML = "";
    host.appendChild(svg);
    // force layout then tag
    void svg.getBBox();
    tagSymbols(svg);
    mark._sigil = svg;
    mark.classList.add("is-ready");
    if (reduced) mark.classList.add("reduced");
  };

  const wireHover = () => {
    if (reduced) return;
    mark.querySelectorAll(".hotspot[data-hotspot]").forEach((el) => {
      const id = el.getAttribute("data-hotspot");
      const on = () => {
        mark.setAttribute("data-hover", id);
        if (mark._sigil) heat(mark._sigil, id);
      };
      const off = () => {
        if (mark.getAttribute("data-hover") === id) {
          mark.removeAttribute("data-hover");
          if (mark._sigil) clearHot(mark._sigil);
        }
      };
      el.addEventListener("pointerenter", on);
      el.addEventListener("pointerleave", off);
      el.addEventListener("focus", on);
      el.addEventListener("blur", off);
    });
  };

  fetch("coins.json")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data?.site?.tagline) return;
      const el = document.getElementById("tagline");
      if (el) el.textContent = data.site.tagline;
    })
    .catch(() => {});

  const start = () => {
    wireHover();
    mount();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
