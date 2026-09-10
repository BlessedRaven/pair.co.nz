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
      const slot = makeSlot("bean");
      const beanWrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
      beanWrap.setAttribute("class", "sym");
      beanWrap.setAttribute("data-sym", "bean");
      orbit.insertBefore(slot, cluster);
      slot.appendChild(beanWrap);
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
