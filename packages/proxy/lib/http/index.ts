import _ from 'lodash'
import CyServer from '@packages/server'
import {
  CypressIncomingRequest,
  CypressOutgoingResponse,
} from '@packages/proxy'
import debugModule from 'debug'
import ErrorMiddleware from './error-middleware'
import { HttpBuffers } from './util/buffers'
import { IncomingMessage } from 'http'
import { NetStubbingState } from '@packages/net-stubbing/server'
import Promise from 'bluebird'
import { Readable } from 'stream'
import { Response } from 'express'
import RequestMiddleware from './request-middleware'
import ResponseMiddleware from './response-middleware'

const debug = debugModule('cypress:proxy:http')

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

  middleware: HttpMiddlewareStacks
} & T

export type ServerCtx = Readonly<{
  config: CyServer.Config
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
  const stage = HttpStages[type]

  debug('Entering stage %o', { stage })

  const runMiddlewareStack = () => {
    const middlewares = ctx.middleware[type]

    // pop the first pair off the middleware
    const middlewareName = _.keys(middlewares)[0]

    if (!middlewareName) {
      return Promise.resolve()
    }

    const middleware = middlewares[middlewareName]

    ctx.middleware[type] = _.omit(middlewares, middlewareName)

    return new Promise((resolve) => {
      let ended = false

      function copyChangedCtx () {
        if (ended) {
          return
        }

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
        onResponse: (incomingRes: Response, resStream: Readable) => {
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
  config: CyServer.Config
  getFileServerToken: () => string
  getRemoteState: () => any
  middleware: HttpMiddlewareStacks
  netStubbingState: NetStubbingState
  request: any
  socket: CyServer.Socket

  constructor (opts: ServerCtx & { middleware?: HttpMiddlewareStacks }) {
    this.buffers = new HttpBuffers()

    this.config = opts.config
    this.getFileServerToken = opts.getFileServerToken
    this.getRemoteState = opts.getRemoteState
    this.middleware = opts.middleware
    this.netStubbingState = opts.netStubbingState
    this.socket = opts.socket
    _.assign(this, opts)

    if (typeof opts.middleware === 'undefined') {
      this.middleware = {
        [HttpStages.IncomingRequest]: RequestMiddleware,
        [HttpStages.IncomingResponse]: ResponseMiddleware,
        [HttpStages.Error]: ErrorMiddleware,
      }
    }
  }

  handle (req, res) {
    const ctx: HttpMiddlewareCtx<any> = {
      req,
      res,

      buffers: this.buffers,
      config: this.config,
      getFileServerToken: this.getFileServerToken,
      getRemoteState: this.getRemoteState,
      request: this.request,
      middleware: _.cloneDeep(this.middleware),
      netStubbingState: this.netStubbingState,
      socket: this.socket,
    }

    return _runStage(HttpStages.IncomingRequest, ctx)
    .then(() => {
      if (ctx.incomingRes) {
        return _runStage(HttpStages.IncomingResponse, ctx)
      }

      return debug('warning: Request was not fulfilled with a response.')
    })
  }

  reset () {
    this.buffers.reset()
  }

  setBuffer (buffer) {
    return this.buffers.set(buffer)
  }
}
