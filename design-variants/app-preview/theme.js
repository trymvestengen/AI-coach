/* ============================================================
   AI Coach — shared theme controller (forge)
   - Reads saved theme from localStorage key "forge-theme".
   - Applies data-theme on <html> BEFORE first paint (no flash).
   - Binds every .theme-toggle on the page to flip + persist.

   USAGE: put <script src="theme.js"></script> in <head>
   (NOT deferred / not module) so the pre-paint block runs early.
   Works across all pages via the shared key.
   ============================================================ */
(function () {
  "use strict";
  var KEY = "forge-theme";
  var root = document.documentElement;

  /* ---- pre-paint: apply stored (or current) theme immediately ---- */
  function resolve() {
    var saved;
    try { saved = localStorage.getItem(KEY); } catch (e) { saved = null; }
    if (saved === "dark" || saved === "light") return saved;
    return root.getAttribute("data-theme") || "light";
  }

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    // reflect on any toggles already in the DOM
    var toggles = document.querySelectorAll(".theme-toggle");
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].setAttribute("aria-pressed", String(theme === "dark"));
    }
  }

  apply(resolve()); // runs in <head>, before body paints

  function toggle() {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    try { localStorage.setItem(KEY, next); } catch (e) {}
    apply(next);
  }

  /* ---- bind toggles once the DOM is ready ---- */
  function bind() {
    var toggles = document.querySelectorAll(".theme-toggle");
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].setAttribute("aria-pressed", String(root.getAttribute("data-theme") === "dark"));
      toggles[i].addEventListener("click", toggle);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }

  // expose for any screen that wants programmatic control
  window.ForgeTheme = { toggle: toggle, set: function (t) { try { localStorage.setItem(KEY, t); } catch (e) {} apply(t); } };
})();
