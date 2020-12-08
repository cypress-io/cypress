require('./cwd')

const _ = require('lodash')
const url = require('url')
const http = require('http')
const stream = require('stream')
const express = require('express')
const Promise = require('bluebird')
const evilDns = require('evil-dns')
const isHtml = require('is-html')
const httpProxy = require('http-proxy')
const la = require('lazy-ass')
const httpsProxy = require('@packages/https-proxy')
const compression = require('compression')
const debug = require('debug')('cypress:server:server')
const {
  agent,
  concatStream,
  cors,
  uri,
} = require('@packages/network')
const { NetworkProxy } = require('@packages/proxy')
const {
  netStubbingState,
  getRouteForRequest,
} = require('@packages/net-stubbing')
const { createInitialWorkers } = require('@packages/rewriter')
const origin = require('./util/origin')
const ensureUrl = require('./util/ensure-url')
const appData = require('./util/app_data')
const statusCode = require('./util/status_code')
const headersUtil = require('./util/headers')
const allowDestroy = require('./util/server_destroy')
const { SocketAllowed } = require('./util/socket_allowed')
const errors = require('./errors')
const logger = require('./logger')
const Socket = require('./socket')
const Request = require('./request')
const fileServer = require('./file_server')
const templateEngine = require('./template_engine')

const DEFAULT_DOMAIN_NAME = 'localhost'
const fullyQualifiedRe = /^https?:\/\//
const textHtmlContentTypeRe = /^text\/html/i

const ALLOWED_PROXY_BYPASS_URLS = [
  '/',
  '/__cypress/runner/cypress_runner.css',
  '/__cypress/static/favicon.ico',
]

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

const isResponseHtml = function (contentType, responseBuffer) {
  let body

  if (contentType) {
    // want to match anything starting with 'text/html'
    // including 'text/html;charset=utf-8' and 'Text/HTML'
    // https://github.com/cypress-io/cypress/issues/8506
    return textHtmlContentTypeRe.test(contentType)
  }

  body = _.invoke(responseBuffer, 'toString')

  if (body) {
    return isHtml(body)
  }

  return false
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

class Server {
  constructor () {
    if (!(this instanceof Server)) {
      return new Server()
    }

    this._socketAllowed = new SocketAllowed()
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

  createRoutes (...args) {
    return require('./routes').apply(null, args)
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

  open (config = {}, project, onError, onWarning) {
    debug('server open')

    la(_.isPlainObject(config), 'expected plain config object', config)

    return Promise.try(() => {
      const app = this.createExpressApp(config)

      logger.setSettings(config)

      // TODO: does not need to be an instance anymore
      this._request = Request()
      this._nodeProxy = httpProxy.createProxyServer()
      this._socket = new Socket(config)

      const getRemoteState = () => {
        return this._getRemoteState()
      }

      this.createNetworkProxy(config, getRemoteState)

      if (config.experimentalSourceRewriting) {
        createInitialWorkers()
      }

      this.createHosts(config.hosts)

      this.createRoutes({
        app,
        config,
        getRemoteState,
        networkProxy: this._networkProxy,
        onError,
        project,
      })

      return this.createServer(app, config, project, this._request, onWarning)
    })
  }

  createNetworkProxy (config, getRemoteState) {
    const getFileServerToken = () => {
      return this._fileServer.token
    }

    this._netStubbingState = netStubbingState()
    this._networkProxy = new NetworkProxy({
      socket: this._socket,
      netStubbingState: this._netStubbingState,
      config,
      getRemoteState,
      getFileServerToken,
      request: this._request,
    })
  }

  createHosts (hosts = {}) {
    return _.each(hosts, (ip, host) => {
      return evilDns.add(host, ip)
    })
  }

  createServer (app, config, project, request, onWarning) {
    return new Promise((resolve, reject) => {
      const { port, fileServerFolder, socketIoRoute, baseUrl } = config

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

      const onUpgrade = (req, socket, head) => {
        debug('Got UPGRADE request from %s', req.url)

        return this.proxyWebsockets(this._nodeProxy, socketIoRoute, req, socket, head)
      }

      const callListeners = (req, res) => {
        const listeners = this._server.listeners('request').slice(0)

        return this._callRequestListeners(this._server, listeners, req, res)
      }

      const onSniUpgrade = (req, socket, head) => {
        const upgrades = this._server.listeners('upgrade').slice(0)

        return upgrades.map((upgrade) => {
          return upgrade.call(this._server, req, socket, head)
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
        return Promise.all([
          httpsProxy.create(appData.path('proxy'), port, {
            onRequest: callListeners,
            onUpgrade: onSniUpgrade,
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

                return reject(errors.get('CANNOT_CONNECT_BASE_URL', baseUrl))
              })
            }

            return ensureUrl.isListening(baseUrl)
            .return(null)
            .catch((err) => {
              return errors.get('CANNOT_CONNECT_BASE_URL_WARNING', baseUrl)
            })
          }
        }).then((warning) => {
          // once we open set the domain
          // to root by default
          // which prevents a situation where navigating
          // to http sites redirects to /__/ cypress
          this._onDomainSet(baseUrl != null ? baseUrl : '<root>')

          return resolve([port, warning])
        })
      })
    })
  }

  _port () {
    return _.chain(this._server).invoke('address').get('port').value()
  }

  _listen (port, onError) {
    return new Promise((resolve) => {
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

  _onRequest (headers, automationRequest, options) {
    return this._request.sendPromise(headers, automationRequest, options)
  }

  _onResolveUrl (urlStr, headers, automationRequest, options = { headers: {} }) {
    let p

    debug('resolving visit %o', {
      url: urlStr,
      headers,
      options,
    })

    // always clear buffers - reduces the possibility of a random HTTP request
    // accidentally retrieving buffered content at the wrong time
    this._networkProxy.reset()

    const startTime = new Date()

    // if we have an existing url resolver
    // in flight then cancel it
    if (this._urlResolver) {
      this._urlResolver.cancel()
    }

    const request = this._request

    let handlingLocalFile = false
    const previousState = _.clone(this._getRemoteState())

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
        ..._.pick(requestOptions, ['headers', 'method']),
        // TODO: add `body` here once bodies can be statically matched
      }

      return !!getRouteForRequest(this._netStubbingState.routes, proxiedReq)
    }

    return this._urlResolver = (p = new Promise((resolve, reject, onCancel) => {
      let urlFile

      onCancel(() => {
        p.currentPromisePhase = currentPromisePhase
        p.reqStream = reqStream

        _.invoke(reqStream, 'abort')

        return _.invoke(currentPromisePhase, 'cancel')
      })

      const redirects = []
      let newUrl = null

      if (!fullyQualifiedRe.test(urlStr)) {
        handlingLocalFile = true

        options.headers['x-cypress-authorization'] = this._fileServer.token

        this._remoteVisitingUrl = true

        this._onDomainSet(urlStr, options)

        // TODO: instead of joining remoteOrigin here
        // we can simply join our fileServer origin
        // and bypass all the remoteState.visiting shit
        urlFile = url.resolve(this._remoteFileServer, urlStr)
        urlStr = url.resolve(this._remoteOrigin, urlStr)
      }

      const onReqError = (err) => {
        // only restore the previous state
        // if our promise is still pending
        if (p.isPending()) {
          restorePreviousState()
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
            return automationRequest('get:cookies', {
              domain: cors.getSuperDomain(newUrl),
            })
            .then((cookies) => {
              let fp

              this._remoteVisitingUrl = false

              const statusIs2xxOrAllowedFailure = () => {
                // is our status code in the 2xx range, or have we disabled failing
                // on status code?
                return statusCode.isOk(incomingRes.statusCode) || options.failOnStatusCode === false
              }

              const isOk = statusIs2xxOrAllowedFailure()
              const contentType = headersUtil.getContentType(incomingRes)

              const details = {
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
              fp = incomingRes.headers['x-cypress-file-path']

              if (fp) {
                // if so we know this is a local file request
                details.filePath = fp
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

                debug('resolve:url response ended, setting buffer %o', { newUrl, details })

                details.totalTime = new Date() - startTime

                // TODO: think about moving this logic back into the
                // frontend so that the driver can be in control of
                // when the server should cache the request buffer
                // and set the domain vs not
                if (isOk && details.isHtml) {
                  // reset the domain to the new url if we're not
                  // handling a local file
                  if (!handlingLocalFile) {
                    this._onDomainSet(newUrl, options)
                  }

                  const responseBufferStream = new stream.PassThrough({
                    highWaterMark: Number.MAX_SAFE_INTEGER,
                  })

                  responseBufferStream.end(responseBuffer)

                  this._networkProxy.setHttpBuffer({
                    url: newUrl,
                    stream: responseBufferStream,
                    details,
                    originalUrl,
                    response: incomingRes,
                  })
                } else {
                  // TODO: move this logic to the driver too for
                  // the same reasons listed above
                  restorePreviousState()
                }

                return resolve(details)
              })

              return str.pipe(concatStr)
            }).catch(onReqError)
          })
        })
      }

      const restorePreviousState = () => {
        this._remoteAuth = previousState.auth
        this._remoteProps = previousState.props
        this._remoteOrigin = previousState.origin
        this._remoteStrategy = previousState.strategy
        this._remoteFileServer = previousState.fileServer
        this._remoteDomainName = previousState.domainName
        this._remoteVisitingUrl = previousState.visiting
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
        // however, network errors will be obsfucated by the proxying so this is not an ideal solution
        _.assign(options, {
          proxy: `http://127.0.0.1:${this._port()}`,
          agent: null,
        })
      }

      debug('sending request with options %o', options)

      return runPhase(() => {
        return request.sendStream(headers, automationRequest, options)
        .then((createReqStream) => {
          return onReqStreamReady(createReqStream())
        }).catch(onReqError)
      })
    }))
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
    if (this._networkProxy != null) {
      this._networkProxy.reset()
    }

    return this._onDomainSet(this._baseUrl != null ? this._baseUrl : '<root>')
  }

  _close () {
    this.reset()

    logger.unsetSettings()

    evilDns.clear()

    // bail early we dont have a server or we're not
    // currently listening
    if (!this._server || !this.isListening) {
      return Promise.resolve()
    }

    return this._server.destroyAsync()
    .then(() => {
      this.isListening = false
    })
  }

  close () {
    return Promise.join(
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

  startWebsockets (automation, config, options = {}) {
    options.onResolveUrl = this._onResolveUrl.bind(this)
    options.onRequest = this._onRequest.bind(this)
    options.netStubbingState = this._netStubbingState

    options.onResetServerState = () => {
      this._networkProxy.reset()
      this._netStubbingState.reset()
    }

    this._socket.startListening(this._server, automation, config, options)

    return this._normalizeReqUrl(this._server)
  }
}

module.exports = Server
