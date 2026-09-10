(() => {
  const KEY = "pair-theme";
  const allowed = new Set(["dark", "light", "vibe"]);

  const read = () => {
    try {
      const t = localStorage.getItem(KEY);
      return allowed.has(t) ? t : "dark";
    } catch {
      return "dark";
    }
  };

  const apply = (theme) => {
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
      localStorage.setItem(KEY, t);
    } catch {}
  };

  apply(read());

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-theme-set]");
    if (!btn) return;
    apply(btn.getAttribute("data-theme-set"));
  });
})();
