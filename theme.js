(() => {
  const THEME_KEY = "pair-theme";
  const COLOUR_KEY = "pair-colour";
  const allowed = new Set(["dark", "light", "vibe"]);

  const readTheme = () => {
    try {
      const t = localStorage.getItem(THEME_KEY);
      return allowed.has(t) ? t : "dark";
    } catch {
      return "dark";
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
    // Vibe theme implies colour cycle on
    if (t === "vibe") {
      document.documentElement.setAttribute("data-colour", "vibe");
      try {
        localStorage.setItem(COLOUR_KEY, "vibe");
      } catch {}
      document.dispatchEvent(new CustomEvent("pair:colour-changed"));
    }
  };

  applyTheme(readTheme());

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-motion-toggle]") || e.target.closest("[data-motion-panel]") || e.target.closest("[data-panel-open]")) return;
    const btn = e.target.closest("[data-theme-set]");
    if (!btn) return;
    applyTheme(btn.getAttribute("data-theme-set"));
  });
})();
