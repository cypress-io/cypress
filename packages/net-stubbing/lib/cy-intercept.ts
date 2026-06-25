import _ from 'lodash'
import url from 'url'
import Debug from 'debug'
import errors from '@packages/errors'
import type {
  AnnotatedRouteMatcherOptions,
  BackendRoute,
  BackendStaticResponse,
  ForInterceptionEvents,
  ForStubbing,
  GetFixtureFn,
  HttpRequest,
  HttpResponse,
  InterceptMiddleware,
  NetEvent,
  OriginForwarder,
  RouteMatcherOptions,
  Subscription,
} from '@packages/network-interception'
import { PLAIN_FIELDS, SERIALIZABLE_RES_PROPS } from '@packages/network-interception'
import type { SocketBroadcaster } from '@packages/socket'
import type { InFlightIntercept } from './core/in-flight-intercept'
import {
  addInFlightInterceptSubscription,
  createInFlightIntercept,
  markInFlightInterceptStaticResponse,
} from './core/in-flight-intercept'
import {
  applyHandlerRequestToRequest,
  cloneHandlerRequest,
  cloneHandlerResponse,
  mergeIncomingRequestChanges,
  mergeIncomingResponseChanges,
} from './core/merge-handler-result'
import { planSubscriptions } from './core/plan-subscriptions'
import { matchRoutes, matchesRoutePreflight } from './core/route-matching'
import type { RouteMatchableRequest } from './core/route-matching'
import { buildHttpResponseFromStatic, buildPreflightHttpResponse } from './core/static-response'
import { runSubscriptions } from './core/subscription-runner'
import {
  fromDriverInterceptChangedData,
  toDriverInterceptEventData,
} from './driver-intercept-bridge'
import type { PendingEventHandler } from './driver-intercept-bridge'
import { getAllStringMatcherFields, getBodyEncoding, setResponseFromFixture, emit } from './server/util'

const debug = Debug('cypress:net-stubbing:cy-intercept')

export const INTERCEPT_HEADERS = [
  'x-cypress-is-from-extra-target',
] as const

export type CyInterceptConfig = {
  devServerPublicPathRoute?: string
  exclusionHeaders?: readonly string[]
}

export type CyInterceptOptions = {
  socket: SocketBroadcaster
  onSyncInterceptSkipped?: (url: string) => void
  config?: CyInterceptConfig
}

export type DriverEventFrame =
  | NetEvent.ToServer.AddRoute<BackendStaticResponse>
  | NetEvent.ToServer.Subscribe
  | NetEvent.ToServer.EventHandlerResolved
  | NetEvent.ToServer.SendStaticResponse

function isExcludedFromCyIntercept (request: HttpRequest, config: CyInterceptConfig): boolean {
  const { devServerPublicPathRoute, exclusionHeaders = [] } = config

  if (devServerPublicPathRoute) {
    try {
      const pathname = new URL(request.url).pathname

      if (pathname.startsWith(devServerPublicPathRoute)) {
        return true
      }
    } catch {
      // ignore invalid URLs
    }
  }

  return exclusionHeaders.some((header) => {
    return !!request.headers[header]
  })
}

export function _restoreMatcherOptionsTypes (options: AnnotatedRouteMatcherOptions) {
  const stringMatcherFields = getAllStringMatcherFields(options)

  const ret: RouteMatcherOptions = {}

  stringMatcherFields.forEach((field) => {
    const obj = _.get(options, field)

    if (!obj) {
      return
    }

    let { value, type } = obj

    if (type === 'regex') {
      const lastSlashI = value.lastIndexOf('/')
      const flags = value.slice(lastSlashI + 1)
      const pattern = value.slice(1, lastSlashI)

      value = new RegExp(pattern, flags)
    }

    _.set(ret, field, value)
  })

  _.extend(ret, _.pick(options, PLAIN_FIELDS))

  return ret
}

/**
 * Owns `cy.intercept` route state, in-flight intercepts, driver socket I/O, and HTTP middleware.
 */
export class CyIntercept implements ForStubbing, ForInterceptionEvents {
  routes: BackendRoute[] = []

  pendingEventHandlers: Record<string, PendingEventHandler> = {}
  private readonly inFlightIntercepts = new Map<string, InFlightIntercept>()
  private readonly socket: SocketBroadcaster
  private readonly onSyncInterceptSkipped?: (url: string) => void
  private readonly config: CyInterceptConfig

  constructor (options: CyInterceptOptions) {
    this.socket = options.socket
    this.onSyncInterceptSkipped = options.onSyncInterceptSkipped
    this.config = options.config ?? {}
  }

  readonly middleware: InterceptMiddleware = async (
    request: HttpRequest,
    next: OriginForwarder,
  ): Promise<HttpResponse> => {
    if (isExcludedFromCyIntercept(request, this.config)) {
      return next(request)
    }

    if (matchesRoutePreflight(this.routes, request)) {
      request.hadIntercept = true

      return buildPreflightHttpResponse(request)
    }

    const matchingRoutes = matchRoutes(this.routes, request)

    if (!matchingRoutes.length) {
      return next(request)
    }

    request.hadIntercept = true

    const subscriptionsByRoute = planSubscriptions({
      matchingRoutes,
      isSyncRequest: request.isSyncRequest,
      url: request.url,
      onSyncInterceptSkipped: this.onSyncInterceptSkipped,
    })

    const inFlightIntercept = createInFlightIntercept(request, matchingRoutes, subscriptionsByRoute)

    this.inFlightIntercepts.set(inFlightIntercept.request.inFlightInterceptId, inFlightIntercept)

    let deferCleanup = false

    try {
      const needsRequestBody = matchingRoutes.some((route) => route.hasInterceptor)

      if (needsRequestBody && request.materializeRequestBody) {
        request.body = await request.materializeRequestBody()
        request.requestBodyMaterialized = true

        const bodyEncoding = getBodyEncoding({
          body: request.body ?? '',
          headers: request.headers,
        } as any)

        if (bodyEncoding !== 'binary' && request.body && Buffer.isBuffer(request.body)) {
          request.body = request.body.toString('utf8')
        }
      }

      const handlerRequest = cloneHandlerRequest(request)

      const mergeRequestChanges = (before: HttpRequest, after: HttpRequest) => {
        const resolvedUrl = mergeIncomingRequestChanges(before, after, {
          baseUrl: request.url,
          resolveUrl: (baseUrl, relativeUrl) => url.resolve(baseUrl, relativeUrl),
        })

        applyHandlerRequestToRequest(request, before, resolvedUrl)
      }

      await runSubscriptions({
        inFlightIntercept,
        eventName: 'before:request',
        data: handlerRequest,
        mergeChanges: mergeRequestChanges,
        driverNotification: this,
      })

      if (inFlightIntercept.forceNetworkError) {
        throw new Error('forceNetworkError called')
      }

      if (inFlightIntercept.fulfilledAtRequestStage && inFlightIntercept.stubResponse) {
        const stubResponse = inFlightIntercept.stubResponse

        this.attachAfterResponseOnWritten(stubResponse, inFlightIntercept)
        deferCleanup = true

        return stubResponse
      }

      let originResponse: HttpResponse

      try {
        originResponse = await next(request)
      } catch (error) {
        await runSubscriptions({
          inFlightIntercept,
          eventName: 'network:error',
          data: { error: errors.cloneErr(error as Error) },
          mergeChanges: _.noop,
          driverNotification: this,
        })

        throw error
      }

      const needsResponseBody = matchingRoutes.some((route) => route.hasInterceptor)

      if (needsResponseBody && originResponse.materializeResponseBody) {
        originResponse.body = await originResponse.materializeResponseBody()
      }

      const handlerResponse = cloneHandlerResponse(originResponse, request.url)

      const mergeResponseChanges = (
        before: HttpResponse,
        after: HttpResponse,
      ) => {
        mergeIncomingResponseChanges(before, after, {
          serializableProps: SERIALIZABLE_RES_PROPS,
        })
      }

      const modifiedResponse = await runSubscriptions({
        inFlightIntercept,
        eventName: ['before:response', 'response:callback', 'response'],
        data: handlerResponse,
        mergeChanges: mergeResponseChanges,
        driverNotification: this,
      })

      const finalResponse = inFlightIntercept.responseOverride ?? {
        statusCode: modifiedResponse.statusCode,
        statusMessage: modifiedResponse.statusMessage,
        headers: modifiedResponse.headers,
        body: modifiedResponse.body,
        delay: modifiedResponse.delay,
        throttleKbps: modifiedResponse.throttleKbps,
        materializeResponseBody: modifiedResponse.body === undefined
          ? originResponse.materializeResponseBody
          : undefined,
        consumePassthroughResponse: modifiedResponse.body === undefined
          ? originResponse.consumePassthroughResponse
          : undefined,
      }

      this.attachAfterResponseOnWritten(finalResponse, inFlightIntercept)
      deferCleanup = true

      return finalResponse
    } finally {
      if (!deferCleanup) {
        this.inFlightIntercepts.delete(inFlightIntercept.request.inFlightInterceptId)
      }
    }
  }

  matchesUrl (req: RouteMatchableRequest): boolean {
    return matchRoutes(this.routes, req).length > 0
  }

  private attachAfterResponseOnWritten (
    response: HttpResponse,
    inFlightIntercept: InFlightIntercept,
  ): void {
    const inFlightInterceptId = inFlightIntercept.request.inFlightInterceptId

    response.onResponseWrittenToClient = async () => {
      try {
        await runSubscriptions({
          inFlightIntercept,
          eventName: 'after:response',
          data: inFlightIntercept.includeBodyInAfterResponse ? {
            finalResBody: response.body!,
          } : {},
          mergeChanges: _.noop,
          driverNotification: this,
        })
      } finally {
        this.inFlightIntercepts.delete(inFlightInterceptId)
      }
    }
  }

  reset (): void {
    this.pendingEventHandlers = {}
    this.routes = []
  }

  emitAndAwait<D, R = unknown> (
    eventName: string,
    frame: NetEvent.ToDriver.Event<D>,
  ): Promise<{ changedData?: R, stopPropagation?: boolean }> {
    return new Promise((resolve) => {
      const pending: PendingEventHandler = {
        eventName,
        complete: ({ changedData, stopPropagation }) => {
          resolve({
            changedData: changedData as R,
            stopPropagation,
          })
        },
      }

      this.pendingEventHandlers[frame.eventId] = pending
      emit(this.socket, eventName, {
        ...frame,
        data: toDriverInterceptEventData(eventName, frame.data),
      })
    })
  }

  emit<D> (eventName: string, frame: NetEvent.ToDriver.Event<D>): void {
    emit(this.socket, eventName, {
      ...frame,
      data: toDriverInterceptEventData(eventName, frame.data),
    })
  }

  resolveEventHandler (options: {
    eventId: string
    changedData?: unknown
    stopPropagation: boolean
  }): void {
    const pending = this.pendingEventHandlers[options.eventId]

    if (!pending) {
      return
    }

    delete this.pendingEventHandlers[options.eventId]

    pending.complete({
      changedData: options.changedData === undefined
        ? undefined
        : fromDriverInterceptChangedData(pending.eventName, options.changedData),
      stopPropagation: options.stopPropagation,
    })
  }

  async handleDriverEvent (
    eventName: string,
    frame: DriverEventFrame,
    getFixture: GetFixtureFn,
  ): Promise<unknown> {
    debug('received driver event %o', { eventName, frame })

    switch (eventName) {
      case 'route:added':
        return this.onRouteAdded(getFixture, frame as NetEvent.ToServer.AddRoute<BackendStaticResponse>)
      case 'subscribe':
        return this.addSubscription(
          (frame as NetEvent.ToServer.Subscribe).requestId,
          (frame as NetEvent.ToServer.Subscribe).subscription,
        )
      case 'event:handler:resolved':
        return this.resolveEventHandler(frame as NetEvent.ToServer.EventHandlerResolved)
      case 'send:static:response': {
        const sendStaticResponseFrame = frame as NetEvent.ToServer.SendStaticResponse

        return this.fulfillStaticResponse(
          sendStaticResponseFrame.requestId,
          sendStaticResponseFrame.staticResponse,
          getFixture,
        )
      }
      default:
        throw new Error(`Unrecognized net event: ${eventName}`)
    }
  }

  private async onRouteAdded (
    getFixture: GetFixtureFn,
    options: NetEvent.ToServer.AddRoute<BackendStaticResponse>,
  ): Promise<void> {
    const routeMatcher = _restoreMatcherOptionsTypes(options.routeMatcher)
    const { staticResponse } = options

    if (staticResponse) {
      await setResponseFromFixture(getFixture, staticResponse)
    }

    const route: BackendRoute = {
      id: options.routeId,
      hasInterceptor: options.hasInterceptor,
      staticResponse: options.staticResponse,
      routeMatcher,
      getFixture,
      matches: 0,
    }

    this.routes.push(route)
  }

  private addSubscription (inFlightInterceptId: string, subscription: Subscription): void {
    const inFlightIntercept = this.inFlightIntercepts.get(inFlightInterceptId)

    if (!inFlightIntercept) {
      return
    }

    addInFlightInterceptSubscription(inFlightIntercept, subscription)
  }

  private async fulfillStaticResponse (
    inFlightInterceptId: string,
    staticResponse: BackendStaticResponse,
    getFixture: GetFixtureFn,
  ): Promise<void> {
    const inFlightIntercept = this.inFlightIntercepts.get(inFlightInterceptId)

    if (!inFlightIntercept) {
      return
    }

    if (staticResponse.forceNetworkError) {
      inFlightIntercept.forceNetworkError = true
      inFlightIntercept.fulfilledAtRequestStage = true

      return
    }

    const response = await buildHttpResponseFromStatic(staticResponse, getFixture)

    if (['before:response', 'response:callback', 'response'].includes(inFlightIntercept.lastEvent!)) {
      if (staticResponse.fixture) {
        inFlightIntercept.includeBodyInAfterResponse = true
      }

      inFlightIntercept.responseOverride = response

      return
    }

    markInFlightInterceptStaticResponse(inFlightIntercept, staticResponse, response)

    if (inFlightIntercept.inFlightEventId) {
      this.resolveEventHandler({
        eventId: inFlightIntercept.inFlightEventId,
        stopPropagation: true,
      })
    }
  }
}
