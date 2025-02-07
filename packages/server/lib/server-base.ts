import './cwd'
import Bluebird from 'bluebird'
import compression from 'compression'
import Debug from 'debug'
import EventEmitter from 'events'
import evilDns from 'evil-dns'
import * as ensureUrl from './util/ensure-url'
import express, { Express } from 'express'
import http from 'http'
import httpProxy from 'http-proxy'
import _ from 'lodash'
import type { AddressInfo } from 'net'
import url from 'url'
import la from 'lazy-ass'
import httpsProxy from '@packages/https-proxy'
import { getRoutesForRequest, netStubbingState, NetStubbingState } from '@packages/net-stubbing'
import { agent, clientCertificates, cors, httpUtils, uri, concatStream, DocumentDomainInjection } from '@packages/network'
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
import type { Browser } from './browsers/types'
import { InitializeRoutes, createCommonRoutes } from './routes'
import type { FoundSpec, ProtocolManagerShape, TestingType } from '@packages/types'
import type { Server as WebSocketServer } from 'ws'
import { RemoteStates, RemoteState } from './remote_states'
import { cookieJar, SerializableAutomationCookie } from './util/cookies'
import { resourceTypeAndCredentialManager, ResourceTypeAndCredentialManager } from './util/resourceTypeAndCredentialManager'
import fileServer from './file_server'
import appData from './util/app_data'
import { graphqlWS } from '@packages/graphql/src/makeGraphQLServer'
import statusCode from './util/status_code'
import headersUtil from './util/headers'
import stream from 'stream'
import isHtml from 'is-html'
import type Protocol from 'devtools-protocol'
import type { ServiceWorkerClientEvent } from '@packages/proxy/lib/http/util/service-worker-manager'
import type { Automation } from './automation'
import type { AutomationCookie } from './automation/cookies'

const debug = Debug('cypress:server:server-base')

const fullyQualifiedRe = /^https?:\/\//
const htmlContentTypesRe = /^(text\/html|application\/xhtml)/i

const isResponseHtml = function (contentType, responseBuffer) {
  if (contentType) {
    // want to match anything starting with 'text/html'
    // including 'text/html;charset=utf-8' and 'Text/HTML'
    // https://github.com/cypress-io/cypress/issues/8506
    return htmlContentTypesRe.test(contentType)
  }

  const body = _.invoke(responseBuffer, 'toString')

  if (body) {
    return isHtml(body)
  }

  return false
}

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
  getCurrentBrowser: () => Browser
  getSpec: () => FoundSpec | null
  shouldCorrelatePreRequests: () => boolean
}

export class ServerBase<TSocket extends SocketE2E | SocketCt> {
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
  private _urlResolver: Bluebird<Record<string, any>> | null = null
  private testingType?: TestingType
  private _documentDomainInjection: DocumentDomainInjection

  constructor (config: Cfg) {
    this.isListening = false
    // @ts-ignore
    this.request = Request()
    this.socketAllowed = new SocketAllowed()
    this._eventBus = new EventEmitter()
    this._middleware = null
    this._baseUrl = null
    this._fileServer = null

    this._documentDomainInjection = DocumentDomainInjection.InjectionBehavior(config)

    const remoteStatePorts = () => {
      return {
        server: this._port(),
        fileServer: this._fileServer?.port(),
      }
    }

    this._remoteStates = new RemoteStates(remoteStatePorts, this._documentDomainInjection)

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

  setProtocolManager (protocolManager: ProtocolManagerShape | undefined) {
    this._socket?.setProtocolManager(protocolManager)
    this._networkProxy?.setProtocolManager(protocolManager)
  }

  setPreRequestTimeout (timeout: number) {
    this._networkProxy?.setPreRequestTimeout(timeout)
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

  createServer (
    app: Express,
    config: Cfg,
    onWarning: unknown,
  ): Bluebird<[number, WarningErr?]> {
    return new Bluebird((resolve, reject) => {
      const { port, fileServerFolder, socketIoRoute, baseUrl } = config

      this._server = this._createHttpServer(app)

      const onError = (err) => {
        // if the server bombs before starting
        // and the err no is EADDRINUSE
        // then we know to display the custom err message
        if (err.code === 'EADDRINUSE') {
          return reject(this.portInUseErr(port))
        }
      }

      debug('createServer connecting to server')

      this.server.on('connect', this.onConnect.bind(this))
      this.server.on('upgrade', (req, socket, head) => this.onUpgrade(req, socket, head, socketIoRoute))
      this.server.once('error', onError)

      this._graphqlWS = graphqlWS(this.server, `${socketIoRoute}-graphql`)

      return this._listen(port, (err) => {
        // if the server bombs before starting
        // and the err no is EADDRINUSE
        // then we know to display the custom err message
        if (err.code === 'EADDRINUSE') {
          return reject(this.portInUseErr(port))
        }
      })
      .then((port) => {
        return Bluebird.all([
          httpsProxy.create(appData.path('proxy'), port, {
            onRequest: this.callListeners.bind(this),
            onUpgrade: this.onSniUpgrade.bind(this),
          }),

          fileServer.create(fileServerFolder),
        ])
        .spread((httpsProxy, fileServer) => {
          this._httpsProxy = httpsProxy
          this._fileServer = fileServer

          // if we have a baseUrl let's go ahead
          // and make sure the server is connectable!
          if (baseUrl) {
            this._baseUrl = baseUrl

            if (config.isTextTerminal) {
              return this._retryBaseUrlCheck(baseUrl, onWarning)
              .return(null)
              .catch((e) => {
                debug(e)

                return reject(errors.get('CANNOT_CONNECT_BASE_URL'))
              })
            }

            return ensureUrl.isListening(baseUrl)
            .return(null)
            .catch((err) => {
              debug('ensuring baseUrl (%s) errored: %o', baseUrl, err)

              return errors.get('CANNOT_CONNECT_BASE_URL_WARNING', baseUrl)
            })
          }
        }).then((warning) => {
          // once we open set the domain to root by default
          // which prevents a situation where navigating
          // to http sites redirects to /__/ cypress
          this._remoteStates.set(baseUrl != null ? baseUrl : '<root>')

          return resolve([port, warning])
        })
      })
    })
  }

  open (config: Cfg, {
    getSpec,
    getCurrentBrowser,
    onError,
    onWarning,
    shouldCorrelatePreRequests,
    testingType,
    SocketCtor,
  }: OpenServerOptions) {
    debug('server open')
    this.testingType = testingType

    la(_.isPlainObject(config), 'expected plain config object', config)

    if (!config.baseUrl && testingType === 'component') {
      throw new Error('Server#open called without config.baseUrl.')
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
      getCurrentBrowser,
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

  createNetworkProxy ({ config, remoteStates, resourceTypeAndCredentialManager, shouldCorrelatePreRequests, getCurrentBrowser }) {
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
      getCurrentBrowser,
    })
  }

  startWebsockets (automation: Automation, config, options: Record<string, unknown> = {}) {
    // e2e only?
    options.onResolveUrl = this._onResolveUrl.bind(this)

    options.onRequest = this._onRequest.bind(this)
    options.netStubbingState = this.netStubbingState
    options.getRenderedHTMLOrigins = this._networkProxy?.http.getRenderedHTMLOrigins
    options.getCurrentBrowser = () => this.getCurrentBrowser?.()

    options.onResetServerState = () => {
      this.networkProxy.reset({ resetBetweenSpecs: false })
      this.netStubbingState.reset()
      this._remoteStates.reset()
      this.resourceTypeAndCredentialManager.clear()
    }

    const ios = this.socket.startListening(this.server, automation, config, options)

    this._normalizeReqUrl(this.server)

    return ios
  }

  createHosts (hosts: {[key: string]: string} | null = {}) {
    return _.each(hosts, (ip, host) => {
      return evilDns.add(host, ip)
    })
  }

  async addBrowserPreRequest (browserPreRequest: BrowserPreRequest) {
    await this.networkProxy.addPendingBrowserPreRequest(browserPreRequest)
  }

  removeBrowserPreRequest (requestId: string) {
    this.networkProxy.removePendingBrowserPreRequest(requestId)
  }

  getBrowserPreRequests () {
    return this._networkProxy?.getPendingBrowserPreRequests()
  }

  emitRequestEvent (eventName, data) {
    this.socket.toDriver('request:event', eventName, data)
  }

  addPendingUrlWithoutPreRequest (downloadUrl: string) {
    this.networkProxy.addPendingUrlWithoutPreRequest(downloadUrl)
  }

  updateServiceWorkerRegistrations (data: Protocol.ServiceWorker.WorkerRegistrationUpdatedEvent) {
    this.networkProxy.updateServiceWorkerRegistrations(data)
  }

  updateServiceWorkerVersions (data: Protocol.ServiceWorker.WorkerVersionUpdatedEvent) {
    this.networkProxy.updateServiceWorkerVersions(data)
  }

  updateServiceWorkerClientSideRegistrations (data: { scriptURL: string, initiatorOrigin: string }) {
    this.networkProxy.updateServiceWorkerClientSideRegistrations(data)
  }

  handleServiceWorkerClientEvent (event: ServiceWorkerClientEvent) {
    this.networkProxy.handleServiceWorkerClientEvent(event)
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

  _onRequest (userAgent, automationRequest, options) {
    // @ts-ignore
    return this.request.sendPromise(userAgent, automationRequest, options)
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
    this._networkProxy?.reset({ resetBetweenSpecs: true })
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

  _retryBaseUrlCheck (baseUrl, onWarning) {
    return ensureUrl.retryIsListening(baseUrl, {
      retryIntervals: [3000, 3000, 4000],
      onRetry ({ attempt, delay, remaining }) {
        const warning = errors.get('CANNOT_CONNECT_BASE_URL_RETRYING', {
          remaining,
          attempt,
          delay,
          baseUrl,
        })

        return onWarning(warning)
      },
    })
  }

  _onResolveUrl (urlStr, userAgent, automationRequest: (message: string, data: Record<string, unknown>) => Bluebird<any>, options: Record<string, any> = { headers: {} }) {
    debug('resolving visit %o', {
      url: urlStr,
      userAgent,
      options,
    })

    // always clear buffers - reduces the possibility of a random HTTP request
    // accidentally retrieving buffered content at the wrong time
    this._networkProxy?.reset()

    const startTime = Date.now()

    // if we have an existing url resolver
    // in flight then cancel it
    if (this._urlResolver) {
      this._urlResolver.cancel()
    }

    const request = this.request

    let handlingLocalFile = false
    const previousRemoteState = this._remoteStates.current()
    const previousRemoteStateIsPrimary = this._remoteStates.isPrimarySuperDomainOrigin(previousRemoteState.origin)
    const primaryRemoteState = this._remoteStates.getPrimary()

    // nuke any hashes from our url since
    // those those are client only and do
    // not apply to http requests
    urlStr = url.parse(urlStr)
    urlStr.hash = null
    urlStr = urlStr.format()

    const originalUrl = urlStr

    let reqStream = null
    let currentPromisePhase = null

    const runPhase = (fn) => {
      return currentPromisePhase = fn()
    }

    const matchesNetStubbingRoute = (requestOptions) => {
      const proxiedReq = {
        proxiedUrl: requestOptions.url,
        resourceType: 'document',
        ..._.pick(requestOptions, ['headers', 'method']),
        // TODO: add `body` here once bodies can be statically matched
      }

      // @ts-ignore
      const iterator = getRoutesForRequest(this.netStubbingState?.routes, proxiedReq)
      // If the iterator is exhausted (done) on the first try, then 0 matches were found
      const zeroMatches = iterator.next().done

      return !zeroMatches
    }

    let p

    return this._urlResolver = (p = new Bluebird<Record<string, any>>((resolve, reject, onCancel) => {
      let urlFile

      onCancel?.(() => {
        p.currentPromisePhase = currentPromisePhase
        p.reqStream = reqStream

        _.invoke(reqStream, 'abort')

        return _.invoke(currentPromisePhase, 'cancel')
      })

      const redirects: any[] = []
      let newUrl: string | null = null

      if (!fullyQualifiedRe.test(urlStr)) {
        handlingLocalFile = true

        options.headers['x-cypress-authorization'] = this._fileServer?.token

        const state = this._remoteStates.set(urlStr, options)

        // TODO: Update url.resolve signature to not use deprecated methods
        urlFile = state?.fileServer ? url.resolve(state.fileServer, urlStr) : url.resolve('', urlStr)
        urlStr = state?.origin ? url.resolve(state.origin, urlStr) : url.resolve('', urlStr)
      }

      const onReqError = (err) => {
        // only restore the previous state
        // if our promise is still pending
        if (p.isPending()) {
          restorePreviousRemoteState(previousRemoteState, previousRemoteStateIsPrimary)
        }

        return reject(err)
      }

      const onReqStreamReady = (str) => {
        reqStream = str

        return str
        .on('error', onReqError)
        .on('response', (incomingRes) => {
          debug(
            'resolve:url headers received, buffering response %o',
            _.pick(incomingRes, 'headers', 'statusCode'),
          )

          if (newUrl == null) {
            newUrl = urlStr
          }

          return runPhase(() => {
            // get the cookies that would be sent with this request so they can be rehydrated
            const hostname = newUrl ? this._documentDomainInjection.getHostname(newUrl) : undefined

            return automationRequest('get:cookies', {
              domain: hostname,
            })
            .then((cookies: (AutomationCookie | null)[]) => {
              const statusIs2xxOrAllowedFailure = () => {
                // is our status code in the 2xx range, or have we disabled failing
                // on status code?
                return statusCode.isOk(incomingRes.statusCode) || options.failOnStatusCode === false
              }

              const isOk = statusIs2xxOrAllowedFailure()
              const contentType = headersUtil.getContentType(incomingRes)

              const details: Record<string, unknown> = {
                isOkStatusCode: isOk,
                contentType,
                url: newUrl,
                status: incomingRes.statusCode,
                cookies,
                statusText: statusCode.getText(incomingRes.statusCode),
                redirects,
                originalUrl,
              }

              // does this response have this cypress header?
              const fp = incomingRes.headers['x-cypress-file-path']

              if (fp) {
                // if so we know this is a local file request
                details.filePath = decodeURI(fp)
              }

              debug('setting details resolving url %o', details)

              const concatStr = concatStream((responseBuffer) => {
                // buffer the entire response before resolving.
                // this allows us to detect & reject ETIMEDOUT errors
                // where the headers have been sent but the
                // connection hangs before receiving a body.

                // if there is not a content-type, try to determine
                // if the response content is HTML-like
                // https://github.com/cypress-io/cypress/issues/1727
                details.isHtml = isResponseHtml(contentType, responseBuffer)

                debug('resolve:url response ended, setting buffer %o', { newUrl, alreadyVisited: options.hasAlreadyVisitedUrl, details })

                details.totalTime = Date.now() - startTime

                // buffer the response and set the remote state if this is a successful html response
                // TODO: think about moving this logic back into the frontend so that the driver can be in control
                // of when to buffer and set the remote state
                if (isOk && details.isHtml) {
                  const originsMatchByPolicy = this._documentDomainInjection.urlsMatch(primaryRemoteState.origin, newUrl || '')

                  const urlDoesNotMatchPolicyBasedOnDomain = options.hasAlreadyVisitedUrl
                    && !originsMatchByPolicy
                    || options.isFromSpecBridge

                  debug('urlDoesNotMatchPolicy?', {
                    urlDoesNotMatchPolicyBasedOnDomain,
                    hasAlreadyVisited: options.hasAlreadyVisited,
                    originsMatchByPolicy,
                    isFromSpecBridge: options.isFromSpecBridge,
                  })

                  if (!handlingLocalFile) {
                    this._remoteStates.set(newUrl as string, options, !urlDoesNotMatchPolicyBasedOnDomain)
                  }

                  const responseBufferStream = new stream.PassThrough({
                    highWaterMark: Number.MAX_SAFE_INTEGER,
                  })

                  responseBufferStream.end(responseBuffer)

                  this._networkProxy?.setHttpBuffer({
                    url: newUrl,
                    stream: responseBufferStream,
                    details,
                    originalUrl,
                    response: incomingRes,
                    urlDoesNotMatchPolicyBasedOnDomain,
                  })
                } else {
                  // TODO: move this logic to the driver too for
                  // the same reasons listed above
                  restorePreviousRemoteState(previousRemoteState, previousRemoteStateIsPrimary)
                }

                details.isPrimarySuperDomainOrigin = this._remoteStates.isPrimarySuperDomainOrigin(newUrl!)

                return resolve(details)
              })

              return str.pipe(concatStr)
            }).catch(onReqError)
          })
        })
      }

      const restorePreviousRemoteState = (previousRemoteState: RemoteState, previousRemoteStateIsPrimary: boolean) => {
        this._remoteStates.set(previousRemoteState, {}, previousRemoteStateIsPrimary)
      }

      // if they're POSTing an object, querystringify their POST body
      if ((options.method === 'POST') && _.isObject(options.body)) {
        options.form = options.body
        delete options.body
      }

      _.assign(options, {
        // turn off gzip since we need to eventually
        // rewrite these contents
        gzip: false,
        url: urlFile != null ? urlFile : urlStr,
        headers: _.assign({
          accept: 'text/html,*/*',
        }, options.headers),
        onBeforeReqInit: runPhase,
        followRedirect (incomingRes) {
          const status = incomingRes.statusCode
          const next = incomingRes.headers.location

          const curr = newUrl != null ? newUrl : urlStr

          newUrl = url.resolve(curr, next)

          redirects.push([status, newUrl].join(': '))

          return true
        },
      })

      if (matchesNetStubbingRoute(options)) {
        // TODO: this is being used to force cy.visits to be interceptable by network stubbing
        // however, network errors will be obfuscated by the proxying so this is not an ideal solution
        _.merge(options, {
          proxy: `http://127.0.0.1:${this._port()}`,
          agent: null,
          headers: {
            'x-cypress-resolving-url': '1',
          },
        })
      }

      debug('sending request with options %o', options)

      return runPhase(() => {
        return request.sendStream(userAgent, automationRequest, options)
        .then((createReqStream) => {
          const stream = createReqStream()

          return onReqStreamReady(stream)
        }).catch(onReqError)
      })
    }))
  }

  destroyAut () {
    if (this.testingType === 'component' && 'destroyAut' in this.socket) {
      return this.socket.destroyAut()
    }

    return
  }
}
