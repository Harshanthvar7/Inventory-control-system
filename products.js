/**
 * InvenTrack — Products Module
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

  /* ── State ───────────────────────────────────────────────── */
  var state = {
    editingId:    null,      // product id being edited, or null for new
    pendingDeact: null,      // product id waiting for deactivate confirm
    searchQuery:  "",
    filterCat:    "all",
  };

  /* ── Build skeleton ──────────────────────────────────────── */
  function buildSkeleton() {
    return `
<!-- Form Panel (hidden by default) -->
<div class="prod-form-panel" id="prod-form-panel">
  <div class="prod-form-card">
    <div class="prod-form-header">
      <div class="prod-form-title" id="prod-form-title">➕ Add New Product</div>
      <button class="prod-form-close" id="prod-form-close" title="Close form">✕</button>
    </div>
    <div class="prod-form-body">
      <div class="prod-form-grid">

        <!-- Name -->
        <div class="form-group prod-form-row-full">
          <label class="form-label" for="pf-name">
            Product Name <span class="required">*</span>
          </label>
          <input
            type="text"
            class="form-input"
            id="pf-name"
            placeholder="e.g. Wireless Keyboard"
            maxlength="80"
            autocomplete="off"
          />
          <span class="field-error" id="pf-name-err"></span>
        </div>

        <!-- Category -->
        <div class="form-group">
          <label class="form-label" for="pf-category">
            Category <span class="required">*</span>
          </label>
          <input
            type="text"
            class="form-input"
            id="pf-category"
            placeholder="e.g. Electronics"
            list="pf-category-list"
            autocomplete="off"
          />
          <datalist id="pf-category-list">
            <option value="Electronics">
            <option value="Office Supplies">
            <option value="Furniture">
            <option value="Consumables">
            <option value="Raw Materials">
            <option value="Packaging">
            <option value="Safety Equipment">
            <option value="Tools">
          </datalist>
          <span class="field-error" id="pf-category-err"></span>
        </div>

        <!-- Unit -->
        <div class="form-group">
          <label class="form-label" for="pf-unit">
            Unit <span class="required">*</span>
          </label>
          <input
            type="text"
            class="form-input"
            id="pf-unit"
            placeholder="e.g. pcs, kg, boxes"
            list="pf-unit-list"
            autocomplete="off"
          />
          <datalist id="pf-unit-list">
            <option value="pcs">
            <option value="kg">
            <option value="g">
            <option value="L">
            <option value="boxes">
            <option value="reams">
            <option value="rolls">
            <option value="sets">
            <option value="pairs">
          </datalist>
          <span class="field-error" id="pf-unit-err"></span>
        </div>

        <!-- Threshold -->
        <div class="form-group">
          <label class="form-label" for="pf-threshold">
            Low-Stock Threshold <span class="required">*</span>
          </label>
          <input
            type="number"
            class="form-input"
            id="pf-threshold"
            placeholder="e.g. 10"
            min="1"
            step="1"
          />
          <span class="form-hint">Alert when stock falls at or below this number</span>
          <span class="field-error" id="pf-threshold-err"></span>
        </div>

      </div>

      <!-- Actions -->
      <div class="prod-form-actions">
        <button class="btn btn-secondary" id="pf-cancel">Cancel</button>
        <button class="btn btn-primary" id="pf-save">💾 Save Product</button>
      </div>
    </div>
  </div>
</div>

<!-- Toolbar -->
<div class="prod-toolbar">
  <div class="prod-toolbar-left">
    <div class="prod-search-wrap">
      <span class="prod-search-icon">🔍</span>
      <input
        type="search"
        class="prod-search"
        id="prod-search"
        placeholder="Search products…"
        autocomplete="off"
      />
    </div>
    <div class="prod-filter-tabs" id="prod-filter-tabs"></div>
    <span class="prod-count" id="prod-count"></span>
  </div>
  <button class="btn btn-primary" id="prod-add-btn">➕ Add Product</button>
</div>

<!-- Table -->
<div class="prod-table-wrap table-wrapper">
  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>Category</th>
        <th>Unit</th>
        <th>Stock</th>
        <th>Threshold</th>
        <th>Status</th>
        <th style="text-align:right;padding-right:1.25rem;">Actions</th>
      </tr>
    </thead>
    <tbody id="prod-table-body"></tbody>
  </table>
</div>`;
  }

  /* ── Render category filter tabs ─────────────────────────── */
  function renderFilterTabs() {
    var products   = InvenTrack.getProducts();
    var categories = ["all"].concat(
      [...new Set(products.map(function (p) { return p.category; }))].sort()
    );

    el("prod-filter-tabs").innerHTML = categories.map(function (cat) {
      var label  = cat === "all" ? "All" : escHtml(cat);
      var active = state.filterCat === cat ? " active" : "";
      return '<button class="prod-filter-tab' + active + '" data-cat="' +
        escHtml(cat) + '">' + label + '</button>';
    }).join("");

    // Wire
    el("prod-filter-tabs").querySelectorAll(".prod-filter-tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.filterCat = btn.dataset.cat;
        renderTable();
        renderFilterTabs();
      });
    });
  }

  /* ── Render table ────────────────────────────────────────── */
  function renderTable() {
    var tbody    = el("prod-table-body");
    var countEl  = el("prod-count");
    var products = InvenTrack.getProducts();

    var filtered = products.filter(function (p) {
      var matchCat   = state.filterCat === "all" || p.category === state.filterCat;
      var matchQuery = !state.searchQuery ||
        p.name.toLowerCase().includes(state.searchQuery) ||
        p.category.toLowerCase().includes(state.searchQuery);
      return matchCat && matchQuery;
    });

    countEl.textContent = filtered.length + " of " + products.length;

    if (filtered.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7">' +
          '<div class="empty-state">' +
            '<div class="empty-icon">📦</div>' +
            '<h3>' +
              (products.length === 0 ? "No products yet" : "No products match your search") +
            '</h3>' +
            (products.length === 0
              ? '<p>Click <strong>Add Product</strong> to create your first item.</p>'
              : "") +
          '</div>' +
        '</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function (p) {
      var rowCls     = !p.active ? "row-inactive" : "";
      var stockCls   = !p.active ? "" : (p.stock === 0 ? " critical" : (p.stock <= p.threshold ? " low" : ""));
      var status     = !p.active
        ? '<span class="badge badge-gray">Inactive</span>'
        : p.stock === 0
          ? '<span class="badge badge-red">Out of stock</span>'
          : p.stock <= p.threshold
            ? '<span class="badge badge-amber">Low stock</span>'
            : '<span class="badge badge-green">Active</span>';

      // Stock display
      var stockHtml =
        '<div class="prod-stock-cell">' +
          '<span class="prod-stock-num' + stockCls + '">' + p.stock + '</span>' +
          '<span class="text-muted text-xs">' + escHtml(p.unit) + '</span>' +
        '</div>';

      // Action buttons
      var actions = "";
      if (state.pendingDeact === p.id) {
        // Inline deactivate confirm
        actions =
          '<div class="prod-confirm-wrap">' +
            '<span class="prod-confirm-label">Deactivate?</span>' +
            '<button class="btn btn-sm btn-danger" data-action="deact-confirm" data-id="' + p.id + '">Yes</button>' +
            '<button class="btn btn-sm btn-secondary" data-action="deact-cancel">No</button>' +
          '</div>';
      } else if (p.active) {
        actions =
          '<div class="prod-actions">' +
            '<button class="btn btn-sm btn-outline" data-action="edit" data-id="' + p.id + '">✏️ Edit</button>' +
            '<button class="btn btn-sm btn-secondary" data-action="deact-start" data-id="' + p.id + '">Deactivate</button>' +
          '</div>';
      } else {
        actions =
          '<div class="prod-actions">' +
            '<button class="btn btn-sm btn-outline" data-action="edit" data-id="' + p.id + '">✏️ Edit</button>' +
            '<span class="text-xs text-muted">Inactive</span>' +
          '</div>';
      }

      return (
        '<tr class="' + rowCls + '" data-product-id="' + p.id + '">' +
          '<td><strong>' + escHtml(p.name) + '</strong></td>' +
          '<td>' + escHtml(p.category) + '</td>' +
          '<td class="prod-threshold">' + escHtml(p.unit) + '</td>' +
          '<td>' + stockHtml + '</td>' +
          '<td class="prod-threshold">' + p.threshold + '</td>' +
          '<td>' + status + '</td>' +
          '<td style="text-align:right;padding-right:1.25rem;">' + actions + '</td>' +
        '</tr>'
      );
    }).join("");

    // Wire action buttons
    tbody.querySelectorAll("button[data-action]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var action = btn.dataset.action;
        var id     = btn.dataset.id;

        switch (action) {
          case "edit":
            openForm(id);
            break;
          case "deact-start":
            state.pendingDeact = id;
            renderTable();
            break;
          case "deact-cancel":
            state.pendingDeact = null;
            renderTable();
            break;
          case "deact-confirm":
            InvenTrack.deactivateProduct(id);
            state.pendingDeact = null;
            renderTable();
            renderFilterTabs();
            break;
        }
      });
    });
  }

  /* ── Validation helpers ──────────────────────────────────── */
  var NAME_RE = /^[A-Za-z0-9][A-Za-z0-9\s\-().,'&#+/]*$/;

  function showErr(id, msg) {
    var e = el(id);
    e.textContent = msg;
    e.classList.add("visible");
  }

  function clearErr(id) {
    var e = el(id);
    if (e) { e.textContent = ""; e.classList.remove("visible"); }
  }

  function clearAllErrors() {
    ["pf-name-err", "pf-category-err", "pf-unit-err", "pf-threshold-err"]
      .forEach(clearErr);
    ["pf-name", "pf-category", "pf-unit", "pf-threshold"]
      .forEach(function (id) { var i = el(id); if (i) i.classList.remove("error"); });
  }

  function validateForm() {
    clearAllErrors();
    var name      = el("pf-name").value.trim();
    var category  = el("pf-category").value.trim();
    var unit      = el("pf-unit").value.trim();
    var threshold = parseInt(el("pf-threshold").value, 10);
    var valid     = true;

    if (!name) {
      showErr("pf-name-err", "Product name is required.");
      el("pf-name").classList.add("error");
      valid = false;
    } else if (!NAME_RE.test(name)) {
      showErr("pf-name-err", "Name may only contain letters, numbers, spaces, and basic punctuation.");
      el("pf-name").classList.add("error");
      valid = false;
    }

    if (!category) {
      showErr("pf-category-err", "Category is required.");
      el("pf-category").classList.add("error");
      valid = false;
    }

    if (!unit) {
      showErr("pf-unit-err", "Unit is required.");
      el("pf-unit").classList.add("error");
      valid = false;
    }

    if (!threshold || threshold < 1) {
      showErr("pf-threshold-err", "Threshold must be at least 1.");
      el("pf-threshold").classList.add("error");
      valid = false;
    }

    return valid;
  }

  /* ── Open / close form ───────────────────────────────────── */
  function openForm(editId) {
    state.editingId = editId || null;
    clearAllErrors();

    var panel      = el("prod-form-panel");
    var titleEl    = el("prod-form-title");
    var saveBtn    = el("pf-save");

    if (editId) {
      var p = InvenTrack.getProducts().find(function (x) { return x.id === editId; });
      if (!p) return;
      el("pf-name").value      = p.name;
      el("pf-category").value  = p.category;
      el("pf-unit").value      = p.unit;
      el("pf-threshold").value = p.threshold;
      titleEl.textContent      = "✏️ Edit Product";
      saveBtn.textContent      = "💾 Update Product";
    } else {
      el("pf-name").value      = "";
      el("pf-category").value  = "";
      el("pf-unit").value      = "";
      el("pf-threshold").value = "";
      titleEl.textContent      = "➕ Add New Product";
      saveBtn.textContent      = "💾 Save Product";
    }

    panel.classList.add("open");
    // Scroll to form
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(function () { el("pf-name").focus(); }, 360);
  }

  function closeForm() {
    el("prod-form-panel").classList.remove("open");
    state.editingId = null;
    clearAllErrors();
  }

  /* ── Save form ───────────────────────────────────────────── */
  function handleSave() {
    if (!validateForm()) return;

    var name      = el("pf-name").value.trim();
    var category  = el("pf-category").value.trim();
    var unit      = el("pf-unit").value.trim();
    var threshold = parseInt(el("pf-threshold").value, 10);

    var productData = {
      name: name,
      category: category,
      unit: unit,
      threshold: threshold,
    };

    if (state.editingId) {
      // Preserve existing stock + active; only update meta
      var existing = InvenTrack.getProducts().find(function (p) { return p.id === state.editingId; });
      productData.id     = state.editingId;
      productData.stock  = existing ? existing.stock  : 0;
      productData.active = existing ? existing.active : true;
    }

    InvenTrack.saveProduct(productData);
    closeForm();
    renderTable();
    renderFilterTabs();
  }

  /* ── Main init ───────────────────────────────────────────── */
  function init() {
    var root = document.getElementById("module-root");
    if (!root) { console.error("[Products] #module-root not found"); return; }
    root.innerHTML = buildSkeleton();

    renderFilterTabs();
    renderTable();

    // Add Product button
    el("prod-add-btn").addEventListener("click", function () {
      openForm(null);
    });

    // Form close
    el("prod-form-close").addEventListener("click", closeForm);
    el("pf-cancel").addEventListener("click", closeForm);

    // Form save
    el("pf-save").addEventListener("click", handleSave);

    // Real-time name validation feedback
    el("pf-name").addEventListener("input", function () {
      var val = el("pf-name").value.trim();
      if (val && !NAME_RE.test(val)) {
        showErr("pf-name-err", "Invalid characters in name.");
        el("pf-name").classList.add("error");
      } else {
        clearErr("pf-name-err");
        el("pf-name").classList.remove("error");
      }
    });

    // Search
    el("prod-search").addEventListener("input", function () {
      state.searchQuery = el("prod-search").value.trim().toLowerCase();
      renderTable();
    });

    // Submit form on Enter (name / category / unit / threshold)
    ["pf-name", "pf-category", "pf-unit", "pf-threshold"].forEach(function (id) {
      el(id).addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); handleSave(); }
      });
    });

    // Close deactivate confirm if clicking anywhere else
    document.addEventListener("click", function (e) {
      if (state.pendingDeact && !e.target.closest("[data-action]")) {
        state.pendingDeact = null;
        renderTable();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
