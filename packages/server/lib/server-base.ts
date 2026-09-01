import Bluebird from 'bluebird'
import compression from 'compression'
import Debug from 'debug'
import EventEmitter from 'events'
import evilDns from 'evil-dns'
import * as ensureUrl from './util/ensure-url'
import type { Express } from 'express'
import express from 'express'
import http from 'http'
import httpProxy from 'http-proxy'
import _ from 'lodash'
import type { AddressInfo } from 'net'
import url from 'url'
import la from 'lazy-ass'
import { createProxy as createHttpsProxy } from '@packages/https-proxy'
import type { Server as HttpsProxyServer } from '@packages/https-proxy'
import { getRoutesForRequest } from '@packages/network-interception'
import type { NetStubbingState } from '@packages/net-stubbing'
import { DriverInterceptRegistrationAdapter, netStubbingState } from '@packages/net-stubbing'
import { get as fixtureGet } from './fixture'
import { agent, clientCertificates, httpUtils, concatStream } from '@packages/network'
import { DocumentDomainInjection, getPath, getSupportedAcceptEncoding, parseUrlIntoHostProtocolDomainTldPort, removeDefaultPort } from '@packages/network-tools'
import type { NetworkProxy, BrowserPreRequest } from '@packages/proxy'
import type { SocketCt } from './socket-ct'
import * as errors from './errors'
import { Request } from './request'
import type { SocketE2E } from './socket-e2e'
import { render as renderTemplate } from './template_engine'
import { ensureProp } from './util/class-helpers'
import type { DestroyableHttpServer } from './util/server_destroy'
import { allowDestroy } from './util/server_destroy'
import { SocketAllowed } from './util/socket_allowed'
import type { Cfg } from './project-base'
import type { Browser } from './browsers/types'
import type { InitializeRoutes } from './routes'
import { createCommonRoutes } from './routes'
import { SESSIONS_ROUTE_PREFIX, SESSION_ID_HEADER, TAP_GRAPHQL_ROUTE_PREFIX } from '@packages/cypress-sessions'
import { cypressSessions } from './cypress-sessions'
import type { FoundSpec, ProtocolManagerShape, TestingType, ExtraTargetDetach } from '@packages/types'
import { RemoteStates } from '@packages/network-tools'
import type { RemoteState } from '@packages/network-tools'
import type { SerializableAutomationCookie } from './automation/cookie/jar'
import { cookieJar } from './automation/cookie/jar'
import * as fileServer from './file_server'
import type { FileServer } from './file_server'
import * as appData from './util/app_data'
import { graphqlWS } from '@packages/data-context/graphql/makeGraphQLServer'
import type { GraphqlWsHandle } from '@packages/data-context/graphql/makeGraphQLServer'
import * as statusCode from './util/status_code'
import { getContentType } from './util/headers'
import stream from 'stream'
import isHtml from 'is-html'
import type Protocol from 'devtools-protocol'
import type { ServiceWorkerClientEvent } from '@packages/proxy/lib/http/util/service-worker-manager'
import type { Automation } from './automation'
import type { AutomationCookie } from './automation/cookie/automation'
import type { ResourceType, RequestCredentialLevel } from '@packages/proxy'
import { GracefulExit } from './util/graceful-exit'
import { createCdpFetchRuntime, createProxyRuntime } from './network-runtime'
import type { CreateProxyRuntimeDeps, CdpFetchNetworkRuntime, ProxyNetworkRuntime } from './network-runtime'
import type { ICriClient } from './browsers/cdp-protocol/cri-client'
import { CYPRESS_INTERNAL_LOOPBACK_TOKEN_HEADER, cypressInternalLoopbackToken, getTrustedLoopbackUrl, isTrustedInternalLoopback } from './adapters/internal-routes'

const debug = Debug('cypress:server:server-base')

// How long to wait for the browser to acknowledge the service worker bypass
// before navigating anyway. A CDP send is enqueued rather than rejected while
// the connection is reconnecting, and the driver blocks on this before it
// navigates, so a stuck send must not be able to hang the visit.
const SERVICE_WORKER_BYPASS_TIMEOUT_MS = 2000

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

const _hasValidSessionIdHeader = (req): boolean => {
  const provided = req.headers[SESSION_ID_HEADER]
  const current = cypressSessions.getCurrent()?.sessionId

  return Boolean(current) && typeof provided === 'string' && provided === current
}

const _isTapRequest = (req): boolean => {
  const trimmedUrl = _.trimEnd(req.proxiedUrl, '/')

  return trimmedUrl.startsWith(SESSIONS_ROUTE_PREFIX) ||
    (trimmedUrl.startsWith(TAP_GRAPHQL_ROUTE_PREFIX) && _hasValidSessionIdHeader(req))
}

// `isNativeBrowserNetwork`: on that path the browser intercepts its own
// traffic, so nothing transits the proxy and the force-proxy redirect must
// not apply.
export const _forceProxyMiddleware = function (clientRoute, namespace = '__cypress', isNativeBrowserNetwork: () => boolean) {
  const ALLOWED_PROXY_BYPASS_URLS = [
    '/',
    `/${namespace}/runner/cypress_runner.css`,
    `/${namespace}/runner/cypress_runner.js`, // TODO: fix this
    `/${namespace}/runner/favicon.ico`,
  ]

  const isAllowedProxyBypass = (trimmedUrl: string, req) => {
    return ALLOWED_PROXY_BYPASS_URLS.includes(trimmedUrl) || _isTapRequest(req)
  }

  // normalize clientRoute to help with comparison
  const trimmedClientRoute = _.trimEnd(clientRoute, '/')

  return function (req, res, next) {
    // if this request is a non-proxied cy-in-cy request,
    // we need to update the proxiedUrl and allow it to pass through
    // (runs on both network paths — cy-in-cy self tests may use either)
    if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF && _isNonProxiedRequest(req) && req.headers.referer) {
      const referrerUrl = new URL(req.headers.referer)

      req.proxiedUrl = `${referrerUrl.origin}${req.proxiedUrl}`

      return next()
    }

    // CDP Fetch owns browser traffic on the browser (CDP) network path, so
    // path-only requests to the Cypress server are expected — not a sign the
    // browser was launched outside Cypress.
    if (isNativeBrowserNetwork()) {
      return next()
    }

    const trimmedUrl = _.trimEnd(req.proxiedUrl, '/')

    // Trusted loopback from serve-internal-routes: path-only HTTP to Express
    // must reach internal route handlers instead of redirecting to clientRoute.
    // Require the per-process token — AUT content can forge the URL header alone.
    if (isTrustedInternalLoopback(req.headers)) {
      return next()
    }

    if (_isNonProxiedRequest(req) && !isAllowedProxyBypass(trimmedUrl, req) && (trimmedUrl !== trimmedClientRoute)) {
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

  // Loopback requests from serve-internal-routes arrive path-only, but carry
  // the browser's original absolute URL in the loopback header so consumers
  // like the spec-bridge iframe controller can still derive the origin.
  // Only honor the URL when accompanied by the per-process loopback token.
  const loopbackUrl = getTrustedLoopbackUrl(req.headers)

  if (typeof loopbackUrl === 'string' && fullyQualifiedRe.test(loopbackUrl)) {
    req.proxiedUrl = removeDefaultPort(loopbackUrl)

    req.url = getPath(req.url)

    return
  }

  // backup the original proxied url
  // and slice out the host/origin
  // and only leave the path which is
  // how browsers would normally send
  // use their url
  req.proxiedUrl = removeDefaultPort(req.url)

  req.url = getPath(req.url)
}

const notSSE = (req, res) => {
  return (req.headers.accept !== 'text/event-stream') && compression.filter(req, res)
}

type WarningErr = Record<string, any>

/**
 * Which network runtime currently owns browser traffic. `undefined` means no
 * launch has resolved it yet: request handling then follows MITM semantics,
 * because the MITM runtime is the one that is installed, but a CONNECT is
 * refused because no browser has claimed the proxy.
 */
type NetworkMode = 'browser' | 'proxy'

// The pointer that must always name the same runtime as `_networkMode`. The
// runtime's interception core (and the policy registration built into it) is
// constructed into its NetworkProxy, so it travels with this pointer and
// cannot drift on its own.
type NetworkRuntimePointers = Pick<ProxyNetworkRuntime, 'networkProxy'>

interface OpenServerOptions {
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
  protected _fileServer: FileServer | null
  protected _baseUrl: string | null
  protected _server?: DestroyableHttpServer
  protected _socket?: TSocket
  protected _nodeProxy?: httpProxy
  protected _networkProxy?: NetworkProxy
  protected _netStubbingState?: NetStubbingState
  protected _cdpFetchRuntime?: CdpFetchNetworkRuntime
  protected _proxyRuntime?: ProxyNetworkRuntime
  protected _openConfig?: Cfg
  // Resolved per launch, not at open: the browser is unknown until then (Chrome
  // with `forceHttp1: false` takes the browser path, Firefox the proxy path).
  // Published only alongside the runtime it names, so no awaited step can leave
  // this claiming a path `_networkProxy` is not on. See `useNetworkRuntime`.
  private _networkMode?: NetworkMode
  // Retained so the CDP Fetch NetworkProxy, created per launch, still receives
  // protocol / pre-request settings applied at open.
  private _protocolManager?: ProtocolManagerShape
  private _preRequestTimeout?: number
  // Tests can override `blockHosts` at runtime, so hold the project-level value to
  // restore between specs. Kept here rather than in the network runtime, which is
  // rebuilt mid-run and would snapshot an active override.
  private _projectBlockHosts?: Cfg['blockHosts']
  // @ts-ignore - this is currently affecting the v8-snapshot type checking job as we are importing the file directly from the server package
  // After some package refactoring, we should be able to remove this.
  protected _httpsProxy?: httpsProxy
  private _httpsProxyReady?: Promise<void>
  protected _graphqlWS?: GraphqlWsHandle
  private _closing?: Bluebird<any>
  protected _eventBus: EventEmitter
  protected _remoteStates: RemoteStates
  private getCurrentBrowser: undefined | (() => Browser)
  private shouldCorrelatePreRequests: () => boolean = () => false
  private _urlResolver: Bluebird<Record<string, any>> | null = null
  private testingType?: TestingType
  private _documentDomainInjection: DocumentDomainInjection

  constructor (config: Cfg) {
    this.isListening = false
    this.request = new Request()
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

  get remoteStates () {
    return this._remoteStates
  }

  setProtocolManager (protocolManager: ProtocolManagerShape | undefined) {
    this._protocolManager = protocolManager
    this._socket?.setProtocolManager(protocolManager)
    this._networkProxy?.setProtocolManager(protocolManager)
  }

  setPreRequestTimeout (timeout: number) {
    this._preRequestTimeout = timeout
    this._networkProxy?.setPreRequestTimeout(timeout)
  }

  setupCrossOriginRequestHandling () {
    this._eventBus.on('cross:origin:cookies', (cookies: SerializableAutomationCookie[]) => {
      this.socket.localBus.once('cross:origin:cookies:received', () => {
        this._eventBus.emit('cross:origin:cookies:received')
      })

      this.socket.toDriver('cross:origin:cookies', cookies)
    })

    this.socket.localBus.on('request:sent:with:credentials', (credentials: { url: string, resourceType: ResourceType, credentialStatus: RequestCredentialLevel }) => {
      this._networkProxy?.setCredentials(credentials)
    })
  }

  async createServer (
    app: Express,
    config: Cfg,
    onWarning: unknown,
  ): Promise<[number, WarningErr?]> {
    const { port, fileServerFolder, socketIoRoute, baseUrl } = config

    this._server = this._createHttpServer(app)

    debug('createServer connecting to server')

    this.server.on('connect', (req, socket, head) => {
      this.onConnect(req, socket, head).catch((err) => {
        debug('CONNECT handling failed: %s', err?.stack || err)
        socket.destroy()
      })
    })

    this.server.on('upgrade', (req, socket, head) => this.onUpgrade(req, socket, head, socketIoRoute))

    // enforceOrigin is disabled here because upgrades arrive via the cypress proxy with Origin reflecting the AUT host — never the runner port. Inbound connections are gated by socketAllowed.isRequestAllowed in proxyWebsockets.
    this._graphqlWS = graphqlWS(this.server, `${socketIoRoute}-graphql`, { enforceOrigin: false })

    // Start the file server first so its port is known before we begin
    // listening for proxied requests on the main server. The primary
    // remote state's `<root>` strategy reads `_fileServer.port()`
    // synchronously, so the fileServer must exist before the primary
    // is computed.
    this._fileServer = await fileServer.create(fileServerFolder as string) as FileServer

    const listenedPort = await this._listen(port)

    this._remoteStates.set(baseUrl != null ? baseUrl : '<root>')

    let warning: WarningErr | undefined

    // if we have a baseUrl let's go ahead and make sure the server is
    // connectable!
    if (baseUrl) {
      this._baseUrl = baseUrl

      if (config.isTextTerminal) {
        try {
          await this._retryBaseUrlCheck(baseUrl, onWarning)
        } catch (e) {
          debug(e)
          throw errors.get('CANNOT_CONNECT_BASE_URL')
        }
      } else {
        try {
          await ensureUrl.isListening(baseUrl)
        } catch (err) {
          debug('ensuring baseUrl (%s) errored: %o', baseUrl, err)
          warning = errors.get('CANNOT_CONNECT_BASE_URL_WARNING', baseUrl) as WarningErr
        }
      }
    }

    return [listenedPort, warning]
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
    this._openConfig = config
    this._projectBlockHosts = config.blockHosts
    this.shouldCorrelatePreRequests = shouldCorrelatePreRequests

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

    // Owned by the server for its whole lifetime: DriverInterceptRegistrationAdapter
    // binds to this object at open and every network runtime must share it, or
    // cy.intercept() stops matching.
    this._netStubbingState = netStubbingState()

    // The standing MITM proxy runtime is deliberately eager: constructing it costs
    // ~6 KiB of retained heap in this process plus one sweep interval disposed at
    // close, and binds no port and opens no file descriptor. That buys a
    // Firefox/WebKit launch — or a Chrome→Firefox switch in open mode — a proxy
    // that is already built. The expensive part, the https/SNI proxy and its root
    // CA, stays behind ensureHttpsProxy().
    this.createNetworkProxy({
      config,
      remoteStates: this._remoteStates,
      shouldCorrelatePreRequests,
      getCurrentBrowser,
    })

    this.createHosts(config.hosts)

    const routeOptions: InitializeRoutes = {
      config,
      remoteStates: this._remoteStates,
      nodeProxy: this.nodeProxy,
      // Lazy: the CDP Fetch runtime swaps NetworkProxy at each launch, so the
      // routes must read whichever instance is current rather than capture one.
      getNetworkProxy: () => this.networkProxy,
      isBrowserNetworkMode: this.isBrowserNetworkMode,
      onError,
      getSpec,
      testingType,
    }

    this.getCurrentBrowser = getCurrentBrowser

    this.setupCrossOriginRequestHandling()

    app.use(createCommonRoutes(routeOptions))

    // Preserve Bluebird-typed return value.
    return Bluebird.resolve(this.createServer(app, config, onWarning))
  }

  isBrowserNetworkMode = (): boolean => {
    return this._networkMode === 'browser'
  }

  /**
   * Prepares the server for the network path of the browser about to launch.
   *
   * The MITM direction is completed here: the https proxy is up and the MITM
   * NetworkProxy is reinstalled in the same step as the mode that names it, so
   * the old browser — still alive until `browsers.open` kills it — never sees a
   * mode that disagrees with the installed runtime.
   *
   * The browser direction cannot be completed here: its runtime needs the page
   * CRI client, which does not exist until `onPageCriClientReady`. So the mode is
   * left alone and `createCdpFetchNetworkRuntime` publishes it together with the
   * runtime it installs; until then the server keeps MITM request semantics,
   * which is what the still-installed MITM runtime can actually serve.
   */
  async setNetworkMode (useBrowserNetworkInterception: boolean) {
    if (useBrowserNetworkInterception) {
      return
    }

    await this.ensureHttpsProxy()

    // A switch away from the browser (CDP) network path (open-mode browser
    // switch) is the only thing that tears its Fetch runtime down. Swapping in
    // no successor hands the pointers and the mode back to the MITM runtime,
    // and covers the case where there was no CDP runtime to stop.
    await this.swapCdpFetchRuntime()
  }

  /**
   * The MITM proxy path needs an https proxy; the native browser (CDP) path does
   * not. Creating it generates a root CA on first use, so it stays deferred until
   * a browser that needs it launches.
   */
  ensureHttpsProxy (): Promise<void> {
    if (this._httpsProxy) {
      return Promise.resolve()
    }

    if (this._httpsProxyReady) {
      // Retained so CONNECTs arriving mid-creation await the same work rather
      // than starting a second root CA generation.
      return this._httpsProxyReady
    }

    if (!this._server?.listening) {
      // The https proxy binds against this server's port, so there is nothing
      // to create yet. Callers must not read this as "already created".
      return Promise.reject(new Error('Server#createServer must first be called before creating the https proxy'))
    }

    // The IIFE keeps this assignment synchronous — making the method itself
    // async would publish the memo a tick late, after a concurrent CONNECT
    // had already missed it.
    this._httpsProxyReady = (async () => {
      try {
        this._httpsProxy = await createHttpsProxy(appData.path('proxy'), this._port(), {
          onRequest: this.callListeners.bind(this),
          onUpgrade: this.onSniUpgrade.bind(this),
        }) as HttpsProxyServer
      } catch (err) {
        // Memoizing a rejection would make one transient CA-write or bind failure
        // fatal for every later launch and CONNECT in the session.
        this._httpsProxyReady = undefined

        throw err
      }
    })()

    return this._httpsProxyReady
  }

  /**
   * Settles any in-flight creation before tearing down, so a proxy that finishes
   * after close() cannot leave a listening SNI server with no owner.
   */
  private async closeHttpsProxy () {
    const ready = this._httpsProxyReady

    if (ready) {
      await ready.catch((err) => {
        debug('https proxy creation failed while closing: %s', err?.stack || err)
      })
    }

    const proxy = this._httpsProxy

    this._httpsProxyReady = undefined
    this._httpsProxy = undefined

    await proxy?.close()
  }

  createExpressApp (config) {
    const { morgan, clientRoute, namespace } = config
    const app = express()

    // set the cypress config from the cypress.config.{js,ts,mjs,cjs} file
    app.set('view engine', 'html')

    // since we use absolute paths, configure express-handlebars to not automatically find layouts
    // https://github.com/cypress-io/cypress/issues/2891
    app.engine('html', renderTemplate)

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

    app.use(_forceProxyMiddleware(clientRoute, namespace, this.isBrowserNetworkMode))

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
    return require('morgan')('dev', {
      skip: (req) => GracefulExit.isShuttingDown || _isTapRequest(req),
    })
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

  createNetworkProxy ({ config, remoteStates, shouldCorrelatePreRequests, getCurrentBrowser }) {
    const getFileServerToken = () => {
      return this._fileServer?.token
    }

    const runtime = createProxyRuntime({
      config,
      shouldCorrelatePreRequests,
      remoteStates,
      getFileServerToken,
      getCookieJar: () => cookieJar,
      socket: this.socket,
      request: this.request,
      serverBus: this._eventBus,
      getCurrentBrowser,
      netStubbingState: this.netStubbingState,
    })

    this._proxyRuntime = runtime

    // Not published as 'proxy' here: no browser has launched, so a CONNECT
    // arriving now is not one we opened the proxy for (see onConnect).
    this.useNetworkRuntime(runtime)
  }

  /**
   * Installs a network runtime's NetworkProxy and, when given, the mode that
   * names it. Both must move together and without an await in between: any
   * window where `_networkMode` and `_networkProxy` disagree routes requests
   * into the wrong pipeline (an absolute-form request handed to the
   * browser-interception branch, or a path-only one handed to the MITM proxy).
   */
  private useNetworkRuntime (runtime: NetworkRuntimePointers | undefined, mode?: NetworkMode) {
    this._networkProxy = runtime?.networkProxy

    if (mode) {
      this._networkMode = mode
    }
  }

  async createCdpFetchNetworkRuntime (
    client: Pick<ICriClient, 'send' | 'on' | 'off'>,
    isAUTFrame?: (frameId: string) => Promise<boolean>,
    onAUTFrameNavigated?: (listener: (url: string) => void) => () => void,
  ) {
    const config = this.ensureProp(this._openConfig, 'open') as unknown as CreateProxyRuntimeDeps['config']

    // Once per runtime — one per spec/tab — so a worker that escapes on every
    // navigation warns once instead of flooding stdout. Every escape is still
    // visible under DEBUG=cypress:server:browsers:interception-escape-detector.
    let warnedInterceptionEscape = false

    const runtime = createCdpFetchRuntime({
      client,
      isAUTFrame,
      onAUTFrameNavigated,
      config,
      shouldCorrelatePreRequests: this.shouldCorrelatePreRequests,
      remoteStates: this._remoteStates,
      getFileServerToken: () => this._fileServer?.token,
      getCookieJar: () => cookieJar,
      socket: this.socket,
      request: this.request,
      serverBus: this._eventBus,
      getCurrentBrowser: this.getCurrentBrowser ?? (() => {
        throw new Error('getCurrentBrowser is not available')
      }),
      netStubbingState: this.netStubbingState,
      onInterceptionEscape: ({ url }) => {
        if (warnedInterceptionEscape) {
          return
        }

        warnedInterceptionEscape = true
        errors.warning('BROWSER_NETWORK_INTERCEPTION_ESCAPE', url)
      },
    })

    // Publishing the mode here — rather than in setNetworkMode — is what keeps
    // it in step with the runtime: this is the first moment a CDP runtime exists
    // to serve what the browser network mode claims. Constructing the successor
    // first is what lets one launch replace another's runtime without the mode
    // ever naming the MITM path the browser is not on.
    await this.swapCdpFetchRuntime(runtime)

    // This NetworkProxy replaces the one settings were applied to at open, so
    // re-apply them here.
    if (this._protocolManager) {
      runtime.networkProxy.setProtocolManager(this._protocolManager)
    }

    if (this._preRequestTimeout != null) {
      runtime.networkProxy.setPreRequestTimeout(this._preRequestTimeout)
    }

    await runtime.start()
  }

  async attachCdpFetchExtraTarget (
    client: Pick<ICriClient, 'send' | 'on' | 'off'>,
  ): Promise<ExtraTargetDetach | undefined> {
    return this._cdpFetchRuntime?.attachExtraTarget(client)
  }

  /**
   * Hides the next top-level navigation from the AUT origin's service worker.
   * No-op on the MITM path, where the proxy sees worker traffic. Fails open:
   * an unprotected navigation is a bad page load, a stuck one is a hung run.
   */
  async bypassServiceWorkerForTopNavigation () {
    if (!this._cdpFetchRuntime) {
      return
    }

    const timedOut = Symbol('serviceWorkerBypassTimedOut')
    let timeout: NodeJS.Timeout | undefined

    try {
      const outcome = await Promise.race([
        this._cdpFetchRuntime.bypassServiceWorkerForTopNavigation(),
        new Promise((resolve) => {
          timeout = setTimeout(() => resolve(timedOut), SERVICE_WORKER_BYPASS_TIMEOUT_MS)
        }),
      ])

      if (outcome === timedOut) {
        debug('the service worker bypass was not acknowledged within %dms; navigating anyway', SERVICE_WORKER_BYPASS_TIMEOUT_MS)
      }
    } catch (err) {
      debug('arming the service worker bypass failed: %s', err?.stack || err)
    } finally {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }

  private resetCdpFetchRuntime () {
    try {
      this._cdpFetchRuntime?.reset()
    } catch (err) {
      debug('CDP Fetch runtime reset failed: %s', err?.stack || err)
    }
  }

  /**
   * Installs `successor` as the CDP Fetch runtime and tears the outgoing one
   * down. No successor means browser traffic goes back to the standing MITM
   * runtime.
   *
   * The successor is published before anything is awaited, so the mode and the
   * pointers never disagree — in particular a replacement (spec change, new
   * tab, relaunch) moves from one CDP runtime straight to the next, rather than
   * spending the teardown claiming the MITM path the browser is not on.
   *
   * Disposal is deferred until after that publish so concurrent
   * getNetworkProxy / addBrowserPreRequest callers cannot use a NetworkProxy
   * whose sweep timer has already been cleared.
   *
   * Callers must await this before starting the successor: `Fetch.enable` is
   * not additive within a session, so the outgoing runtime has to release the
   * domain first.
   */
  private swapCdpFetchRuntime (successor?: CdpFetchNetworkRuntime) {
    // Stopping sends Fetch.disable to the previous page client, which may
    // already be gone (spec change, browser relaunch); failing to stop the
    // old runtime must not fail the next launch.
    const previous = this._cdpFetchRuntime

    this._cdpFetchRuntime = successor

    this.useNetworkRuntime(successor ?? this._proxyRuntime, successor ? 'browser' : 'proxy')

    if (!previous) {
      return
    }

    // Disable Fetch and drop handlers before dispose so paused requests cannot
    // enter the legacy pipeline against a NetworkProxy whose PreRequests
    // sweep/buffers are already cleared. Then dispose so replaced runtimes do
    // not leave sweep timers accumulating across specs.
    return previous.stop().catch((err) => {
      debug('CDP Fetch runtime stop failed: %s', err?.stack || err)
    }).finally(() => {
      try {
        previous.networkProxy.dispose()
      } catch (err) {
        debug('CDP Fetch NetworkProxy dispose failed: %s', err?.stack || err)
      }
    })
  }

  startWebsockets (automation: Automation, config, options: Record<string, unknown> = {}) {
    // e2e only?
    options.onResolveUrl = this._onResolveUrl.bind(this)

    options.onRequest = this._onRequest.bind(this)
    options.onPreserveRunState = this.bypassServiceWorkerForTopNavigation.bind(this)
    options.interceptRegistration = new DriverInterceptRegistrationAdapter({
      state: this.netStubbingState,
      socket: this.socket,
      getFixture: (path, opts) => fixtureGet(config.fixturesFolder, path, opts as Parameters<typeof fixtureGet>[2]),
    })

    // Lazy lookup: which NetworkProxy is installed depends on the browser this
    // launch resolves to — Chrome with `forceHttp1: false` swaps in a CDP Fetch one,
    // Firefox keeps the MITM one — and that is unknown here.
    options.getRenderedHTMLOrigins = () => {
      return this._networkProxy?.http.getRenderedHTMLOrigins() ?? {}
    }

    options.getCurrentBrowser = () => this.getCurrentBrowser?.()

    options.onResetServerState = ({ blockHosts }: { blockHosts?: Cfg['blockHosts'] } = {}) => {
      this._networkProxy?.reset({ resetBetweenSpecs: false })
      this.resetCdpFetchRuntime()
      this.netStubbingState.reset()
      this._remoteStates.reset()
      this._networkProxy?.clearCredentials()

      // only apply blockHosts when the caller explicitly sent a value. the config object
      // is shared with every network runtime and read at enforcement time, so assigning
      // it here is enough for both current and later-created runtimes to see it.
      if (blockHosts !== undefined && this._openConfig) {
        this._openConfig.blockHosts = blockHosts
      }
    }

    const ios = this.socket.startListening(this.server, automation, config, options)

    this._normalizeReqUrl(this.server)

    return ios
  }

  createHosts (hosts: { [key: string]: string } | null = {}) {
    return _.each(hosts, (ip, host) => {
      return evilDns.add(host, ip)
    })
  }

  async addBrowserPreRequest (browserPreRequest: BrowserPreRequest) {
    await this._networkProxy?.addPendingBrowserPreRequest(browserPreRequest)
  }

  removeBrowserPreRequest (requestId: string) {
    this._networkProxy?.removePendingBrowserPreRequest(requestId)
  }

  getBrowserPreRequests () {
    return this._networkProxy?.getPendingBrowserPreRequests()
  }

  emitRequestEvent (eventName, data) {
    this.socket.toDriver('request:event', eventName, data)
  }

  addPendingUrlWithoutPreRequest (downloadUrl: string) {
    this._networkProxy?.addPendingUrlWithoutPreRequest(downloadUrl)
  }

  updateServiceWorkerRegistrations (data: Protocol.ServiceWorker.WorkerRegistrationUpdatedEvent) {
    this._networkProxy?.updateServiceWorkerRegistrations(data)
  }

  updateServiceWorkerVersions (data: Protocol.ServiceWorker.WorkerVersionUpdatedEvent) {
    this._networkProxy?.updateServiceWorkerVersions(data)
  }

  updateServiceWorkerClientSideRegistrations (data: { scriptURL: string, initiatorOrigin: string }) {
    this._networkProxy?.updateServiceWorkerClientSideRegistrations(data)
  }

  handleServiceWorkerClientEvent (event: ServiceWorkerClientEvent) {
    this._networkProxy?.handleServiceWorkerClientEvent(event)
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

  _listen (port: number | null | undefined): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      const onError = (err) => {
        // if the server bombs before starting
        // and the err no is EADDRINUSE
        // then we know to display the custom err message
        if (err.code === 'EADDRINUSE') {
          reject(this.portInUseErr(port))
        }
      }

      this.server.once('error', onError)

      const listener = () => {
        const address = this.server.address() as AddressInfo

        this.isListening = true

        debug('Server listening on ', address)

        this.server.removeListener('error', onError)

        resolve(address.port)
      }

      this.server.listen(port || 0, '127.0.0.1', listener)
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
      // Without the proxy, upgrades arrive on direct connections the CONNECT
      // port allow-list never saw — a loopback remoteAddress is the only
      // available gate (see #34513).
      const isAllowed = this.isBrowserNetworkMode()
        ? this.socketAllowed.isRequestFromLocalhost(req)
        : this.socketAllowed.isRequestAllowed(req)

      if (!isAllowed) {
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
      const { port } = parseUrlIntoHostProtocolDomainTldPort(fullUrl)

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
    this.resetCdpFetchRuntime()
    this._networkProxy?.clearCredentials()

    // discard any per-test blockHosts override so it can't leak into the next spec
    if (this._openConfig) {
      this._openConfig.blockHosts = this._projectBlockHosts
    }

    const baseUrl = this._baseUrl ?? '<root>'

    return this._remoteStates.set(baseUrl)
  }

  _close () {
    // bail early we dont have a server or we're not
    // currently listening
    if (!this._server || !this.isListening) {
      return Promise.resolve(true)
    }

    this.reset()

    evilDns.clear()

    // Fully tear down CDP Fetch (Fetch.disable + NetworkProxy.dispose). reset()
    // only clears in-flight state so the next test can keep using Fetch.
    const cdpFetchTeardown = this.swapCdpFetchRuntime()

    // The swap above re-published 'proxy'. Refuse CONNECTs for the rest of
    // teardown: close() destroys the https proxy concurrently, so one accepted
    // here could bind an SNI server after closeHttpsProxy() has run. Same tick
    // as the publish, so no CONNECT lands in between.
    this._networkMode = undefined

    return Promise.resolve(cdpFetchTeardown)
    .then(() => this.disposeProxyRuntime())
    .then(() => this._server!.destroyAsync())
    .then(() => {
      this.isListening = false
    })
  }

  /**
   * The standing MITM runtime outlives every launch, so nothing else disposes
   * it — and its PreRequests sweep interval keeps the whole Http graph alive.
   * A ServerBase is created per ProjectBase.open(), so skipping this leaks one
   * timer and graph per project open and testing-type switch.
   */
  private disposeProxyRuntime () {
    const runtime = this._proxyRuntime

    this._proxyRuntime = undefined
    this._networkMode = undefined
    // The server owns this state until close, so teardown is the only place that
    // may drop it.
    this._netStubbingState = undefined
    this.useNetworkRuntime(undefined)

    if (!runtime) {
      return
    }

    try {
      runtime.networkProxy.dispose()
    } catch (err) {
      debug('MITM NetworkProxy dispose failed: %s', err?.stack || err)
    }
  }

  close () {
    if (this._closing) {
      return this._closing
    }

    // graphql-ws clients must be closed before the HTTP server is destroyed.
    const graphqlDispose = this._graphqlWS?.dispose
      ? Bluebird.resolve(this._graphqlWS.dispose()).finally(() => {
        // graphql-ws dispose() closes the ws server; repeating close() rejects with
        // "The server is not running". Clear handle so subsequent close() is a no-op for gql.
        this._graphqlWS = undefined
      })
      : Bluebird.resolve()

    this._closing = graphqlDispose.then(() => {
      return Bluebird.all<any>([
        this._close(),
        this._socket?.close(),
        this._fileServer?.close(),
        this.closeHttpsProxy(),
      ])
    })
    .then((res) => {
      this._middleware = null

      return res
    })
    .finally(() => {
      this._closing = undefined
    })

    return this._closing
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

  async onConnect (req, socket, head) {
    debug('Got CONNECT request from %s', req.url)

    // Only a launch that resolved to the MITM path opens this server as a proxy.
    // Before that — and on the native browser (CDP) path — a CONNECT is a stray
    // client, a machine-level system proxy, or a leftover browser on this port;
    // tunneling it would also generate a root CA that path never needs.
    if (this._networkMode !== 'proxy') {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\nProxy is disabled\r\n')
      socket.end()

      return
    }

    // The https proxy is created when a browser that needs it launches. A CONNECT
    // can still race that creation, so wait for any in-flight work rather than
    // assuming it exists — and retry it if a previous attempt failed.
    try {
      await this.ensureHttpsProxy()
    } catch (err) {
      debug('https proxy creation failed while handling a CONNECT: %s', err?.stack || err)
    }

    if (!this._httpsProxy) {
      debug('CONNECT arrived before the https proxy was available')
      socket.write('HTTP/1.1 502 Bad Gateway\r\n\r\nProxy is not ready\r\n')
      socket.end()

      return
    }

    socket.once('upstream-connected', this.socketAllowed.add)

    return this._httpsProxy.connect(req, socket, head)
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

      // Read the field, not the getter: teardown drops _netStubbingState, so a
      // resolve:url racing close matches zero routes instead of throwing.
      // @ts-ignore
      const iterator = getRoutesForRequest(this._netStubbingState?.routes ?? [], proxiedReq)
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
              const contentType = getContentType(incomingRes)

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

                  debug('urlDoesNotMatchPolicy?: %o', {
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

      // HTTP header names are case-insensitive; convert all keys to lowercase
      options.headers = _.mapKeys(options.headers, (value, key) => key.toLowerCase())

      _.assign(options, {
        // turn off gzip since we need to eventually
        // rewrite these contents
        gzip: false,
        url: urlFile != null ? urlFile : urlStr,
        headers: _.assign({
          accept: 'text/html,*/*',
        }, options.headers, {
          'accept-encoding': getSupportedAcceptEncoding(options.headers['accept-encoding']),
        }),
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
          // With the MITM proxy disabled, the server is not a proxy. The
          // `proxy` option above still delivers this request in absolute form,
          // so it lands on the direct-origin catch-all in routes.ts — the token
          // is what marks it as our own loopback there, letting the catch-all
          // route it through the interception pipeline so the stub can reply.
          // `tunnel: false` keeps https URLs on that same absolute-form path:
          // the default CONNECT tunnel would be rejected by onConnect, which
          // refuses all CONNECTs when the proxy is disabled. Loopback-only —
          // this request never leaves 127.0.0.1.
          // Gated so proxy-on wire traffic is unchanged.
          ...(this.isBrowserNetworkMode() ? { tunnel: false } : {}),
          headers: {
            'x-cypress-resolving-url': '1',
            ...(this.isBrowserNetworkMode() ? { [CYPRESS_INTERNAL_LOOPBACK_TOKEN_HEADER]: cypressInternalLoopbackToken } : {}),
          },
        })
      }

      debug('sending request with options %o', options)

      return runPhase(() => {
        // @ts-ignore - this is currently affecting the v8-snapshot type checking job as we are importing the file directly from the server package
        // After some package refactoring, we should be able to remove this.
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
