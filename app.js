(() => {
  const CX = 447.56;
  const CY = 484.96;
  const VB_W = 923.86;
  const VB_H = 886.31;
  const host = document.querySelector("[data-mark-host]");
  const mark = document.querySelector("[data-mark]");
  if (!host || !mark) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const hotspotGeom = {
    center: { cx: 447.56, cy: 484.96, r: 150 },
    bean: { cx: 452.5, cy: 28, r: 36 },
    key: { cx: 452.5, cy: 78, r: 42 },
    sun: { cx: 452.5, cy: 118, r: 32 },
    n: { cx: 453.56, cy: 145, r: 70 },
    nw: { cx: 148, cy: 167, r: 88 },
    w: { cx: 91.8, cy: 353, r: 82 },
    sw: { cx: 90, cy: 555, r: 88 },
    s: { cx: 462, cy: 820, r: 88 },
    se: { cx: 672.71, cy: 750.29, r: 100 },
    e: { cx: 821.16, cy: 582.19, r: 95 },
    ne: { cx: 820.1, cy: 342.59, r: 95 },
  };

  const fxFilter = {
    center: "warpSpectral",
    bean: "warpSpectral",
    sun: "warpViolent",
    key: "warpFlutter",
    n: "warpFlutter",
    ne: "warpViolent",
    e: "warpSpectral",
    se: "warpDrip",
    s: "warpDrip",
    sw: "warpFlutter",
    w: "warpViolent",
    nw: "warpSpectral",
  };

  const restartFilterAnims = (filterId) => {
    const filter = document.getElementById(filterId);
    if (!filter) return;
    filter.querySelectorAll("animate").forEach((el) => {
      try {
        el.beginElement();
      } catch (_) {
        el.replaceWith(el.cloneNode(true));
      }
    });
  };

  const setClip = (id) => {
    const g = hotspotGeom[id];
    if (!g) return;
    const x = (g.cx / VB_W) * 100;
    const y = (g.cy / VB_H) * 100;
    // slightly tight so neighbouring symbols stay calm
    const r = (g.r / Math.min(VB_W, VB_H)) * 100;
    mark.style.setProperty("--clip-x", `${x}%`);
    mark.style.setProperty("--clip-y", `${y}%`);
    mark.style.setProperty("--clip-r", `${r}%`);
  };

  const buildSigilTree = (src) => {
    const frag = document.createDocumentFragment();
    const defs = src.querySelector("defs");
    if (defs) frag.appendChild(document.importNode(defs, true));

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
    frag.appendChild(orbit);
    frag.appendChild(center);
    return frag;
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

    const mkSvg = (className) => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", className);
      svg.setAttribute("viewBox", src.getAttribute("viewBox") || `0 0 ${VB_W} ${VB_H}`);
      svg.setAttribute("focusable", "false");
      svg.appendChild(buildSigilTree(src));
      return svg;
    };

    const base = mkSvg("sigil sigil-base");
    base.setAttribute("role", "img");
    base.setAttribute("aria-label", "PAIR portal sigil");

    const warp = mkSvg("sigil sigil-warp");
    warp.setAttribute("aria-hidden", "true");

    host.innerHTML = "";
    host.appendChild(base);
    host.appendChild(warp);
    mark.classList.add("is-ready");
    if (reduced) mark.classList.add("reduced");
  };

  const wireHover = () => {
    if (reduced) return;
    const hotspots = mark.querySelectorAll(".hotspot[data-hotspot]");
    hotspots.forEach((el) => {
      const id = el.getAttribute("data-hotspot");
      const on = () => {
        const filterId = fxFilter[id] || "warpViolent";
        setClip(id);
        mark.setAttribute("data-hover", id);
        mark.setAttribute("data-filter", filterId);
        restartFilterAnims(filterId);
      };
      const off = () => {
        if (mark.getAttribute("data-hover") === id) {
          mark.removeAttribute("data-hover");
          mark.removeAttribute("data-filter");
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
