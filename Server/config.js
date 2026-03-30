import connectDB from './db.js'
import { app } from './app/app.js'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

dotenv.config()

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
  windowMs: 15 * 60 * 1000,
  max: 100,
}))

export default app