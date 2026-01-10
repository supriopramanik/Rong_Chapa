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
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate('product', 'name basePrice sku')
    .populate('user', 'name email phone');

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const fileName = `invoice-${order.billing?.number || order._id}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  doc.pipe(res);

  const brandColor = '#8b5a2b';
  const textColor = '#111827';
  const subtleRow = '#fcf5ee';

  const unitPrice = Number(order.product?.basePrice || 0);
  const lineTotal = Number((unitPrice * order.quantity).toFixed(2));
  const deliveryCharge = order.deliveryCharge || 0;
  const totalDue = order.billing?.amount ?? Number((lineTotal + deliveryCharge).toFixed(2));

  // Header
  doc
    .font('Helvetica-Bold')
    .fillColor(brandColor)
    .fontSize(26)
    .text('RONG CHAPA', { align: 'center' });

  doc
    .fontSize(16)
    .fillColor(textColor)
    .moveDown(0.4)
    .text('Order Invoice', { align: 'center' });

  doc.moveDown(1);

  // Order meta block
  doc.font('Helvetica').fontSize(11).fillColor(textColor);
  doc.text(`Order ID: ${order.billing?.number || order._id}`);
  doc.text(`Status: ${order.status}`);
  doc.text(`Customer: ${order.customerName} (${order.customerEmail || 'N/A'})`);
  doc.text(`Address: ${order.shippingAddress}`);
  doc.text(`Phone: ${order.customerPhone || 'N/A'}`);
  doc.text(`Total: ${formatCurrency(totalDue)}`);
  doc.moveDown(1);

  // Items table
  const tableTop = doc.y + 4;
  const tableLeft = doc.page.margins.left;
  const tableRight = doc.page.width - doc.page.margins.right;
  const colItem = 320;
  const colQty = 60;
  const colPrice = 80;
  const colTotal = 80;

  const headerHeight = 20;
  doc
    .save()
    .rect(tableLeft, tableTop, tableRight - tableLeft, headerHeight)
    .fill(brandColor)
    .restore();

  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('Item', tableLeft + 8, tableTop + 5, { width: colItem - 8 })
    .text('Qty', tableLeft + colItem, tableTop + 5, { width: colQty, align: 'center' })
    .text('Price', tableLeft + colItem + colQty, tableTop + 5, { width: colPrice, align: 'right' })
    .text('Total', tableLeft + colItem + colQty + colPrice, tableTop + 5, {
      width: colTotal,
      align: 'right'
    });

  const rowTop = tableTop + headerHeight;
  const rowHeight = 22;

  doc
    .save()
    .rect(tableLeft, rowTop, tableRight - tableLeft, rowHeight)
    .fill(subtleRow)
    .restore();

  const productLabel = order.product?.name || 'Custom item';
  const details = [];
  if (order.size) details.push(`Size: ${order.size}`);
  if (order.paperType) details.push(`Paper: ${order.paperType}`);
  if (order.notes) details.push(order.notes);
  const itemText = details.length ? `${productLabel} — ${details.join(' · ')}` : productLabel;

  const bodyY = rowTop + 5;
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(textColor)
    .text(itemText, tableLeft + 8, bodyY, { width: colItem - 8 })
    .text(String(order.quantity), tableLeft + colItem, bodyY, { width: colQty, align: 'center' })
    .text(formatCurrency(unitPrice), tableLeft + colItem + colQty, bodyY, {
      width: colPrice,
      align: 'right'
    })
    .text(formatCurrency(lineTotal), tableLeft + colItem + colQty + colPrice, bodyY, {
      width: colTotal,
      align: 'right'
    });

  // Totals under table
  const totalsTop = rowTop + rowHeight + 10;
  doc
    .moveTo(tableLeft, totalsTop)
    .lineTo(tableRight, totalsTop)
    .strokeColor('#e5e7eb')
    .stroke();

  const labelX = tableLeft + colItem + colQty;
  const valueX = tableRight;

  const writeTotalLine = (label, value, bold = false) => {
    doc
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(11)
      .fillColor(textColor)
      .text(label, labelX, doc.y + 4, { width: colPrice, align: 'right', continued: true })
      .text(value, valueX, doc.y, { width: colTotal, align: 'right' });
  };

  doc.moveDown(0.2);
  writeTotalLine('Subtotal', formatCurrency(lineTotal));
  doc.moveDown(0.1);
  writeTotalLine('Delivery', formatCurrency(deliveryCharge));
  doc.moveDown(0.1);
  writeTotalLine('Total', formatCurrency(totalDue), true);

  // Footer
  doc.moveDown(3);
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#4b5563')
    .text('Thank you for your order! We hope you enjoy your prints.', {
      align: 'center'
    });

  doc.end();
};
