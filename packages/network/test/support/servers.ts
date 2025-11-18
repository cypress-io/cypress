import { promisify } from 'util'
import express from 'express'
import http from 'http'
import https from 'https'
import { CA } from '@packages/https-proxy'
import { SocketIOServer } from '@packages/socket'
import { allowDestroy } from '../../lib/allow-destroy'

export interface AsyncServer {
  closeAsync: () => Promise<void>
  destroyAsync: () => Promise<void>
  listenAsync: (port) => Promise<void>
}

function createExpressApp (requestCallback: (req) => void) {
  const app: express.Application = express()

  app.get('/get', (req, res) => {
    if (requestCallback) requestCallback(req)

    res.send('It worked!')
  })

  app.get('/empty-response', (req, res) => {
    if (requestCallback) requestCallback(req)

    // ERR_EMPTY_RESPONSE in Chrome
    setTimeout(() => res.connection.destroy(), 100)
  })

  return app
}

async function getCAInformation () {
  const ca = await CA.create()

  const [serverCertificateKeys, caCertificatePath] = await Promise.all([ca.generateServerCertificateKeys('localhost'), ca.getCACertPath()])

  return { serverCertificateKeys, caCertificatePath }
}

function onWsConnection (socket) {
  socket.send('It worked!')
}

export class Servers {
  https: { cert: string, key: string }
  httpServer: http.Server & AsyncServer
  httpsServer: https.Server & AsyncServer
  wsServer: any
  wssServer: any
  caCertificatePath: string
  lastRequestHeaders: any

  async start (httpPort: number, httpsPort: number) {
    const [app, { serverCertificateKeys, caCertificatePath }]: [Express.Application, {serverCertificateKeys: string[], caCertificatePath: string}] = await Promise.all([
      createExpressApp((req) => this.lastRequestHeaders = req.headers),
      getCAInformation(),
    ])

    const httpServer = allowDestroy(http.createServer(app))

    this.httpServer = Object.assign(httpServer, {
      closeAsync: promisify(httpServer.close.bind(httpServer)),
      destroyAsync: promisify(httpServer.destroy.bind(httpServer)),
      listenAsync: promisify(httpServer.listen.bind(httpServer)),
    }) as http.Server & AsyncServer

    this.wsServer = new SocketIOServer(this.httpServer)

    this.caCertificatePath = caCertificatePath
    this.https = { cert: serverCertificateKeys[0], key: serverCertificateKeys[1] }
    const httpsServer = allowDestroy(https.createServer(this.https, <http.RequestListener>app))

    this.httpsServer = Object.assign(httpsServer, {
      closeAsync: promisify(httpsServer.close.bind(httpsServer)),
      destroyAsync: promisify(httpsServer.destroy.bind(httpsServer)),
      listenAsync: promisify(httpsServer.listen.bind(httpsServer)),
    }) as https.Server & AsyncServer

    this.wssServer = new SocketIOServer(this.httpsServer)

    ;[this.wsServer, this.wssServer].map((ws) => {
      ws.on('connection', onWsConnection)
    })

    await Promise.all([
      this.httpServer.listenAsync(httpPort),
      this.httpsServer.listenAsync(httpsPort),
    ])

    return undefined
  }

  async stop () {
    await Promise.all([
      this.httpServer.destroyAsync(),
      this.httpsServer.destroyAsync(),
    ])
  }
}
