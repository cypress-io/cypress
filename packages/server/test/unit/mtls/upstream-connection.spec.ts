import { describe, it, expect, afterEach } from 'vitest'
import net from 'net'
import type { AddressInfo } from 'net'
import { connectUpstream } from '../../../lib/mtls/upstream-connection'

/**
 * Exercises the real dial against a stand-in CONNECT proxy. The bridge spec injects a fake
 * `connectUpstream`, so without these the proxy handshake has no coverage at all.
 */
type ProxyBehavior = (socket: net.Socket, request: string) => void

const servers: net.Server[] = []

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
