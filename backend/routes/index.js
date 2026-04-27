import { Router } from 'express';
import { register, login }              from '../controllers/authController.js';
import { getUsers, getUserById, updateUser, deleteUser, changePassword } from '../controllers/userController.js';
import { getOrders, getOrderById, createOrder, updateOrderStatus }       from '../controllers/orderController.js';
import {
  getProducts, getProductById, createProduct, updateProduct, deleteProduct,
  getCategories, getCategoryById, createCategory, updateCategory, deleteCategory,
  getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier,
  getWarehouses, getWarehouseById, createWarehouse, updateWarehouse, deleteWarehouse,
  getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer,
  getInventory, getLowStock, adjustInventory,
  getPaymentsByOrder, createPayment, updatePaymentStatus,
  getReturns, createReturn,
} from '../controllers/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// ── AUTH ──────────────────────────────────────────────────
router.post('/auth/register', register);
router.post('/auth/login',    login);

// ── USERS  (any authenticated user) ───────────────────
router.get   ('/users',              authenticate, getUsers);
router.get   ('/users/:id',          authenticate, getUserById);
router.put   ('/users/:id',          authenticate, authorize('Admin'), updateUser);
router.delete('/users/:id',          authenticate, authorize('Admin'), deleteUser);
router.put   ('/users/me/password',  authenticate, changePassword);

// ── CATEGORIES ────────────────────────────────────────────
router.get   ('/categories',     authenticate, getCategories);
router.get   ('/categories/:id', authenticate, getCategoryById);
router.post  ('/categories',     authenticate, authorize('Admin', 'Manager'), createCategory);
router.put   ('/categories/:id', authenticate, authorize('Admin', 'Manager'), updateCategory);
router.delete('/categories/:id', authenticate, authorize('Admin'),            deleteCategory);

// ── SUPPLIERS ─────────────────────────────────────────────
router.get   ('/suppliers',     authenticate, getSuppliers);
router.get   ('/suppliers/:id', authenticate, getSupplierById);
router.post  ('/suppliers',     authenticate, authorize('Admin', 'Manager'), createSupplier);
router.put   ('/suppliers/:id', authenticate, authorize('Admin', 'Manager'), updateSupplier);
router.delete('/suppliers/:id', authenticate, authorize('Admin'),            deleteSupplier);

// ── WAREHOUSES ────────────────────────────────────────────
router.get   ('/warehouses',     authenticate, getWarehouses);
router.get   ('/warehouses/:id', authenticate, getWarehouseById);
router.post  ('/warehouses',     authenticate, authorize('Admin', 'Manager'), createWarehouse);
router.put   ('/warehouses/:id', authenticate, authorize('Admin', 'Manager'), updateWarehouse);
router.delete('/warehouses/:id', authenticate, authorize('Admin'),            deleteWarehouse);

// ── PRODUCTS ──────────────────────────────────────────────
router.get   ('/products',     authenticate, getProducts);
router.get   ('/products/:id', authenticate, getProductById);
router.post  ('/products',     authenticate, authorize('Admin', 'Manager'), createProduct);
router.put   ('/products/:id', authenticate, authorize('Admin', 'Manager'), updateProduct);
router.delete('/products/:id', authenticate, authorize('Admin'),            deleteProduct);

// ── CUSTOMERS ─────────────────────────────────────────────
router.get   ('/customers',     authenticate, getCustomers);
router.get   ('/customers/:id', authenticate, getCustomerById);
router.post  ('/customers',     authenticate, createCustomer);
router.put   ('/customers/:id', authenticate, updateCustomer);
router.delete('/customers/:id', authenticate, authorize('Admin', 'Manager'), deleteCustomer);

// ── INVENTORY ─────────────────────────────────────────────
router.get ('/inventory',         authenticate, getInventory);
router.get ('/inventory/lowstock',authenticate, getLowStock);
router.post('/inventory/adjust',  authenticate, authorize('Admin', 'Manager'), adjustInventory);

// ── ORDERS ────────────────────────────────────────────────
router.get ('/orders',           authenticate, getOrders);
router.get ('/orders/:id',       authenticate, getOrderById);
router.post('/orders',           authenticate, createOrder);
router.put ('/orders/:id/status',authenticate, authorize('Admin', 'Manager'), updateOrderStatus);
router.patch('/orders/:id/status', authenticate, updateOrderStatus);

// ── PAYMENTS ──────────────────────────────────────────────
router.get('/orders/:orderId/payments', authenticate, getPaymentsByOrder);
router.get('/payments', authenticate, getPaymentsByOrder); // Get all payments
router.post('/payments',                authenticate, createPayment);
router.put ('/payments/:id/status',     authenticate, authorize('Admin', 'Manager'), updatePaymentStatus);

// ── RETURNS ───────────────────────────────────────────────
router.get ('/returns', authenticate, getReturns);
router.post('/returns', authenticate, createReturn);

export default router;