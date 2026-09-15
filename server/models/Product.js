const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }, // 👈 Multi-tenancy link: Har product dukaandar ke account se connect ho gaya
  name: { type: String, required: true },
  category: { type: String, default: 'Grocery' },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  status: { type: String, default: 'In Stock' },
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Product', productSchema)