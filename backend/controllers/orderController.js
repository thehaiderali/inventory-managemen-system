import Order from '../models/Order.js';

export const getOrders = async (req, res) => {
  try {
    const { status, customerId } = req.query;
    res.json(await Order.findAll({ status, customerId }));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createOrder = async (req, res) => {
  try {
    const order = await Order.create({ ...req.body, createdByUserId: req.user.userId });
    res.status(201).json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.updateStatus(req.params.id, req.body.status);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
};