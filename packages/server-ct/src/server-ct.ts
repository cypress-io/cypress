// @ts-nocheck

import Bluebird from 'bluebird'
import Debug from 'debug'
import httpProxy from 'http-proxy'
import httpsProxy from '@packages/https-proxy'
import logger from '@packages/server/lib/logger'
import { ServerBase } from '@packages/server/lib/server-base'
import appData from '@packages/server/lib/util/app_data'
import { initializeRoutes } from './routes-ct'
import { SocketCt } from './socket-ct'

type WarningErr = Record<string, any>

const debug = Debug('cypress:server-ct:server')

export class ServerCt extends ServerBase {
  createRoutes (...args: unknown[]) {
    return initializeRoutes.apply(null, args)
  }

  open (config = {}, specsStore, project, onError, onWarning) {
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

      this.createRoutes({
        app,
        config,
        specsStore,
        nodeProxy: this._nodeProxy,
        networkProxy: this._networkProxy,
        onError,
        project,
      })

      return this.createServer(app, config, project, this._request, onWarning)
    })
  }

  createServer (app, config, project, request, onWarning): Bluebird<[number, WarningErr]> {
    return new Bluebird((resolve, reject) => {
      const { port, socketIoRoute, baseUrl } = config

      const _server = this._server = this._createHttpServer(app)

      const onError = (err) => {
        // if the server bombs before starting
        // and the err no is EADDRINUSE
        // then we know to display the custom err message
        if (err.code === 'EADDRINUSE') {
          return reject(`Port ${port} is already in use`)
        }
      }

      const onUpgrade = (req, socket, head) => {
        debug('Got UPGRADE request from %s', req.url)

        return this.proxyWebsockets(this._nodeProxy, socketIoRoute, req, socket, head)
      }

      const callListeners = (req, res) => {
        const listeners = _server.listeners('request').slice(0)

        return this._callRequestListeners(_server, listeners, req, res)
      }

      const onSniUpgrade = (req, socket, head) => {
        const upgrades = _server.listeners('upgrade').slice(0)

        return upgrades.map((upgrade) => {
          return upgrade.call(_server, req, socket, head)
        })
      }

      this._server.on('connect', (req, socket, head) => {
        debug('Got CONNECT request from %s', req.url)

        socket.once('upstream-connected', this._socketAllowed.add)

        return this._httpsProxy.connect(req, socket, head)
      })

      this._server.on('upgrade', onUpgrade)

      this._server.once('error', onError)

      return this._listen(port, onError)
      .then((port) => {
        httpsProxy.create(appData.path('proxy'), port, {
          onRequest: callListeners,
          onUpgrade: onSniUpgrade,
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

  _close () {
    // bail early we dont have a server or we're not
    // currently listening
    if (!this._server || !this.isListening) {
      return Bluebird.resolve()
    }

    return this._server.destroyAsync()
    .then(() => {
      this.isListening = false
    })
  }

  sendSpecList (specs) {
    return this._socket && this._socket.sendSpecList(specs)
  }

  startWebsockets (automation, config, options = {}) {
    this._socket.startListening(this._server, automation, config, options)
  }
}
