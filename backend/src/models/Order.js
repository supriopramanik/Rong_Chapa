import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String },
    paperType: { type: String },
    notes: { type: String, trim: true },
    shippingAddress: { type: String, trim: true, required: true },
    deliveryZone: { type: String, enum: ['dhaka', 'outside'], required: true },
    deliveryCharge: { type: Number, min: 0, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'cancelled'],
      default: 'pending'
    },
    billing: {
      number: { type: String, trim: true },
      amount: { type: Number, min: 0 },
      notes: { type: String, trim: true },
      generatedAt: { type: Date }
    },
    cancelRequest: {
      status: {
        type: String,
        enum: ['none', 'pending', 'approved', 'declined'],
        default: 'none'
      },
      reason: { type: String, trim: true },
      requestedAt: { type: Date },
      resolvedAt: { type: Date },
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      adminNote: { type: String, trim: true }
    }
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
