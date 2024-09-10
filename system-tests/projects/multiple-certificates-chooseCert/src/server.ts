import fs from 'fs'
import path from 'path'
import express from 'express'
import { createServer, ServerOptions } from 'https'
import { validateClientCert } from './middleware/validate-client-cert'

// Certificates directory
const certDir = path.join(__dirname, '../certs')

// Create Express app
const app = express()

// Apply the validateClientCert middleware to all routes
app.use(validateClientCert)

// Load server key and certificate, and CA to validate client certificates
const options: ServerOptions = {
  key: fs.readFileSync(path.join(certDir, 'server.key')),
  cert: fs.readFileSync(path.join(certDir, 'server.crt')),
  ca: fs.readFileSync(path.join(certDir, 'ca.crt')),
  requestCert: true, // Request client certificates
  rejectUnauthorized: false, // Reject unauthorized clients
}

// Create the server instancve
const serverInstance = createServer(options, app)

// Export the server commands for use
export const server = {
  start: async () => {
    return new Promise<boolean>((resolve, reject) => {
      serverInstance.listen(3000, () => {
        console.log('Server running on https://localhost:3000')
        resolve(true)
      })
    })
  },
  stop: async () => {
    return new Promise<void>((resolve, reject) => {
      serverInstance.close(() => {
        console.log('Server stopped')
        resolve()
      })
    })
  },
}
