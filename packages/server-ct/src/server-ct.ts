// @ts-nocheck

import Bluebird from 'bluebird'
import Debug from 'debug'
import { ServerBase } from '@packages/server/lib/server-base'
import { initializeRoutes } from './routes-ct'
import { Socket } from './socket-ct'

type WarningErr = Record<string, any>

const debug = Debug('cypress:server-ct:server')

export class ServerCt extends ServerBase {
  createRoutes (...args: unknown[]) {
    return initializeRoutes.apply(null, args)
  }

  open (config = {}, specsStore, project, onError, onWarning) {
    debug('server open')

    return Bluebird.try(() => {
      const app = this.createExpressApp(config)

      this._socket = new Socket(config)

      this.createRoutes({
        app,
        config,
        specsStore,
        // onError,
        project,
      })

      return this.createServer(app, config, project, this._request, onWarning)
    })
  }

  createServer (app, config, project, request, onWarning): Bluebird<[number, WarningErr]> {
    return new Bluebird((resolve, reject) => {
      const { port } = config


      const _server = this._server = this._createHttpServer(app)

      const onError = (err) => {
        // if the server bombs before starting
        // and the err no is EADDRINUSE
        // then we know to display the custom err message
        if (err.code === 'EADDRINUSE') {
          return reject(`Port ${port} is already in use`)
        }
      }

      this._server.once('error', onError)

      return this._listen(port, onError)
      .then((port) => {
        return resolve([port])
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

  reset () {
    // TODO: implement this
  }

  sendSpecList (specs) {
    return this._socket && this._socket.sendSpecList(specs)
  }

  startWebsockets (automation, config, options = {}) {
    this._socket.startListening(this._server, automation, config, options)
  }
}
