import _ from 'lodash'
import debugModule from 'debug'
import ErrorMiddleware from './error-middleware'
import { HttpBuffers } from './util/buffers'
import { IncomingMessage } from 'http'
import Bluebird from 'bluebird'
import { Readable } from 'stream'
import { Request, Response } from 'express'
import RequestMiddleware from './request-middleware'
import ResponseMiddleware from './response-middleware'
import { DeferredSourceMapCache } from '@packages/rewriter'

const debug = debugModule('cypress:proxy:http')

export enum HttpStages {
  IncomingRequest,
  IncomingResponse,
  Error
}

export type HttpMiddleware<T> = (this: HttpMiddlewareThis<T>) => void

export type CypressRequest = Request & {
  // TODO: what's this difference from req.url? is it only for non-proxied requests?
  proxiedUrl: string
  abort: () => void
}

type MiddlewareStacks = {
  [stage in HttpStages]: {
    [name: string]: HttpMiddleware<any>
  }
}

export type CypressResponse = Response & {
  isInitial: null | boolean
  wantsInjection: 'full' | 'partial' | false
  wantsSecurityRemoved: null | boolean
}

type HttpMiddlewareCtx<T> = {
  req: CypressRequest
  res: CypressResponse

  middleware: MiddlewareStacks
  deferSourceMapRewrite: (opts: { js: string, url: string }) => string
} & T

const READONLY_MIDDLEWARE_KEYS: (keyof HttpMiddlewareThis<{}>)[] = [
  'buffers',
  'config',
  'getFileServerToken',
  'getRemoteState',
  'request',
  'next',
  'end',
  'onResponse',
  'onError',
  'skipMiddleware',
]

type HttpMiddlewareThis<T> = HttpMiddlewareCtx<T> & Readonly<{
  buffers: HttpBuffers
  config: any
  getFileServerToken: () => string
  getRemoteState: () => any
  request: any

  next: () => void
  /**
   * Call to completely end the stage, bypassing any remaining middleware.
   */
  end: () => void
  onResponse: (incomingRes: Response, resStream: Readable) => void
  onError: (error: Error) => void
  skipMiddleware: (name: string) => void
}>

export function _runStage (type: HttpStages, ctx: any) {
  const stage = HttpStages[type]

  debug('Entering stage %o', { stage })

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

      debug('Running middleware %o', { stage, middlewareName })

      const fullCtx = {
        next: () => {
          copyChangedCtx()

          _end(runMiddlewareStack())
        },
        end: () => _end(),
        onResponse: (incomingRes: IncomingMessage, resStream: Readable) => {
          ctx.incomingRes = incomingRes
          ctx.incomingResStream = resStream

          _end()
        },
        onError: (error: Error) => {
          debug('Error in middleware %o', { stage, middlewareName, error })

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
  .then(() => {
    debug('Leaving stage %o', { stage })
  })
}

export class Http {
  buffers: HttpBuffers
  deferredSourceMapCache: DeferredSourceMapCache
  config: any
  getFileServerToken: () => string
  getRemoteState: () => any
  middleware: MiddlewareStacks
  request: any

  constructor (opts: {
    config: any
    getFileServerToken: () => string
    getRemoteState: () => any
    middleware?: MiddlewareStacks
    request: any
  }) {
    this.buffers = new HttpBuffers()
    this.deferredSourceMapCache = new DeferredSourceMapCache(opts.request)

    this.config = opts.config
    this.getFileServerToken = opts.getFileServerToken
    this.getRemoteState = opts.getRemoteState
    this.request = opts.request

    if (typeof opts.middleware === 'undefined') {
      this.middleware = {
        [HttpStages.IncomingRequest]: RequestMiddleware,
        [HttpStages.IncomingResponse]: ResponseMiddleware,
        [HttpStages.Error]: ErrorMiddleware,
      }
    } else {
      this.middleware = opts.middleware
    }
  }

  handle (req: Request, res: Response) {
    const ctx: HttpMiddlewareCtx<any> = {
      req,
      res,

      buffers: this.buffers,
      config: this.config,
      getFileServerToken: this.getFileServerToken,
      getRemoteState: this.getRemoteState,
      request: this.request,
      middleware: _.cloneDeep(this.middleware),
      deferSourceMapRewrite: (opts) => {
        this.deferredSourceMapCache.defer({
          resHeaders: ctx.incomingRes.headers,
          ...opts,
        })
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
  }

  setBuffer (buffer) {
    return this.buffers.set(buffer)
  }
}
