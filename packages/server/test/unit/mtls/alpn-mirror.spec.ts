import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import tls from 'tls'
import { execFileSync } from 'child_process'
import { randomUUID } from 'crypto'
import type { AddressInfo } from 'net'
import { generateMtlsCertificates } from '@packages/network/test/helpers/mtls-certs'
import { MtlsBridge } from '../../../lib/mtls/mtls-bridge'
import type { MtlsBridgeOptions } from '../../../lib/mtls/mtls-bridge'

/**
 * The bridge must offer the browser only the protocol the *origin* chose, not the list the
 * browser offered. An origin that speaks both h2 and http/1.1 cannot show the difference:
 * either rule yields the browser's own first preference. These two origins can — one takes
 * only http/1.1, the other negotiates no ALPN at all — so they are what pins the mirror.
 */
let dir: string
const read = (f: string) => fs.readFileSync(path.join(dir, f))
const servers: tls.Server[] = []

function startOrigin (alpnProtocols?: string[]): Promise<number> {
  const server = tls.createServer({
    key: read('origin.key'),
    cert: read('origin.crt'),
    ca: read('client-ca.crt'),
    requestCert: true,
    rejectUnauthorized: true,
    ...(alpnProtocols ? { ALPNProtocols: alpnProtocols } : {}),
  })

  servers.push(server)

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve((server.address() as AddressInfo).port))
  })
}

const connectUpstream: MtlsBridgeOptions['connectUpstream'] = ({ hostname, port, alpnProtocols, material }) => {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({
      host: '127.0.0.1',
      port,
      servername: hostname,
      ALPNProtocols: alpnProtocols.length ? alpnProtocols : undefined,
      ca: material.ca,
      cert: material.cert,
      key: material.key?.map((k) => k.pem),
    }, () => resolve({ socket, alpnProtocol: socket.alpnProtocol }))

    socket.once('error', reject)
  })
}

async function bridgeTo (originPort: number) {
  const bridge = new MtlsBridge({
    listeners: [{
      hostname: 'localhost',
      port: originPort,
      sourceUrls: [`https://localhost:${originPort}`],
      material: { ca: [read('origin-ca.crt')], cert: [read('client.crt')], key: [{ pem: read('client.key') }] },
    }],
    connectUpstream,
    secureContextFor: async () => tls.createSecureContext({ key: read('forged.key'), cert: read('forged.crt') }),
  })

  const [bound] = await bridge.listen()

  return { bridge, listenPort: bound.listenPort }
}

/**
 * What the client ends up negotiating with the bridge, which is the only thing that can
 * catch a broken mirror — a response body cannot, because an HTTP/1.1 request succeeds
 * whichever protocol was negotiated.
 */
function negotiate (listenPort: number, offer: string[]): Promise<string | false | null> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({
      host: '127.0.0.1',
      port: listenPort,
      servername: 'localhost',
      ALPNProtocols: offer,
      ca: read('forged.crt'),
    }, () => {
      const alpnProtocol = socket.alpnProtocol

      socket.destroy()
      resolve(alpnProtocol)
    })

    socket.once('error', reject)
  })
}

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), `mtls-alpn-${randomUUID()}`))

  generateMtlsCertificates(dir)

  const at = (f: string) => path.join(dir, f)

  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', at('forged.key'), '-out', at('forged.crt'), '-days', '2', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1'], { stdio: 'pipe' })
}, 120000)

afterAll(() => {
  servers.forEach((server) => server.close())
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('MtlsBridge ALPN mirror', () => {
  it('offers the browser http/1.1 when the origin would take nothing else', async () => {
    const { bridge, listenPort } = await bridgeTo(await startOrigin(['http/1.1']))

    await expect(negotiate(listenPort, ['h2', 'http/1.1'])).resolves.toStrictEqual('http/1.1')

    await bridge.close()
  }, 30000)

  it('offers the browser no ALPN when the origin negotiated none', async () => {
    const { bridge, listenPort } = await bridgeTo(await startOrigin())

    await expect(negotiate(listenPort, ['h2', 'http/1.1'])).resolves.toStrictEqual(false)

    await bridge.close()
  }, 30000)
})
