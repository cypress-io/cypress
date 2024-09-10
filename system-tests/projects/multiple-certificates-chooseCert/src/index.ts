import { server } from './server'

// Starts the server
try {
  server.start()
} catch (error) {
  console.error(error)
}
