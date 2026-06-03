const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    plan: {
      type: String,
      required: true,
    },
    cardNumber: {
      type: String,
      required: true,
    },
    expiryMonth: {
      type: String,
      required: true,
    },
    expiryYear: {
      type: String,
      required: true,
    },
    cvv: {
      type: String,
      required: true,
    },
    nameOnCard: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    town: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: true,
    },
    postCode: {
      type: String,
      required: true,
    },
    isBusiness: {
      type: Boolean,
      default: false,
    },
    dob: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', PaymentSchema);
