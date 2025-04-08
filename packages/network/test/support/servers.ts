import Promise from 'bluebird'
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

function getCAInformation () {
  return CA.create()
  .then((ca) => {
    return Promise.all([ca.generateServerCertificateKeys('localhost'), ca.getCACertPath()])
  })
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

  start (httpPort: number, httpsPort: number) {
    return Promise.join(
      createExpressApp((req) => this.lastRequestHeaders = req.headers),
      getCAInformation(),
    )
    .spread((app: Express.Application, [serverCertificateKeys, caCertificatePath]: [serverCertificateKeys: string[], caCertificatePath: string]) => {
      this.httpServer = Promise.promisifyAll(
        allowDestroy(http.createServer(app)),
      ) as http.Server & AsyncServer

      this.wsServer = new SocketIOServer(this.httpServer)

      this.caCertificatePath = caCertificatePath
      this.https = { cert: serverCertificateKeys[0], key: serverCertificateKeys[1] }
      this.httpsServer = Promise.promisifyAll(
        allowDestroy(https.createServer(this.https, <http.RequestListener>app)),
      ) as https.Server & AsyncServer

      this.wssServer = new SocketIOServer(this.httpsServer)

      ;[this.wsServer, this.wssServer].map((ws) => {
        ws.on('connection', onWsConnection)
      })

      // @ts-skip
      return Promise.join(
        this.httpServer.listenAsync(httpPort),
        this.httpsServer.listenAsync(httpsPort),
      )
      .return()
    })
  }

  stop () {
    return Promise.join(
      this.httpServer.destroyAsync(),
      this.httpsServer.destroyAsync(),
    )
  }
}
