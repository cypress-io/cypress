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

// Arming sits on the critical path: the response pause is not released until
// it settles. A CDP send to a crashed renderer never resolves and is never
// aborted, so an unbounded wait here would hang the page — the exact failure
// this transport exists to avoid. Capture is best-effort; delivery is not.
const ARM_TIMEOUT_MS = 2000

const ARM_TIMED_OUT = Symbol('arm timed out')

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
    this.client.on('Network.loadingFinished', this.onLoadingEnded)
    this.client.on('Network.loadingFailed', this.onLoadingEnded)
  }

  stop (): void {
    this.client.off('Network.dataReceived', this.onDataReceived)
    this.client.off('Network.loadingFinished', this.onLoadingEnded)
    this.client.off('Network.loadingFailed', this.onLoadingEnded)
    this.reset()
  }

  /**
   * Arms the capture pump for a networkId before the response pause is
   * released. Returns undefined on any CDP failure — arm failure must never
   * throw into the caller, it just means this response goes uncaptured.
   */
  async arm (networkId: string, sessionId?: string): Promise<Readable | undefined> {
    const key = this.getCaptureKey(networkId, sessionId)
    let entry: CaptureEntry | undefined

    try {
      const sent = this.client.send('Network.streamResourceContent', {
        requestId: networkId,
      }, sessionId) as Promise<Protocol.Network.StreamResourceContentResponse>

      // a send that settles after the race is over has no reader; swallow a
      // late rejection so it can't surface as an unhandled rejection
      sent.catch(() => {})

      let armTimer: NodeJS.Timeout | undefined

      const response = await Promise.race([
        sent,
        new Promise<typeof ARM_TIMED_OUT>((resolve) => {
          armTimer = setTimeout(() => resolve(ARM_TIMED_OUT), ARM_TIMEOUT_MS)
          armTimer.unref?.()
        }),
      ])

      clearTimeout(armTimer)

      if (response === ARM_TIMED_OUT) {
        debug('arming body capture timed out after %dms, releasing the pause uncaptured: %s', ARM_TIMEOUT_MS, key)

        return undefined
      }

      const stream = new PassThrough()

      entry = { stream, bytesReceived: 0 }

      // A re-arm for a live key would strand the previous stream un-ended,
      // hanging any consumer holding it — end it before replacing.
      this.captures.get(key)?.stream.end()
      this.captures.set(key, entry)

      // Buffers are documented as zeroed for an armed-at-pause stream (nothing
      // flows before Fetch.continueResponse), but a non-empty value here is
      // still correct to forward if the browser ever behaves otherwise.
      if (response?.bufferedData) {
        this.pushToEntry(key, entry, Buffer.from(response.bufferedData, 'base64'))
      }

      return stream
    } catch (err) {
      debug('failed to arm body capture for %s: %s', key, (err as Error).message)

      // The caller treats undefined as uncaptured, so an entry left behind
      // would absorb chunks with no owner — but only tear down the entry THIS
      // call created: when send() rejected, no entry was inserted, and the key
      // may hold a predecessor whose stream Replay is still reading.
      if (entry && this.captures.get(key) === entry) {
        entry.stream.destroy()
        this.captures.delete(key)
      }

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
    // dataReceived fires for every chunk of every response once Network is
    // enabled; with nothing armed (e.g. recording off) the common case must
    // cost nothing.
    if (!this.captures.size) {
      return
    }

    const key = this.getCaptureKey(event.requestId, sessionId)
    const entry = this.captures.get(key)

    if (!entry || !event.data) {
      return
    }

    this.pushToEntry(key, entry, Buffer.from(event.data, 'base64'))
  }

  // A failed load still leaves whatever was captured up to that point valid
  // for Test Replay — end (not error) the stream on both events, so a partial
  // capture from loadingFailed is delivered instead of discarded.
  private onLoadingEnded = (event: Protocol.Network.LoadingFinishedEvent | Protocol.Network.LoadingFailedEvent, sessionId?: string): void => {
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
