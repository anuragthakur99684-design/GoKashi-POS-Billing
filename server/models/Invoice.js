const mongoose = require('mongoose')

const invoiceSchema = new mongoose.Schema(
  {
    customerName: { type: String, default: 'Walk-in Customer' },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        subtotal: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card'], default: 'Cash' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Invoice', invoiceSchema)