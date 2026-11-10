import net from 'net'
import tls from 'tls'
import type { AddressInfo } from 'net'

/**
 * Captures the bytes a real TLS client sends first, so the scanner is exercised against an
 * actual ClientHello rather than one this test hand-rolled to its own reading of the spec.
 */
export function captureClientHello (options: { servername?: string, ALPNProtocols?: string[] }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const server = net.createServer((socket) => {
      socket.once('data', (chunk) => {
        socket.destroy()
        server.close()
        resolve(chunk)
      })
    })

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo
      const socket = tls.connect({ host: '127.0.0.1', port, rejectUnauthorized: false, ...options })

      socket.on('error', () => {})
    })

    server.once('error', reject)
  })
}
