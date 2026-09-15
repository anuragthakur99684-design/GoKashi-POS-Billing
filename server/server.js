const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const { GoogleGenAI } = require('@google/genai') // Gemini AI SDK Import

const Product = require('./models/Product')
const Invoice = require('./models/Invoice')
const authRoutes = require('./routes/auth')
const authMiddleware = require('./middleware/authMiddleware')

const app = express()
const PORT = process.env.PORT || 5000

// 🔓 MIDDLEWARES & ENHANCED CORS (Fixes "Failed to fetch" on Vercel)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '10mb' }))

// Initialize Gemini AI Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY' })

// Database Connection String (Reads from Environment Variable or Fallback)
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://anuragthakur99684_db_user:kjNtfR1W0QH9OY0T@cluster0.wt3vnde.mongodb.net/retailpro_db?retryWrites=true&w=majority&appName=Cluster0'

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB Cloud Connected Successfully 🍃🚀'))
  .catch((err) => console.error('MongoDB Connection Error:', err))

// --- 🔐 AUTH ROUTES ---
app.use('/api/auth', authRoutes)

// --- 📦 PRODUCT ROUTES (Multi-Tenant Secured) ---

// GET: Fetch products for logged-in user only
app.get('/api/products', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.userId })
    const formatted = products.map((p) => ({
      id: p._id,
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      status: p.stock <= 5 ? 'Low Stock' : 'In Stock',
    }))
    res.json(formatted)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products', error: err.message })
  }
})

// POST: Add new product for logged-in user
app.post('/api/products', authMiddleware, async (req, res) => {
  const { name, category, price, stock } = req.body

  if (!name || !price || !stock) {
    return res.status(400).json({ message: 'Please provide all required fields' })
  }

  try {
    const stockNum = parseInt(stock, 10)
    const newProduct = new Product({
      userId: req.userId,
      name,
      category: category || 'General',
      price: parseFloat(price),
      stock: stockNum,
      status: stockNum <= 5 ? 'Low Stock' : 'In Stock',
    })

    const savedProduct = await newProduct.save()
    res.status(201).json({
      id: savedProduct._id,
      name: savedProduct.name,
      category: savedProduct.category,
      price: savedProduct.price,
      stock: savedProduct.stock,
      status: savedProduct.status,
    })
  } catch (err) {
    res.status(500).json({ message: 'Error saving product', error: err.message })
  }
})

// --- 🧾 INVOICE & BILLING ROUTES (Multi-Tenant Secured) ---

// POST: Process Sale & Deduct Stock
app.post('/api/invoices', authMiddleware, async (req, res) => {
  const { customerName, items, totalAmount, paymentMethod } = req.body

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' })
  }

  try {
    const newInvoice = new Invoice({
      userId: req.userId,
      customerName,
      items,
      totalAmount,
      paymentMethod,
    })
    const savedInvoice = await newInvoice.save()

    // Deduct stock for sold items
    for (let item of items) {
      if (item.productId) {
        await Product.findOneAndUpdate(
          { _id: item.productId, userId: req.userId },
          { $inc: { stock: -item.quantity } }
        )
      }
    }

    res.status(201).json({ message: 'Invoice generated successfully!', invoice: savedInvoice })
  } catch (err) {
    res.status(500).json({ message: 'Failed to process sale', error: err.message })
  }
})

// GET: Fetch Recent Invoices for logged-in user
app.get('/api/invoices', authMiddleware, async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.userId }).sort({ createdAt: -1 })
    res.json(invoices)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching invoices', error: err.message })
  }
})

// --- 🤖 AI ROUTES (Gemini Integrated) ---

// AI Assistant
app.post('/api/ai/assistant', authMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body

    const products = await Product.find({ userId: req.userId })
    const invoices = await Invoice.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(15)

    const context = `
      You are an expert AI Retail Store Manager & Advisor for "GoKashi POS & Billing".
      
      LIVE STORE DATA (LOGGED-IN USER):
      - Inventory Products: ${JSON.stringify(products)}
      - Recent Invoices/Sales: ${JSON.stringify(invoices)}

      Instructions:
      Answer the user's prompt strictly based on the provided live store data.
      Provide clear, practical, bulleted points in simple Hinglish or English.
      If asked for stock prediction, highlight products with low stock (<= 5) or high sales volume.
      
      User Question / Prompt: "${prompt || 'Give me today store insights and low stock predictions.'}"
    `

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: context,
    })

    res.json({ answer: response.text })
  } catch (err) {
    console.error('Gemini AI Assistant Error:', err)
    res.status(500).json({ message: 'AI processing failed', error: err.message })
  }
})

// AI Bill / Receipt Image Scanner (OCR)
app.post('/api/ai/scan-receipt', authMiddleware, async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body

    if (!imageBase64) {
      return res.status(400).json({ message: 'Base64 Image data required' })
    }

    const prompt = `
      Extract product information from this receipt image. 
      Return ONLY a raw JSON object with no markdown formatting, backticks, or extra text.
      JSON structure must be:
      {
        "name": "Product Name",
        "category": "Grocery" (or Personal Care/Beverages/General),
        "price": 100 (numeric price),
        "stock": 10 (numeric quantity/stock)
      }
    `

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: imageBase64,
          },
        },
        prompt,
      ],
    })

    const cleanJsonText = response.text.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsedData = JSON.parse(cleanJsonText)

    res.json({ result: parsedData })
  } catch (err) {
    console.error('Gemini OCR Error:', err)
    res.status(500).json({ message: 'Receipt scan failed', error: err.message })
  }
})

// Start Server for local testing
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
  })
}

// 💥 VERCEL EXPORT (Crucial for Vercel Serverless Functions)
module.exports = app;