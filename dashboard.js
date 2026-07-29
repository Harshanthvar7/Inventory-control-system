/**
 * InvenTrack — Dashboard Module
 * Injects full UI into #module-root.
 * Depends on: shared/data.js (window.InvenTrack)
 */
(function () {
  "use strict";

  /* ── Helpers ─────────────────────────────────────────────── */
  function el(id) { return document.getElementById(id); }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(iso) {
    var d    = new Date(iso);
    var now  = new Date();
    var diff = (now - d) / 1000;
    if (diff < 60)    return "Just now";
    if (diff < 3600)  return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  }

  function formatDateMed(iso) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  /* ── Compute stats ───────────────────────────────────────── */
  function computeStats(products, movements) {
    var active     = products.filter(function (p) { return p.active; });
    var lowStock   = active.filter(function (p) {
      return p.stock <= p.threshold;
    });

    var sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    var recent7      = movements.filter(function (m) {
      return new Date(m.date).getTime() >= sevenDaysAgo;
    });

    return {
      totalActive:    active.length,
      lowStockCount:  lowStock.length,
      recent7Days:    recent7.length,
      lowStockItems:  lowStock,
      allActive:      active,
    };
  }

  /* ── Build stat cards ────────────────────────────────────── */
  function buildStatCards(stats) {
    var lowClass  = stats.lowStockCount > 0 ? "amber" : "green";
    var lowIcon   = stats.lowStockCount > 0 ? "⚠️"    : "✅";

    return (
      '<div class="dash-stats">' +

        // Card 1: Total Active Products
        '<div class="stat-card">' +
          '<div class="stat-icon blue">📦</div>' +
          '<div class="stat-body">' +
            '<div class="stat-value">' + stats.totalActive + '</div>' +
            '<div class="stat-label">Active Products</div>' +
          '</div>' +
        '</div>' +

        // Card 2: Low Stock
        '<div class="stat-card">' +
          '<div class="stat-icon ' + lowClass + '">' + lowIcon + '</div>' +
          '<div class="stat-body">' +
            '<div class="stat-value">' + stats.lowStockCount + '</div>' +
            '<div class="stat-label">Low-Stock Items</div>' +
          '</div>' +
        '</div>' +

        // Card 3: Movements (7 days)
        '<div class="stat-card">' +
          '<div class="stat-icon blue">📊</div>' +
          '<div class="stat-body">' +
            '<div class="stat-value">' + stats.recent7Days + '</div>' +
            '<div class="stat-label">Movements (7 days)</div>' +
          '</div>' +
        '</div>' +

      '</div>'
    );
  }

  /* ── Build low-stock panel ───────────────────────────────── */
  function buildLowStockPanel(items) {
    var inner = "";

    if (items.length === 0) {
      inner =
        '<div class="dash-all-clear">' +
          '<div class="all-clear-icon">🟢</div>' +
          '<p>All products are well-stocked!</p>' +
        '</div>';
    } else {
      // Sort: most critical first
      var sorted = items.slice().sort(function (a, b) {
        return (a.stock / (a.threshold || 1)) - (b.stock / (b.threshold || 1));
      });
      inner = '<div class="low-stock-list">' +
        sorted.map(function (p) {
          var isCritical = p.stock === 0;
          var rowClass = isCritical ? "low-stock-item critical" : "low-stock-item";
          var stockClass = isCritical ? "lsi-stock critical" : "lsi-stock";
          var icon = isCritical ? "🔴" : "⚠️";
          return (
            '<div class="' + rowClass + '">' +
              '<div class="flex flex-col" style="min-width:0;flex:1">' +
                '<span class="lsi-name" title="' + escHtml(p.name) + '">' +
                  icon + " " + escHtml(p.name) +
                '</span>' +
                '<span class="lsi-category">' + escHtml(p.category) + '</span>' +
              '</div>' +
              '<span class="' + stockClass + '">' +
                p.stock + "/" + p.threshold + " " + escHtml(p.unit) +
              '</span>' +
            '</div>'
          );
        }).join("") +
      '</div>';
    }

    return (
      '<div class="card dash-low-stock" style="height:fit-content;">' +
        '<div class="card-header">' +
          '<div>' +
            '<div class="card-title">⚠️ Low-Stock Alerts</div>' +
            '<div class="card-subtitle">' +
              (items.length > 0
                ? items.length + " item" + (items.length > 1 ? "s" : "") + " need attention"
                : "All clear") +
            '</div>' +
          '</div>' +
          (items.length > 0
            ? '<span class="badge badge-amber">' + items.length + '</span>'
            : '<span class="badge badge-green">OK</span>') +
        '</div>' +
        inner +
      '</div>'
    );
  }

  /* ── Build recent activity feed ──────────────────────────── */
  function buildRecentFeed(movements, products) {
    var recent = movements.slice(0, 8);
    var inner  = "";

    if (recent.length === 0) {
      inner =
        '<div class="empty-state" style="padding:2rem 1rem;">' +
          '<div class="empty-icon">📭</div>' +
          '<h3>No movements yet</h3>' +
        '</div>';
    } else {
      inner = '<div class="feed-list">' +
        recent.map(function (m) {
          var p = products.find(function (x) { return x.id === m.productId; });
          var name    = p ? escHtml(p.name)  : "Unknown";
          var unit    = p ? escHtml(p.unit)  : "";
          var isIN    = m.type === "IN";
          var dotCls  = isIN ? "in" : "out";
          var sign    = isIN ? "+" : "−";
          var qtyCls  = isIN ? "feed-qty in" : "feed-qty out";
          var note    = m.note ? " · " + escHtml(m.note).substring(0, 40) : "";
          return (
            '<div class="feed-item">' +
              '<div class="feed-dot ' + dotCls + '">' + (isIN ? "📥" : "📤") + '</div>' +
              '<div class="feed-body">' +
                '<div class="feed-title">' + name + '</div>' +
                '<div class="feed-meta">' + formatDate(m.date) + note + '</div>' +
              '</div>' +
              '<div class="' + qtyCls + '">' + sign + m.qty + " " + unit + '</div>' +
            '</div>'
          );
        }).join("") +
      '</div>';
    }

    return (
      '<div class="card dash-recent-feed">' +
        '<div class="card-header">' +
          '<div>' +
            '<div class="card-title">📋 Recent Activity</div>' +
            '<div class="card-subtitle">Last 8 movements</div>' +
          '</div>' +
          '<a href="stock-movement.html" class="btn btn-sm btn-outline">+ New</a>' +
        '</div>' +
        inner +
      '</div>'
    );
  }

  /* ── Build full stock table ──────────────────────────────── */
  function buildStockTable(products) {
    var html =
      '<div class="card dash-stock-section">' +
        '<div class="dash-table-toolbar">' +
          '<div class="dash-search-wrap">' +
            '<span class="dash-search-icon">🔍</span>' +
            '<input ' +
              'type="search" ' +
              'class="dash-search" ' +
              'id="dash-search" ' +
              'placeholder="Search by name or category…" ' +
              'autocomplete="off" ' +
            '/>' +
          '</div>' +
          '<span class="dash-results-count" id="dash-results-count"></span>' +
        '</div>' +
        '<div class="table-wrapper" style="border:none;box-shadow:none;">' +
          '<table id="dash-stock-table">' +
            '<thead><tr>' +
              '<th>Product</th>' +
              '<th>Category</th>' +
              '<th>Unit</th>' +
              '<th style="min-width:160px;">Stock Level</th>' +
              '<th>Threshold</th>' +
              '<th>Status</th>' +
            '</tr></thead>' +
            '<tbody id="dash-stock-body"></tbody>' +
          '</table>' +
        '</div>' +
      '</div>';
    return html;
  }

  /* ── Render stock table body ─────────────────────────────── */
  function renderStockBody(products, query) {
    var tbody  = el("dash-stock-body");
    var countEl = el("dash-results-count");
    if (!tbody) return;

    var filtered = products;
    if (query) {
      var q = query.toLowerCase();
      filtered = products.filter(function (p) {
        return p.name.toLowerCase().includes(q) ||
               p.category.toLowerCase().includes(q);
      });
    }

    countEl.textContent = filtered.length + " of " + products.length + " products";

    if (filtered.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6">' +
          '<div class="empty-state" style="padding:2rem 1rem;">' +
            '<div class="empty-icon">🔍</div>' +
            '<h3>No products match "' + escHtml(query) + '"</h3>' +
          '</div>' +
        '</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function (p) {
      var ratio    = p.threshold > 0 ? p.stock / p.threshold : 1;
      var pct      = Math.min(Math.round(ratio * 100), 100);
      var fillCls  = p.stock === 0 ? "critical" : (p.stock <= p.threshold ? "low" : "ok");
      var rowCls   = p.stock === 0 ? "row-critical" : (p.stock <= p.threshold ? "row-low-stock" : "");
      var statusBadge =
        p.stock === 0
          ? '<span class="badge badge-red">Out of stock</span>'
          : p.stock <= p.threshold
            ? '<span class="badge badge-amber">Low stock</span>'
            : '<span class="badge badge-green">In stock</span>';

      return (
        '<tr class="' + rowCls + '">' +
          '<td><strong>' + escHtml(p.name) + '</strong></td>' +
          '<td>' + escHtml(p.category) + '</td>' +
          '<td>' + escHtml(p.unit) + '</td>' +
          '<td>' +
            '<div class="dash-stock-bar-wrap">' +
              '<div class="dash-stock-bar">' +
                '<div class="dash-stock-fill ' + fillCls + '" style="width:' + pct + '%"></div>' +
              '</div>' +
              '<span class="dash-stock-num">' + p.stock + '</span>' +
            '</div>' +
          '</td>' +
          '<td class="text-muted">' + p.threshold + '</td>' +
          '<td>' + statusBadge + '</td>' +
        '</tr>'
      );
    }).join("");
  }

  /* ── Wire search ─────────────────────────────────────────── */
  function wireSearch(activeProducts) {
    var input = el("dash-search");
    if (!input) return;
    input.addEventListener("input", function () {
      renderStockBody(activeProducts, input.value.trim());
    });
    // Initial count
    renderStockBody(activeProducts, "");
  }

  /* ── Main init ───────────────────────────────────────────── */
  function init() {
    var root = document.getElementById("module-root");
    if (!root) { console.error("[Dashboard] #module-root not found"); return; }

    var products  = InvenTrack.getProducts();
    var movements = InvenTrack.getMovements();
    var stats     = computeStats(products, movements);

    var html =
      buildStatCards(stats) +
      '<div class="dash-mid">' +
        buildLowStockPanel(stats.lowStockItems) +
        buildRecentFeed(movements, products) +
      '</div>' +
      buildStockTable(stats.allActive);

    root.innerHTML = html;

    // Wire search after DOM is ready
    wireSearch(stats.allActive);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
