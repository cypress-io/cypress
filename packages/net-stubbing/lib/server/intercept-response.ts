import _ from 'lodash'
import concatStream from 'concat-stream'
import Debug from 'debug'
import { Readable } from 'stream'

import {
  ResponseMiddleware,
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
  setBodyFromFixture,
  getBodyStream,
} from './util'

const debug = Debug('cypress:net-stubbing:server:intercept-response')

export const InterceptResponse: ResponseMiddleware = function () {
  const backendRequest = this.netStubbingState.requests[this.req.requestId]

  debug('InterceptResponse %o', { req: _.pick(this.req, 'url'), backendRequest })

  if (!backendRequest || !backendRequest.sendResponseToDriver) {
    // either the original request was not intercepted, or there's nothing for the driver to do with this response
    return this.next()
  }

  // this may get set back to `true` by another route
  backendRequest.sendResponseToDriver = false

  backendRequest.incomingRes = this.incomingRes

  backendRequest.onResponse = (incomingRes, resStream) => {
    this.incomingRes = incomingRes

    backendRequest.continueResponse!(resStream)
  }

  backendRequest.continueResponse = (newResStream?: Readable) => {
    if (newResStream) {
      this.incomingResStream = newResStream.on('error', this.onError)
    }

    this.next()
  }

  const frame: NetEventFrames.HttpResponseReceived = {
    routeHandlerId: backendRequest.route.handlerId!,
    requestId: backendRequest.requestId,
    res: _.extend(_.pick(this.incomingRes, SERIALIZABLE_RES_PROPS), {
      url: this.req.proxiedUrl,
    }) as CyHttpMessages.IncomingResponse,
  }

  const res = frame.res as CyHttpMessages.IncomingResponse

  const emitReceived = () => {
    emit(this.socket, 'http:response:received', frame)
  }

  this.makeResStreamPlainText()

  this.incomingResStream.pipe(concatStream((resBody) => {
    res.body = resBody.toString()
    emitReceived()
  }))
}

export async function onResponseContinue (state: NetStubbingState, frame: NetEventFrames.HttpResponseContinue) {
  const backendRequest = state.requests[frame.requestId]

  if (typeof backendRequest === 'undefined') {
    return
  }

  const { res } = backendRequest

  debug('_onResponseContinue %o', { backendRequest: _.omit(backendRequest, 'res.body'), frame: _.omit(frame, 'res.body') })

  const throttleKbps = _.get(frame, 'staticResponse.throttleKbps') || frame.throttleKbps
  const continueResponseAt = _.get(frame, 'staticResponse.continueResponseAt') || frame.continueResponseAt

  if (frame.staticResponse) {
    // replacing response with a staticResponse
    await setBodyFromFixture(backendRequest.route.getFixture, frame.staticResponse)

    const staticResponse = _.chain(frame.staticResponse).clone().assign({ continueResponseAt, throttleKbps }).value()

    return sendStaticResponse(res, staticResponse, backendRequest.onResponse!)
  }

  // merge the changed response attributes with our response and continue
  _.assign(res, _.pick(frame.res, SERIALIZABLE_RES_PROPS))

  const bodyStream = getBodyStream(res.body, { throttleKbps, continueResponseAt })

  return backendRequest.continueResponse!(bodyStream)
}
