import Order from '../models/Order.js';

// Add paginate function
const paginate = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, parseInt(query.limit) || 20);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

export const getOrders = async (req, res) => {
  try {
    const { status, customerId } = req.query;
    
    const orders = await Order.findAll({ status, customerId });
    
    // Make sure orders is an array
    const ordersArray = Array.isArray(orders) ? orders : [];
    const sortedOrders = ordersArray.sort((a, b) => a.OrderID - b.OrderID);
    
    res.json({ 
      page: 1, 
      limit: sortedOrders.length, 
      total: sortedOrders.length, 
      data: sortedOrders 
    });
  } catch (err) { 
    console.error('Get orders error:', err);
    res.status(500).json({ message: err.message }); 
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

export const createOrder = async (req, res) => {
  try {
    const order = await Order.create({ ...req.body, createdByUserId: req.user.userId });
    res.status(201).json(order);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.updateStatus(req.params.id, req.body.status);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};