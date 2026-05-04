import http from 'http'
import { AddressInfo } from 'net'
import express, { Application } from 'express'
import Promise from 'bluebird'
import debugLib from 'debug'
import DebuggingProxy from '@cypress/debugging-proxy'
import getPort from 'get-port'
import { CA } from '@packages/https-proxy'
import { allowDestroy } from '@packages/network'

const debug = debugLib('cypress:test:fake_proxy_server')

const app = express()

app.get('/ping', (req, res) => {
  debug(`GET /ping request to ${req.url}`)
  res.send('OK')
})

app.post('/ping', (req, res) => {
  debug(`POST /ping request to ${req.url}`)
  res.json({ ok: true, auth: req.headers['authorization'] })
})

app.get('/error', (req, res) => {
  res.status(404).json({ ok: false })
})

let ca: CA
let caPromise: Promise<CA> | null = null
// Cache certificate generation promises per hostname to prevent parallel writes
const certPromises: Map<string, Promise<{ cert: string, key: string }>> = new Map()

interface DestroyableProxyOptions {
  keepRequests?: boolean
  auth?: {
    username?: string
    password?: string
  }
  https?: {
    cert: string | Buffer
    key: string | Buffer
  }
  onRequest?: (url: string, req: http.IncomingMessage, res: http.ServerResponse) => void
}

export class DestroyableProxy extends DebuggingProxy {
  constructor (readonly options: DestroyableProxyOptions) {
    super(options)
    allowDestroy(this.server)
  }

  get baseUrl () {
    const maybeAuth = this.options.auth ? `${this.options.auth.username}:${this.options.auth.password}@` : ''

    return `http${this.options.https ? 's' : ''}://${maybeAuth}localhost:${this.port}`
  }

  get isHttps () {
    return Boolean(this.options.https)
  }

  teardown () {
    return Promise.fromCallback((cb) => {
      this.server.destroy(cb)
    })
  }

  get port () {
    return (this.server.address() as AddressInfo).port
  }
}

export async function fakeProxyServer (opts: DestroyableProxyOptions = {}) {
  const port = await getPort()
  const proxy = new DestroyableProxy({
    keepRequests: true,
    ...opts,
  })

  await proxy.start(port)

  return proxy
}

interface FakeServerOptions {
  https?: true
  auth?: {
    username?: string
    password?: string
  }
}

interface FakeProxyOptions {
  https?: true
  auth?: {
    username?: string
    password?: string
  }
}

export async function fakeServer (opts: FakeServerOptions, serverApp: Application = app) {
  const port = await getPort()
  const server = new DestroyableProxy({
    auth: opts.auth,
    https: opts.https ? await getHttpsOptions() : undefined,
    keepRequests: true,
    onRequest (url, req, res) {
      server.requests.push(req)

      if (opts.auth) {
        const serverAuth = req.headers['authorization']

        if (serverAuth.split(' ', 2)[1] !== server.correctAuth) {
          res.writeHead(401, 'Unauthorized')
          res.end()

          return
        }
      }

      serverApp(req, res)
    },
  })

  await server.start(port)

  return server
}

export async function fakeProxy (opts: FakeProxyOptions) {
  const port = await getPort()
  const server = new DestroyableProxy({
    keepRequests: true,
    auth: opts.auth,
    https: opts.https ? await getHttpsOptions() : undefined,
  })

  await server.start(port)

  return server
}

async function getHttpsOptions () {
  // Ensure CA is only created once, even if called in parallel
  if (!caPromise) {
    caPromise = CA.create().then((createdCa) => {
      ca = createdCa

      return createdCa
    })
  }

  const currentCa = await caPromise
  const hostname = 'localhost'

  // Serialize certificate generation for the same hostname to prevent file corruption
  // when multiple HTTPS servers are created in parallel
  if (!certPromises.has(hostname)) {
    certPromises.set(hostname, currentCa.generateServerCertificateKeys(hostname).then(([cert, key]) => {
      return { cert, key }
    }))
  }

  return certPromises.get(hostname)!
}

export function getCA () {
  return ca
}
