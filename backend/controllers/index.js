import Product from '../models/Product.js';
import { connectDB, sql } from '../config/db.js';
import { Category, Supplier, Warehouse, Customer, Inventory, Payment, Return } from '../models/index.js';

// ── HELPERS ───────────────────────────────────────────────
const paginate = (query) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(100, parseInt(query.limit) || 20);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const stripSensitive = (obj, fields = ['PasswordHash', 'password', '__v']) => {
  if (!obj) return obj;
  const clean = { ...obj };
  fields.forEach(f => delete clean[f]);
  return clean;
};

const validateRequired = (body, fields) => {
  const missing = fields.filter(f => body[f] === undefined || body[f] === null || body[f] === '');
  return missing.length ? missing : null;
};

const LOW_STOCK_THRESHOLD = 10;

// ── PRODUCTS ──────────────────────────────────────────────
export const getProducts = async (req, res) => {
  try {
    const { categoryId, supplierId, isActive, search } = req.query;
    const { page, limit, offset } = paginate(req.query);

    const products = await Product.findAll({ categoryId, supplierId, isActive, search, limit, offset });
    const shaped = products.map(p => ({
      ...stripSensitive(p),
      totalValue: parseFloat(((p.Price || 0) * (p.StockQuantity || 0)).toFixed(2))
    }));

    res.json({ page, limit, total: shaped.length, data: shaped });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(stripSensitive(product));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createProduct = async (req, res) => {
  try {
    // Map frontend field names to database field names
    const productData = {
      ProductName: req.body.name || req.body.ProductName,
      SKU: req.body.sku || req.body.SKU,
      CategoryID: req.body.categoryId || req.body.CategoryID,
      SupplierID: req.body.supplierId || req.body.SupplierID,
      CostPrice: req.body.costPrice || req.body.CostPrice,
      SellingPrice: req.body.price || req.body.SellingPrice
    };

    const missing = validateRequired(productData, ['ProductName', 'SKU', 'CategoryID', 'SupplierID', 'CostPrice', 'SellingPrice']);
    if (missing) return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    
    if (productData.SellingPrice < 0) return res.status(400).json({ message: 'Price cannot be negative' });
    if ((productData.CostPrice ?? 0) < 0) return res.status(400).json({ message: 'Cost cannot be negative' });

    const product = await Product.create(productData);
    res.status(201).json(stripSensitive(product));
  } catch (err) { 
    console.error('Create product error:', err);
    res.status(500).json({ message: err.message }); 
  }
};

export const updateProduct = async (req, res) => {
  try {
    if (req.body.price !== undefined && req.body.price < 0)
      return res.status(400).json({ message: 'Price cannot be negative' });

    const product = await Product.update(req.params.id, req.body);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(stripSensitive(product));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteProduct = async (req, res) => {
  try {
    await Product.delete(req.params.id, {
      deletedByUserId: req.user?.userId,
      deletedAt: new Date().toISOString()
    });
    res.json({ message: 'Product deactivated', deletedBy: req.user?.userId, deletedAt: new Date().toISOString() });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
export const bulkCreateProducts = async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0)
      return res.status(400).json({ message: 'products must be a non-empty array' });
    if (products.length > 100)
      return res.status(400).json({ message: 'Bulk limit is 100 products per request' });

    const results = { created: [], failed: [] };

    for (const [i, p] of products.entries()) {
      const missing = validateRequired(p, ['name', 'price', 'categoryId', 'supplierId']);
      if (missing) { results.failed.push({ index: i, reason: `Missing: ${missing.join(', ')}` }); continue; }
      if (p.price < 0) { results.failed.push({ index: i, reason: 'Negative price' }); continue; }
      try {
        const created = await Product.create(p);
        results.created.push(stripSensitive(created));
      } catch (e) {
        results.failed.push({ index: i, reason: e.message });
      }
    }

    res.status(207).json({ message: 'Bulk create complete', ...results });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
export const bulkUpdateProducts = async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0)
      return res.status(400).json({ message: 'products must be a non-empty array' });

    const results = { updated: [], failed: [] };

    for (const p of products) {
      if (!p.id) { results.failed.push({ item: p, reason: 'Missing id' }); continue; }
      try {
        const updated = await Product.update(p.id, p);
        if (!updated) { results.failed.push({ id: p.id, reason: 'Not found' }); continue; }
        results.updated.push(stripSensitive(updated));
      } catch (e) {
        results.failed.push({ id: p.id, reason: e.message });
      }
    }

    res.status(207).json({ message: 'Bulk update complete', ...results });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── CATEGORIES ────────────────────────────────────────────
export const getCategories = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const data = await Category.findAll({ limit, offset });
    res.json({ page, limit, total: data.length, data });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getCategoryById  = async (req, res) => { try { const c = await Category.findById(req.params.id); if (!c) return res.status(404).json({ message: 'Not found' }); res.json(c); } catch (err) { res.status(500).json({ message: err.message }); } };

export const createCategory = async (req, res) => {
  try {
    console.log("Request Body : ",req.body)
    const missing = validateRequired(req.body, ['categoryName']);
    if (missing) return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    res.status(201).json(await Category.create(req.body));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateCategory   = async (req, res) => { try { res.json(await Category.update(req.params.id, req.body)); } catch (err) { res.status(500).json({ message: err.message }); } };

export const deleteCategory = async (req, res) => {
  try {
    await Category.delete(req.params.id, { deletedByUserId: req.user?.userId, deletedAt: new Date().toISOString() });
    res.json({ message: 'Deleted', deletedBy: req.user?.userId });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── SUPPLIERS ─────────────────────────────────────────────
export const getSuppliers = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { search } = req.query;
    const data = await Supplier.findAll({ limit, offset, search });
    res.json({ page, limit, total: data.length, data });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getSupplierById = async (req, res) => { try { const s = await Supplier.findById(req.params.id); if (!s) return res.status(404).json({ message: 'Not found' }); res.json(s); } catch (err) { res.status(500).json({ message: err.message }); } };

export const createSupplier = async (req, res) => {
  try {
    const missing = validateRequired(req.body, ['name', 'contactEmail']);
    if (missing) return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.contactEmail))
      return res.status(400).json({ message: 'Invalid contact email format' });

    res.status(201).json(await Supplier.create(req.body));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateSupplier  = async (req, res) => { try { res.json(await Supplier.update(req.params.id, req.body)); } catch (err) { res.status(500).json({ message: err.message }); } };

export const deleteSupplier = async (req, res) => {
  try {
    await Supplier.delete(req.params.id, { deletedByUserId: req.user?.userId, deletedAt: new Date().toISOString() });
    res.json({ message: 'Deleted', deletedBy: req.user?.userId });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── WAREHOUSES ────────────────────────────────────────────
export const getWarehouses = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const data = await Warehouse.findAll({ limit, offset });
    res.json({ page, limit, total: data.length, data });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getWarehouseById = async (req, res) => { try { const w = await Warehouse.findById(req.params.id); if (!w) return res.status(404).json({ message: 'Not found' }); res.json(w); } catch (err) { res.status(500).json({ message: err.message }); } };

export const createWarehouse = async (req, res) => {
  try {
    const missing = validateRequired(req.body, ['name', 'location']);
    if (missing) return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    res.status(201).json(await Warehouse.create(req.body));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateWarehouse  = async (req, res) => { try { res.json(await Warehouse.update(req.params.id, req.body)); } catch (err) { res.status(500).json({ message: err.message }); } };

export const deleteWarehouse = async (req, res) => {
  try {
    await Warehouse.delete(req.params.id, { deletedByUserId: req.user?.userId, deletedAt: new Date().toISOString() });
    res.json({ message: 'Deleted', deletedBy: req.user?.userId });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── CUSTOMERS ─────────────────────────────────────────────
export const getCustomers = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { search } = req.query;
    const data = await Customer.findAll({ limit, offset, search });
    // NEW: strip any sensitive fields from customer list
    res.json({ page, limit, total: data.length, data: data.map(c => stripSensitive(c)) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getCustomerById = async (req, res) => {
  try {
    const c = await Customer.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Not found' });
    res.json(stripSensitive(c));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createCustomer = async (req, res) => {
  try {
    const missing = validateRequired(req.body, ['name', 'email']);
    if (missing) return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email))
      return res.status(400).json({ message: 'Invalid email format' });

    res.status(201).json(stripSensitive(await Customer.create(req.body)));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateCustomer  = async (req, res) => { try { res.json(stripSensitive(await Customer.update(req.params.id, req.body))); } catch (err) { res.status(500).json({ message: err.message }); } };

export const deleteCustomer = async (req, res) => {
  try {
    await Customer.delete(req.params.id, { deletedByUserId: req.user?.userId, deletedAt: new Date().toISOString() });
    res.json({ message: 'Deleted', deletedBy: req.user?.userId });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── INVENTORY ─────────────────────────────────────────────
export const getInventory = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const items = await Inventory.findAll({ limit, offset });
    const shaped = items.map(i => ({
      ...i,
      totalValue: parseFloat(((i.Price || 0) * (i.QuantityOnHand || 0)).toFixed(2)),
      isLowStock: (i.QuantityOnHand || 0) <= LOW_STOCK_THRESHOLD
    }));

    res.json({ page, limit, total: shaped.length, data: shaped });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getLowStock = async (req, res) => {
  try {
    const items = await Inventory.findLowStock();
    const shaped = items.map(i => ({
      ...i,
      totalValue: parseFloat(((i.Price || 0) * (i.QuantityOnHand || 0)).toFixed(2)),
      isLowStock: true,
      deficit: Math.max(0, LOW_STOCK_THRESHOLD - (i.QuantityOnHand || 0))
    }));
    res.json({ total: shaped.length, threshold: LOW_STOCK_THRESHOLD, data: shaped });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const adjustInventory = async (req, res) => {
  try {
    const { productId, warehouseId, quantity, type, referenceId } = req.body;
    const missing = validateRequired(req.body, ['productId', 'warehouseId', 'quantity', 'type']);
    if (missing) return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    if (type === 'Transfer' || type === 'TRANSFER') {
      if (typeof quantity !== 'number' || quantity === 0)
        return res.status(400).json({ message: 'Quantity cannot be zero' });
    } else {
      if (typeof quantity !== 'number' || quantity <= 0)
        return res.status(400).json({ message: 'Quantity must be a positive number' });
    }
    const allowedTypes = ['IN', 'OUT', 'ADJUSTMENT', 'RETURN', 'TRANSFER','Purchase', 'Sale', 'Return', 'Adjustment', 'Transfer'];
    if (!allowedTypes.includes(type))
      return res.status(400).json({ message: `Type must be one of: ${allowedTypes.join(', ')}` });

    await Inventory.adjust({ productId, warehouseId, quantity, type, referenceId, createdByUserId: req.user.userId });
    
    res.json({ message: 'Inventory adjusted successfully' });
  } catch (err) { 
    console.error('Adjust inventory error:', err);
    res.status(500).json({ message: err.message }); 
  }
};
export const bulkAdjustInventory = async (req, res) => {
  try {
    const { adjustments } = req.body;
    if (!Array.isArray(adjustments) || adjustments.length === 0)
      return res.status(400).json({ message: 'adjustments must be a non-empty array' });
    if (adjustments.length > 50)
      return res.status(400).json({ message: 'Bulk limit is 50 adjustments per request' });

    const allowedTypes = ['IN', 'OUT', 'ADJUSTMENT', 'RETURN', 'TRANSFER'];
    const results = { succeeded: [], failed: [], alerts: [] };

    for (const [i, adj] of adjustments.entries()) {
      const missing = validateRequired(adj, ['productId', 'warehouseId', 'quantity', 'type']);
      if (missing)        { results.failed.push({ index: i, reason: `Missing: ${missing.join(', ')}` }); continue; }
      if (adj.quantity <= 0)                    { results.failed.push({ index: i, reason: 'Quantity must be positive' }); continue; }
      if (!allowedTypes.includes(adj.type))     { results.failed.push({ index: i, reason: `Invalid type: ${adj.type}` }); continue; }

      try {
        await Inventory.adjust({ ...adj, createdByUserId: req.user.userId });
        results.succeeded.push({ index: i, productId: adj.productId });
        const stock = await Inventory.getStockLevel(adj.productId, adj.warehouseId);
        if (stock !== null && stock <= LOW_STOCK_THRESHOLD)
          results.alerts.push({ productId: adj.productId, warehouseId: adj.warehouseId, currentStock: stock });
      } catch (e) {
        results.failed.push({ index: i, reason: e.message });
      }
    }

    res.status(207).json({ message: 'Bulk adjustment complete', ...results });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── PAYMENTS ──────────────────────────────────────────────
export const getPaymentsByOrder = async (req, res) => {
  try {
    const payments = await Payment.findByOrder(req.params.orderId);
    const totalPaid = payments.reduce((sum, p) => sum + (p.Amount || 0), 0);

    res.json({ orderId: req.params.orderId, totalPaid: parseFloat(totalPaid.toFixed(2)), data: payments });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createPayment = async (req, res) => {
  try {
    const missing = validateRequired(req.body, ['orderId', 'amount', 'method']);
    if (missing) return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });

    if (req.body.amount <= 0)
      return res.status(400).json({ message: 'Payment amount must be positive' });
    const allowedMethods = ['cash', 'card', 'bank_transfer', 'online', 'cheque'];
    if (!allowedMethods.includes(req.body.method))
      return res.status(400).json({ message: `Method must be one of: ${allowedMethods.join(', ')}` });

    res.status(201).json(await Payment.create(req.body));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const allowedStatuses = ['pending', 'completed', 'failed', 'refunded', 'cancelled'];
    if (!allowedStatuses.includes(req.body.status))
      return res.status(400).json({ message: `Status must be one of: ${allowedStatuses.join(', ')}` });

    res.json(await Payment.updateStatus(req.params.id, req.body.status));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── RETURNS ───────────────────────────────────────────────
export const getReturns = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const data = await Return.findAll({ limit, offset });
    res.json({ page, limit, total: data.length, data });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createReturn = async (req, res) => {
  try {
    const { orderId, productId, quantity, reason, refundAmount } = req.body;
    const missing = validateRequired(req.body, ['orderId', 'productId', 'quantity', 'reason']);
    if (missing) return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });

    if (quantity <= 0)
      return res.status(400).json({ message: 'Return quantity must be positive' });

    if (refundAmount !== undefined && refundAmount < 0)
      return res.status(400).json({ message: 'Refund amount cannot be negative' });

    const pool = await connectDB();
    const orderItemResult = await pool.request()
      .input('OrderID', sql.Int, orderId)
      .input('ProductID', sql.Int, productId)
      .query(`SELECT OrderItemID, Quantity FROM OrderItems WHERE OrderID = @OrderID AND ProductID = @ProductID`);

    if (!orderItemResult.recordset[0])
      return res.status(404).json({ message: 'Order item not found' });

    const { OrderItemID: orderItemId, Quantity: originalQty } = orderItemResult.recordset[0];
    const existingReturnsResult = await pool.request()
      .input('OrderItemID', sql.Int, orderItemId)
      .query(`SELECT COALESCE(SUM(Quantity), 0) AS TotalReturned FROM Returns WHERE OrderItemID = @OrderItemID`);

    const alreadyReturned = existingReturnsResult.recordset[0]?.TotalReturned || 0;
    const remainingReturnable = originalQty - alreadyReturned;

    if (quantity > remainingReturnable)
      return res.status(400).json({
        message: `Return quantity (${quantity}) exceeds returnable amount (${remainingReturnable})`,
        originalQty,
        alreadyReturned,
        remainingReturnable
      });

    const returnData = await Return.create({ orderItemId, quantity, reason, refundAmount });
    Inventory.adjust({
      productId,
      warehouseId: null,
      quantity,
      type: 'RETURN',
      referenceId: returnData.ReturnID,
      createdByUserId: req.user?.userId
    }).catch(e => console.error('[return inventory adjust failed]', e.message));

    res.status(201).json({
      ...returnData,
      remainingReturnable: remainingReturnable - quantity
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
