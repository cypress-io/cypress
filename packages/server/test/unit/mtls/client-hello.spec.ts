import { describe, it, expect } from 'vitest'
import net from 'net'
import tls from 'tls'
import type { AddressInfo } from 'net'
import { scanClientHello } from '../../../lib/mtls/client-hello'

/**
 * Captures the bytes a real TLS client sends first, so the scanner is exercised against an
 * actual ClientHello rather than one this test hand-rolled to its own reading of the spec.
 */
function captureClientHello (options: { servername?: string, ALPNProtocols?: string[] }): Promise<Buffer> {
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

describe('scanClientHello', () => {
  it('reads the servername and ALPN list a client offered', async () => {
    const hello = await captureClientHello({ servername: 'example.com', ALPNProtocols: ['h2', 'http/1.1'] })
    const scan = scanClientHello(hello)

    expect(scan).toEqual({ kind: 'client-hello', servername: 'example.com', alpnProtocols: ['h2', 'http/1.1'] })
  })

  it('distinguishes a client that offered no ALPN from one that offered none of ours', async () => {
    const hello = await captureClientHello({ servername: 'example.com' })
    const scan = scanClientHello(hello)

    expect(scan).toMatchObject({ kind: 'client-hello', alpnProtocols: [] })
  })

  it('reports no servername when the client sent no SNI', async () => {
    const hello = await captureClientHello({ ALPNProtocols: ['h2'] })

    expect(scanClientHello(hello)).toMatchObject({ kind: 'client-hello', servername: null })
  })

  it('asks for more bytes when the record is split across segments', async () => {
    const hello = await captureClientHello({ servername: 'example.com', ALPNProtocols: ['h2'] })

    expect(scanClientHello(hello.subarray(0, 2))).toEqual({ kind: 'incomplete' })
    expect(scanClientHello(hello.subarray(0, hello.length - 1))).toEqual({ kind: 'incomplete' })
    expect(scanClientHello(hello)).toMatchObject({ kind: 'client-hello' })
  })

  it('asks for more bytes when nothing has arrived', () => {
    expect(scanClientHello(Buffer.alloc(0))).toEqual({ kind: 'incomplete' })
  })

  it('recognizes plain HTTP so the connection can be passed through', () => {
    expect(scanClientHello(Buffer.from('GET / HTTP/1.1\r\n\r\n'))).toEqual({ kind: 'not-tls' })
  })
})
