import app from './config.js'
import http from 'http'

const PORT = process.env.PORT || 8080
const NODE_ENV = process.env.NODE_ENV || 'production'
const server = http.createServer(app)

server.listen(PORT, () => {
    if (NODE_ENV === 'development') {
        console.log('Running in development mode\nAvailable at http://localhost:' + PORT)
    } else {
        console.log('Running in production mode')
    }
    console.log(`Server is running on port ${PORT}`)
})