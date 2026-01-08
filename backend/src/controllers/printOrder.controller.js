import { validationResult } from 'express-validator';
import { PrintOrder } from '../models/PrintOrder.js';

export const createPrintOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { collectionTime, deliveryLocation, ...rest } = req.body;
  const securityAmount = deliveryLocation === 'OTHER' ? 60 : 20;
  const printOrder = await PrintOrder.create({
    ...rest,
    deliveryLocation,
    collectionTime: new Date(collectionTime),
    user: req.user.id,
    securityAmount
  });
  res.status(201).json({ message: 'Print order received', printOrder });
};

export const listPrintOrders = async (req, res) => {
  const printOrders = await PrintOrder.find()
    .sort({ createdAt: -1 })
    .populate('user', 'name email phone');
  res.status(200).json({ printOrders });
};

export const listMyPrintOrders = async (req, res) => {
  const printOrders = await PrintOrder.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json({ printOrders });
};

export const updatePrintOrderStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { id } = req.params;
  const { status } = req.body;

  const printOrder = await PrintOrder.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  ).populate('user', 'name email phone');

  if (!printOrder) {
    return res.status(404).json({ message: 'Print order not found' });
  }

  res.status(200).json({ message: 'Print order status updated', printOrder });
};

export const updatePrintOrderBilling = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { id } = req.params;
  const { billingNumber, billingAmount, billingNotes } = req.body;

  const payload = {};

  if (billingNumber !== undefined) {
    const trimmed = billingNumber.trim();
    if (trimmed) {
      payload.number = trimmed;
    }
  }

  if (billingAmount !== undefined) {
    const numericAmount = typeof billingAmount === 'number' ? billingAmount : Number(billingAmount);
    if (!Number.isNaN(numericAmount)) {
      payload.amount = numericAmount;
    }
  }

  if (billingNotes !== undefined) {
    const trimmedNotes = billingNotes.trim();
    if (trimmedNotes) {
      payload.notes = trimmedNotes;
    }
  }

  if (!Object.keys(payload).length) {
    return res.status(422).json({ message: 'Please provide billing number, amount, or notes.' });
  }

  payload.generatedAt = new Date();

  const printOrder = await PrintOrder.findByIdAndUpdate(
    id,
    { billing: payload },
    { new: true }
  ).populate('user', 'name email phone');

  if (!printOrder) {
    return res.status(404).json({ message: 'Print order not found' });
  }

  res.status(200).json({ message: 'Print order billing updated', printOrder });
};
