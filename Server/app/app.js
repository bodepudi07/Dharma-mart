import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'
import categoryRoutes from './routes/categoryRoutes.js'
import productRoutes from './routes/productRoutes.js'
import vendorRoutes from './routes/vendorRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import authRoutes from './routes/authRoutes.js'

const app = express()

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}))
app.use(bodyParser.json({ limit: '10mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }))

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// API Routes
app.use('/api/categories', categoryRoutes)
app.use('/api/products', productRoutes)
app.use('/api/vendors', vendorRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/auth', authRoutes)

// Welcome route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Welcome to Dharma Mart API',
    version: '1.0.0',
    documentation: '/api/docs'
  })
})

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running"
  })
})

// 404 handler for undefined routes
app.use(notFoundHandler)

// Error handling middleware (must be last)
app.use(errorHandler)

export { app }
