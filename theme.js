(() => {
  const THEME_KEY = "pair-theme";
  const MOTION_KEY = "pair-motion";
  const allowed = new Set(["dark", "light", "vibe"]);

  const readTheme = () => {
    try {
      const t = localStorage.getItem(THEME_KEY);
      return allowed.has(t) ? t : "dark";
    } catch {
      return "dark";
    }
  };

  const readMotion = () => {
    try {
      return localStorage.getItem(MOTION_KEY) === "off" ? "off" : "on";
    } catch {
      return "on";
    }
  };

  const applyTheme = (theme) => {
    const t = allowed.has(theme) ? theme : "dark";
    document.documentElement.setAttribute("data-theme", t);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", t === "light" ? "#f7f5f0" : "#0a0a0c");
    }
    document.querySelectorAll("[data-theme-set]").forEach((btn) => {
      const on = btn.getAttribute("data-theme-set") === t;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {}
  };

  const applyMotion = (motion) => {
    const m = motion === "off" ? "off" : "on";
    document.documentElement.setAttribute("data-motion", m);
    document.querySelectorAll("[data-motion-toggle]").forEach((btn) => {
      btn.setAttribute("aria-pressed", m === "on" ? "true" : "false");
    });
    try {
      localStorage.setItem(MOTION_KEY, m);
    } catch {}
  };

  applyTheme(readTheme());
  applyMotion(readMotion());

  document.addEventListener("click", (e) => {
    const motionBtn = e.target.closest("[data-motion-toggle]");
    if (motionBtn) {
      applyMotion(readMotion() === "on" ? "off" : "on");
      return;
    }
    const btn = e.target.closest("[data-theme-set]");
    if (!btn) return;
    applyTheme(btn.getAttribute("data-theme-set"));
  });
})();
