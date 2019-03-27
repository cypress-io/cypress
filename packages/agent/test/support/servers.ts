import * as http from 'http'
import * as https from 'https'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as express from 'express'
import * as Promise from 'bluebird'
import { CA } from '@packages/https-proxy'
import * as Io from '@packages/socket'

function createExpressApp() {
  const app = express()

  app.get('/get', (req, res) => {
    res.send('It worked!')
  })

  app.get('/empty-response', (req, res) => {
    // ERR_EMPTY_RESPONSE in Chrome
    setTimeout(() => res.connection.destroy(), 100)
  })

  return app
}

function getLocalhostCertKeys() {
  return CA.create(fs.mkdtempSync(path.join(os.tmpdir(), 'cy-test-')))
  .then(ca => ca.generateServerCertificateKeys('localhost'))
}

function onWsConnection(socket) {
  socket.send('It worked!')
}

export class Servers {
  https: { cert: string, key: string }
  httpServer: http.Server
  httpsServer: https.Server
  wsServer: any
  wssServer: any

  start(httpPort: number, httpsPort: number) {
    return Promise.join(
      createExpressApp(),
      getLocalhostCertKeys,
    )
    .spread((app: Express.Application, [cert, key]: string[]) => {
      this.httpServer = http.createServer(app)
      this.wsServer = Io.server(this.httpServer)

      this.httpsServer = https.createServer({ cert, key }, <http.RequestListener>app)
      this.wssServer = Io.server(this.httpsServer)

      ;[this.wsServer, this.wssServer].map(ws => {
        ws.on('connection', onWsConnection)
      })

      return Promise.join(
        new Promise((resolve) => this.httpServer.listen(httpPort, resolve)),
        new Promise((resolve) => this.httpsServer.listen(httpsPort, resolve))
      )
      .return()
    })
  }

  stop() {
    return Promise.join(
      new Promise((resolve) => this.httpServer.close(resolve)),
      new Promise((resolve) => this.httpsServer.close(resolve))
    )
  }
}
