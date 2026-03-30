import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

const app = express()
app.use(cors())
app.use(bodyParser.json())

// Sample route
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the server!' })
})

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' })
})


export { app }