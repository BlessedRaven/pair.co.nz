(() => {
  const THEME_KEY = "pair-theme";
  const allowed = new Set(["dark", "light", "vibe-dark", "vibe-light"]);

  const migrate = (t) => {
    if (t === "vibe") return "vibe-dark";
    return allowed.has(t) ? t : "dark";
  };

  const readTheme = () => {
    try {
      return migrate(localStorage.getItem(THEME_KEY));
    } catch {
      return "dark";
    }
  };

  const vibeOpen = (open) => {
    const menu = document.querySelector("[data-vibe-menu]");
    const btn = document.querySelector("[data-vibe-toggle]");
    if (!menu || !btn) return;
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  const applyTheme = (theme) => {
    const t = migrate(theme);
    document.documentElement.setAttribute("data-theme", t);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", t === "light" || t === "vibe-light" ? "#f7f5f0" : "#0a0a0c");
    }
    document.querySelectorAll("[data-theme-set]").forEach((btn) => {
      const on = btn.getAttribute("data-theme-set") === t;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    const vibeBtn = document.querySelector("[data-vibe-toggle]");
    if (vibeBtn) {
      const vibeOn = t === "vibe-dark" || t === "vibe-light";
      vibeBtn.setAttribute("aria-pressed", vibeOn ? "true" : "false");
      vibeBtn.textContent = t === "vibe-light" ? "Vibe Light" : t === "vibe-dark" ? "Vibe Dark" : "Vibe";
    }
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {}
    vibeOpen(false);
  };

  applyTheme(readTheme());

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-motion-toggle]") || e.target.closest("[data-motion-panel]") || e.target.closest("[data-panel-open]")) {
      vibeOpen(false);
      return;
    }
    const vibeToggle = e.target.closest("[data-vibe-toggle]");
    if (vibeToggle) {
      e.stopPropagation();
      const menu = document.querySelector("[data-vibe-menu]");
      vibeOpen(menu ? menu.hidden : true);
      return;
    }
    const btn = e.target.closest("[data-theme-set]");
    if (btn) {
      applyTheme(btn.getAttribute("data-theme-set"));
      return;
    }
    if (!e.target.closest("[data-vibe-wrap]")) vibeOpen(false);
  });
})();
