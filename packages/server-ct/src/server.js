const _ = require('lodash')
const http = require('http')
const debug = require('debug')('cypress:server-ct:server')
const express = require('express')
const Bluebird = require('bluebird')

const allowDestroy = require('@packages/server/lib/util/server_destroy')
const templateEngine = require('@packages/server/lib/template_engine')
const Socket = require('./socket')

class Server {
  constructor () {
    if (!(this instanceof Server)) {
      return new Server()
    }

    this._request = null
    this._middleware = null
    this._server = null
    this._socket = null
    this._baseUrl = null
    this._nodeProxy = null
    this._fileServer = null
    this._httpsProxy = null
    this._urlResolver = null
  }

  createExpressApp (config) {
    const { morgan } = config
    const app = express()

    // set the cypress config from the cypress.json file
    app.set('view engine', 'html')

    // since we use absolute paths, configure express-handlebars to not automatically find layouts
    // https://github.com/cypress-io/cypress/issues/2891
    app.engine('html', templateEngine.render)

    app.use(require('cookie-parser')())

    if (morgan) {
      app.use(require('morgan')('dev'))
    }

    // errorhandler
    app.use(require('errorhandler')())

    // remove the express powered-by header
    app.disable('x-powered-by')

    return app
  }

  createRoutes (...args) {
    return require('./routes').apply(null, args)
  }

  getHttpServer () {
    return this._server
  }

  open (config = {}, project, onError, onWarning) {
    debug('server open')

    return Bluebird.try(() => {
      const app = this.createExpressApp(config)

      this._socket = new Socket(config)

      this.createRoutes({
        app,
        config,
        // onError,
        project,
      })

      return this.createServer(app, config, project, this._request, onWarning)
    })
  }

  createServer (app, config, project, request, onWarning) {
    return new Bluebird((resolve, reject) => {
      const { port } = config

      this._server = http.createServer(app)

      allowDestroy(this._server)

      const onError = (err) => {
        // if the server bombs before starting
        // and the err no is EADDRINUSE
        // then we know to display the custom err message
        if (err.code === 'EADDRINUSE') {
          return reject(this.portInUseErr(port))
        }
      }

      this._server.once('error', onError)

      return this._listen(port, onError)
      .then((port) => {
        return resolve([port])
      })
    })
  }

  _port () {
    return _.chain(this._server).invoke('address').get('port').value()
  }

  _listen (port, onError) {
    return new Bluebird((resolve) => {
      const listener = () => {
        const address = this._server.address()

        this.isListening = true

        debug('Server listening on ', address)

        this._server.removeListener('error', onError)

        return resolve(address.port)
      }

      return this._server.listen(port || 0, '127.0.0.1', listener)
    })
  }

  _onRequest (headers, automationRequest, options) {
    return this._request.sendPromise(headers, automationRequest, options)
  }

  _callRequestListeners (server, listeners, req, res) {
    return listeners.map((listener) => {
      return listener.call(server, req, res)
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

  close () {
    return Bluebird.join(
      this._close(),
      this._socket != null ? this._socket.close() : undefined,
      this._fileServer != null ? this._fileServer.close() : undefined,
      this._httpsProxy != null ? this._httpsProxy.close() : undefined,
    )
    .then(() => {
      this._middleware = null
    })
  }

  end () {
    return this._socket && this._socket.end()
  }

  changeToUrl (url) {
    return this._socket && this._socket.changeToUrl(url)
  }

  onTestFileChange (filePath) {
    return this._socket && this._socket.onTestFileChange(filePath)
  }

  onRequest (fn) {
    this._middleware = fn
  }

  onNextRequest (fn) {
    return this.onRequest((...args) => {
      fn.apply(this, args)

      this._middleware = null
    })
  }

  startWebsockets (config, options = {}) {
    this._socket.startListening(this._server, config, options)
  }
}

module.exports = Server
