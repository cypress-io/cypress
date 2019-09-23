import _ from 'lodash'
import concatStream from 'concat-stream'
import debugModule from 'debug'
import { IncomingMessage } from 'http'
import { PassThrough, Readable } from 'stream'
import ThrottleStream from 'throttle'

import {
  CypressIncomingRequest,
} from '@packages/proxy'
import {
  NetStubbingState,
} from './types'
import {
  CyHttpMessages,
  NetEventFrames,
  SERIALIZABLE_RES_PROPS,
} from '../types'
import {
  emit,
  sendStaticResponse,
} from './util'

const debug = debugModule('cypress:net-stubbing:server:intercept-response')

export function InterceptResponse (state: NetStubbingState, project: any, req: CypressIncomingRequest, getResBodyStream: () => Readable, incomingRes: IncomingMessage, continueResponse: (newResStream?: Readable) => void) {
  const backendRequest = state.requests[req.requestId]

  debug('onProxiedResponse %o', { req, backendRequest })

  if (!backendRequest || !backendRequest.sendResponseToDriver) {
    // either the original request was not intercepted, or there's nothing for the driver to do with this response
    return continueResponse()
  }

  // this may get set back to `true` by another route
  backendRequest.sendResponseToDriver = false
  backendRequest.incomingRes = incomingRes
  backendRequest.getResBodyStream = getResBodyStream
  backendRequest.continueResponse = continueResponse

  const frame : NetEventFrames.HttpResponseReceived = {
    routeHandlerId: backendRequest.route.handlerId!,
    requestId: backendRequest.requestId,
    res: _.extend(_.pick(incomingRes, SERIALIZABLE_RES_PROPS), {
      url: req.proxiedUrl,
    }) as CyHttpMessages.IncomingResponse,
  }

  const res = frame.res as CyHttpMessages.IncomingResponse

  function emitReceived () {
    emit(project.server._socket, 'http:response:received', frame)
  }

  getResBodyStream().pipe(concatStream((resBody) => {
    res.body = resBody.toString()
    emitReceived()
  }))
}

export function onResponseContinue (state: NetStubbingState, frame: NetEventFrames.HttpResponseContinue) {
  const backendRequest = state.requests[frame.requestId]

  if (typeof backendRequest === 'undefined') {
    return
  }

  const { res } = backendRequest

  debug('_onResponseContinue %o', { backendRequest: _.omit(backendRequest, 'res.body'), frame: _.omit(frame, 'res.body') })

  debug({
    // 'first 10 chars of backendRequest.res.body': backendRequest.res.body.slice(0, 10),
    'first 10 chars of frame.res.body': _.get(frame, 'res.body', '').slice(0, 10),
  })

  function continueResponse () {
    let newResStream : Optional<Readable>

    function throttleify (body) {
      const throttleStr = new ThrottleStream(frame.throttleKbps! * 1024)

      throttleStr.write(body)
      throttleStr.end()

      return throttleStr
    }

    if (frame.staticResponse) {
      if (frame.throttleKbps) {
        return sendStaticResponse(res, frame.staticResponse, throttleify(frame.staticResponse.body))
      }

      return sendStaticResponse(res, frame.staticResponse)
    }

    // merge the changed response attributes with our response and continue
    _.assign(res, _.pick(frame.res, SERIALIZABLE_RES_PROPS))

    function sendBody (bodyBuffer) {
      // transform the body string into stream format
      if (frame.throttleKbps) {
        newResStream = throttleify(bodyBuffer)
      } else {
        const pt = new PassThrough()

        pt.write(bodyBuffer)
        pt.end()

        newResStream = pt
      }

      // TODO: this won't quite work for onProxiedResponseError?
      // @ts-ignore
      backendRequest.continueResponse(newResStream)
    }

    return sendBody(res.body)
  }

  if (typeof frame.continueResponseAt === 'number') {
    const delayMs = frame.continueResponseAt - Date.now()

    if (delayMs > 0) {
      return setTimeout(continueResponse, delayMs)
    }
  }

  return continueResponse()
}
