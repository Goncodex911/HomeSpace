import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        store: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: false,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      streetAddress: { type: String, required: true },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    cancellationDetails: {
      type: String,
      default: '',
    },
    returnRequest: {
      isRequested: { type: Boolean, default: false },
      reason: { type: String, default: '' },
      comments: { type: String, default: '' },
      method: { type: String, default: '' },
      itemsToReturn: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
      status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' }
    },
    orderCode: {
      type: Number,
      required: true,
      unique: true,
    },
    paymentLinkId: {
      type: String,
    }
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
