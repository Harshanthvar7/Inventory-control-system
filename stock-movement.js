/**
 * InvenTrack — Stock Movement Module
 * Injects full UI into #module-root.
 * Depends on: shared/data.js (window.InvenTrack)
 */
(function () {
  "use strict";

  /* ── Helpers ─────────────────────────────────────────────── */
  function el(id) { return document.getElementById(id); }

  function formatDate(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60)  return "Just now";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  function formatDateFull(iso) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ── Build skeleton HTML ─────────────────────────────────── */
  function buildHTML() {
    return `
<div class="sm-layout">

  <!-- ── LEFT: FORM CARD ──────────────────────────────────── -->
  <div class="card sm-form-card" id="sm-form-card">
    <div class="card-header">
      <div>
        <div class="card-title">Record Stock Movement</div>
        <div class="card-subtitle">Track incoming and outgoing inventory</div>
      </div>
    </div>

    <!-- IN / OUT Toggle -->
    <div class="sm-type-toggle" role="group" aria-label="Movement type">
      <button class="sm-type-btn active" data-type="IN" id="sm-btn-in">
        📥 Stock In
      </button>
      <button class="sm-type-btn" data-type="OUT" id="sm-btn-out">
        📤 Stock Out
      </button>
    </div>

    <!-- Product -->
    <div class="form-group">
      <label class="form-label" for="sm-product">
        Product <span class="required">*</span>
      </label>
      <select class="form-select" id="sm-product">
        <option value="">— Select a product —</option>
      </select>
      <div class="sm-stock-preview" id="sm-stock-preview"></div>
    </div>

    <!-- Quantity -->
    <div class="form-group">
      <label class="form-label" for="sm-qty">
        Quantity <span class="required">*</span>
      </label>
      <input
        type="number"
        class="form-input"
        id="sm-qty"
        min="1"
        step="1"
        placeholder="Enter quantity"
        autocomplete="off"
      />
      <span class="form-hint" id="sm-qty-hint"></span>
    </div>

    <!-- Note -->
    <div class="form-group">
      <label class="form-label" for="sm-note">
        Note <span class="text-muted" style="font-weight:400;">(optional)</span>
      </label>
      <textarea
        class="form-textarea"
        id="sm-note"
        placeholder="Add a reference, reason, or note…"
        rows="3"
        style="min-height:72px;"
      ></textarea>
    </div>

    <!-- Save -->
    <button class="btn sm-save-btn in-mode" id="sm-save" disabled>
      📥 Record Stock In
    </button>

    <!-- Feedback -->
    <div class="sm-feedback" id="sm-feedback">
      <div class="sm-feedback-inner" id="sm-feedback-inner">
        <span class="sm-feedback-icon" id="sm-feedback-icon"></span>
        <span id="sm-feedback-text"></span>
      </div>
    </div>
  </div>

  <!-- ── RIGHT: RECENT MOVEMENTS ──────────────────────────── -->
  <div class="card sm-movements-card">
    <div class="sm-movements-header">
      <div>
        <div class="card-title">Recent Movements</div>
        <div class="card-subtitle">Last 10 transactions</div>
      </div>
      <span class="sm-movements-count" id="sm-mov-count"></span>
    </div>
    <div id="sm-movements-body"></div>
  </div>

</div>`;
  }

  /* ── State ───────────────────────────────────────────────── */
  var state = {
    type: "IN",          // "IN" | "OUT"
    newRowId: null,      // id of just-recorded movement (for flash)
  };

  /* ── Populate product dropdown ───────────────────────────── */
  function populateDropdown() {
    var select = el("sm-product");
    var products = InvenTrack.getProducts().filter(function (p) { return p.active; });
    // Remove all options except first placeholder
    while (select.options.length > 1) select.remove(1);
    products.forEach(function (p) {
      var opt = new Option(p.name + " — " + p.stock + " " + p.unit, p.id);
      select.add(opt);
    });
  }

  /* ── Update stock preview chip ───────────────────────────── */
  function updateStockPreview() {
    var preview = el("sm-stock-preview");
    var productId = el("sm-product").value;
    if (!productId) { preview.innerHTML = ""; return; }

    var products = InvenTrack.getProducts();
    var p = products.find(function (x) { return x.id === productId; });
    if (!p) { preview.innerHTML = ""; return; }

    var level = p.stock <= 0 ? "critical" : (p.stock <= p.threshold ? "low" : "");
    var icon  = p.stock <= 0 ? "🔴" : (p.stock <= p.threshold ? "⚠️" : "📦");
    preview.innerHTML =
      '<span class="sm-stock-chip ' + level + '">' +
        icon + " Current stock: <strong>" + p.stock + " " + escHtml(p.unit) + "</strong>" +
      "</span>";
  }

  /* ── Qty hint ────────────────────────────────────────────── */
  function updateQtyHint() {
    var hint = el("sm-qty-hint");
    var productId = el("sm-product").value;
    var qty = parseInt(el("sm-qty").value, 10);
    if (!productId || !qty || qty <= 0 || state.type !== "OUT") { hint.textContent = ""; return; }
    var products = InvenTrack.getProducts();
    var p = products.find(function (x) { return x.id === productId; });
    if (!p) { hint.textContent = ""; return; }
    var after = p.stock - qty;
    hint.textContent = after < 0
      ? "⚠️ Exceeds current stock (" + p.stock + " " + p.unit + ")"
      : "Stock after: " + after + " " + p.unit;
    hint.style.color = after < 0 ? "#ef4444" : "#64748b";
  }

  /* ── Validate and toggle save button ────────────────────── */
  function validate() {
    var productId = el("sm-product").value;
    var qty = parseFloat(el("sm-qty").value);
    var valid = productId !== "" && !isNaN(qty) && qty > 0;
    el("sm-save").disabled = !valid;
    updateQtyHint();
  }

  /* ── Toggle IN / OUT ─────────────────────────────────────── */
  function setType(type) {
    state.type = type;
    var btnIn  = el("sm-btn-in");
    var btnOut = el("sm-btn-out");
    var save   = el("sm-save");

    btnIn.classList.toggle("active", type === "IN");
    btnOut.classList.toggle("active", type === "OUT");

    save.classList.toggle("in-mode",  type === "IN");
    save.classList.toggle("out-mode", type === "OUT");
    save.textContent = type === "IN" ? "📥 Record Stock In" : "📤 Record Stock Out";

    hideFeedback();
    updateQtyHint();
  }

  /* ── Show / hide feedback ────────────────────────────────── */
  function showFeedback(type, message, newStock, unit) {
    var feedback      = el("sm-feedback");
    var inner         = el("sm-feedback-inner");
    var icon          = el("sm-feedback-icon");
    var text          = el("sm-feedback-text");

    inner.className = "sm-feedback-inner " + type;
    icon.textContent = type === "success" ? "✅" : "❌";

    var extra = (type === "success" && newStock !== undefined)
      ? '<span class="sm-feedback-new-stock">Updated stock level: <strong>' +
          newStock + " " + escHtml(unit) + "</strong></span>"
      : "";

    text.innerHTML = escHtml(message) + extra;
    feedback.classList.add("visible");
  }

  function hideFeedback() {
    el("sm-feedback").classList.remove("visible");
  }

  /* ── Handle form submit ──────────────────────────────────── */
  function handleSave() {
    hideFeedback();

    var productId = el("sm-product").value;
    var qty       = parseFloat(el("sm-qty").value);
    var note      = el("sm-note").value.trim();

    var result = InvenTrack.recordMovement({
      productId: productId,
      type: state.type,
      qty: qty,
      note: note,
      user: "warehouse",
    });

    if (result && result.error) {
      showFeedback("error", result.error);
      return;
    }

    // Success
    var products = InvenTrack.getProducts();
    var p = products.find(function (x) { return x.id === productId; });
    var newStock = p ? p.stock : "?";
    var unit     = p ? p.unit  : "";

    var verb = state.type === "IN" ? "added" : "removed";
    showFeedback(
      "success",
      qty + " " + unit + " " + verb + " for " + (p ? p.name : "product") + ".",
      newStock,
      unit
    );

    state.newRowId = result.id;

    // Reset form
    el("sm-product").value = "";
    el("sm-qty").value = "";
    el("sm-note").value = "";
    el("sm-stock-preview").innerHTML = "";
    el("sm-qty-hint").textContent = "";
    el("sm-save").disabled = true;

    // Refresh dropdown options (stock changed) and table
    populateDropdown();
    renderMovements();

    // Auto-hide feedback after 6s
    setTimeout(hideFeedback, 6000);
  }

  /* ── Render movements table ──────────────────────────────── */
  function renderMovements() {
    var container = el("sm-movements-body");
    var movements = InvenTrack.getMovements().slice(0, 10);
    var products  = InvenTrack.getProducts();
    var countEl   = el("sm-mov-count");

    countEl.textContent = movements.length + " shown";

    if (movements.length === 0) {
      container.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-icon">📭</div>' +
          '<h3>No movements yet</h3>' +
          '<p>Record your first stock movement using the form.</p>' +
        '</div>';
      return;
    }

    var rows = movements.map(function (m) {
      var p = products.find(function (x) { return x.id === m.productId; });
      var productName = p ? escHtml(p.name) : "<em>Unknown product</em>";
      var unit        = p ? escHtml(p.unit) : "";
      var isNew       = m.id === state.newRowId;
      var typeClass   = m.type === "IN" ? "in" : "out";
      var noteHtml    = m.note
        ? '<span class="sm-note-cell" title="' + escHtml(m.note) + '">' + escHtml(m.note) + "</span>"
        : '<span class="text-muted" style="font-size:0.75rem;">—</span>';

      return (
        "<tr" + (isNew ? ' class="sm-row-new"' : "") + ">" +
          "<td>" + productName + "</td>" +
          '<td><span class="sm-type-pill ' + typeClass + '">' + m.type + "</span></td>" +
          '<td class="sm-qty-cell">' + m.qty + " " + unit + "</td>" +
          "<td>" + noteHtml + "</td>" +
          '<td class="sm-date-cell" title="' + formatDateFull(m.date) + '">' + formatDate(m.date) + "</td>" +
        "</tr>"
      );
    }).join("");

    container.innerHTML =
      '<div class="table-wrapper" style="border:none;box-shadow:none;">' +
        "<table>" +
          "<thead><tr>" +
            "<th>Product</th>" +
            "<th>Type</th>" +
            "<th>Qty</th>" +
            "<th>Note</th>" +
            "<th>Date</th>" +
          "</tr></thead>" +
          "<tbody>" + rows + "</tbody>" +
        "</table>" +
      "</div>";

    // Clear new-row marker so next render doesn't re-flash
    state.newRowId = null;
  }

  /* ── Wire everything up ──────────────────────────────────── */
  function init() {
    var root = document.getElementById("module-root");
    if (!root) { console.error("[StockMovement] #module-root not found"); return; }
    root.innerHTML = buildHTML();

    populateDropdown();
    renderMovements();

    // Type toggle
    el("sm-btn-in").addEventListener("click",  function () { setType("IN"); });
    el("sm-btn-out").addEventListener("click", function () { setType("OUT"); });

    // Form inputs → validate
    el("sm-product").addEventListener("change", function () {
      updateStockPreview();
      validate();
    });
    el("sm-qty").addEventListener("input", validate);

    // Save
    el("sm-save").addEventListener("click", handleSave);
  }

  // Run after DOM + data.js ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
