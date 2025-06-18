/* eslint-disable no-console */
import http from 'http'
import { AddressInfo } from 'net'
import express from 'express'
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
  res.json({ ok: true })
})

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

class DestroyableProxy extends DebuggingProxy {
  constructor (readonly options: DestroyableProxyOptions) {
    super(options)
    allowDestroy(this.server)
  }
  destroy () {
    return Promise.fromCallback((cb) => {
      this.server.destroy(cb)
    })
  }
}

export async function fakeHttpServer () {
  const srv = await new Promise<http.Server>((resolve) => {
    const _srv = app.listen(() => {
      resolve(_srv)
    })
  })

  allowDestroy(srv)

  return {
    port: (srv.address() as AddressInfo).port,
    teardown: () => {
      debug(`teardown fakeHttpServer`)

      return Promise.fromCallback((cb) => srv.destroy(cb))
    },
  }
}

export async function fakeHttpsServer (opts: DestroyableProxyOptions = {}) {
  const ca = await CA.create()
  const [cert, key] = await ca.generateServerCertificateKeys('localhost')

  return fakeProxyServer({
    ...opts,
    https: {
      cert,
      key,
    },
    onRequest (url, req, res) {
      app(req, res)
    },
  })
}

export async function fakeProxyServer (opts: DestroyableProxyOptions = {}) {
  const port = await getPort()
  const proxy = new DestroyableProxy({
    keepRequests: true,
    ...opts,
  })

  await proxy.start(port)

  return {
    port,
    get requests () {
      return proxy.requests
    },
    teardown () {
      return proxy.destroy()
    },
  }
}
