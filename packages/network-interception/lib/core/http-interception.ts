import _ from 'lodash'
import url from 'url'
import type { ForInterceptionEvents } from '../ports/interception-events'
import type {
  ForHttpInterception,
  HttpRequest,
  HttpResponse,
  Interceptor,
  OriginForwarder,
} from '../ports/http-interception'
import type { BackendRoute } from '../types/backend-route'
import type { Subscription } from '../types/external-types'
import type { InterceptWireRequest, InterceptWireResponse } from '../types/intercept-wire'
import { SERIALIZABLE_RES_PROPS } from '../types/internal-types'
import {
  mergeIncomingRequestChanges,
  mergeIncomingResponseChanges,
} from './merge-handler-result'
import { matchRoutes, matchesRoutePreflight } from './route-matching'
import { planSubscriptions } from './plan-subscriptions'
import {
  addInFlightInterceptSubscription,
  createInFlightIntercept,
  markInFlightInterceptStaticResponse,
  type InFlightIntercept,
} from './in-flight-intercept'
import { buildHttpResponseFromStatic, buildPreflightHttpResponse } from './static-response'
import { runSubscriptions } from './subscription-runner'

export type WireMessages = {
  toWireRequest: (request: HttpRequest) => InterceptWireRequest
  toWireResponse: (response: HttpResponse, requestUrl: string) => InterceptWireResponse
  applyWireRequestToHttpRequest: (
    httpRequest: HttpRequest,
    wireRequest: InterceptWireRequest,
    resolvedUrl: string,
  ) => void
}

/** Dependencies injected at the composition root (`createProxyRuntime`, tests, future CDP wiring). */
export type HttpInterceptionOptions = {
  /** Registered `cy.intercept` routes (typically from net-stubbing state). */
  getRoutes: () => BackendRoute[]
  /** Driven port for intercept handler round-trips (`before:request`, response stages, etc.). */
  interceptionEvents: ForInterceptionEvents
  /** Convert between transport {@link HttpRequest} and driver wire payloads (owned by net-stubbing in production). */
  wireMessages: WireMessages
  /** Called when a synchronous XHR would have been intercepted but was skipped. */
  onSyncInterceptSkipped?: (url: string) => void
}

/**
 * Default implementation of {@link ForHttpInterception} — transport-agnostic orchestration for
 * `cy.intercept` on a single HTTP exchange.
 *
 * ## Role in `@packages/network-interception`
 *
 * This class is the **application core** for per-request intercept logic. Proxy and future CDP
 * adapters call {@link HttpInterception.handle} with a transport-neutral {@link HttpRequest} and
 * an `next` callback that reaches the origin. The class owns:
 *
 * - route matching and CORS preflight short-circuit
 * - subscription planning and ordered handler execution
 * - merging handler mutations back onto the request/response
 * - the in-flight intercept registry ({@link InFlightIntercept}) keyed by `inFlightInterceptId`
 *
 * It does **not** own cookies, document injection, compression, or config policies — those stay on
 * {@link NetworkInterceptionCore} and proxy middleware via other driven ports.
 *
 * ## Ports and adapters
 *
 * | Direction | Port | This class |
 * | --- | --- | --- |
 * | Driving (in) | {@link ForHttpInterception} | {@link HttpInterception.handle} |
 * | Driven (out) | {@link ForInterceptionEvents} | emits handler events, awaits replies |
 *
 * Route registration (`route:added`, etc.) is a separate driving port
 * ({@link ForInterceptRegistration}) handled by net-stubbing adapters, not by this class.
 *
 * ## Typical wiring
 *
 * ```
 * createProxyRuntime()
 *   → new HttpInterception({ getRoutes, interceptionEvents, wireMessages })
 *   → NetworkProxy.httpInterception = httpInterception
 *   → ApplyHttpInterception middleware calls handle(request, forwardToOrigin)
 * ```
 *
 * @see {@link ForHttpInterception} — driving port contract (`handle` only)
 * @see {@link NetworkInterceptionCore} — shared matching/planning helpers and proxy-side policies
 */
export class HttpInterception implements ForHttpInterception {
  private readonly inFlightIntercepts = new Map<string, InFlightIntercept>()

  constructor (private readonly options: HttpInterceptionOptions) {}

  /**
   * Look up mutable state for an intercept still inside {@link HttpInterception.handle}.
   *
   * Used by net-stubbing when the driver sends `subscribe` or `send:static:response` mid-flight.
   * Entries are removed when `handle` completes (success, stub, or error).
   */
  getInFlightIntercept (inFlightInterceptId: string): InFlightIntercept | undefined {
    return this.inFlightIntercepts.get(inFlightInterceptId)
  }

  /**
   * Attach a driver-registered subscription to an active in-flight intercept.
   *
   * No-op if `inFlightInterceptId` is unknown (request already finished or never intercepted).
   */
  addSubscription (inFlightInterceptId: string, subscription: Subscription): void {
    const inFlightIntercept = this.inFlightIntercepts.get(inFlightInterceptId)

    if (!inFlightIntercept) {
      return
    }

    addInFlightInterceptSubscription(inFlightIntercept, subscription)
  }

  /**
   * Fulfill `req.reply()` / `send:static:response` while an intercept is in flight.
   *
   * At the request stage, unblocks a pending `emitAndAwait` via {@link ForInterceptionEvents.resolveEventHandler}.
   * At response stages, sets {@link InFlightIntercept.responseOverride} instead of calling `next`.
   */
  async fulfillStaticResponse (
    inFlightInterceptId: string,
    staticResponse: Parameters<typeof buildHttpResponseFromStatic>[0],
    getFixture: BackendRoute['getFixture'],
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
      this.options.interceptionEvents.resolveEventHandler({
        eventId: inFlightIntercept.inFlightEventId,
        stopPropagation: true,
      })
    }
  }

  /**
   * Driving port entry — run `cy.intercept` for one request/response exchange.
   *
   * - No matching routes → delegates to `next` unchanged.
   * - CORS preflight match → synthetic 204, never calls `next`.
   * - Request-stage stub / `req.reply` → synthetic response, never calls `next`.
   * - Otherwise → `next(modifiedRequest)` once, then apply response-stage handlers.
   *
   * `inFlightInterceptId` on `request` must be set by the transport adapter (proxy uuid today).
   */
  handle: Interceptor = async (
    request: HttpRequest,
    next: OriginForwarder,
  ): Promise<HttpResponse> => {
    const routes = this.options.getRoutes()
    const { wireMessages } = this.options

    if (matchesRoutePreflight(routes, request)) {
      request.hadIntercept = true

      return buildPreflightHttpResponse(request)
    }

    const matchingRoutes = matchRoutes(routes, request)

    if (!matchingRoutes.length) {
      return next(request)
    }

    request.hadIntercept = true

    const subscriptionsByRoute = planSubscriptions({
      matchingRoutes,
      isSyncRequest: request.isSyncRequest,
      url: request.url,
      onSyncInterceptSkipped: this.options.onSyncInterceptSkipped,
    })

    const inFlightIntercept = createInFlightIntercept(request, matchingRoutes, subscriptionsByRoute)

    this.inFlightIntercepts.set(inFlightIntercept.request.inFlightInterceptId, inFlightIntercept)

    try {
      const incomingRequest = wireMessages.toWireRequest(request)

      const mergeRequestChanges = (before: InterceptWireRequest, after: InterceptWireRequest) => {
        const resolvedUrl = mergeIncomingRequestChanges(before, after, {
          baseUrl: request.url,
          resolveUrl: (baseUrl, relativeUrl) => url.resolve(baseUrl, relativeUrl),
        })

        wireMessages.applyWireRequestToHttpRequest(request, before, resolvedUrl)
      }

      await runSubscriptions({
        inFlightIntercept,
        eventName: 'before:request',
        data: incomingRequest,
        mergeChanges: mergeRequestChanges,
        driverNotification: this.options.interceptionEvents,
      })

      if (inFlightIntercept.forceNetworkError) {
        throw new Error('forceNetworkError called')
      }

      if (inFlightIntercept.fulfilledAtRequestStage && inFlightIntercept.stubResponse) {
        return inFlightIntercept.stubResponse
      }

      let originResponse: HttpResponse

      try {
        originResponse = await next(request)
      } catch (error) {
        await runSubscriptions({
          inFlightIntercept,
          eventName: 'network:error',
          data: { error },
          mergeChanges: _.noop,
          driverNotification: this.options.interceptionEvents,
        })

        throw error
      }

      const incomingResponse = wireMessages.toWireResponse(originResponse, request.url)

      const mergeResponseChanges = (
        before: InterceptWireResponse,
        after: InterceptWireResponse,
      ) => {
        mergeIncomingResponseChanges(before, after, {
          serializableProps: SERIALIZABLE_RES_PROPS,
        })
      }

      const modifiedResponse = await runSubscriptions({
        inFlightIntercept,
        eventName: ['before:response', 'response:callback', 'response'],
        data: incomingResponse,
        mergeChanges: mergeResponseChanges,
        driverNotification: this.options.interceptionEvents,
      })

      const finalResponse = inFlightIntercept.responseOverride ?? {
        statusCode: modifiedResponse.statusCode,
        statusMessage: modifiedResponse.statusMessage,
        headers: modifiedResponse.headers,
        body: modifiedResponse.body,
        delay: modifiedResponse.delay,
        throttleKbps: modifiedResponse.throttleKbps,
      }

      await runSubscriptions({
        inFlightIntercept,
        eventName: 'after:response',
        data: inFlightIntercept.includeBodyInAfterResponse ? {
          finalResBody: finalResponse.body!,
        } : {},
        mergeChanges: _.noop,
        driverNotification: this.options.interceptionEvents,
      })

      return finalResponse
    } finally {
      this.inFlightIntercepts.delete(inFlightIntercept.request.inFlightInterceptId)
    }
  }
}
