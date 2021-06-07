import _ from 'lodash'
import CyServer from '@packages/server'
import {
  CypressIncomingRequest,
  CypressOutgoingResponse,
  BrowserPreRequest,
} from '@packages/proxy'
import Debug from 'debug'
import ErrorMiddleware from './error-middleware'
import { HttpBuffers } from './util/buffers'
import { GetPreRequestCb, PreRequests } from './util/prerequests'
import { IncomingMessage } from 'http'
import { NetStubbingState } from '@packages/net-stubbing'
import Bluebird from 'bluebird'
import { Readable } from 'stream'
import { Request, Response } from 'express'
import RequestMiddleware from './request-middleware'
import ResponseMiddleware from './response-middleware'
import { DeferredSourceMapCache } from '@packages/rewriter'

const debug = Debug('cypress:proxy:http')
const debugRequests = Debug('cypress-verbose:proxy:http')

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
  correlatePreRequests?: boolean
  stage: HttpStages
  debug: Debug.Debugger
  middleware: HttpMiddlewareStacks
  deferSourceMapRewrite: (opts: { js: string, url: string }) => string
  getPreRequest: (cb: GetPreRequestCb) => void
} & T

export const defaultMiddleware = {
  [HttpStages.IncomingRequest]: RequestMiddleware,
  [HttpStages.IncomingResponse]: ResponseMiddleware,
  [HttpStages.Error]: ErrorMiddleware,
}

export type ServerCtx = Readonly<{
  config: CyServer.Config
  correlatePreRequests?: boolean
  getFileServerToken: () => string
  getRemoteState: CyServer.getRemoteState
  netStubbingState: NetStubbingState
  middleware: HttpMiddlewareStacks
  socket: CyServer.Socket
  request: any
}>

const READONLY_MIDDLEWARE_KEYS: (keyof HttpMiddlewareThis<{}>)[] = [
  'buffers',
  'config',
  'getFileServerToken',
  'getRemoteState',
  'netStubbingState',
  'next',
  'end',
  'onResponse',
  'onError',
  'skipMiddleware',
]

type HttpMiddlewareThis<T> = HttpMiddlewareCtx<T> & ServerCtx & Readonly<{
  buffers: HttpBuffers

  next: () => void
  /**
   * Call to completely end the stage, bypassing any remaining middleware.
   */
  end: () => void
  onResponse: (incomingRes: IncomingMessage, resStream: Readable) => void
  onError: (error: Error) => void
  skipMiddleware: (name: string) => void
}>

export function _runStage (type: HttpStages, ctx: any) {
  const stage = ctx.stage = HttpStages[type]

  const runMiddlewareStack = () => {
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

      function _end (retval?) {
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
          copyChangedCtx()

          _end(runMiddlewareStack())
        },
        end: () => _end(),
        onResponse: (incomingRes: Response, resStream: Readable) => {
          ctx.incomingRes = incomingRes
          ctx.incomingResStream = resStream

          _end()
        },
        onError: (error: Error) => {
          ctx.debug('Error in middleware %o', { stage, middlewareName, error })

          if (type === HttpStages.Error) {
            return
          }

          ctx.error = error

          _end(_runStage(HttpStages.Error, ctx))
        },

        skipMiddleware: (name) => {
          ctx.middleware[type] = _.omit(ctx.middleware[type], name)
        },

        ...ctx,
      }

      try {
        middleware.call(fullCtx)
      } catch (err) {
        fullCtx.onError(err)
      }
    })
  }

  return runMiddlewareStack()
}

export class Http {
  buffers: HttpBuffers
  config: CyServer.Config
  correlatePreRequests?: boolean
  deferredSourceMapCache: DeferredSourceMapCache
  getFileServerToken: () => string
  getRemoteState: () => any
  middleware: HttpMiddlewareStacks
  netStubbingState: NetStubbingState
  preRequests: PreRequests = new PreRequests()
  request: any
  socket: CyServer.Socket

  constructor (opts: ServerCtx & { middleware?: HttpMiddlewareStacks }) {
    this.buffers = new HttpBuffers()
    this.deferredSourceMapCache = new DeferredSourceMapCache(opts.request)

    this.config = opts.config
    this.correlatePreRequests = opts.correlatePreRequests
    this.getFileServerToken = opts.getFileServerToken
    this.getRemoteState = opts.getRemoteState
    this.middleware = opts.middleware
    this.netStubbingState = opts.netStubbingState
    this.socket = opts.socket
    this.request = opts.request

    if (typeof opts.middleware === 'undefined') {
      this.middleware = defaultMiddleware
    }
  }

  handle (req: Request, res: Response) {
    const ctx: HttpMiddlewareCtx<any> = {
      req,
      res,
      buffers: this.buffers,
      config: this.config,
      correlatePreRequests: this.correlatePreRequests,
      getFileServerToken: this.getFileServerToken,
      getRemoteState: this.getRemoteState,
      request: this.request,
      middleware: _.cloneDeep(this.middleware),
      netStubbingState: this.netStubbingState,
      socket: this.socket,
      debug: (formatter, ...args) => {
        debugRequests(`%s %s %s: ${formatter}`, ctx.stage, ctx.req.method, ctx.req.proxiedUrl, ...args)
      },
      deferSourceMapRewrite: (opts) => {
        this.deferredSourceMapCache.defer({
          resHeaders: ctx.incomingRes.headers,
          ...opts,
        })
      },
      getPreRequest: (cb) => {
        this.preRequests.get(ctx.req, ctx.debug, cb)
      },
    }

    return _runStage(HttpStages.IncomingRequest, ctx)
    .then(() => {
      if (ctx.incomingRes) {
        return _runStage(HttpStages.IncomingResponse, ctx)
      }

      return debug('warning: Request was not fulfilled with a response.')
    })
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

  reset () {
    this.buffers.reset()
    this.preRequests = new PreRequests()
  }

  setBuffer (buffer) {
    return this.buffers.set(buffer)
  }

  addPendingBrowserPreRequest (browserPreRequest: BrowserPreRequest) {
    debug('received browser pre-request: %o', browserPreRequest)

    this.preRequests.addPending(browserPreRequest)
  }
}
