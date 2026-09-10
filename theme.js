(() => {
  const THEME_KEY = "pair-theme";
  const VIBE_LAST_KEY = "pair-vibe-last";
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

  const readLastVibe = () => {
    try {
      const v = migrate(localStorage.getItem(VIBE_LAST_KEY));
      return v === "vibe-light" ? "vibe-light" : "vibe-dark";
    } catch {
      return "vibe-dark";
    }
  };

  const vibeOpen = (open) => {
    const menu = document.querySelector("[data-vibe-menu]");
    const btn = document.querySelector("[data-vibe-toggle]");
    if (!menu || !btn) return;
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  const applyTheme = (theme, opts) => {
    const keepMenu = opts && opts.keepMenu;
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
      vibeBtn.textContent = "Vibe";
    }
    try {
      localStorage.setItem(THEME_KEY, t);
      if (t === "vibe-dark" || t === "vibe-light") {
        localStorage.setItem(VIBE_LAST_KEY, t);
      }
    } catch {}
    if (!keepMenu) vibeOpen(false);
  };

  applyTheme(readTheme());

  document.addEventListener("click", (e) => {
    if (
      e.target.closest("[data-motion-toggle]") ||
      e.target.closest("[data-motion-panel]") ||
      e.target.closest("[data-panel-open]")
    ) {
      vibeOpen(false);
      return;
    }
    const vibeToggle = e.target.closest("[data-vibe-toggle]");
    if (vibeToggle) {
      e.stopPropagation();
      const cur = readTheme();
      const vibeOn = cur === "vibe-dark" || cur === "vibe-light";
      if (!vibeOn) {
        applyTheme(readLastVibe(), { keepMenu: true });
      }
      const menu = document.querySelector("[data-vibe-menu]");
      vibeOpen(menu ? menu.hidden : true);
      return;
    }
    const btn = e.target.closest("[data-theme-set]");
    if (btn) {
      const next = btn.getAttribute("data-theme-set");
      const isVibePick = next === "vibe-dark" || next === "vibe-light";
      applyTheme(next, { keepMenu: isVibePick });
      if (isVibePick) vibeOpen(true);
      return;
    }
    if (!e.target.closest("[data-vibe-wrap]")) vibeOpen(false);
  });
})();
