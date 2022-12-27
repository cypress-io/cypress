import Bluebird from 'bluebird'
import httpsProxy from '@packages/https-proxy'
import { OpenServerOptions, ServerBase } from '@packages/server/lib/server-base'
import appData from '@packages/server/lib/util/app_data'
import type { SocketCt } from './socket-ct'
import type { Cfg } from '@packages/server/lib/project-base'
import { graphqlWS } from '@packages/graphql/src/makeGraphQLServer'

type WarningErr = Record<string, any>

export class ServerCt extends ServerBase<SocketCt> {
  open (config: Cfg, options: OpenServerOptions) {
    return super.open(config, { ...options, testingType: 'component' })
  }

  createServer (app, config, onWarning): Bluebird<[number, WarningErr?]> {
    return new Bluebird((resolve, reject) => {
      const { port, baseUrl, socketIoRoute } = config

      this._server = this._createHttpServer(app)
      this.server.on('connect', this.onConnect.bind(this))
      this.server.on('upgrade', (req, socket, head) => this.onUpgrade(req, socket, head, socketIoRoute))

      this._graphqlWS = graphqlWS(this.server, `${socketIoRoute}-graphql`)

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

          // once we open set the domain to root by default
          // which prevents a situation where navigating
          // to http sites redirects to /__/ cypress
          this._remoteStates.set(baseUrl)

          return resolve([port])
        })
      })
    })
  }

  destroyAut () {
    return this.socket.destroyAut()
  }
}
