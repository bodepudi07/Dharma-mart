import 'dotenv/config'
import connectDB from './db.js'
import { app } from './app/app.js'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

// Connect to the database
connectDB()
  .then(() => {
    console.log('Connected to the database')
  })
  .catch((error) => {
    console.error('MongoDB connection failed, but server will still run')
    console.error(error.message)
  })

// Security middleware
app.use(helmet())
app.use(rateLimit({
  windowMs: process.env.API_RATE_LIMIT_WINDOW ? parseInt(process.env.API_RATE_LIMIT_WINDOW, 10) : 15 * 60 * 1000,
  max: process.env.API_RATE_LIMIT_MAX ? parseInt(process.env.API_RATE_LIMIT_MAX, 10) : 100,
}))

export default app