import type { Protocol } from 'devtools-protocol'
import debugModule from 'debug'
import pDefer from 'p-defer'
import { Readable } from 'stream'
import type { ForHttpIntercept } from '@packages/network-interception'
import { HttpIntercept } from '@packages/network-interception'
import type { ICriClient } from './cri-client'
import { createCdpFetchCodec } from './cdp-fetch-codec'

const debug = debugModule('cypress:server:browsers:cdp-fetch-transport')

type CdpFetchClient = Pick<ICriClient, 'send' | 'on' | 'off'>

type CdpFetchRequest = Protocol.Fetch.RequestPausedEvent['request']
const RESPONSE_PAUSE_TIMEOUT_MS = 30000
const AUT_FRAME_HEADER = 'X-Cypress-Is-AUT-Frame'

type CdpFetchTransportOptions = {
  isAUTFrame?: (frameId: string) => Promise<boolean>
}

export interface CdpFetchTransportRequest extends CdpFetchRequest {
  id: string
  requestId?: string
  sessionId?: string
}

export interface CdpFetchTransportResponse extends CdpFetchTransportRequest {
  body?: string
  bodyStream?: Readable
  fulfilled?: boolean
  requestId: string
  responseCode: number
  responseHeaders?: Protocol.Fetch.HeaderEntry[]
}

export class CdpFetchTransport {
  private readonly inFlightRequests = new Map<string, pDefer.DeferredPromise<CdpFetchTransportResponse>>()

  private isStarted = false

  constructor (
    private readonly client: CdpFetchClient,
    private readonly httpIntercept: ForHttpIntercept<CdpFetchTransportRequest, CdpFetchTransportResponse> = new HttpIntercept(createCdpFetchCodec()),
    private readonly options: CdpFetchTransportOptions = {},
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
    let responseRequestId: string | undefined
    let responseSessionId: string | undefined
    let deferred: pDefer.DeferredPromise<CdpFetchTransportResponse> | undefined

    try {
      if (!event.networkId) {
        debug('continuing request pause without network id: %s', event.request.url)
        await this.safeSend('Fetch.continueRequest', {
          requestId: event.requestId,
          ...(await this.autFrameHeader(event)),
        }, sessionId)

        return
      }

      networkId = event.networkId
      const request: CdpFetchTransportRequest = {
        ...event.request,
        headers: {
          ...event.request.headers,
        },
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
          ...(outbound.method !== event.request.method ? { method: outbound.method } : {}),
          ...(outbound.postData !== event.request.postData ? { postData: outbound.postData } : {}),
          ...(this.headersChanged(outbound.headers ?? {}, event.request.headers)
            ? { headers: this.toContinueRequestHeaders(outbound.headers ?? {}) }
            : {}),
          ...(await this.autFrameHeader(event, outbound)),
        }, outbound.sessionId)

        requestContinued = true

        let timeout: NodeJS.Timeout | undefined

        try {
          const pausedResponse = await Promise.race([
            responseDeferred.promise,
            new Promise<never>((_resolve, reject) => {
              timeout = setTimeout(() => {
                reject(new Error(`Timed out waiting for CDP Fetch response pause for ${event.request.url}`))
              }, RESPONSE_PAUSE_TIMEOUT_MS)
            }),
          ])

          responseRequestId = pausedResponse.requestId
          responseSessionId = pausedResponse.sessionId

          return pausedResponse
        } finally {
          if (timeout) {
            clearTimeout(timeout)
          }
        }
      })

      if (response.fulfilled) {
        await this.client.send('Fetch.fulfillRequest', {
          requestId: response.requestId,
          responseCode: response.responseCode,
          ...(response.responseHeaders ? { responseHeaders: response.responseHeaders } : {}),
          ...(response.body !== undefined ? { body: response.body } : {}),
        }, response.sessionId)
      } else {
        await this.client.send('Fetch.continueResponse', {
          requestId: response.requestId,
          responseCode: response.responseCode,
          ...(response.responseHeaders ? { responseHeaders: response.responseHeaders } : {}),
        }, response.sessionId)
      }

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
      } else {
        const continueRequestId = response?.requestId ?? responseRequestId

        if (continueRequestId) {
          await this.safeSend('Fetch.continueResponse', {
            requestId: continueRequestId,
          }, response?.sessionId ?? responseSessionId ?? sessionId)
        }
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

    const bodyStream = this.createResponseBodyStream(event.requestId, sessionId)

    deferred.resolve({
      ...event.request,
      id: event.networkId!,
      requestId: event.requestId,
      responseCode: event.responseStatusCode,
      responseHeaders: event.responseHeaders,
      bodyStream,
      sessionId,
    })
  }

  private createResponseBodyStream = (requestId: string, sessionId?: string): Readable => {
    let reading = false
    let bodyStream: Readable

    bodyStream = new Readable({
      read: () => {
        if (reading) {
          return
        }

        reading = true

        void (async () => {
          try {
            const response = await this.client.send('Fetch.getResponseBody', {
              requestId,
            }, sessionId) as Protocol.Fetch.GetResponseBodyResponse

            const body = Buffer.from(response.body, response.base64Encoded ? 'base64' : 'utf8')

            if (body.length) {
              bodyStream.push(body)
            }

            bodyStream.push(null)
          } catch (err) {
            bodyStream.destroy(err as Error)
          }
        })()
      },
    })

    return bodyStream
  }

  private toContinueRequestHeaders (headers: Protocol.Network.Headers): Protocol.Fetch.HeaderEntry[] {
    return Object.entries(headers).map(([name, value]) => {
      return {
        name,
        value,
      }
    })
  }

  private headersChanged (left: Protocol.Network.Headers, right: Protocol.Network.Headers): boolean {
    const leftKeys = Object.keys(left)
    const rightKeys = Object.keys(right)

    if (leftKeys.length !== rightKeys.length) {
      return true
    }

    return leftKeys.some((key) => left[key] !== right[key])
  }

  private safeSend = async (...args: Parameters<CdpFetchClient['send']>): Promise<void> => {
    try {
      await this.client.send(...args)
    } catch (err) {
      debug('CDP Fetch send failed: %s', (err as Error).message)
    }
  }

  private autFrameHeader = async (
    event: Protocol.Fetch.RequestPausedEvent,
    outbound: CdpFetchTransportRequest = {
      ...event.request,
      id: event.networkId ?? event.requestId,
      requestId: event.requestId,
    },
  ): Promise<Pick<Protocol.Fetch.ContinueRequestRequest, 'headers'>> => {
    const isAUTFrame = event.frameId && this.options.isAUTFrame ? await this.options.isAUTFrame(event.frameId) : false

    if (!isAUTFrame) {
      return {}
    }

    return {
      headers: [
        ...Object.entries(outbound.headers).map(([name, value]) => {
          return { name, value: String(value) }
        }),
        {
          name: AUT_FRAME_HEADER,
          value: 'true',
        },
      ],
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
