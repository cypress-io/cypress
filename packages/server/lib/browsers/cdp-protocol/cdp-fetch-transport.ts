import type { Protocol } from 'devtools-protocol'
import debugModule from 'debug'
import pDefer from 'p-defer'
import type { ForHttpIntercept } from '@packages/network-interception'
import { HttpIntercept } from '@packages/network-interception'
import type { ICriClient } from './cri-client'
import { createCdpFetchCodec } from './cdp-fetch-codec'

const debug = debugModule('cypress:server:browsers:cdp-fetch-transport')

type CdpFetchClient = Pick<ICriClient, 'send' | 'on' | 'off'>

type CdpFetchRequest = Protocol.Fetch.RequestPausedEvent['request']
const RESPONSE_PAUSE_TIMEOUT_MS = 30000

export interface CdpFetchTransportRequest extends CdpFetchRequest {
  id: string
  requestId?: string
  sessionId?: string
}

export interface CdpFetchTransportResponse extends CdpFetchTransportRequest {
  requestId: string
  responseCode: number
  responseHeaders?: Protocol.Fetch.HeaderEntry[]
  responseBody?: string
}

export class CdpFetchTransport {
  private readonly inFlightRequests = new Map<string, pDefer.DeferredPromise<CdpFetchTransportResponse>>()

  private isStarted = false

  constructor (
    private readonly client: CdpFetchClient,
    private readonly httpIntercept: ForHttpIntercept<CdpFetchTransportRequest, CdpFetchTransportResponse> = new HttpIntercept(createCdpFetchCodec()),
  ) {}

  /**
   * Enables the CDP Fetch domain and starts intercepting requests.
   *
   * This transport must be the sole owner of the Fetch domain on its CDP
   * session. `Fetch.enable` is not additive: the last call on a session
   * replaces the pattern list, while `Fetch.requestPaused` handlers stack.
   * Enabling this alongside `cdp_automation._handlePausedRequests` on the
   * same session clobbers patterns and races `continueRequest` calls, which
   * can drop the `X-Cypress-Is-AUT-Frame` header or hang document requests
   * until the response-pause timeout. Coordinating the two owners is out of
   * scope; do not enable both on one session.
   */
  async start (): Promise<void> {
    if (this.isStarted) {
      return
    }

    this.client.on('Fetch.requestPaused', this.interceptRequest)
    this.client.on('Fetch.requestPaused', this.resolveResponse)
    this.isStarted = true

    try {
      await this.client.send('Fetch.enable', {
        patterns: [{
          requestStage: 'Request',
        }, {
          requestStage: 'Response',
        }],
      })
    } catch (err) {
      this.client.off('Fetch.requestPaused', this.interceptRequest)
      this.client.off('Fetch.requestPaused', this.resolveResponse)
      this.isStarted = false

      throw err
    }
  }

  async stop (): Promise<void> {
    if (!this.isStarted) {
      return
    }

    try {
      await this.client.send('Fetch.disable')
    } finally {
      this.client.off('Fetch.requestPaused', this.interceptRequest)
      this.client.off('Fetch.requestPaused', this.resolveResponse)
      this.rejectAll(new Error('CDP Fetch transport stopped'))
      this.isStarted = false
    }
  }

  private interceptRequest = async (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string): Promise<void> => {
    if (event.responseErrorReason || typeof event.responseStatusCode === 'number') {
      return
    }

    let networkId: string | undefined
    let requestContinued = false
    let response: CdpFetchTransportResponse | undefined
    let deferred: pDefer.DeferredPromise<CdpFetchTransportResponse> | undefined

    try {
      if (!event.networkId) {
        debug('continuing request pause without network id: %s', event.request.url)
        await this.safeSend('Fetch.continueRequest', {
          requestId: event.requestId,
        }, sessionId)

        return
      }

      networkId = event.networkId
      const request: CdpFetchTransportRequest = {
        ...event.request,
        id: networkId,
        requestId: event.requestId,
        sessionId,
      }
      const responseDeferred = pDefer<CdpFetchTransportResponse>()

      deferred = responseDeferred

      this.inFlightRequests.set(networkId, deferred)

      response = await this.httpIntercept.handle(request, async (outbound) => {
        await this.client.send('Fetch.continueRequest', {
          requestId: event.requestId,
          ...(outbound.url !== event.request.url ? { url: outbound.url } : {}),
        }, outbound.sessionId)

        requestContinued = true

        let timeout: NodeJS.Timeout | undefined

        try {
          return await Promise.race([
            responseDeferred.promise,
            new Promise<never>((_resolve, reject) => {
              timeout = setTimeout(() => {
                reject(new Error(`Timed out waiting for CDP Fetch response pause for ${event.request.url}`))
              }, RESPONSE_PAUSE_TIMEOUT_MS)
            }),
          ])
        } finally {
          if (timeout) {
            clearTimeout(timeout)
          }
        }
      })

      if (response.responseBody || !requestContinued) {
        await this.client.send('Fetch.fulfillRequest', {
          requestId: response.requestId,
          responseCode: response.responseCode,
          ...(response.responseHeaders ? { responseHeaders: response.responseHeaders } : {}),
          ...(response.responseBody ? { body: response.responseBody } : {}),
        }, response.sessionId)

        this.cleanup(networkId, deferred)

        return
      }

      await this.client.send('Fetch.continueResponse', {
        requestId: response.requestId,
        responseCode: response.responseCode,
        ...(response.responseHeaders ? { responseHeaders: response.responseHeaders } : {}),
      }, response.sessionId)

      this.cleanup(networkId, deferred)
    } catch (err) {
      if (networkId) {
        if (requestContinued) {
          deferred?.reject(err as Error)
        }

        this.cleanup(networkId, deferred)
      }

      if (!requestContinued) {
        await this.safeSend('Fetch.continueRequest', {
          requestId: event.requestId,
        }, sessionId)
      } else if (response?.requestId) {
        await this.safeSend('Fetch.continueResponse', {
          requestId: response.requestId,
        }, response.sessionId ?? sessionId)
      }

      debug('CDP Fetch transport error: %s', (err as Error).stack || (err as Error).message)
    }
  }

  private resolveResponse = async (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string): Promise<void> => {
    if (!event.responseErrorReason && typeof event.responseStatusCode !== 'number') {
      return
    }

    const deferred = event.networkId ? this.inFlightRequests.get(event.networkId) : undefined

    if (!deferred) {
      if (event.responseErrorReason) {
        debug('failing unmatched response error pause: %s', event.request.url)
        await this.safeSend('Fetch.failRequest', {
          requestId: event.requestId,
          errorReason: event.responseErrorReason,
        }, sessionId)
      } else {
        debug('continuing unmatched response pause: %s', event.request.url)
        await this.safeSend('Fetch.continueResponse', {
          requestId: event.requestId,
        }, sessionId)
      }

      return
    }

    if (event.responseErrorReason) {
      deferred.reject(new Error(`CDP Fetch response failed for ${event.request.url}: ${event.responseErrorReason}`))

      await this.safeSend('Fetch.failRequest', {
        requestId: event.requestId,
        errorReason: event.responseErrorReason,
      }, sessionId)

      return
    }

    if (typeof event.responseStatusCode !== 'number') {
      deferred.reject(new Error(`CDP Fetch response did not include a status code for ${event.request.url}`))

      await this.safeSend('Fetch.continueResponse', {
        requestId: event.requestId,
      }, sessionId)

      return
    }

    deferred.resolve({
      ...event.request,
      id: event.networkId!,
      requestId: event.requestId,
      responseCode: event.responseStatusCode,
      responseHeaders: event.responseHeaders,
      sessionId,
    })
  }

  private safeSend = async (...args: Parameters<CdpFetchClient['send']>): Promise<void> => {
    try {
      await this.client.send(...args)
    } catch (err) {
      debug('CDP Fetch send failed: %s', (err as Error).message)
    }
  }

  private cleanup (networkId: string, deferred?: pDefer.DeferredPromise<CdpFetchTransportResponse>): void {
    if (deferred && this.inFlightRequests.get(networkId) !== deferred) {
      return
    }

    this.inFlightRequests.delete(networkId)
  }

  private rejectAll (err: Error): void {
    for (const [networkId, deferred] of this.inFlightRequests) {
      deferred.reject(err)
      this.cleanup(networkId, deferred)
    }
  }
}
