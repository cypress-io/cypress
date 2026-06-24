import _ from 'lodash'
import url from 'url'
import errors from '@packages/errors'
import { getBodyEncoding } from '../server/util'
import type {
  BackendRoute,
  BackendStaticResponse,
  ForInterceptionEvents,
  ForStubbing,
  GetFixtureFn,
  HttpRequest,
  HttpResponse,
  InterceptMiddleware,
  OriginForwarder,
  Subscription } from '@packages/network-interception'
import { SERIALIZABLE_RES_PROPS } from '@packages/network-interception'
import type { InFlightIntercept } from '../core/in-flight-intercept'
import {
  addInFlightInterceptSubscription,
  createInFlightIntercept,
  markInFlightInterceptStaticResponse,
} from '../core/in-flight-intercept'
import {
  applyHandlerRequestToRequest,
  cloneHandlerRequest,
  cloneHandlerResponse,
  mergeIncomingRequestChanges,
  mergeIncomingResponseChanges,
} from '../core/merge-handler-result'
import { planSubscriptions } from '../core/plan-subscriptions'
import { matchRoutes, matchesRoutePreflight } from '../core/route-matching'
import { buildHttpResponseFromStatic, buildPreflightHttpResponse } from '../core/static-response'
import { runSubscriptions } from '../core/subscription-runner'

export type CyInterceptIntercepterOptions = {
  stubbing: ForStubbing
  interceptionEvents: ForInterceptionEvents
  onSyncInterceptSkipped?: (url: string) => void
}

export type CyInterceptIntercepter = {
  intercepter: InterceptMiddleware
  addSubscription (inFlightInterceptId: string, subscription: Subscription): void
  fulfillStaticResponse (
    inFlightInterceptId: string,
    staticResponse: BackendStaticResponse,
    getFixture: GetFixtureFn,
  ): Promise<void>
}

/**
 * Driver-backed `cy.intercept` intercepter registered on {@link HttpIntercept}.
 */
export function createCyInterceptIntercepter (
  options: CyInterceptIntercepterOptions,
): CyInterceptIntercepter {
  const inFlightIntercepts = new Map<string, InFlightIntercept>()

  const addSubscription = (inFlightInterceptId: string, subscription: Subscription): void => {
    const inFlightIntercept = inFlightIntercepts.get(inFlightInterceptId)

    if (!inFlightIntercept) {
      return
    }

    addInFlightInterceptSubscription(inFlightIntercept, subscription)
  }

  const fulfillStaticResponse = async (
    inFlightInterceptId: string,
    staticResponse: BackendStaticResponse,
    getFixture: BackendRoute['getFixture'],
  ): Promise<void> => {
    const inFlightIntercept = inFlightIntercepts.get(inFlightInterceptId)

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
      options.interceptionEvents.resolveEventHandler({
        eventId: inFlightIntercept.inFlightEventId,
        stopPropagation: true,
      })
    }
  }

  const intercepter: InterceptMiddleware = async (
    request: HttpRequest,
    next: OriginForwarder,
  ): Promise<HttpResponse> => {
    const routes = options.stubbing.routes

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
      onSyncInterceptSkipped: options.onSyncInterceptSkipped,
    })

    const inFlightIntercept = createInFlightIntercept(request, matchingRoutes, subscriptionsByRoute)

    inFlightIntercepts.set(inFlightIntercept.request.inFlightInterceptId, inFlightIntercept)

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
        driverNotification: options.interceptionEvents,
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
          data: { error: errors.cloneErr(error as Error) },
          mergeChanges: _.noop,
          driverNotification: options.interceptionEvents,
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
        driverNotification: options.interceptionEvents,
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

      await runSubscriptions({
        inFlightIntercept,
        eventName: 'after:response',
        data: inFlightIntercept.includeBodyInAfterResponse ? {
          finalResBody: finalResponse.body!,
        } : {},
        mergeChanges: _.noop,
        driverNotification: options.interceptionEvents,
      })

      return finalResponse
    } finally {
      inFlightIntercepts.delete(inFlightIntercept.request.inFlightInterceptId)
    }
  }

  return {
    intercepter,
    addSubscription,
    fulfillStaticResponse,
  }
}
