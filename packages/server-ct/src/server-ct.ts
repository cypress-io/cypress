import Bluebird from 'bluebird'
import Debug from 'debug'
import httpProxy from 'http-proxy'
import httpsProxy from '@packages/https-proxy'
import logger from '@packages/server/lib/logger'
import { ServerBase } from '@packages/server/lib/server-base'
import appData from '@packages/server/lib/util/app_data'
import { createRoutes } from './routes-ct'
import { SocketCt } from './socket-ct'

type WarningErr = Record<string, any>

const debug = Debug('cypress:server-ct:server')

export class ServerCt extends ServerBase<SocketCt> {
  open (config, specsStore, project, onError, onWarning) {
    debug('server open')

    return Bluebird.try(() => {
      if (!config.baseUrl) {
        throw new Error('ServerCt#open called without config.baseUrl.')
      }

      const app = this.createExpressApp(config)

      logger.setSettings(config)

      this._nodeProxy = httpProxy.createProxyServer({
        target: config.baseUrl,
      })

      this._socket = new SocketCt(config)

      const getRemoteState = () => {
        return this._getRemoteState()
      }

      this.createNetworkProxy(config, getRemoteState)

      createRoutes({
        app,
        config,
        specsStore,
        nodeProxy: this.nodeProxy,
        networkProxy: this.networkProxy,
        onError,
        project,
      })

      return this.createServer(app, config, project, this.request, onWarning)
    })
  }

  createServer (app, config, project, request, onWarning): Bluebird<[number, WarningErr?]> {
    return new Bluebird((resolve, reject) => {
      const { port, baseUrl, socketIoRoute } = config

      this._server = this._createHttpServer(app)
      this.server.on('connect', this.onConnect.bind(this))
      this.server.on('upgrade', (req, socket, head) => this.onUpgrade(req, socket, head, socketIoRoute))

      return this._listen(port, (err) => {
        if (err.code === 'EADDRINUSE') {
          reject(`Port ${port} is already in use`)
        }

        reject(err)
      })
      .then((port) => {
        httpsProxy.create(appData.path('proxy'), port, {
          onRequest: this.callListeners.bind(this),
          onUpgrade: this.onSniUpgrade.bind(this),
        })
        .then((httpsProxy) => {
          this._httpsProxy = httpsProxy

          // once we open set the domain
          // to root by default
          // which prevents a situation where navigating
          // to http sites redirects to /__/ cypress
          this._onDomainSet(baseUrl)

          return resolve([port])
        })
      })
    })
  }

  sendSpecList (specs) {
    return this.socket.sendSpecList(specs)
  }
}
