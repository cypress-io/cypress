import './cwd'
import Bluebird from 'bluebird'
import compression from 'compression'
import Debug from 'debug'
import EventEmitter from 'events'
import evilDns from 'evil-dns'
import express, { Express } from 'express'
import http from 'http'
import httpProxy from 'http-proxy'
import _ from 'lodash'
import type { AddressInfo } from 'net'
import url from 'url'
import la from 'lazy-ass'
import type httpsProxy from '@packages/https-proxy'
import { netStubbingState, NetStubbingState } from '@packages/net-stubbing'
import { agent, clientCertificates, cors, httpUtils, uri } from '@packages/network'
import { NetworkProxy, BrowserPreRequest } from '@packages/proxy'
import type { SocketCt } from './socket-ct'
import * as errors from './errors'
import Request from './request'
import type { SocketE2E } from './socket-e2e'
import templateEngine from './template_engine'
import { ensureProp } from './util/class-helpers'
import { allowDestroy, DestroyableHttpServer } from './util/server_destroy'
import { SocketAllowed } from './util/socket_allowed'
import { createInitialWorkers } from '@packages/rewriter'
import type { Cfg } from './project-base'
import type { Browser } from '@packages/server/lib/browsers/types'
import { InitializeRoutes, createCommonRoutes } from './routes'
import { createRoutesE2E } from './routes-e2e'
import { createRoutesCT } from './routes-ct'
import type { FoundSpec } from '@packages/types'
import type { Server as WebSocketServer } from 'ws'
import { RemoteStates } from './remote_states'
import { cookieJar, SerializableAutomationCookie } from './util/cookies'
import { resourceTypeAndCredentialManager, ResourceTypeAndCredentialManager } from './util/resourceTypeAndCredentialManager'

const debug = Debug('cypress:server:server-base')

const _isNonProxiedRequest = (req) => {
  // proxied HTTP requests have a URL like: "http://example.com/foo"
  // non-proxied HTTP requests have a URL like: "/foo"
  return req.proxiedUrl.startsWith('/')
}

const _forceProxyMiddleware = function (clientRoute, namespace = '__cypress') {
  const ALLOWED_PROXY_BYPASS_URLS = [
    '/',
    `/${namespace}/runner/cypress_runner.css`,
    `/${namespace}/runner/cypress_runner.js`, // TODO: fix this
    `/${namespace}/runner/favicon.ico`,
  ]

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

export type WarningErr = Record<string, any>

type FileServer = {
  token: string
  port: () => number
  close: () => void
}

export interface OpenServerOptions {
  SocketCtor: typeof SocketE2E | typeof SocketCt
  testingType: Cypress.TestingType
  onError: any
  onWarning: any
  exit?: boolean
  getCurrentBrowser: () => Browser
  getSpec: () => FoundSpec | null
  shouldCorrelatePreRequests: () => boolean
}

export abstract class ServerBase<TSocket extends SocketE2E | SocketCt> {
  private _middleware
  protected request: Request
  protected isListening: boolean
  protected socketAllowed: SocketAllowed
  protected resourceTypeAndCredentialManager: ResourceTypeAndCredentialManager
  protected _fileServer: FileServer | null
  protected _baseUrl: string | null
  protected _server?: DestroyableHttpServer
  protected _socket?: TSocket
  protected _nodeProxy?: httpProxy
  protected _networkProxy?: NetworkProxy
  protected _netStubbingState?: NetStubbingState
  protected _httpsProxy?: httpsProxy
  protected _graphqlWS?: WebSocketServer
  protected _eventBus: EventEmitter
  protected _remoteStates: RemoteStates
  private getCurrentBrowser: undefined | (() => Browser)

  constructor () {
    this.isListening = false
    // @ts-ignore
    this.request = Request()
    this.socketAllowed = new SocketAllowed()
    this._eventBus = new EventEmitter()
    this._middleware = null
    this._baseUrl = null
    this._fileServer = null

    this._remoteStates = new RemoteStates(() => {
      return {
        serverPort: this._port(),
        fileServerPort: this._fileServer?.port(),
      }
    })

    this.resourceTypeAndCredentialManager = resourceTypeAndCredentialManager
  }

  ensureProp = ensureProp

  get server () {
    return this.ensureProp(this._server, 'open')
  }

  get socket () {
    return this.ensureProp(this._socket, 'open')
  }

  get nodeProxy () {
    return this.ensureProp(this._nodeProxy, 'open')
  }

  get networkProxy () {
    return this.ensureProp(this._networkProxy, 'open')
  }

  get netStubbingState () {
    return this.ensureProp(this._netStubbingState, 'open')
  }

  get httpsProxy () {
    return this.ensureProp(this._httpsProxy, 'open')
  }

  get remoteStates () {
    return this._remoteStates
  }

  setupCrossOriginRequestHandling () {
    this._eventBus.on('cross:origin:cookies', (cookies: SerializableAutomationCookie[]) => {
      this.socket.localBus.once('cross:origin:cookies:received', () => {
        this._eventBus.emit('cross:origin:cookies:received')
      })

      this.socket.toDriver('cross:origin:cookies', cookies)
    })

    this.socket.localBus.on('request:sent:with:credentials', this.resourceTypeAndCredentialManager.set)
  }

  abstract createServer (
    app: Express,
    config: Cfg,
    onWarning: unknown,
  ): Bluebird<[number, WarningErr?]>

  open (config: Cfg, {
    getSpec,
    getCurrentBrowser,
    onError,
    onWarning,
    shouldCorrelatePreRequests,
    testingType,
    SocketCtor,
    exit,
  }: OpenServerOptions) {
    debug('server open')

    la(_.isPlainObject(config), 'expected plain config object', config)

    if (!config.baseUrl && testingType === 'component') {
      throw new Error('ServerCt#open called without config.baseUrl.')
    }

    const app = this.createExpressApp(config)

    this._nodeProxy = httpProxy.createProxyServer({
      target: config.baseUrl && testingType === 'component' ? config.baseUrl : undefined,
    })

    this._socket = new SocketCtor(config) as TSocket

    clientCertificates.loadClientCertificateConfig(config)

    this.createNetworkProxy({
      config,
      remoteStates: this._remoteStates,
      resourceTypeAndCredentialManager: this.resourceTypeAndCredentialManager,
      shouldCorrelatePreRequests,
    })

    if (config.experimentalSourceRewriting) {
      createInitialWorkers()
    }

    this.createHosts(config.hosts)

    const routeOptions: InitializeRoutes = {
      config,
      remoteStates: this._remoteStates,
      nodeProxy: this.nodeProxy,
      networkProxy: this._networkProxy!,
      onError,
      getSpec,
      testingType,
    }

    this.getCurrentBrowser = getCurrentBrowser

    this.setupCrossOriginRequestHandling()

    const runnerSpecificRouter = testingType === 'e2e'
      ? createRoutesE2E(routeOptions)
      : createRoutesCT(routeOptions)

    app.use(runnerSpecificRouter)
    app.use(createCommonRoutes(routeOptions))

    return this.createServer(app, config, onWarning)
  }

  createExpressApp (config) {
    const { morgan, clientRoute, namespace } = config
    const app = express()

    // set the cypress config from the cypress.config.{js,ts,mjs,cjs} file
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

    app.use(_forceProxyMiddleware(clientRoute, namespace))

    app.use(require('cookie-parser')())
    app.use(compression({ filter: notSSE }))
    if (morgan) {
      app.use(this.useMorgan())
    }

    // errorhandler
    app.use(require('errorhandler')())

    // remove the express powered-by header
    app.disable('x-powered-by')

    return app
  }

  useMorgan () {
    return require('morgan')('dev')
  }

  getHttpServer () {
    return this._server
  }

  portInUseErr (port: any) {
    const e = errors.get('PORT_IN_USE_SHORT', port) as any

    e.port = port
    e.portInUse = true

    return e
  }

  createNetworkProxy ({ config, remoteStates, resourceTypeAndCredentialManager, shouldCorrelatePreRequests }) {
    const getFileServerToken = () => {
      return this._fileServer?.token
    }

    this._netStubbingState = netStubbingState()
    // @ts-ignore
    this._networkProxy = new NetworkProxy({
      config,
      shouldCorrelatePreRequests,
      remoteStates,
      getFileServerToken,
      getCookieJar: () => cookieJar,
      socket: this.socket,
      netStubbingState: this.netStubbingState,
      request: this.request,
      serverBus: this._eventBus,
      resourceTypeAndCredentialManager,
    })
  }

  startWebsockets (automation, config, options: Record<string, unknown> = {}) {
    options.onRequest = this._onRequest.bind(this)
    options.netStubbingState = this.netStubbingState
    options.getRenderedHTMLOrigins = this._networkProxy?.http.getRenderedHTMLOrigins
    options.getCurrentBrowser = () => this.getCurrentBrowser?.()

    options.onResetServerState = () => {
      this.networkProxy.reset()
      this.netStubbingState.reset()
      this._remoteStates.reset()
      this.resourceTypeAndCredentialManager.clear()
    }

    const io = this.socket.startListening(this.server, automation, config, options)

    this._normalizeReqUrl(this.server)

    return io
  }

  createHosts (hosts: {[key: string]: string} | null = {}) {
    return _.each(hosts, (ip, host) => {
      return evilDns.add(host, ip)
    })
  }

  addBrowserPreRequest (browserPreRequest: BrowserPreRequest) {
    this.networkProxy.addPendingBrowserPreRequest(browserPreRequest)
  }

  emitRequestEvent (eventName, data) {
    this.socket.toDriver('request:event', eventName, data)
  }

  _createHttpServer (app): DestroyableHttpServer {
    const svr = http.createServer(httpUtils.lenientOptions, app)

    allowDestroy(svr)

    // @ts-ignore
    return svr
  }

  _port = () => {
    return (this.server.address() as AddressInfo).port
  }

  _listen (port, onError) {
    return new Bluebird<number>((resolve) => {
      const listener = () => {
        const address = this.server.address() as AddressInfo

        this.isListening = true

        debug('Server listening on ', address)

        this.server.removeListener('error', onError)

        return resolve(address.port)
      }

      return this.server.listen(port || 0, '127.0.0.1', listener)
    })
  }

  _onRequest (headers, automationRequest, options) {
    // @ts-ignore
    return this.request.sendPromise(headers, automationRequest, options)
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

    server.on('request', (req, res) => {
      setProxiedUrl(req)

      this._callRequestListeners(server, listeners, req, res)
    })
  }

  proxyWebsockets (proxy, socketIoRoute, req, socket, head) {
    // bail if this is our own namespaced socket.io / graphql-ws request

    if (req.url.startsWith(socketIoRoute)) {
      if (!this.socketAllowed.isRequestAllowed(req)) {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\nRequest not made via a Cypress-launched browser.')
        socket.end()
      }

      // we can return here either way, if the socket is still valid socket.io or graphql-ws will hook it up
      return
    }

    const host = req.headers.host

    if (host) {
      // get the protocol using req.connection.encrypted
      // get the port & hostname from host header
      const fullUrl = `${req.connection.encrypted ? 'https' : 'http'}://${host}`
      const { hostname, protocol } = url.parse(fullUrl)
      const { port } = cors.parseUrlIntoHostProtocolDomainTldPort(fullUrl)

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
        headers: {
          'x-cypress-forwarded-from-cypress': true,
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
    this.resourceTypeAndCredentialManager.clear()
    const baseUrl = this._baseUrl ?? '<root>'

    return this._remoteStates.set(baseUrl)
  }

  _close () {
    // bail early we dont have a server or we're not
    // currently listening
    if (!this._server || !this.isListening) {
      return Bluebird.resolve(true)
    }

    this.reset()

    evilDns.clear()

    return this._server.destroyAsync()
    .then(() => {
      this.isListening = false
    })
  }

  close () {
    return Bluebird.all([
      this._close(),
      this._socket?.close(),
      this._fileServer?.close(),
      this._httpsProxy?.close(),
      this._graphqlWS?.close(),
    ])
    .then((res) => {
      this._middleware = null

      return res
    })
  }

  end () {
    return this._socket && this._socket.end()
  }

  async sendFocusBrowserMessage () {
    this._socket && await this._socket.sendFocusBrowserMessage()
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

  onUpgrade (req, socket, head, socketIoRoute) {
    debug('Got UPGRADE request from %s', req.url)

    return this.proxyWebsockets(this.nodeProxy, socketIoRoute, req, socket, head)
  }

  callListeners (req, res) {
    const listeners = this.server.listeners('request').slice(0)

    return this._callRequestListeners(this.server, listeners, req, res)
  }

  onSniUpgrade (req, socket, head) {
    const upgrades = this.server.listeners('upgrade').slice(0)

    return upgrades.map((upgrade) => {
      return upgrade.call(this.server, req, socket, head)
    })
  }

  onConnect (req, socket, head) {
    debug('Got CONNECT request from %s', req.url)

    socket.once('upstream-connected', this.socketAllowed.add)

    return this.httpsProxy.connect(req, socket, head)
  }
}
