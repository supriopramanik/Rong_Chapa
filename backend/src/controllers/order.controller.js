import { validationResult } from 'express-validator';
import PDFDocument from 'pdfkit';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { signToken } from '../utils/token.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';

const DELIVERY_RATES = {
  dhaka: 60,
  Outside: 110
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

  const { accountPassword, invoiceNumber, batchId, billingAmount, ...orderData } = req.body;

  if (!orderData.shippingAddress) {
    return res.status(422).json({ message: 'Delivery address is required.' });
  }

  const { zone: normalizedZone, charge } = resolveDeliveryCharge(orderData.deliveryZone);
  orderData.deliveryZone = normalizedZone;
  orderData.deliveryCharge = typeof orderData.deliveryCharge === 'number' ? orderData.deliveryCharge : charge;

  const product = await Product.findById(orderData.product);
  if (!product) {
    return res.status(404).json({ message: 'Selected product could not be found.' });
  }

  const productTotal = Number(product.basePrice || 0) * Number(orderData.quantity || 1);
  const orderTotal = Number((productTotal + (orderData.deliveryCharge || 0)).toFixed(2));
  const resolvedInvoiceNumber = invoiceNumber || `INV-${Date.now()}`;
  const resolvedBatchId = batchId || resolvedInvoiceNumber;
  const providedBillingAmount = typeof billingAmount === 'number' && !Number.isNaN(billingAmount) ? billingAmount : undefined;

  orderData.billing = {
    number: resolvedInvoiceNumber,
    amount: providedBillingAmount !== undefined ? providedBillingAmount : orderTotal,
    generatedAt: new Date()
  };
  orderData.batchId = resolvedBatchId;

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
    .populate('product', 'name imageUrl basePrice')
    .populate('user', 'name email phone')
    .populate('cancelRequest.resolvedBy', 'name email');
  res.status(200).json({ orders });
};

export const listMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate('product', 'name slug imageUrl basePrice')
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
    .populate('product', 'name imageUrl basePrice')
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
    .populate('product', 'name imageUrl basePrice')
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
    .populate('product', 'name imageUrl basePrice')
    .populate('user', 'name email phone');

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.status(200).json({ message: 'Billing details saved', order });
};

export const downloadOrderInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // Load primary order to get customer + grouping info
    const primaryOrder = await Order.findById(id)
      .populate('product', 'name basePrice sku')
      .populate('user', 'name email phone');

    if (!primaryOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Find all orders in the same batch/invoice so every product appears
    const groupFilter = primaryOrder.batchId
      ? { batchId: primaryOrder.batchId }
      : primaryOrder.billing?.number
        ? { 'billing.number': primaryOrder.billing.number }
        : { _id: primaryOrder._id };

    const orders = await Order.find(groupFilter)
      .sort({ createdAt: 1 })
      .populate('product', 'name basePrice sku');

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice.pdf"`);
    doc.pipe(res);

    // Header section
    doc.font('Helvetica-Bold').fontSize(22).text('Rong Chapa Invoice', { align: 'center' });
    doc.moveDown(1.5);

    // Customer and Invoice metadata
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    doc.text(`Invoice #: ${primaryOrder.billing?.number || primaryOrder._id}`);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`);
    doc.text(`Status: ${primaryOrder.status}`);

    doc.moveDown(1);
    doc.font('Helvetica-Bold').text('Customer Details:');
    doc.font('Helvetica').text(`Name: ${primaryOrder.customerName || 'N/A'}`);
    doc.text(`Phone: ${primaryOrder.customerPhone || 'N/A'}`);
    doc.text(`Address: ${primaryOrder.shippingAddress || 'N/A'}`);

    // Order Table Header
    doc.moveDown(2);
    const tableTop = doc.y;
    doc.rect(40, tableTop, 515, 20).fill('#f3f4f6');
    doc.fillColor('#000000').font('Helvetica-Bold');
    doc.text('Product', 50, tableTop + 6);
    doc.text('Qty', 300, tableTop + 6, { width: 50, align: 'center' });
    doc.text('Unit Price', 360, tableTop + 6, { width: 80, align: 'center' });
    doc.text('Total', 450, tableTop + 6, { width: 90, align: 'center' });

    // Table rows for all orders in the batch
    let currentY = tableTop + 25;
    let itemsSubtotal = 0;

    orders.forEach((order) => {
      if (!order.product) return;

      const name = order.product.name || 'Product';
      const qty = order.quantity || 1;
      const price = Number(order.product.basePrice || 0);
      const lineTotal = price * qty;
      itemsSubtotal += lineTotal;

      doc.font('Helvetica').fontSize(10);
      doc.text(name, 50, currentY, { width: 240 });
      doc.text(String(qty), 300, currentY, { width: 50, align: 'center' });
      doc.text(`Tk ${price.toFixed(2)}`, 360, currentY, { width: 80, align: 'center' });
      doc.text(`Tk ${lineTotal.toFixed(2)}`, 450, currentY, { width: 90, align: 'center' });

      currentY += 20;
    });

    // Delivery charge: prefer explicit positive value; otherwise derive from zone
    let deliveryCharge = 0;
    if (
      typeof primaryOrder.deliveryCharge === 'number' &&
      !Number.isNaN(primaryOrder.deliveryCharge) &&
      primaryOrder.deliveryCharge > 0
    ) {
      deliveryCharge = primaryOrder.deliveryCharge;
    } else {
      const { charge } = resolveDeliveryCharge(primaryOrder.deliveryZone);
      deliveryCharge = charge;
    }

    const totalDue =
      typeof primaryOrder.billing?.amount === 'number' && !Number.isNaN(primaryOrder.billing.amount)
        ? primaryOrder.billing.amount
        : itemsSubtotal + deliveryCharge;

    // Delivery & Billing Box (Right Aligned)
    const boxX = 340;
    const boxY = currentY + 30;
    const boxWidth = 215;

    doc.rect(boxX, boxY, boxWidth, 115).strokeColor('#e5e7eb').stroke();

    // Delivery Details
    doc.font('Helvetica-Bold').fontSize(10).text('Delivery Info', boxX + 10, boxY + 10);
    doc.font('Helvetica').fontSize(9);
    doc.text(`Zone: ${primaryOrder.deliveryZone || 'dhaka'}`, boxX + 10, boxY + 25);
    doc.text(`Charge: Tk ${deliveryCharge.toFixed(2)}`, boxX + 10, boxY + 35);

    // Billing Details
    doc.font('Helvetica-Bold').fontSize(10).text('Payment Summary', boxX + 10, boxY + 60);
    doc.font('Helvetica').fontSize(9);
    doc.text(`Subtotal: Tk ${itemsSubtotal.toFixed(2)}`, boxX + 10, boxY + 75);
    doc.text(`Total Due: Tk ${totalDue.toFixed(2)}`, boxX + 10, boxY + 88, { underline: true });
    doc.text(`Notes: ${primaryOrder.billing?.notes || 'N/A'}`, boxX + 10, boxY + 100);

    // Footer
    doc.moveDown(8);
    doc.font('Helvetica').fontSize(10).fillColor('#666666').text('Thank you for choosing Rong Chapa!', {
      align: 'center'
    });

    doc.end();
  } catch (error) {
    console.error('PDF Error:', error);
    res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
  }
};