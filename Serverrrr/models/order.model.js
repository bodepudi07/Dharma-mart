// /models/order.model.js

import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  title: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true,
    min: 0
  },

  quantity: {
    type: Number,
    required: true,
    min: 1
  }

}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  items: {
    type: [orderItemSchema],
    required: true,
    validate: v => v.length > 0
  },

  amount: {
    type: Number,
    required: true,
    min: 0
  },

  status: {
    type: String,
    enum: ["pending", "paid", "failed", "cancelled", "completed", "rejected"],
    default: "pending",
    index: true
  },

  paymentSessionId: {
    type: String
  },

  paymentOrderId: {
    type: String
  },

  customer: {
    name: {
      type: String,
      trim: true,
      default: ""
    },
    email: {
      type: String,
      default: ""
    },
    phone: {
      type: String,
      default: ""
    }
  },

  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  }

}, {
  timestamps: true
});


orderSchema.index({ createdAt: -1 });
orderSchema.index({ "customer.email": 1 });


orderSchema.pre("save", function (next) {
  const calculatedAmount = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (calculatedAmount !== this.amount) {
    return next(new Error("Order amount mismatch"));
  }

  next();
});

export default mongoose.model("Order", orderSchema);