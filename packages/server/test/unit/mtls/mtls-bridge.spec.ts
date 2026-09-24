import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import tls from 'tls'
import http2 from 'http2'
import https from 'https'
import { execFileSync } from 'child_process'
import { randomUUID } from 'crypto'
import type { AddressInfo } from 'net'
import { generateMtlsCertificates } from '@packages/network/test/helpers/mtls-certs'
import { MtlsBridge } from '../../../lib/mtls/mtls-bridge'
import type { MtlsBridgeOptions } from '../../../lib/mtls/mtls-bridge'
import type { BridgeListener } from '../../../lib/mtls/bridge-plan'

let dir: string
let origin: http2.Http2SecureServer
let originPort: number
let bridge: MtlsBridge
let listener: BridgeListener
let listenPort: number
let secureContextFor: MtlsBridgeOptions['secureContextFor']

const read = (f: string) => fs.readFileSync(path.join(dir, f))

/**
 * Dials the origin with the configured client certificate, recording what the bridge asked
 * for. The real implementation also establishes any upstream proxy here, which is why the
 * bridge must pass the origin through rather than assume it.
 */
const connectCalls: { hostname: string, port: number, alpnProtocols: string[] }[] = []

const connectUpstream: MtlsBridgeOptions['connectUpstream'] = ({ hostname, port, alpnProtocols, material }) => {
  connectCalls.push({ hostname, port, alpnProtocols })

  return new Promise((resolve, reject) => {
    const socket = tls.connect({
      // the listener stands in for `localhost:originPort`, so what the bridge passed is
      // what a real adapter would dial
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

function startOrigin (): Promise<void> {
  origin = http2.createSecureServer({
    key: read('origin.key'),
    cert: read('origin.crt'),
    ca: read('client-ca.crt'),
    requestCert: true,
    rejectUnauthorized: true,
    allowHTTP1: true,
    ALPNProtocols: ['h2', 'http/1.1'],
  })

  const body = (socket: any) => {
    return JSON.stringify({
      peerCN: socket.getPeerCertificate()?.subject?.CN ?? null,
      alpn: socket.alpnProtocol,
    })
  }

  origin.on('stream', (stream) => {
    stream.respond({ ':status': 200, 'content-type': 'application/json' })
    stream.end(body(stream.session!.socket))
  })

  origin.on('request', (req, res) => {
    if (req.httpVersionMajor === 2) return

    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(body(req.socket))
  })

  return new Promise((resolve) => {
    origin.listen(0, '127.0.0.1', () => {
      originPort = (origin.address() as AddressInfo).port
      resolve()
    })
  })
}

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), `mtls-bridge-${randomUUID()}`))

  generateMtlsCertificates(dir)

  // The identity the bridge forges for the browser is deliberately not the origin's own
  // certificate, so a test client reaching the origin directly could not be mistaken for one
  // the bridge terminated.
  const at = (f: string) => path.join(dir, f)

  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', at('forged.key'), '-out', at('forged.crt'), '-days', '2', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1'], { stdio: 'pipe' })

  await startOrigin()

  listener = {
    hostname: 'localhost',
    port: originPort,
    sourceUrls: [`https://localhost:${originPort}`],
    material: {
      ca: [read('origin-ca.crt')],
      cert: [read('client.crt')],
      key: [{ pem: read('client.key') }],
    },
  }

  secureContextFor = async () => tls.createSecureContext({ key: read('forged.key'), cert: read('forged.crt') })

  bridge = new MtlsBridge({ listeners: [listener], connectUpstream, secureContextFor })

  const bound = await bridge.listen()

  listenPort = bound[0].listenPort
}, 60000)

afterAll(async () => {
  await bridge?.close()
  origin?.close()
  fs.rmSync(dir, { recursive: true, force: true })
})

function requestOverHttp2 (alpn: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const client = http2.connect(`https://localhost:${originPort}`, {
      createConnection: () => {
        return tls.connect({
          host: '127.0.0.1',
          port: listenPort,
          servername: 'localhost',
          ALPNProtocols: alpn,
          ca: read('forged.crt'),
        })
      },
    })

    client.once('error', reject)

    const req = client.request({ ':path': '/' })
    let body = ''

    req.on('data', (d) => body += d)
    req.on('end', () => {
      client.close()
      resolve(JSON.parse(body))
    })

    req.once('error', reject)
  })
}

describe('MtlsBridge', () => {
  // The system test cannot catch a broken ALPN mirror: its origin also speaks HTTP/1.1, so
  // forcing http/1.1 for every client would still serve every page. These two cases are the
  // ones that pin the mirror.
  it('presents the configured certificate and keeps HTTP/2 negotiated end to end', async () => {
    await expect(requestOverHttp2(['h2', 'http/1.1'])).resolves.toMatchObject({
      peerCN: 'cypress-client',
      alpn: 'h2',
    })
  })

  it('mirrors http/1.1 when that is all the client offered', async () => {
    const body = await new Promise<string>((resolve, reject) => {
      https.get({
        host: '127.0.0.1',
        port: listenPort,
        servername: 'localhost',
        path: '/',
        ALPNProtocols: ['http/1.1'],
        ca: read('forged.crt'),
      }, (res) => {
        let data = ''

        res.on('data', (d) => data += d)
        res.on('end', () => resolve(data))
      }).once('error', reject)
    })

    expect(JSON.parse(body)).toMatchObject({ peerCN: 'cypress-client', alpn: 'http/1.1' })
  })

  // Closing a listener without taking its connections down would wait out every live one,
  // so a browser holding a session open would stall shutdown for as long as it kept it.
  // The session has to be fully established: a connection the listener has not accepted yet
  // is not one `close` would wait for, so it would prove nothing.
  it('closes while a session to a listener is still open', async () => {
    const closing = new MtlsBridge({ listeners: [listener], connectUpstream, secureContextFor })
    const [bound] = await closing.listen()

    const socket = tls.connect({
      host: '127.0.0.1',
      port: bound.listenPort,
      servername: 'localhost',
      ALPNProtocols: ['h2'],
      ca: read('forged.crt'),
    })

    await new Promise<void>((resolve, reject) => {
      socket.once('secureConnect', () => resolve())
      socket.once('error', reject)
    })

    const timeout = new Promise((_resolve, reject) => {
      setTimeout(() => reject(new Error('close() did not resolve while a connection was open')), 2000).unref()
    })

    await Promise.race([closing.close(), timeout])

    socket.destroy()
  })

  it('asks the upstream adapter for the origin the listener stands for', async () => {
    connectCalls.length = 0

    await requestOverHttp2(['h2', 'http/1.1'])

    expect(connectCalls).toEqual([{
      hostname: 'localhost',
      port: originPort,
      alpnProtocols: ['h2', 'http/1.1'],
    }])
  })
})
