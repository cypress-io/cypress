import type { Protocol } from 'devtools-protocol'
import debugModule from 'debug'
import pDefer from 'p-defer'
import type { DeferredPromise } from 'p-defer'
import type { ForNetworkInterception, HttpRequest, HttpResponse, ResourceType } from '@packages/network-interception'
import type { CriClient } from './cri-client'
import { cdpFetch } from './fetch-codec'

const debug = debugModule('cypress:browser-automation:cdp-network-interception')

const FETCH_ENABLE_PATTERNS: Protocol.Fetch.EnableRequest = {
  patterns: [{
    urlPattern: '*',
    requestStage: 'Request',
  }],
}

function toInterceptionError (err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err))
}

/**
 * Run a best-effort CDP egress command. The paused request may no longer exist (the page
 * navigated or Cypress tore down between the pause and our reply), so a rejection here is
 * expected and non-fatal — swallow it rather than crash Cypress.
 */
async function swallow (send: () => Promise<unknown>): Promise<void> {
  try {
    await send()
  } catch (err) {
    // Non-fatal (the paused request likely no longer exists — see doc comment), but still surface
    // it under DEBUG in case an unexpected failure is hiding here.
    debug('best-effort CDP egress command failed: %o', err)
  }
}

/** Rejection used when {@link CDPNetworkInterception.disable} unwinds in-flight forwards. */
class InterceptionDisposedError extends Error {}

/** Rejection carrying the CDP error reason from a response-stage network failure. */
class OriginNetworkError extends Error {
  constructor (readonly reason: Protocol.Network.ErrorReason) {
    super(`origin network error: ${reason}`)
  }
}

/**
 * CDP Fetch adapter for {@link ForNetworkInterception.handle}.
 *
 * Request-stage pauses drive `cy.intercept`: a stub short-circuits to `Fetch.fulfillRequest`,
 * while a forwarded request continues to the origin with `interceptResponse: true` and the `next()`
 * promise blocks until the response-stage pause materializes the origin response (via
 * `Fetch.getResponseBody`). Core then runs the response subscriptions and the final response is
 * delivered to the browser with `Fetch.fulfillRequest`.
 *
 * Correlation between the two pauses is adapter-local: a map keyed by the CDP Fetch `requestId`
 * (held directly in both pause callbacks), because the response-stage callback only receives CDP
 * `params`, not the original {@link HttpRequest}.
 *
 * Notes for the experimental path: `interceptResponse` is opt-in per request, so unmatched/stub
 * traffic is unaffected. Redirects (3xx) intercept independently per hop and expose no body to
 * `getResponseBody`. There is deliberately no adapter-level timeout: the browser network stack
 * bounds the wait and surfaces a hung origin as a response-stage pause with `responseErrorReason`,
 * while the driver enforces `responseTimeout`; {@link disable} is the teardown backstop.
 */
export class CDPNetworkInterception {
  private enabled = false

  /**
   * In-flight forwards keyed by CDP Fetch `requestId`. An entry is created when core calls `next()`
   * at the request stage and settled when the response-stage pause arrives. Per-request lifetime is
   * owned solely by {@link handleRequestStagePause}'s `finally` (the one deleter); {@link disable}
   * performs the bulk teardown. Other paths only settle the deferred, never delete.
   */
  private readonly pendingForwards = new Map<string, DeferredPromise<HttpResponse>>()

  constructor (
    private readonly intercept: ForNetworkInterception,
    private readonly client: CriClient,
    private readonly normalizeResourceType?: (resourceType: string | undefined) => ResourceType,
  ) {}

  async enable (): Promise<void> {
    if (this.enabled) {
      return
    }

    const { client } = this

    await client.send('Fetch.enable', FETCH_ENABLE_PATTERNS)

    client.queue.enableCommands.push({
      command: 'Fetch.enable',
      params: FETCH_ENABLE_PATTERNS,
    })

    client.on('Fetch.requestPaused', this.handlePausedRequest)
    this.enabled = true
  }

  async disable (): Promise<void> {
    if (!this.enabled) {
      return
    }

    const { client } = this

    client.off('Fetch.requestPaused', this.handlePausedRequest)

    await swallow(() => client.send('Fetch.disable'))

    // Unblock any handle() calls still awaiting an origin response so they unwind cleanly.
    for (const pending of this.pendingForwards.values()) {
      pending.reject(new InterceptionDisposedError('disabled while a request was in flight'))
    }

    this.pendingForwards.clear()
    this.enabled = false
  }

  private handlePausedRequest = async (params: Protocol.Fetch.RequestPausedEvent): Promise<void> => {
    // A pause is at the response stage when responseStatusCode or responseErrorReason is present.
    const isResponseStage = params.responseStatusCode !== undefined || params.responseErrorReason !== undefined

    if (isResponseStage) {
      return this.handleResponseStagePause(params)
    }

    return this.handleRequestStagePause(params)
  }

  /**
   * `next()` for {@link ForNetworkInterception.handle} on the forward path: continue the request to
   * the origin with `interceptResponse: true`, then block until the response-stage pause materializes
   * the origin response. `requestId` (the CDP Fetch id) is identical across both pauses, so it is the
   * correlation key registered in {@link pendingForwards} and the authoritative wire id (we do not
   * trust `outbound.browserRequestId`, which a handler could in principle have changed).
   */
  private forwardToOrigin = (requestId: string, outbound: HttpRequest): Promise<HttpResponse> => {
    const deferred = pDefer<HttpResponse>()

    this.pendingForwards.set(requestId, deferred)

    this.client.send('Fetch.continueRequest', {
      ...cdpFetch.fromHttpRequest(outbound),
      requestId,
      interceptResponse: true,
    }).catch((err) => deferred.reject(toInterceptionError(err)))

    return deferred.promise
  }

  private handleRequestStagePause = async (params: Protocol.Fetch.RequestPausedEvent): Promise<void> => {
    const { client } = this
    const httpRequest = cdpFetch.toHttpRequest(params, this.normalizeResourceType)

    try {
      const response = await this.intercept.handle(httpRequest, (outbound) => {
        return this.forwardToOrigin(params.requestId, outbound)
      })

      // Stub and forward paths both end here: deliver the final response to the browser. On the
      // forward path the request is now paused at the response stage (same requestId), so the
      // fulfill applies to that pause.
      await swallow(() => client.send('Fetch.fulfillRequest', cdpFetch.fromHttpResponse(httpRequest, response)))
    } catch (err) {
      await this.failRequest(params.requestId, err)
    } finally {
      this.pendingForwards.delete(params.requestId)
    }
  }

  private handleResponseStagePause = async (params: Protocol.Fetch.RequestPausedEvent): Promise<void> => {
    const pending = this.pendingForwards.get(params.requestId)

    if (!pending) {
      // Defensive: only our own forwards opt in via interceptResponse, so this should not occur.
      await swallow(() => this.client.send('Fetch.continueResponse', { requestId: params.requestId }))

      return
    }

    if (params.responseErrorReason) {
      pending.reject(new OriginNetworkError(params.responseErrorReason))

      return
    }

    try {
      pending.resolve(await cdpFetch.materializeResponse(this.client, params))
    } catch (err) {
      pending.reject(toInterceptionError(err))
    }

    // Do not send a CDP command here — handleRequestStagePause fulfills once handle() completes.
  }

  /**
   * Fail the paused request so the browser does not hang. Teardown rejections have no live pause to
   * fail, so they are skipped; an origin network error forwards its CDP reason verbatim.
   */
  private async failRequest (requestId: string, err: unknown): Promise<void> {
    if (err instanceof InterceptionDisposedError) {
      return
    }

    const errorReason = err instanceof OriginNetworkError ? err.reason : 'Failed'

    await swallow(() => this.client.send('Fetch.failRequest', { requestId, errorReason }))
  }
}
