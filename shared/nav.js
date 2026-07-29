/**
 * InvenTrack — Shared Navigation Injector
 * Include this script in any page: <script src="shared/nav.js" defer></script>
 * It injects #inventrack-nav before <body>'s first element and highlights
 * the active link based on the current page filename.
 */

(function () {
  "use strict";

  /* ── Link definitions ─────────────────────────────────────── */
  const NAV_LINKS = [
    {
      href: "dashboard.html",
      label: "Dashboard",
      icon: "📊",
    },
    {
      href: "stock-movement.html",
      label: "Stock Entry",
      icon: "📦",
    },
    {
      href: "products.html",
      label: "Products",
      icon: "🗂️",
    },
  ];

  /* ── Detect active page ───────────────────────────────────── */
  /**
   * Returns the basename of the current page (e.g. "dashboard.html").
   * Falls back to "index.html" for the root path.
   */
  function currentPage() {
    const path = window.location.pathname;
    const file = path.substring(path.lastIndexOf("/") + 1);
    return file === "" ? "index.html" : file;
  }

  /* ── Build nav HTML ───────────────────────────────────────── */
  function buildNav() {
    const active = currentPage();

    const linksHTML = NAV_LINKS.map(({ href, label, icon }) => {
      const isActive = active === href;
      return `
        <li>
          <a href="${href}"${isActive ? ' class="nav-active" aria-current="page"' : ""}>
            <span class="nav-icon" aria-hidden="true">${icon}</span>
            ${label}
          </a>
        </li>`.trim();
    }).join("\n");

    return `
<nav id="inventrack-nav" role="navigation" aria-label="Main navigation">
  <div class="nav-inner">
    <a class="nav-brand" href="index.html" aria-label="InvenTrack home">
      <span class="brand-icon" aria-hidden="true">📋</span>
      Inven<span class="brand-dot">Track</span>
    </a>

    <button
      class="nav-toggle"
      id="nav-toggle-btn"
      aria-controls="nav-link-list"
      aria-expanded="false"
      aria-label="Toggle navigation menu"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <ul class="nav-links" id="nav-link-list" role="list">
      ${linksHTML}
    </ul>
  </div>
</nav>`.trim();
  }

  /* ── Inject into DOM ──────────────────────────────────────── */
  function injectNav() {
    // Avoid double-injection
    if (document.getElementById("inventrack-nav")) return;

    const navEl = document.createElement("div");
    navEl.innerHTML = buildNav();
    const nav = navEl.firstElementChild;

    // Insert as the first child of <body>
    document.body.insertBefore(nav, document.body.firstChild);

    // Wire up mobile hamburger toggle
    setupToggle();
  }

  /* ── Mobile hamburger toggle ──────────────────────────────── */
  function setupToggle() {
    const btn = document.getElementById("nav-toggle-btn");
    const links = document.getElementById("nav-link-list");
    if (!btn || !links) return;

    btn.addEventListener("click", function () {
      const isOpen = links.classList.toggle("open");
      btn.classList.toggle("open", isOpen);
      btn.setAttribute("aria-expanded", String(isOpen));
    });

    // Close menu when a link is clicked (UX on mobile)
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        btn.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      });
    });

    // Close menu when clicking outside the nav
    document.addEventListener("click", function (e) {
      const nav = document.getElementById("inventrack-nav");
      if (nav && !nav.contains(e.target) && links.classList.contains("open")) {
        links.classList.remove("open");
        btn.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ── Entry point ──────────────────────────────────────────── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectNav);
  } else {
    // Script loaded with defer or after DOMContentLoaded
    injectNav();
  }
})();
