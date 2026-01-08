import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    priceModifier: { type: Number, default: 0 }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, trim: true },
    basePrice: { type: Number, required: true, min: 0 },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    sizes: [optionSchema],
    paperTypes: [optionSchema],
    quantityOptions: [{ type: Number, min: 1 }],
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

productSchema.virtual('displayPrice').get(function getDisplayPrice() {
  return this.basePrice;
});

export const Product = mongoose.model('Product', productSchema);
