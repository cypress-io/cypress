import { describe, it, expect } from 'vitest'
import { scanClientHello } from '../../../lib/mtls/client-hello'
import { captureClientHello } from './support/capture-client-hello'

describe('scanClientHello', () => {
  it('reads the servername and ALPN list a client offered', async () => {
    const hello = await captureClientHello({ servername: 'example.com', ALPNProtocols: ['h2', 'http/1.1'] })
    const scan = scanClientHello(hello)

    expect(scan).toStrictEqual({ kind: 'client-hello', servername: 'example.com', alpnProtocols: ['h2', 'http/1.1'] })
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

    expect(scanClientHello(hello.subarray(0, 2))).toStrictEqual({ kind: 'incomplete' })
    expect(scanClientHello(hello.subarray(0, hello.length - 1))).toStrictEqual({ kind: 'incomplete' })
    expect(scanClientHello(hello)).toMatchObject({ kind: 'client-hello' })
  })

  it('asks for more bytes when nothing has arrived', () => {
    expect(scanClientHello(Buffer.alloc(0))).toStrictEqual({ kind: 'incomplete' })
  })

  // Anything can connect to a bridge listener — a port scanner, a health probe. The scan
  // runs inside the socket's data handler, so a throw here is an uncaught exception that
  // takes down the whole run rather than just that connection.
  it('refuses a record that declares more than it carries, without throwing', () => {
    // a complete 4-byte handshake record whose vectors run past the end of the record
    const truncated = Buffer.from([0x16, 0x03, 0x01, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00])

    expect(() => scanClientHello(truncated)).not.toThrow()
    expect(scanClientHello(truncated)).toStrictEqual({ kind: 'not-tls' })
  })

  it('refuses a record whose vectors overrun it at any position', () => {
    const hello = Buffer.from([0x16, 0x03, 0x01, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00])

    // walk every truncation of a well-formed-looking header; none may throw
    for (let length = 5; length <= hello.length; length++) {
      expect(() => scanClientHello(hello.subarray(0, length))).not.toThrow()
    }
  })

  it('recognizes plain HTTP so the connection can be passed through', () => {
    expect(scanClientHello(Buffer.from('GET / HTTP/1.1\r\n\r\n'))).toStrictEqual({ kind: 'not-tls' })
  })
})
