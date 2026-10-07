import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import net from 'net'
import os from 'os'
import path from 'path'
import tls from 'tls'
import { randomUUID } from 'crypto'
import type { AddressInfo } from 'net'
import { generateMtlsCertificates } from '@packages/network/test/helpers/mtls-certs'
import { connectUpstream } from '../../../lib/mtls/upstream-connection'

/**
 * Exercises the real dial against a stand-in CONNECT proxy. The bridge spec injects a fake
 * `connectUpstream`, so without these the proxy handshake has no coverage at all.
 */
type ProxyBehavior = (socket: net.Socket, request: string) => void

const servers: (net.Server | tls.Server)[] = []

function startProxy (behave: ProxyBehavior): Promise<number> {
  const server = net.createServer((socket) => {
    socket.once('data', (chunk) => behave(socket, chunk.toString()))
  })

  servers.push(server)

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve((server.address() as AddressInfo).port))
  })
}

async function dialThrough (port: number, hostname = 'origin.example') {
  process.env.HTTP_PROXY = `http://127.0.0.1:${port}`
  process.env.HTTPS_PROXY = process.env.HTTP_PROXY

  return connectUpstream({
    hostname,
    port: 443,
    alpnProtocols: [],
    material: {},
  })
}

afterEach(() => {
  delete process.env.HTTP_PROXY
  delete process.env.HTTPS_PROXY
  servers.splice(0).forEach((server) => server.close())
})

describe('connectUpstream through an upstream proxy', () => {
  it('asks the proxy to tunnel to the origin', async () => {
    let seen = ''
    const port = await startProxy((socket, request) => {
      seen = request
      socket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
      // nothing speaks TLS on the far side, so end the tunnel and let the handshake fail;
      // the CONNECT line is what this is checking
      setTimeout(() => socket.destroy(), 20)
    })

    await dialThrough(port).catch(() => {})

    expect(seen.split('\r\n')[0]).toEqual('CONNECT origin.example:443 HTTP/1.1')
  })

  // The status line can arrive split across segments, and the status check matches a prefix,
  // so a response judged on the first chunk alone would accept a partial line and then feed
  // the rest of the headers to the TLS handshake as if they were records.
  it('waits for the whole response before judging it', async () => {
    const port = await startProxy((socket) => {
      socket.write('HTTP/1.1 4')
      setTimeout(() => socket.write('03 Forbidden\r\n\r\n'), 20)
    })

    await expect(dialThrough(port)).rejects.toThrow(/refused CONNECT to origin\.example:443/)
  })

  it('fails when the proxy answers with a non-200', async () => {
    const port = await startProxy((socket) => {
      socket.write('HTTP/1.1 407 Proxy Authentication Required\r\n\r\n')
    })

    await expect(dialThrough(port)).rejects.toThrow(/refused CONNECT to origin\.example:443/)
  })

  // Without a 'close' handler this never settles, and the caller waits forever with no error.
  it('fails when the proxy closes without answering', async () => {
    const port = await startProxy((socket) => socket.end())

    await expect(dialThrough(port)).rejects.toThrow(/closed the connection without answering CONNECT/)
  })
})

/**
 * Every case above kills the tunnel before TLS starts, and the system test runs without a
 * proxy — so without this nothing proves that an mTLS handshake survives a CONNECT at all,
 * which is the configuration most users with a client certificate are actually in.
 */
describe('connectUpstream completes mutual TLS through a CONNECT proxy', () => {
  let dir: string

  const read = (f: string) => fs.readFileSync(path.join(dir, f))

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), `mtls-connect-${randomUUID()}`))
    generateMtlsCertificates(dir)
  }, 120000)

  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('presents the client certificate to the origin on the far side of the tunnel', async () => {
    const origin = tls.createServer({
      key: read('origin.key'),
      cert: read('origin.crt'),
      ca: read('client-ca.crt'),
      requestCert: true,
      rejectUnauthorized: true,
      ALPNProtocols: ['http/1.1'],
    }, (socket) => socket.write(`peer=${socket.getPeerCertificate()?.subject?.CN ?? 'none'}`))

    servers.push(origin)
    const originPort = await new Promise<number>((resolve) => {
      origin.listen(0, '127.0.0.1', () => resolve((origin.address() as AddressInfo).port))
    })

    // a proxy that answers CONNECT and then actually tunnels, rather than hanging up
    const proxyPort = await startProxy((client, request) => {
      const port = Number(request.split('\r\n')[0].split(' ')[1].split(':').pop())
      const tunnel = net.connect(port, '127.0.0.1', () => {
        client.write('HTTP/1.1 200 Connection Established\r\n\r\n')
        client.pipe(tunnel).pipe(client)
      })

      tunnel.on('error', () => client.destroy())
      client.on('error', () => tunnel.destroy())
    })

    process.env.HTTP_PROXY = `http://127.0.0.1:${proxyPort}`
    process.env.HTTPS_PROXY = process.env.HTTP_PROXY

    const connection = await connectUpstream({
      hostname: 'localhost',
      port: originPort,
      alpnProtocols: ['h2', 'http/1.1'],
      material: { ca: [read('origin-ca.crt')], cert: [read('client.crt')], key: [{ pem: read('client.key') }] },
    })

    const greeting = await new Promise<string>((resolve) => {
      connection.socket.once('data', (chunk) => resolve(chunk.toString()))
    })

    expect(greeting).toEqual('peer=cypress-client')
    expect(connection.alpnProtocol).toEqual('http/1.1')

    connection.socket.destroy()
  }, 30000)
})
