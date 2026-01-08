import mongoose from 'mongoose';

const printOrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true, trim: true },
    fileLink: { type: String, trim: true },
    colorMode: { type: String, enum: ['color', 'black_white'], required: true },
    sides: { type: String, enum: ['single', 'double'], required: true },
    paperSize: {
      type: String,
      enum: ['a4', 'letter', 'photo_paper', 'passport_photo', 'stamp_photo'],
      required: true
    },
    quantity: { type: Number, required: true, min: 1 },
    collectionTime: { type: Date, required: true },
    deliveryLocation: { type: String, enum: ['SEU', 'AUST', 'OTHER'], required: true },
    deliveryAddress: { type: String, trim: true },
    paymentTransaction: { type: String, trim: true, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'cancelled'],
      default: 'pending'
    },
    securityAmount: { type: Number, min: 0, default: 0 },
    billing: {
      number: { type: String, trim: true },
      amount: { type: Number, min: 0 },
      notes: { type: String, trim: true },
      generatedAt: { type: Date }
    }
  },
  { timestamps: true }
);

export const PrintOrder = mongoose.model('PrintOrder', printOrderSchema);
