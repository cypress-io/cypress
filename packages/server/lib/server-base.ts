// @ts-nocheck

require('./cwd')

import Bluebird from 'bluebird'
import compression from 'compression'
import Debug from 'debug'
import evilDns from 'evil-dns'
import express from 'express'
import http from 'http'
import httpProxy from 'http-proxy'
import _ from 'lodash'
import url from 'url'
import httpsProxy from '@packages/https-proxy'
import { netStubbingState, NetStubbingState } from '@packages/net-stubbing'
import { agent, cors, uri } from '@packages/network'
import { NetworkProxy } from '@packages/proxy'
import errors from './errors'
import logger from './logger'
import Request from './request'
import { SocketE2E } from './socket-e2e'
import templateEngine from './template_engine'
import origin from './util/origin'
import { allowDestroy, DestroyableHttpServer } from './util/server_destroy'
import { SocketAllowed } from './util/socket_allowed'

const ALLOWED_PROXY_BYPASS_URLS = [
  '/',
  '/__cypress/runner/cypress_runner.css',
  '/__cypress/runner/cypress_runner.js', // TODO: fix this
  '/__cypress/static/favicon.ico',
]
const DEFAULT_DOMAIN_NAME = 'localhost'
const fullyQualifiedRe = /^https?:\/\//

const debug = Debug('cypress:server:server-base')

const _isNonProxiedRequest = (req) => {
  // proxied HTTP requests have a URL like: "http://example.com/foo"
  // non-proxied HTTP requests have a URL like: "/foo"
  return req.proxiedUrl.startsWith('/')
}

const _forceProxyMiddleware = function (clientRoute) {
  // normalize clientRoute to help with comparison
  const trimmedClientRoute = _.trimEnd(clientRoute, '/')

  return function (req, res, next) {
    const trimmedUrl = _.trimEnd(req.proxiedUrl, '/')

    if (_isNonProxiedRequest(req) && !ALLOWED_PROXY_BYPASS_URLS.includes(trimmedUrl) && (trimmedUrl !== trimmedClientRoute)) {
      // this request is non-proxied and non-allowed, redirect to the runner error page
      return res.redirect(clientRoute)
    }

    return next()
  }
}

const setProxiedUrl = function (req) {
  // proxiedUrl is the full URL with scheme, host, and port
  // it will only be fully-qualified if the request was proxied.

  // this function will set the URL of the request to be the path
  // only, which can then be used to proxy the request.

  // bail if we've already proxied the url
  if (req.proxiedUrl) {
    return
  }

  // backup the original proxied url
  // and slice out the host/origin
  // and only leave the path which is
  // how browsers would normally send
  // use their url
  req.proxiedUrl = uri.removeDefaultPort(req.url).format()

  req.url = uri.getPath(req.url)
}

const notSSE = (req, res) => {
  return (req.headers.accept !== 'text/event-stream') && compression.filter(req, res)
}

export class ServerBase {
  private _middleware
  protected _netStubbingState: NetStubbingState | null
  protected _baseUrl: string | null
  protected _fileServer
  protected isListening: boolean
  protected _socketAllowed: SocketAllowed
  protected _httpsProxy: httpsProxy | null
  protected _server: DestroyableHttpServer | null
  protected _socket: SocketE2E
  protected _request: Request
  protected _nodeProxy: httpProxy | null
  protected _networkProxy: NetworkProxy | null

  constructor () {
    this.isListening = false
    this._socketAllowed = new SocketAllowed()
    this._request = Request()
    this._middleware = null
    this._networkProxy = null
    this._netStubbingState = null
    this._server = null
    this._socket = null
    this._baseUrl = null
    this._nodeProxy = null
    this._fileServer = null
    this._httpsProxy = null
  }

  createExpressApp (config) {
    const { morgan, clientRoute } = config
    const app = express()

    // set the cypress config from the cypress.json file
    app.set('view engine', 'html')

    // since we use absolute paths, configure express-handlebars to not automatically find layouts
    // https://github.com/cypress-io/cypress/issues/2891
    app.engine('html', templateEngine.render)

    // handle the proxied url in case
    // we have not yet started our websocket server
    app.use((req, res, next) => {
      setProxiedUrl(req)

      // useful for tests
      if (this._middleware) {
        this._middleware(req, res)
      }

      // always continue on

      return next()
    })

    app.use(_forceProxyMiddleware(clientRoute))

    app.use(require('cookie-parser')())
    app.use(compression({ filter: notSSE }))
    if (morgan) {
      app.use(require('morgan')('dev'))
    }

    // errorhandler
    app.use(require('errorhandler')())

    // remove the express powered-by header
    app.disable('x-powered-by')

    return app
  }

  getHttpServer () {
    return this._server
  }

  portInUseErr (port) {
    const e = errors.get('PORT_IN_USE_SHORT', port)

    e.port = port
    e.portInUse = true

    return e
  }

  createNetworkProxy (config, getRemoteState) {
    const getFileServerToken = () => {
      return this._fileServer.token
    }

    this._netStubbingState = netStubbingState()
    this._networkProxy = new NetworkProxy({
      config,
      getRemoteState,
      getFileServerToken,
      socket: this._socket,
      netStubbingState: this._netStubbingState,
      request: this._request,
    })
  }

  createHosts (hosts = {}) {
    return _.each(hosts, (ip, host) => {
      return evilDns.add(host, ip)
    })
  }

  _createHttpServer (app): DestroyableHttpServer {
    const svr = http.createServer(app)

    allowDestroy(svr)

    return svr
  }

  _port () {
    return this._server?.address()?.port
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

  _normalizeReqUrl (server) {
    // because socket.io removes all of our request
    // events, it forces the socket.io traffic to be
    // handled first.
    // however we need to basically do the same thing
    // it does and after we call into socket.io go
    // through and remove all request listeners
    // and change the req.url by slicing out the host
    // because the browser is in proxy mode
    const listeners = server.listeners('request').slice(0)

    server.removeAllListeners('request')

    return server.on('request', (req, res) => {
      setProxiedUrl(req)

      return this._callRequestListeners(server, listeners, req, res)
    })
  }

  _getRemoteState () {
    // {
    //   origin: "http://localhost:2020"
    //   fileServer:
    //   strategy: "file"
    //   domainName: "localhost"
    //   props: null
    // }

    // {
    //   origin: "https://foo.google.com"
    //   strategy: "http"
    //   domainName: "google.com"
    //   props: {
    //     port: 443
    //     tld: "com"
    //     domain: "google"
    //   }
    // }

    const props = _.extend({}, {
      auth: this._remoteAuth,
      props: this._remoteProps,
      origin: this._remoteOrigin,
      strategy: this._remoteStrategy,
      visiting: this._remoteVisitingUrl,
      domainName: this._remoteDomainName,
      fileServer: this._remoteFileServer,
    })

    debug('Getting remote state: %o', props)

    return props
  }

  _onDomainSet (fullyQualifiedUrl, options = {}) {
    const l = (type, val) => {
      return debug('Setting', type, val)
    }

    this._remoteAuth = options.auth

    l('remoteAuth', this._remoteAuth)

    // if this isn't a fully qualified url
    // or if this came to us as <root> in our tests
    // then we know to go back to our default domain
    // which is the localhost server
    if ((fullyQualifiedUrl === '<root>') || !fullyQualifiedRe.test(fullyQualifiedUrl)) {
      this._remoteOrigin = `http://${DEFAULT_DOMAIN_NAME}:${this._port()}`
      this._remoteStrategy = 'file'
      this._remoteFileServer = `http://${DEFAULT_DOMAIN_NAME}:${(this._fileServer != null ? this._fileServer.port() : undefined)}`
      this._remoteDomainName = DEFAULT_DOMAIN_NAME
      this._remoteProps = null

      l('remoteOrigin', this._remoteOrigin)
      l('remoteStrategy', this._remoteStrategy)
      l('remoteHostAndPort', this._remoteProps)
      l('remoteDocDomain', this._remoteDomainName)
      l('remoteFileServer', this._remoteFileServer)
    } else {
      this._remoteOrigin = origin(fullyQualifiedUrl)

      this._remoteStrategy = 'http'

      this._remoteFileServer = null

      // set an object with port, tld, and domain properties
      // as the remoteHostAndPort
      this._remoteProps = cors.parseUrlIntoDomainTldPort(this._remoteOrigin)

      this._remoteDomainName = _.compact([this._remoteProps.domain, this._remoteProps.tld]).join('.')

      l('remoteOrigin', this._remoteOrigin)
      l('remoteHostAndPort', this._remoteProps)
      l('remoteDocDomain', this._remoteDomainName)
    }

    return this._getRemoteState()
  }

  proxyWebsockets (proxy, socketIoRoute, req, socket, head) {
    // bail if this is our own namespaced socket.io request

    if (req.url.startsWith(socketIoRoute)) {
      if (!this._socketAllowed.isRequestAllowed(req)) {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\nRequest not made via a Cypress-launched browser.')
        socket.end()
      }

      // we can return here either way, if the socket is still valid socket.io will hook it up
      return
    }

    const host = req.headers.host

    if (host) {
      // get the protocol using req.connection.encrypted
      // get the port & hostname from host header
      const fullUrl = `${req.connection.encrypted ? 'https' : 'http'}://${host}`
      const { hostname, protocol } = url.parse(fullUrl)
      const { port } = cors.parseUrlIntoDomainTldPort(fullUrl)

      const onProxyErr = (err, req, res) => {
        return debug('Got ERROR proxying websocket connection', { err, port, protocol, hostname, req })
      }

      return proxy.ws(req, socket, head, {
        secure: false,
        target: {
          host: hostname,
          port,
          protocol,
        },
        agent,
      }, onProxyErr)
    }

    // we can't do anything with this socket
    // since we don't know how to proxy it!
    if (socket.writable) {
      return socket.end()
    }
  }

  reset () {
    this._networkProxy?.reset()

    const baseUrl = this._baseUrl ?? '<root>'

    return this._onDomainSet(baseUrl)
  }

  _close () {
    this.reset()

    logger.unsetSettings()

    evilDns.clear()

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
      this._socket?.close(),
      this._fileServer?.close(),
      this._httpsProxy?.close(),
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
}
