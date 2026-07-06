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

export interface CdpFetchTransportRequest extends CdpFetchRequest {
  id: string
  sessionId?: string
}

export interface CdpFetchTransportResponse extends CdpFetchRequest {
  id: string
  requestId: string
  responseCode: number
  responseHeaders?: Protocol.Fetch.HeaderEntry[]
  sessionId?: string
}

export class CdpFetchTransport {
  private readonly inFlightRequests = new Map<string, pDefer.DeferredPromise<CdpFetchTransportResponse>>()

  constructor (
    private readonly client: CdpFetchClient,
    private readonly httpIntercept: ForHttpIntercept<CdpFetchTransportRequest, CdpFetchTransportResponse> = new HttpIntercept(createCdpFetchCodec()),
  ) {}

  async start (): Promise<void> {
    await this.client.send('Fetch.enable', {
      patterns: [{
        requestStage: 'Request',
      }, {
        requestStage: 'Response',
      }],
    })

    this.client.on('Fetch.requestPaused', this.interceptRequest)
    this.client.on('Fetch.requestPaused', this.resolveResponse)
  }

  async stop (): Promise<void> {
    try {
      await this.client.send('Fetch.disable')
    } finally {
      this.client.off('Fetch.requestPaused', this.interceptRequest)
      this.client.off('Fetch.requestPaused', this.resolveResponse)
      this.rejectAll(new Error('CDP Fetch transport stopped'))
    }
  }

  private interceptRequest = async (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string): Promise<void> => {
    if (event.responseErrorReason || typeof event.responseStatusCode === 'number') {
      return
    }

    let networkId: string | undefined
    let requestContinued = false

    try {
      if (!event.networkId) {
        debug('continuing request pause without network id: %s', event.request.url)
        await this.client.send('Fetch.continueRequest', {
          requestId: event.requestId,
        }, sessionId)

        return
      }

      networkId = event.networkId
      const request: CdpFetchTransportRequest = {
        ...event.request,
        id: networkId,
        sessionId,
      }
      const deferred = pDefer<CdpFetchTransportResponse>()

      this.inFlightRequests.set(networkId, deferred)

      const response = await this.httpIntercept.handle(request, async (outbound) => {
        await this.client.send('Fetch.continueRequest', {
          requestId: event.requestId,
          ...(outbound.url !== event.request.url ? { url: outbound.url } : {}),
        }, outbound.sessionId)

        requestContinued = true

        let timeout: NodeJS.Timeout | undefined

        try {
          return await Promise.race([
            deferred.promise,
            new Promise<never>((_resolve, reject) => {
              timeout = setTimeout(() => {
                reject(new Error(`Timed out waiting for CDP Fetch response pause for ${event.request.url}`))
              }, 30000)
            }),
          ])
        } finally {
          if (timeout) {
            clearTimeout(timeout)
          }
        }
      })

      await this.client.send('Fetch.continueResponse', {
        requestId: response.requestId,
        responseCode: response.responseCode,
        ...(response.responseHeaders ? { responseHeaders: response.responseHeaders } : {}),
      }, response.sessionId)

      this.cleanup(networkId)
    } catch (err) {
      if (networkId) {
        if (requestContinued) {
          this.inFlightRequests.get(networkId)?.reject(err as Error)
        }

        this.cleanup(networkId)
      }

      if (!requestContinued) {
        await this.client.send('Fetch.continueRequest', {
          requestId: event.requestId,
        }, sessionId)
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
      debug('continuing unmatched response pause: %s', event.request.url)
      await this.client.send('Fetch.continueResponse', {
        requestId: event.requestId,
      }, sessionId)

      return
    }

    if (event.responseErrorReason) {
      await this.client.send('Fetch.failRequest', {
        requestId: event.requestId,
        errorReason: event.responseErrorReason,
      }, sessionId)

      deferred.reject(new Error(`CDP Fetch response failed for ${event.request.url}: ${event.responseErrorReason}`))

      return
    }

    if (typeof event.responseStatusCode !== 'number') {
      await this.client.send('Fetch.continueResponse', {
        requestId: event.requestId,
      }, sessionId)

      deferred.reject(new Error(`CDP Fetch response did not include a status code for ${event.request.url}`))

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

  private cleanup (networkId: string): void {
    this.inFlightRequests.delete(networkId)
  }

  private rejectAll (err: Error): void {
    for (const [networkId, deferred] of this.inFlightRequests) {
      deferred.reject(err)
      this.cleanup(networkId)
    }
  }
}
