import express from 'express'
import { CA } from '@packages/https-proxy'
import http from 'http'
import https from 'https'
import Io from '@packages/socket'
import Promise from 'bluebird'
import { allowDestroy } from '../../lib/allow-destroy'

export interface AsyncServer {
  closeAsync: () => Promise<void>
  destroyAsync: () => Promise<void>
  listenAsync: (port) => Promise<void>
}

function createExpressApp () {
  const app: express.Application = express()

  app.get('/get', (req, res) => {
    res.send('It worked!')
  })

  app.get('/empty-response', (req, res) => {
    // ERR_EMPTY_RESPONSE in Chrome
    setTimeout(() => res.connection.destroy(), 100)
  })

  return app
}

function getLocalhostCertKeys () {
  return CA.create()
  .then((ca) => ca.generateServerCertificateKeys('localhost'))
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

  start (httpPort: number, httpsPort: number) {
    return Promise.join(
      createExpressApp(),
      getLocalhostCertKeys(),
    )
    .spread((app: Express.Application, [cert, key]: string[]) => {
      this.httpServer = Promise.promisifyAll(
        allowDestroy(http.createServer(app)),
      ) as http.Server & AsyncServer

      this.wsServer = Io.server(this.httpServer)

      this.https = { cert, key }
      this.httpsServer = Promise.promisifyAll(
        allowDestroy(https.createServer(this.https, <http.RequestListener>app)),
      ) as https.Server & AsyncServer

      this.wssServer = Io.server(this.httpsServer)

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
