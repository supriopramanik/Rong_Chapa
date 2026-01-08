import { validationResult } from 'express-validator';
import PDFDocument from 'pdfkit';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { signToken } from '../utils/token.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';

const DELIVERY_RATES = {
  dhaka: 60,
  outside: 110
};

const resolveDeliveryCharge = (zone) => {
  if (!zone || !DELIVERY_RATES[zone]) {
    return { zone: 'dhaka', charge: DELIVERY_RATES.dhaka };
  }
  return { zone, charge: DELIVERY_RATES[zone] };
};

const buildAuthResponse = (user, token) => ({
  token,
  user: {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    organization: user.organization,
    address: user.address
  }
});

const formatCurrency = (value) => {
  if (typeof value !== 'number') {
    return 'N/A';
  }
  return `Tk ${value.toFixed(2)}`;
};

export const createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { accountPassword, ...orderData } = req.body;

  if (!orderData.shippingAddress) {
    return res.status(422).json({ message: 'Delivery address is required.' });
  }

  const { zone: normalizedZone, charge } = resolveDeliveryCharge(orderData.deliveryZone);
  orderData.deliveryZone = normalizedZone;
  orderData.deliveryCharge = charge;

  const product = await Product.findById(orderData.product);
  if (!product) {
    return res.status(404).json({ message: 'Selected product could not be found.' });
  }

  const productTotal = Number(product.basePrice || 0) * Number(orderData.quantity || 1);
  const orderTotal = Number((productTotal + charge).toFixed(2));
  const invoiceNumber = `INV-${Date.now()}`;

  orderData.billing = {
    number: invoiceNumber,
    amount: orderTotal,
    generatedAt: new Date()
  };

  let orderUserId = req.user?.id;
  let accountPayload = null;

  if (!orderUserId) {
    if (!orderData.customerEmail) {
      return res.status(422).json({ message: 'Email is required to create an account with your order.' });
    }
    if (!accountPassword) {
      return res.status(422).json({ message: 'Password is required to create your account.' });
    }

    const existingUser = await User.findOne({ email: orderData.customerEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists. Please sign in to continue.' });
    }

    const user = await User.create({
      name: orderData.customerName,
      email: orderData.customerEmail,
      password: accountPassword,
      phone: orderData.customerPhone,
      address: orderData.shippingAddress,
      role: 'customer',
      lastLoginAt: new Date()
    });

    orderUserId = user._id;
    const token = signToken({ id: user._id, role: user.role, email: user.email });
    accountPayload = buildAuthResponse(sanitizeUser(user), token);
  }

  const order = await Order.create({
    ...orderData,
    user: orderUserId || undefined
  });

  res.status(201).json({ message: 'Order created', order, account: accountPayload });
};

export const listOrders = async (req, res) => {
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .populate('product', 'name')
    .populate('user', 'name email phone')
    .populate('cancelRequest.resolvedBy', 'name email');
  res.status(200).json({ orders });
};

export const listMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate('product', 'name slug')
    .populate('cancelRequest.resolvedBy', 'name email');
  res.status(200).json({ orders });
};

export const requestOrderCancellation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { id } = req.params;
  const { reason } = req.body;

  const order = await Order.findOne({ _id: id, user: req.user.id }).populate('product', 'name slug');
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  if (order.status === 'completed' || order.status === 'cancelled') {
    return res.status(409).json({ message: 'This order can no longer be cancelled.' });
  }

  if (order.cancelRequest?.status === 'pending') {
    return res.status(409).json({ message: 'A cancellation request is already pending review.' });
  }

  order.cancelRequest = {
    status: 'pending',
    reason: reason.trim(),
    requestedAt: new Date()
  };

  await order.save();

  res.status(200).json({ message: 'Cancellation request submitted.', order });
};

export const reviewOrderCancellation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { id } = req.params;
  const { action, adminNote } = req.body;

  const order = await Order.findById(id)
    .populate('product', 'name')
    .populate('user', 'name email phone');

  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  if (order.cancelRequest?.status !== 'pending') {
    return res.status(409).json({ message: 'This order does not have a pending cancellation request.' });
  }

  const isApproval = action === 'approve';

  order.cancelRequest.status = isApproval ? 'approved' : 'declined';
  order.cancelRequest.resolvedAt = new Date();
  order.cancelRequest.resolvedBy = req.user.id;
  order.cancelRequest.adminNote = adminNote?.trim() || '';

  if (isApproval) {
    order.status = 'cancelled';
  }

  await order.save();
  await order.populate('cancelRequest.resolvedBy', 'name email');

  res.status(200).json({
    message: isApproval ? 'Order cancelled successfully.' : 'Cancellation request declined.',
    order
  });
};

export const updateOrderStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { id } = req.params;
  const { status } = req.body;

  const order = await Order.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  )
    .populate('product', 'name')
    .populate('user', 'name email phone');

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.status(200).json({ message: 'Order status updated', order });
};

export const updateOrderBilling = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { id } = req.params;
  const { billingNumber, billingAmount, billingNotes } = req.body;

  const billingPayload = {
    generatedAt: new Date()
  };

  if (billingAmount !== undefined) {
    const numericAmount = typeof billingAmount === 'number' ? billingAmount : Number(billingAmount);
    if (!Number.isNaN(numericAmount)) {
      billingPayload.amount = numericAmount;
    }
  }
  if (billingNumber !== undefined) {
    billingPayload.number = billingNumber;
  }
  if (billingNotes !== undefined) {
    billingPayload.notes = billingNotes;
  }

  const order = await Order.findByIdAndUpdate(
    id,
    { billing: billingPayload },
    { new: true }
  )
    .populate('product', 'name')
    .populate('user', 'name email phone');

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.status(200).json({ message: 'Billing details saved', order });
};

export const downloadOrderInvoice = async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate('product', 'name price sku')
    .populate('user', 'name email phone');

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const fileName = `invoice-${order.billing?.number || order._id}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  doc.pipe(res);

  doc.fontSize(20).text('Rong Chapa Invoice', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Invoice #: ${order.billing?.number || order._id}`);
  doc.text(`Generated: ${new Date(order.billing?.generatedAt || order.updatedAt).toLocaleDateString()}`);
  doc.text(`Status: ${order.status}`);
  doc.moveDown();

  doc.font('Helvetica-Bold').text('Customer');
  doc.font('Helvetica').text(`Name: ${order.customerName}`);
  doc.text(`Email: ${order.customerEmail || 'N/A'}`);
  doc.text(`Phone: ${order.customerPhone || 'N/A'}`);
  doc.moveDown();

  doc.font('Helvetica-Bold').text('Order');
  doc.font('Helvetica').text(`Product: ${order.product?.name || 'Custom Item'}`);
  doc.text(`Quantity: ${order.quantity}`);
  if (order.size) {
    doc.text(`Size: ${order.size}`);
  }
  if (order.paperType) {
    doc.text(`Paper: ${order.paperType}`);
  }
  if (order.notes) {
    doc.text(`Notes: ${order.notes}`);
  }
  doc.moveDown();

  doc.font('Helvetica-Bold').text('Delivery');
  doc.font('Helvetica').text(`Address: ${order.shippingAddress}`);
  doc.text(`Zone: ${order.deliveryZone}`);
  doc.text(`Charge: ${formatCurrency(order.deliveryCharge)}`);
  doc.moveDown();

  doc.font('Helvetica-Bold').text('Billing');
  doc.font('Helvetica').text(`Amount: ${formatCurrency(order.billing?.amount)}`);
  doc.text(`Notes: ${order.billing?.notes || 'N/A'}`);
  doc.moveDown();

  doc.text('Thank you for choosing Rong Chapa!', { align: 'center' });

  doc.end();
};
