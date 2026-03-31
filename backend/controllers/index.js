import Product from '../models/Product.js';
import { connectDB, sql } from '../config/db.js';
import { Category, Supplier, Warehouse, Customer, Inventory, Payment, Return } from '../models/index.js';

// ── PRODUCTS ──────────────────────────────────────────────
export const getProducts = async (req, res) => {
  try {
    const { categoryId, supplierId, isActive } = req.query;
    const products = await Product.findAll({ categoryId, supplierId, isActive });
    res.json(products);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.update(req.params.id, req.body);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteProduct = async (req, res) => {
  try {
    await Product.delete(req.params.id);
    res.json({ message: 'Product deactivated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── CATEGORIES ────────────────────────────────────────────
export const getCategories    = async (req, res) => { try { res.json(await Category.findAll()); } catch (err) { res.status(500).json({ message: err.message }); } };
export const getCategoryById  = async (req, res) => { try { const c = await Category.findById(req.params.id); if (!c) return res.status(404).json({ message: 'Not found' }); res.json(c); } catch (err) { res.status(500).json({ message: err.message }); } };
export const createCategory   = async (req, res) => { try { res.status(201).json(await Category.create(req.body)); } catch (err) { res.status(500).json({ message: err.message }); } };
export const updateCategory   = async (req, res) => { try { res.json(await Category.update(req.params.id, req.body)); } catch (err) { res.status(500).json({ message: err.message }); } };
export const deleteCategory   = async (req, res) => { try { await Category.delete(req.params.id); res.json({ message: 'Deleted' }); } catch (err) { res.status(500).json({ message: err.message }); } };

// ── SUPPLIERS ─────────────────────────────────────────────
export const getSuppliers    = async (req, res) => { try { res.json(await Supplier.findAll()); } catch (err) { res.status(500).json({ message: err.message }); } };
export const getSupplierById = async (req, res) => { try { const s = await Supplier.findById(req.params.id); if (!s) return res.status(404).json({ message: 'Not found' }); res.json(s); } catch (err) { res.status(500).json({ message: err.message }); } };
export const createSupplier  = async (req, res) => { try { res.status(201).json(await Supplier.create(req.body)); } catch (err) { res.status(500).json({ message: err.message }); } };
export const updateSupplier  = async (req, res) => { try { res.json(await Supplier.update(req.params.id, req.body)); } catch (err) { res.status(500).json({ message: err.message }); } };
export const deleteSupplier  = async (req, res) => { try { await Supplier.delete(req.params.id); res.json({ message: 'Deleted' }); } catch (err) { res.status(500).json({ message: err.message }); } };

// ── WAREHOUSES ────────────────────────────────────────────
export const getWarehouses    = async (req, res) => { try { res.json(await Warehouse.findAll()); } catch (err) { res.status(500).json({ message: err.message }); } };
export const getWarehouseById = async (req, res) => { try { const w = await Warehouse.findById(req.params.id); if (!w) return res.status(404).json({ message: 'Not found' }); res.json(w); } catch (err) { res.status(500).json({ message: err.message }); } };
export const createWarehouse  = async (req, res) => { try { res.status(201).json(await Warehouse.create(req.body)); } catch (err) { res.status(500).json({ message: err.message }); } };
export const updateWarehouse  = async (req, res) => { try { res.json(await Warehouse.update(req.params.id, req.body)); } catch (err) { res.status(500).json({ message: err.message }); } };
export const deleteWarehouse  = async (req, res) => { try { await Warehouse.delete(req.params.id); res.json({ message: 'Deleted' }); } catch (err) { res.status(500).json({ message: err.message }); } };

// ── CUSTOMERS ─────────────────────────────────────────────
export const getCustomers    = async (req, res) => { try { res.json(await Customer.findAll()); } catch (err) { res.status(500).json({ message: err.message }); } };
export const getCustomerById = async (req, res) => { try { const c = await Customer.findById(req.params.id); if (!c) return res.status(404).json({ message: 'Not found' }); res.json(c); } catch (err) { res.status(500).json({ message: err.message }); } };
export const createCustomer  = async (req, res) => { try { res.status(201).json(await Customer.create(req.body)); } catch (err) { res.status(500).json({ message: err.message }); } };
export const updateCustomer  = async (req, res) => { try { res.json(await Customer.update(req.params.id, req.body)); } catch (err) { res.status(500).json({ message: err.message }); } };
export const deleteCustomer  = async (req, res) => { try { await Customer.delete(req.params.id); res.json({ message: 'Deleted' }); } catch (err) { res.status(500).json({ message: err.message }); } };

// ── INVENTORY ─────────────────────────────────────────────
export const getInventory = async (req, res) => {
  try { res.json(await Inventory.findAll()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

export const getLowStock = async (req, res) => {
  try { res.json(await Inventory.findLowStock()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

export const adjustInventory = async (req, res) => {
  try {
    const { productId, warehouseId, quantity, type, referenceId } = req.body;
    await Inventory.adjust({ productId, warehouseId, quantity, type, referenceId, createdByUserId: req.user.userId });
    res.json({ message: 'Inventory adjusted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── PAYMENTS ──────────────────────────────────────────────
export const getPaymentsByOrder = async (req, res) => {
  try { res.json(await Payment.findByOrder(req.params.orderId)); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

export const createPayment = async (req, res) => {
  try { res.status(201).json(await Payment.create(req.body)); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

export const updatePaymentStatus = async (req, res) => {
  try { res.json(await Payment.updateStatus(req.params.id, req.body.status)); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

// ── RETURNS ───────────────────────────────────────────────
export const getReturns = async (req, res) => {
  try { res.json(await Return.findAll()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

export const createReturn = async (req, res) => {
  try {
    const { orderId, productId, quantity, reason, refundAmount } = req.body;
    
    const pool = await connectDB();
    const orderItemResult = await pool.request()
      .input('OrderID', sql.Int, orderId)
      .input('ProductID', sql.Int, productId)
      .query(`SELECT OrderItemID FROM OrderItems WHERE OrderID = @OrderID AND ProductID = @ProductID`);
    
    if (!orderItemResult.recordset[0]) {
      return res.status(404).json({ message: 'Order item not found' });
    }
    
    const orderItemId = orderItemResult.recordset[0].OrderItemID;
    
    const returnData = await Return.create({
      orderItemId,
      quantity,
      reason,
      refundAmount
    });
    
    res.status(201).json(returnData);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};