// @ts-nocheck

import Bluebird from 'bluebird'
import Debug from 'debug'
import evilDns from 'evil-dns'
import httpProxy from 'http-proxy'
import isHtml from 'is-html'
import la from 'lazy-ass'
import _ from 'lodash'
import stream from 'stream'
import url from 'url'
import httpsProxy from '@packages/https-proxy'
import { getRouteForRequest } from '@packages/net-stubbing'
import { concatStream, cors } from '@packages/network'
import { createInitialWorkers } from '@packages/rewriter'
import errors from './errors'
import fileServer from './file_server'
import logger from './logger'
import { ServerBase } from './server-base'
import Socket from './socket'
import appData from './util/app_data'
import * as ensureUrl from './util/ensure-url'
import headersUtil from './util/headers'
import statusCode from './util/status_code'

const fullyQualifiedRe = /^https?:\/\//
const textHtmlContentTypeRe = /^text\/html/i

const debug = Debug('cypress:server:server-e2e')

const isResponseHtml = function (contentType, responseBuffer) {
  if (contentType) {
    // want to match anything starting with 'text/html'
    // including 'text/html;charset=utf-8' and 'Text/HTML'
    // https://github.com/cypress-io/cypress/issues/8506
    return textHtmlContentTypeRe.test(contentType)
  }

  const body = _.invoke(responseBuffer, 'toString')

  if (body) {
    return isHtml(body)
  }

  return false
}

export class ServerE2E extends ServerBase {
  open (config = {}, project, onError, onWarning) {
    debug('server open')

    la(_.isPlainObject(config), 'expected plain config object', config)

    return Bluebird.try(() => {
      const app = this.createExpressApp(config)

      logger.setSettings(config)

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

  createServer (app, config, project, request, onWarning) {
    return new Bluebird((resolve, reject) => {
      const { port, fileServerFolder, socketIoRoute, baseUrl } = config

      const _server = this._server = this._createHttpServer(app)

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
        return Bluebird.all([
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

  createRoutes (...args) {
    return require('./routes').apply(null, args)
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

    return this._urlResolver = (p = new Bluebird((resolve, reject, onCancel) => {
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
              const fp = incomingRes.headers['x-cypress-file-path']

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

                details.totalTime = Date.now() - startTime

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
}
