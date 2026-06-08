import type { Protocol } from 'devtools-protocol'
import type { ForNetworkInterception, HttpResponse, ResourceType } from '@packages/network-interception'
import type { CriClient } from './cri-client'
import { cdpFetch } from './fetch-codec'
import { normalizeResourceType as defaultNormalizeResourceType } from './normalize-resource-type'

const FETCH_ENABLE_PATTERNS: Protocol.Fetch.EnableRequest = {
  patterns: [{
    urlPattern: '*',
    requestStage: 'Request',
  }],
}

/** CDP may reject stale continues after teardown — swallow so Cypress does not crash. */
function swallowStaleInterceptionError (err: unknown): void {
  const message = err instanceof Error ? err.message : String(err)

  if (message.includes('Invalid InterceptionId')) {
    return
  }

  throw err instanceof Error ? err : new Error(message)
}

/**
 * CDP Fetch adapter for {@link ForNetworkInterception.handle}.
 *
 * v0a: request-stage intercept only. Response-stage subscriptions run only when
 * {@link ForNetworkInterception.handle}'s `next` can materialize a response (not yet on CDP).
 */
export class CDPNetworkInterception {
  private enabled = false

  constructor (
    private readonly intercept: ForNetworkInterception,
    /**
     * Resolves the current page CDP session. A getter (not a stored client ref) so
     * reconnect/target swap can supply a new CriClient without rewiring this adapter.
     */
    private readonly getClient: () => CriClient,
    private readonly normalizeResourceType?: (resourceType: string | undefined) => ResourceType,
  ) {}

  async enable (): Promise<void> {
    if (this.enabled) {
      return
    }

    const client = this.getClient()

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

    const client = this.getClient()

    client.off('Fetch.requestPaused', this.handlePausedRequest)

    try {
      await client.send('Fetch.disable')
    } catch {
      // ignore disable errors during teardown
    }

    this.enabled = false
  }

  private handlePausedRequest = async (params: Protocol.Fetch.RequestPausedEvent): Promise<void> => {
    const client = this.getClient()

    if (params.responseStatusCode !== undefined) {
      try {
        await client.send('Fetch.continueRequest', { requestId: params.requestId })
      } catch (err) {
        swallowStaleInterceptionError(err)
      }

      return
    }

    const normalize = this.normalizeResourceType ?? defaultNormalizeResourceType
    const httpRequest = {
      ...cdpFetch.toHttpRequest(params),
      resourceType: normalize(params.resourceType),
    }

    try {
      // handle() either returns a stub (fulfill on CDP) or calls next() (continue on CDP).
      // Both paths end in a Fetch.* command — the flag tracks which one already ran.
      let forwarded = false

      const response = await this.intercept.handle(httpRequest, async (outbound) => {
        forwarded = true

        try {
          await client.send('Fetch.continueRequest', cdpFetch.fromHttpRequest(outbound))
        } catch (err) {
          swallowStaleInterceptionError(err)
        }

        // Placeholder until v0b materializes the origin response on CDP.
        return { statusCode: 200, headers: {}, body: '' } satisfies HttpResponse
      })

      if (!forwarded) {
        try {
          await client.send('Fetch.fulfillRequest', cdpFetch.fromHttpResponse(httpRequest, response))
        } catch (err) {
          swallowStaleInterceptionError(err)
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('forceNetworkError')) {
        try {
          await client.send('Fetch.failRequest', { requestId: params.requestId, errorReason: 'Failed' })
        } catch (failErr) {
          swallowStaleInterceptionError(failErr)
        }

        return
      }

      throw err
    }
  }
}
