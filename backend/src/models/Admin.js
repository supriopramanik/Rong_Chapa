import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    organization: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

export const Admin = mongoose.model('Admin', adminSchema);
