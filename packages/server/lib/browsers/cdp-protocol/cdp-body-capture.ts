import type { Protocol } from 'devtools-protocol'
import debugModule from 'debug'
import { PassThrough } from 'stream'
import type { Readable } from 'stream'
import type { ICriClient } from './cri-client'

const debug = debugModule('cypress:server:browsers:cdp-body-capture')

type CdpBodyCaptureClient = Pick<ICriClient, 'send' | 'on' | 'off'>

// Bounds capture of never-ending bodies (SSE, MJPEG multipart) so Test Replay
// always receives a finite stream. The browser's own delivery to the page is
// unaffected — this only ends the side-channel pump. The bound is per capture,
// not global: N concurrent unconsumed streams hold up to N times this cap.
const CAPTURE_BYTE_CAP = 10 * 1024 * 1024

type CaptureEntry = {
  stream: PassThrough
  bytesReceived: number
}

/**
 * Pumps a stream-classified response's bytes out via
 * `Network.streamResourceContent` + `Network.dataReceived`. Armed before the
 * pause is released, so no bytes are lost. Pushes are not idempotent (unlike
 * CDPNetworkExtraInfo's deferreds) — the session-scoped keys are what
 * protects against duplicate delivery.
 */
export class CdpBodyCapture {
  private readonly captures = new Map<string, CaptureEntry>()

  constructor (private readonly client: CdpBodyCaptureClient) {}

  start (): void {
    this.client.on('Network.dataReceived', this.onDataReceived)
    this.client.on('Network.loadingFinished', this.onLoadingFinished)
    this.client.on('Network.loadingFailed', this.onLoadingFailed)
  }

  stop (): void {
    this.client.off('Network.dataReceived', this.onDataReceived)
    this.client.off('Network.loadingFinished', this.onLoadingFinished)
    this.client.off('Network.loadingFailed', this.onLoadingFailed)
    this.reset()
  }

  /**
   * Arms the capture pump for a networkId before the response pause is
   * released. Returns undefined on any CDP failure — arm failure must never
   * throw into the caller, it just means this response goes uncaptured.
   */
  async arm (networkId: string, sessionId?: string): Promise<Readable | undefined> {
    const key = this.getCaptureKey(networkId, sessionId)

    try {
      const response = await this.client.send('Network.streamResourceContent', {
        requestId: networkId,
      }, sessionId) as Protocol.Network.StreamResourceContentResponse

      const stream = new PassThrough()
      const entry: CaptureEntry = { stream, bytesReceived: 0 }

      // A re-arm for a live key would strand the previous stream un-ended,
      // hanging any consumer holding it — end it before replacing.
      this.captures.get(key)?.stream.end()
      this.captures.set(key, entry)

      // Buffers are documented as zeroed for an armed-at-pause stream (nothing
      // flows before Fetch.continueResponse), but a non-empty value here is
      // still correct to forward if the browser ever behaves otherwise.
      if (response.bufferedData) {
        this.pushToEntry(key, entry, Buffer.from(response.bufferedData, 'base64'))
      }

      return stream
    } catch (err) {
      debug('failed to arm body capture for %s: %s', key, (err as Error).message)

      return undefined
    }
  }

  /**
   * Abandons a single armed capture whose flow lost its owner (e.g. reset()
   * raced the arm await), so the pump stops pushing into a stream nobody will
   * read. Destroys rather than ends: there is no consumer for a partial capture.
   */
  release (networkId: string, sessionId?: string): void {
    this.drop(networkId, sessionId, 'destroy')
  }

  /**
   * Destroys and clears every live capture stream. Used between tests
   * (transport.reset) so a spec boundary never leaks a pump into the next.
   */
  reset (): void {
    debug('resetting %d in-flight capture(s)', this.captures.size)

    for (const entry of this.captures.values()) {
      entry.stream.destroy()
    }

    this.captures.clear()
  }

  private getCaptureKey (networkId: string, sessionId?: string): string {
    return `${sessionId ?? 'root'}:${networkId}`
  }

  private pushToEntry (key: string, entry: CaptureEntry, chunk: Buffer): void {
    entry.bytesReceived += chunk.length
    entry.stream.push(chunk)

    if (entry.bytesReceived >= CAPTURE_BYTE_CAP) {
      debug('capture byte cap reached, ending stream: %s', key)
      entry.stream.end()
      this.captures.delete(key)
    }
  }

  private onDataReceived = (event: Protocol.Network.DataReceivedEvent, sessionId?: string): void => {
    const key = this.getCaptureKey(event.requestId, sessionId)
    const entry = this.captures.get(key)

    if (!entry || !event.data) {
      return
    }

    this.pushToEntry(key, entry, Buffer.from(event.data, 'base64'))
  }

  private onLoadingFinished = (event: Protocol.Network.LoadingFinishedEvent, sessionId?: string): void => {
    this.drop(event.requestId, sessionId, 'end')
  }

  // A failed load still leaves whatever was captured up to that point valid
  // for Test Replay — end the stream rather than erroring it, so a partial
  // capture is delivered instead of discarded.
  private onLoadingFailed = (event: Protocol.Network.LoadingFailedEvent, sessionId?: string): void => {
    this.drop(event.requestId, sessionId, 'end')
  }

  private drop (networkId: string, sessionId: string | undefined, mode: 'end' | 'destroy'): void {
    const key = this.getCaptureKey(networkId, sessionId)
    const entry = this.captures.get(key)

    if (!entry) {
      return
    }

    entry.stream[mode]()
    this.captures.delete(key)
  }
}
