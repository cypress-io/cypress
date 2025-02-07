import Bluebird from 'bluebird'
import chalk from 'chalk'
import Debug from 'debug'
import _ from 'lodash'
import { errorUtils } from '@packages/errors'
import { DeferredSourceMapCache } from '@packages/rewriter'
import { telemetry, Span } from '@packages/telemetry'
import ErrorMiddleware from './error-middleware'
import RequestMiddleware from './request-middleware'
import ResponseMiddleware from './response-middleware'
import { HttpBuffers } from './util/buffers'
import { GetPreRequestCb, PendingRequest, PreRequests } from './util/prerequests'
import { ServiceWorkerManager } from './util/service-worker-manager'

import type EventEmitter from 'events'
import type CyServer from '@packages/server'
import type {
  CypressIncomingRequest,
  CypressOutgoingResponse,
  BrowserPreRequest,
} from '../types'
import type { IncomingMessage } from 'http'
import type { NetStubbingState } from '@packages/net-stubbing'
import type { Readable } from 'stream'
import type { Request, Response } from 'express'
import type { RemoteStates } from '@packages/server/lib/remote_states'
import type { CookieJar, SerializableAutomationCookie } from '@packages/server/lib/util/cookies'
import type { ResourceTypeAndCredentialManager } from '@packages/server/lib/util/resourceTypeAndCredentialManager'
import type { FoundBrowser, ProtocolManagerShape } from '@packages/types'
import type Protocol from 'devtools-protocol'
import type { ServiceWorkerClientEvent } from './util/service-worker-manager'

function getRandomColorFn () {
  return chalk.hex(`#${Number(
    Math.floor(Math.random() * 0xFFFFFF),
  ).toString(16).padStart(6, 'F').toUpperCase()}`)
}

export const hasServiceWorkerHeader = (headers: Record<string, string | string[] | undefined>) => {
  return headers?.['service-worker'] === 'script' || headers?.['Service-Worker'] === 'script'
}

export const isVerboseTelemetry = true

const isVerbose = isVerboseTelemetry

export const debugVerbose = Debug('cypress-verbose:proxy:http')

export enum HttpStages {
  IncomingRequest,
  IncomingResponse,
  Error
}

export type HttpMiddleware<T> = (this: HttpMiddlewareThis<T>) => void

export type HttpMiddlewareStacks = {
  [stage in HttpStages]: {
    [name: string]: HttpMiddleware<any>
  }
}

type HttpMiddlewareCtx<T> = {
  req: CypressIncomingRequest
  res: CypressOutgoingResponse
  handleHttpRequestSpan?: Span
  reqMiddlewareSpan?: Span
  resMiddlewareSpan?: Span
  shouldCorrelatePreRequests: () => boolean
  stage: HttpStages
  debug: Debug.Debugger
  middleware: HttpMiddlewareStacks
  pendingRequest: PendingRequest | undefined
  getCookieJar: () => CookieJar
  deferSourceMapRewrite: (opts: { js: string, url: string }) => string
  getPreRequest: (cb: GetPreRequestCb) => PendingRequest | undefined
  addPendingUrlWithoutPreRequest: (url: string) => void
  removePendingRequest: (pendingRequest: PendingRequest) => void
  getAUTUrl: Http['getAUTUrl']
  setAUTUrl: Http['setAUTUrl']
  simulatedCookies: SerializableAutomationCookie[]
  protocolManager?: ProtocolManagerShape
} & T

export const defaultMiddleware = {
  [HttpStages.IncomingRequest]: RequestMiddleware,
  [HttpStages.IncomingResponse]: ResponseMiddleware,
  [HttpStages.Error]: ErrorMiddleware,
}

export type ServerCtx = Readonly<{
  config: CyServer.Config & Cypress.Config
  shouldCorrelatePreRequests?: () => boolean
  getFileServerToken: () => string | undefined
  getCookieJar: () => CookieJar
  remoteStates: RemoteStates
  resourceTypeAndCredentialManager: ResourceTypeAndCredentialManager
  getRenderedHTMLOrigins: Http['getRenderedHTMLOrigins']
  netStubbingState: NetStubbingState
  middleware: HttpMiddlewareStacks
  socket: CyServer.Socket
  request: any
  serverBus: EventEmitter
  getCurrentBrowser: () => FoundBrowser
}>

const READONLY_MIDDLEWARE_KEYS: (keyof HttpMiddlewareThis<{}>)[] = [
  'buffers',
  'config',
  'getFileServerToken',
  'netStubbingState',
  'next',
  'end',
  'onResponse',
  'onError',
  'skipMiddleware',
  'onlyRunMiddleware',
]

export type HttpMiddlewareThis<T> = HttpMiddlewareCtx<T> & ServerCtx & Readonly<{
  buffers: HttpBuffers

  next: () => void
  /**
   * Call to completely end the stage, bypassing any remaining middleware.
   */
  end: () => void
  onResponse: (incomingRes: IncomingMessage, resStream: Readable) => void
  onError: (error: Error) => void
  skipMiddleware: (name: string) => void
  onlyRunMiddleware: (names: string[]) => void
}>

export function _runStage (type: HttpStages, ctx: any, onError: Function) {
  ctx.stage = HttpStages[type]

  const runMiddlewareStack = (): Promise<void> => {
    const middlewares = ctx.middleware[type]

    // pop the first pair off the middleware
    const middlewareName = _.keys(middlewares)[0]

    if (!middlewareName) {
      return Bluebird.resolve()
    }

    const middleware = middlewares[middlewareName]

    ctx.middleware[type] = _.omit(middlewares, middlewareName)

    return new Bluebird((resolve) => {
      let ended = false

      function copyChangedCtx () {
        _.chain(fullCtx)
        .omit(READONLY_MIDDLEWARE_KEYS)
        .forEach((value, key) => {
          if (ctx[key] !== value) {
            ctx[key] = value
          }
        })
        .value()
      }

      function _onError (error: Error) {
        ctx.debug('Error in middleware %o', { middlewareName, error })

        if (type === HttpStages.Error) {
          return
        }

        ctx.res.off('close', onClose)
        _end(onError(error))
      }

      function onClose () {
        if (!ctx.res.writableFinished) {
          _onError(new Error('Socket closed before finished writing response.'))
        }
      }

      // If we are in the middle of the response phase we want to listen for the on close message and abort responding and instead send an error.
      // If the response is closed before the middleware completes, it implies the that request was canceled by the browser.
      // The request phase is handled elsewhere because we always want the request phase to complete before erroring on canceled.
      if (type === HttpStages.IncomingResponse) {
        ctx.res.on('close', onClose)
      }

      function _end (retval?) {
        ctx.res.off('close', onClose)

        if (ended) {
          return
        }

        ended = true

        copyChangedCtx()

        resolve(retval)
      }

      if (!middleware) {
        return resolve()
      }

      const fullCtx = {
        next: () => {
          fullCtx.next = () => {
            const error = new Error('Error running proxy middleware: Detected `this.next()` was called more than once in the same middleware function, but a middleware can only be completed once.')

            if (ctx.error) {
              error.message = error.message += '\nThis middleware invocation previously encountered an error which may be related, see `error.cause`'
              error['cause'] = ctx.error
            }

            throw error
          }

          copyChangedCtx()

          ctx.res.off('close', onClose)
          _end(runMiddlewareStack())
        },
        end: _end,
        onResponse: (incomingRes: Response, resStream: Readable) => {
          ctx.incomingRes = incomingRes
          ctx.incomingResStream = resStream

          _end()
        },
        onError: _onError,
        skipMiddleware: (name: string) => {
          ctx.middleware[type] = _.omit(ctx.middleware[type], name)
        },
        onlyRunMiddleware: (names: string[]) => {
          ctx.middleware[type] = _.pick(ctx.middleware[type], names)
        },
        ...ctx,
      }

      try {
        middleware.call(fullCtx)
      } catch (err) {
        err.message = `Internal error while proxying "${ctx.req.method} ${ctx.req.proxiedUrl}" in ${middlewareName}:\n${err.message}`

        errorUtils.logError(err)
        fullCtx.onError(err)
      }
    })
  }

  return runMiddlewareStack()
}

function getUniqueRequestId (requestId: string) {
  const match = /^(.*)-retry-([\d]+)$/.exec(requestId)

  if (match) {
    return `${match[1]}-retry-${Number(match[2]) + 1}`
  }

  return `${requestId}-retry-1`
}

export class Http {
  buffers: HttpBuffers
  config: CyServer.Config
  shouldCorrelatePreRequests: () => boolean
  deferredSourceMapCache: DeferredSourceMapCache
  getFileServerToken: () => string | undefined
  remoteStates: RemoteStates
  middleware: HttpMiddlewareStacks
  netStubbingState: NetStubbingState
  preRequests: PreRequests = new PreRequests()
  getCurrentBrowser: () => FoundBrowser
  request: any
  socket: CyServer.Socket
  serverBus: EventEmitter
  resourceTypeAndCredentialManager: ResourceTypeAndCredentialManager
  renderedHTMLOrigins: {[key: string]: boolean} = {}
  autUrl?: string
  getCookieJar: () => CookieJar
  protocolManager?: ProtocolManagerShape
  serviceWorkerManager: ServiceWorkerManager = new ServiceWorkerManager()

  constructor (opts: ServerCtx & { middleware?: HttpMiddlewareStacks }) {
    this.buffers = new HttpBuffers()
    this.deferredSourceMapCache = new DeferredSourceMapCache(opts.request)
    this.config = opts.config
    this.shouldCorrelatePreRequests = opts.shouldCorrelatePreRequests || (() => false)
    this.getFileServerToken = opts.getFileServerToken
    this.remoteStates = opts.remoteStates
    this.middleware = opts.middleware
    this.netStubbingState = opts.netStubbingState
    this.socket = opts.socket
    this.request = opts.request
    this.serverBus = opts.serverBus
    this.resourceTypeAndCredentialManager = opts.resourceTypeAndCredentialManager
    this.getCookieJar = opts.getCookieJar
    this.getCurrentBrowser = opts.getCurrentBrowser

    if (typeof opts.middleware === 'undefined') {
      this.middleware = defaultMiddleware
    }
  }

  handleHttpRequest (req: CypressIncomingRequest, res: CypressOutgoingResponse, handleHttpRequestSpan?: Span) {
    const colorFn = debugVerbose.enabled ? getRandomColorFn() : undefined
    const debugUrl = debugVerbose.enabled ?
      (req.proxiedUrl.length > 80 ? `${req.proxiedUrl.slice(0, 80)}...` : req.proxiedUrl)
      : undefined

    const ctx: HttpMiddlewareCtx<any> = {
      req,
      res,
      handleHttpRequestSpan,
      buffers: this.buffers,
      config: this.config,
      shouldCorrelatePreRequests: this.shouldCorrelatePreRequests,
      getFileServerToken: this.getFileServerToken,
      remoteStates: this.remoteStates,
      request: this.request,
      middleware: _.cloneDeep(this.middleware),
      netStubbingState: this.netStubbingState,
      socket: this.socket,
      serverBus: this.serverBus,
      resourceTypeAndCredentialManager: this.resourceTypeAndCredentialManager,
      getCookieJar: this.getCookieJar,
      simulatedCookies: [],
      debug: (formatter, ...args) => {
        if (!debugVerbose.enabled) return

        debugVerbose(`${colorFn!(`%s %s`)} %s ${formatter}`, req.method, debugUrl, chalk.grey(ctx.stage), ...args)
      },
      deferSourceMapRewrite: (opts) => {
        this.deferredSourceMapCache.defer({
          resHeaders: ctx.incomingRes.headers,
          ...opts,
        })
      },
      getRenderedHTMLOrigins: this.getRenderedHTMLOrigins,
      getAUTUrl: this.getAUTUrl,
      setAUTUrl: this.setAUTUrl,
      getPreRequest: (cb) => {
        // The initial request that loads the service worker does not always get sent to CDP. Thus, we need to explicitly ignore it. We determine
        // it's the service worker request via the `service-worker` header
        if (hasServiceWorkerHeader(req.headers)) {
          ctx.debug('Ignoring service worker script since we are not guaranteed to receive it', req.proxiedUrl)

          cb({
            noPreRequestExpected: true,
          })

          return
        }

        return this.preRequests.get(ctx.req, ctx.debug, cb)
      },
      addPendingUrlWithoutPreRequest: (url) => {
        this.preRequests.addPendingUrlWithoutPreRequest(url)
      },
      removePendingRequest: (pendingRequest: PendingRequest) => {
        this.preRequests.removePendingRequest(pendingRequest)
      },
      protocolManager: this.protocolManager,
      getCurrentBrowser: this.getCurrentBrowser,
    }

    const onError = async (error: Error): Promise<void> => {
      const pendingRequest = ctx.pendingRequest as PendingRequest | undefined

      if (pendingRequest) {
        delete ctx.pendingRequest
        ctx.removePendingRequest(pendingRequest)
      }

      ctx.error = error

      // if there is a pre-request and the error has not been handled and the response has not been destroyed
      // (which implies the request was canceled by the browser), try to re-use the pre-request for the next retry
      //
      // browsers will retry requests in the event of network errors, but they will not send pre-requests,
      // so try to re-use the current browserPreRequest for the next retry after incrementing the ID.
      if (ctx.req.browserPreRequest && !ctx.req.browserPreRequest.errorHandled && !ctx.res.destroyed) {
        ctx.req.browserPreRequest.errorHandled = true
        const preRequest = {
          ...ctx.req.browserPreRequest,
          requestId: getUniqueRequestId(ctx.req.browserPreRequest.requestId),
          errorHandled: false,
        }

        ctx.debug('Re-using pre-request data %o', preRequest)
        await this.addPendingBrowserPreRequest(preRequest)
      }

      return _runStage(HttpStages.Error, ctx, onError)
    }

    // start the span that is responsible for recording the start time of the entire middleware run on the stack
    // make this span a part of the middleware ctx so we can keep names simple when correlating
    ctx.reqMiddlewareSpan = telemetry.startSpan({
      name: 'request:middleware',
      parentSpan: handleHttpRequestSpan,
      isVerbose,
    })

    return _runStage(HttpStages.IncomingRequest, ctx, onError)
    .then(() => {
      // If the response has been destroyed after handling the incoming request, it implies the that request was canceled by the browser.
      // In this case we don't want to run the response middleware and should just exit.
      if (res.destroyed) {
        return onError(new Error('Socket closed before finished writing response'))
      }

      if (ctx.incomingRes) {
        // start the span that is responsible for recording the start time of the entire middleware run on the stack
        ctx.resMiddlewareSpan = telemetry.startSpan({
          name: 'response:middleware',
          parentSpan: handleHttpRequestSpan,
          isVerbose,
        })

        return _runStage(HttpStages.IncomingResponse, ctx, onError)
        .finally(() => {
          ctx.resMiddlewareSpan?.end()
        })
      }

      return ctx.debug('Warning: Request was not fulfilled with a response.')
    })
  }

  getRenderedHTMLOrigins = () => {
    return this.renderedHTMLOrigins
  }

  getAUTUrl = () => {
    return this.autUrl
  }

  setAUTUrl = (url) => {
    this.autUrl = url
  }

  async handleSourceMapRequest (req: Request, res: Response) {
    try {
      const sm = await this.deferredSourceMapCache.resolve(req.params.id, req.headers)

      if (!sm) {
        throw new Error('no sourcemap found')
      }

      res.json(sm)
    } catch (err) {
      res.status(500).json({ err })
    }
  }

  reset (options: { resetBetweenSpecs: boolean }) {
    this.buffers.reset()
    this.setAUTUrl(undefined)

    if (options.resetBetweenSpecs) {
      this.preRequests.reset()
      this.serviceWorkerManager = new ServiceWorkerManager()
    }
  }

  setBuffer (buffer) {
    return this.buffers.set(buffer)
  }

  async addPendingBrowserPreRequest (browserPreRequest: BrowserPreRequest) {
    if (await this.shouldIgnorePendingRequest(browserPreRequest)) {
      return
    }

    this.preRequests.addPending(browserPreRequest)
  }

  removePendingBrowserPreRequest (requestId: string) {
    this.preRequests.removePendingPreRequest(requestId)
  }

  getPendingBrowserPreRequests () {
    return this.preRequests.pendingPreRequests
  }

  addPendingUrlWithoutPreRequest (url: string) {
    this.preRequests.addPendingUrlWithoutPreRequest(url)
  }

  updateServiceWorkerRegistrations (data: Protocol.ServiceWorker.WorkerRegistrationUpdatedEvent) {
    this.serviceWorkerManager.updateServiceWorkerRegistrations(data)
  }

  updateServiceWorkerVersions (data: Protocol.ServiceWorker.WorkerVersionUpdatedEvent) {
    this.serviceWorkerManager.updateServiceWorkerVersions(data)
  }

  updateServiceWorkerClientSideRegistrations (data: { scriptURL: string, initiatorOrigin: string }) {
    this.serviceWorkerManager.addInitiatorToServiceWorker({ scriptURL: data.scriptURL, initiatorOrigin: data.initiatorOrigin })
  }

  handleServiceWorkerClientEvent (event: ServiceWorkerClientEvent) {
    this.serviceWorkerManager.handleServiceWorkerClientEvent(event)
  }

  setProtocolManager (protocolManager: ProtocolManagerShape) {
    this.protocolManager = protocolManager
    this.preRequests.setProtocolManager(protocolManager)
  }

  setPreRequestTimeout (timeout: number) {
    this.preRequests.setPreRequestTimeout(timeout)
  }

  private async shouldIgnorePendingRequest (browserPreRequest: BrowserPreRequest) {
    // The initial request that loads the service worker does not always get sent to CDP. If it does, we want it to not clog up either the prerequests
    // or pending requests. Thus, we need to explicitly ignore it here and in `get`. We determine it's the service worker request via the
    // `service-worker` header
    if (hasServiceWorkerHeader(browserPreRequest.headers)) {
      debugVerbose('Ignoring service worker script since we are not guaranteed to receive it: %o', browserPreRequest)

      return true
    }

    if (await this.serviceWorkerManager.processBrowserPreRequest(browserPreRequest)) {
      debugVerbose('Not correlating request since it is fully controlled by the service worker and the correlation will happen within the service worker: %o', browserPreRequest)

      return true
    }

    return false
  }
}
