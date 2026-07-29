/**
 * InvenTrack — Shared Data Layer (localStorage)
 * ==============================================
 * Data contracts
 * --------------
 *   Product  : { id, name, category, unit, threshold, stock, active }
 *   Movement : { id, productId, type("IN"|"OUT"), qty, note, date, user }
 *
 * Public API
 * ----------
 *   getProducts()            → Product[]
 *   saveProduct(product)     → Product          (create or update)
 *   deactivateProduct(id)    → Product | null
 *   getMovements()           → Movement[]
 *   recordMovement(movement) → Movement | { error: string }
 *
 * Errors (recordMovement) — returned as objects, never thrown:
 *   { error: "..." }
 */

(function (global) {
  "use strict";

  /* ── Storage keys ────────────────────────────────────────── */
  const KEYS = {
    products:  "inventrack_products",
    movements: "inventrack_movements",
  };

  /* ── ID generator ────────────────────────────────────────── */
  function uid(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 7)
    );
  }

  /* ── LocalStorage helpers ────────────────────────────────── */
  function load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("[InvenTrack] Failed to load", key, e);
      return null;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("[InvenTrack] Failed to save", key, e);
    }
  }

  /* ── Seed data ───────────────────────────────────────────── */
  const SEED_PRODUCTS = [
    {
      id:        "prod_seed_001",
      name:      "Wireless Keyboard",
      category:  "Electronics",
      unit:      "pcs",
      threshold: 10,
      stock:     45,
      active:    true,
    },
    {
      id:        "prod_seed_002",
      name:      "A4 Copy Paper (Ream)",
      category:  "Office Supplies",
      unit:      "reams",
      threshold: 20,
      stock:     120,
      active:    true,
    },
    {
      id:        "prod_seed_003",
      name:      "Ballpoint Pens (Box)",
      category:  "Office Supplies",
      unit:      "boxes",
      threshold: 15,
      stock:     8,        // intentionally below threshold for demo
      active:    true,
    },
    {
      id:        "prod_seed_004",
      name:      "USB-C Hub",
      category:  "Electronics",
      unit:      "pcs",
      threshold: 5,
      stock:     22,
      active:    true,
    },
  ];

  const SEED_MOVEMENTS = [
    {
      id:        "mov_seed_001",
      productId: "prod_seed_001",
      type:      "IN",
      qty:       50,
      note:      "Initial stock receive from supplier",
      date:      "2026-07-15T09:00:00.000Z",
      user:      "admin",
    },
    {
      id:        "mov_seed_002",
      productId: "prod_seed_001",
      type:      "OUT",
      qty:       5,
      note:      "Issued to IT department",
      date:      "2026-07-20T14:30:00.000Z",
      user:      "admin",
    },
    {
      id:        "mov_seed_003",
      productId: "prod_seed_002",
      type:      "IN",
      qty:       120,
      note:      "Quarterly restock",
      date:      "2026-07-18T10:00:00.000Z",
      user:      "admin",
    },
    {
      id:        "mov_seed_004",
      productId: "prod_seed_003",
      type:      "IN",
      qty:       20,
      note:      "Ordered from stationery vendor",
      date:      "2026-07-10T08:45:00.000Z",
      user:      "admin",
    },
    {
      id:        "mov_seed_005",
      productId: "prod_seed_003",
      type:      "OUT",
      qty:       12,
      note:      "Distributed to all departments",
      date:      "2026-07-25T16:00:00.000Z",
      user:      "admin",
    },
    {
      id:        "mov_seed_006",
      productId: "prod_seed_004",
      type:      "IN",
      qty:       22,
      note:      "Initial procurement batch",
      date:      "2026-07-22T11:15:00.000Z",
      user:      "admin",
    },
  ];

  /* ── Initialization (seed once) ──────────────────────────── */
  function init() {
    if (!load(KEYS.products)) {
      save(KEYS.products, SEED_PRODUCTS);
    }
    if (!load(KEYS.movements)) {
      save(KEYS.movements, SEED_MOVEMENTS);
    }
  }

  /* ═══════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════ */

  /**
   * getProducts()
   * Returns all product records (active and inactive).
   * @returns {Product[]}
   */
  function getProducts() {
    return load(KEYS.products) || [];
  }

  /**
   * saveProduct(product)
   * Creates a new product (if no id) or updates an existing one.
   * Returns the saved product.
   * @param {object} product
   * @returns {Product}
   */
  function saveProduct(product) {
    const products = getProducts();

    if (!product.id) {
      // Create
      const newProduct = Object.assign(
        {
          id:       uid("prod"),
          active:   true,
          stock:    product.stock !== undefined ? Number(product.stock) : 0,
        },
        product
      );
      products.push(newProduct);
      save(KEYS.products, products);
      return newProduct;
    }

    // Update
    const idx = products.findIndex(function (p) { return p.id === product.id; });
    if (idx === -1) {
      // Not found — treat as create with given id
      const newProduct = Object.assign({ active: true }, product);
      products.push(newProduct);
      save(KEYS.products, products);
      return newProduct;
    }

    const updated = Object.assign({}, products[idx], product);
    products[idx] = updated;
    save(KEYS.products, products);
    return updated;
  }

  /**
   * deactivateProduct(id)
   * Soft-deletes a product by setting active = false.
   * Returns the updated product, or null if not found.
   * @param {string} id
   * @returns {Product|null}
   */
  function deactivateProduct(id) {
    const products = getProducts();
    const idx = products.findIndex(function (p) { return p.id === id; });
    if (idx === -1) return null;

    products[idx] = Object.assign({}, products[idx], { active: false });
    save(KEYS.products, products);
    return products[idx];
  }

  /**
   * getMovements()
   * Returns all stock movement records, newest first.
   * @returns {Movement[]}
   */
  function getMovements() {
    const movements = load(KEYS.movements) || [];
    return movements.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });
  }

  /**
   * recordMovement(movement)
   * Validates and records a stock movement.
   * On success: persists the movement, updates product.stock, returns Movement.
   * On failure: returns { error: "reason string" } — never throws.
   *
   * Validation rules:
   *   1. qty must be a positive number (> 0)
   *   2. productId must reference an active product
   *   3. OUT movements must not drop stock below 0
   *
   * @param {object} movement  { productId, type, qty, note, date?, user? }
   * @returns {Movement | { error: string }}
   */
  function recordMovement(movement) {
    /* 1 — qty validation */
    const qty = Number(movement.qty);
    if (!qty || qty <= 0) {
      return { error: "Quantity must be a positive number greater than 0." };
    }

    /* 2 — product existence */
    const products = getProducts();
    const productIdx = products.findIndex(function (p) {
      return p.id === movement.productId;
    });

    if (productIdx === -1) {
      return { error: "Product not found. Please select a valid product." };
    }

    const product = products[productIdx];

    if (!product.active) {
      return { error: "Cannot record movements for a deactivated product." };
    }

    /* 3 — OUT stock check */
    const type = (movement.type || "").toUpperCase();
    if (type !== "IN" && type !== "OUT") {
      return { error: 'Movement type must be "IN" or "OUT".' };
    }

    const currentStock = Number(product.stock) || 0;
    if (type === "OUT" && currentStock - qty < 0) {
      return {
        error:
          "Insufficient stock. Current stock: " +
          currentStock +
          " " +
          product.unit +
          ", requested: " +
          qty +
          " " +
          product.unit +
          ".",
      };
    }

    /* ── Persist movement ────────────────────────────────────── */
    const newMovement = {
      id:        uid("mov"),
      productId: movement.productId,
      type:      type,
      qty:       qty,
      note:      movement.note || "",
      date:      movement.date || new Date().toISOString(),
      user:      movement.user || "system",
    };

    const movements = load(KEYS.movements) || [];
    movements.push(newMovement);
    save(KEYS.movements, movements);

    /* ── Update product stock ────────────────────────────────── */
    const newStock =
      type === "IN" ? currentStock + qty : currentStock - qty;
    products[productIdx] = Object.assign({}, product, { stock: newStock });
    save(KEYS.products, products);

    return newMovement;
  }

  /* ── Expose on window.InvenTrack ─────────────────────────── */
  init();

  global.InvenTrack = {
    getProducts:       getProducts,
    saveProduct:       saveProduct,
    deactivateProduct: deactivateProduct,
    getMovements:      getMovements,
    recordMovement:    recordMovement,
  };

})(window);
