import type { Protocol } from 'devtools-protocol'
import { describe, expect, it, vi } from 'vitest'
import { CdpBodyCapture } from '../../../lib/browsers/cdp-protocol/cdp-body-capture'

// Mirrors CdpBodyCapture's cap (not exported — this pins the contract).
const CAPTURE_BYTE_CAP = 10 * 1024 * 1024

function createClient () {
  return {
    send: vi.fn(async (..._args: unknown[]): Promise<unknown> => ({})),
    on: vi.fn(),
    off: vi.fn(),
  }
}

type Client = ReturnType<typeof createClient>

function respondTo (client: Client, command: string, respond: () => Promise<unknown>) {
  const previous = client.send.getMockImplementation()!

  client.send.mockImplementation((...args: unknown[]) => args[0] === command ? respond() : previous(...args))
}

function createCapture (client = createClient()) {
  const capture = new CdpBodyCapture(client as any)

  capture.start()

  const handler = (eventName: string) => client.on.mock.calls.find((call) => call[0] === eventName)![1]

  return {
    client,
    capture,
    dataReceived: handler('Network.dataReceived') as (event: Partial<Protocol.Network.DataReceivedEvent>, sessionId?: string) => void,
    loadingFinished: handler('Network.loadingFinished') as (event: Partial<Protocol.Network.LoadingFinishedEvent>, sessionId?: string) => void,
    loadingFailed: handler('Network.loadingFailed') as (event: Partial<Protocol.Network.LoadingFailedEvent>, sessionId?: string) => void,
  }
}

// Arms a capture and starts collecting its decoded chunks — shared by the
// tests below that assert on accumulated data rather than stream lifecycle.
async function armAndCollect (capture: CdpBodyCapture, networkId: string, sessionId?: string) {
  const stream = (await capture.arm(networkId, sessionId))!
  const chunks: Buffer[] = []

  stream.on('data', (chunk: Buffer) => chunks.push(chunk))

  return { stream, chunks }
}

// Drains the microtask queue deep enough to cross the PassThrough's internal
// read/write scheduling.
async function tick () {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve()
  }
}

// Stream lifecycle events ('close', 'end') are scheduled via process.nextTick
// internally — waiting on the event itself is robust regardless of exactly
// how many internal ticks that takes.
function onceEvent (stream: NodeJS.ReadableStream, event: string): Promise<void> {
  return new Promise((resolve) => stream.once(event, () => resolve()))
}

describe('CdpBodyCapture', () => {
  it('registers the Network handlers on start, removes them symmetrically on stop, and destroys any live capture', async () => {
    const client = createClient()
    const capture = new CdpBodyCapture(client as any)

    capture.start()

    expect(client.on.mock.calls.map((call) => call[0])).toEqual([
      'Network.dataReceived',
      'Network.loadingFinished',
      'Network.loadingFailed',
    ])

    const stream = await capture.arm('network-1')
    const closed = onceEvent(stream!, 'close')

    capture.stop()

    await closed

    expect(client.off.mock.calls.map((call) => call[0])).toEqual([
      'Network.dataReceived',
      'Network.loadingFinished',
      'Network.loadingFailed',
    ])
  })

  describe('arm', () => {
    it('sends Network.streamResourceContent for the given networkId/sessionId and pushes any bufferedData before dataReceived events', async () => {
      const client = createClient()

      respondTo(client, 'Network.streamResourceContent', async () => {
        return { bufferedData: Buffer.from('buffered').toString('base64') }
      })

      const { capture } = createCapture(client)

      const stream = await capture.arm('network-1', 'session-1')

      expect(client.send).toHaveBeenCalledWith('Network.streamResourceContent', {
        requestId: 'network-1',
      }, 'session-1')

      const firstChunk = new Promise<Buffer>((resolve) => stream!.once('data', resolve))

      expect((await firstChunk).toString()).toBe('buffered')
    })

    it('returns undefined without throwing when CDP rejects the arm', async () => {
      const client = createClient()

      respondTo(client, 'Network.streamResourceContent', () => Promise.reject(new Error('No resource with given identifier found')))

      const { capture } = createCapture(client)

      const stream = await capture.arm('network-1')

      expect(stream).toBeUndefined()
    })

    // arming holds the response pause open, so a send that never settles must
    // not hang the page — capture is best-effort, delivery is not
    it('gives up arming when the CDP send never settles', async () => {
      const client = createClient()
      const neverSettles = new Promise(() => {})

      respondTo(client, 'Network.streamResourceContent', () => neverSettles)

      const { capture } = createCapture(client)

      vi.useFakeTimers({ shouldAdvanceTime: true })

      try {
        const armed = capture.arm('network-1')

        await vi.advanceTimersByTimeAsync(2000)

        expect(await armed).toBeUndefined()
      } finally {
        vi.useRealTimers()
      }
    })

    // the failure cleanup must only tear down the entry the failing call
    // created — a rejected send created none, and the key may hold a
    // predecessor whose stream is still being read
    it('a failed re-arm leaves the predecessor capture pumping', async () => {
      const { client, capture, dataReceived } = createCapture()
      const first = (await capture.arm('network-1'))!
      const chunks: Buffer[] = []

      first.on('data', (chunk: Buffer) => chunks.push(chunk))

      respondTo(client, 'Network.streamResourceContent', () => Promise.reject(new Error('boom')))

      expect(await capture.arm('network-1')).toBeUndefined()

      dataReceived({ requestId: 'network-1', data: Buffer.from('still-live').toString('base64') })

      await tick()

      expect(Buffer.concat(chunks).toString()).toBe('still-live')
      expect(first.destroyed).toBe(false)
    })
  })

  describe('dataReceived', () => {
    it('isolates captures for the same networkId across different sessions, ignoring an event with no data payload', async () => {
      const { capture, dataReceived } = createCapture()
      const root = await armAndCollect(capture, 'network-1')
      const session = await armAndCollect(capture, 'network-1', 'session-1')

      // no data payload — must not throw or push anything
      dataReceived({ requestId: 'network-1' })

      dataReceived({ requestId: 'network-1', data: Buffer.from('root').toString('base64') })
      dataReceived({ requestId: 'network-1', data: Buffer.from('sess').toString('base64') }, 'session-1')

      await tick()

      expect(Buffer.concat(root.chunks).toString()).toBe('root')
      expect(Buffer.concat(session.chunks).toString()).toBe('sess')
    })

    // Bounds capture of a never-ending body so Test Replay always receives a
    // finite stream — the browser's own delivery to the page is unaffected.
    it('ends and drops the stream once the capture byte cap is reached', async () => {
      const { capture, dataReceived } = createCapture()
      const stream = await capture.arm('network-1')
      const ended = onceEvent(stream!, 'end')

      stream!.resume()

      dataReceived({ requestId: 'network-1', data: Buffer.alloc(CAPTURE_BYTE_CAP).toString('base64') })

      await ended

      // The entry was dropped once the cap ended it — further bytes for the
      // same key must not throw (e.g. push after the stream ended).
      expect(() => {
        dataReceived({ requestId: 'network-1', data: Buffer.from('late').toString('base64') })
      }).not.toThrow()
    })
  })

  describe('loadingFinished / loadingFailed', () => {
    it('ends the stream on loadingFinished', async () => {
      const { capture, loadingFinished } = createCapture()
      const stream = await capture.arm('network-1')
      const ended = onceEvent(stream!, 'end')

      stream!.resume()

      loadingFinished({ requestId: 'network-1' })

      await ended
    })

    // A failed load still leaves whatever was captured up to that point valid
    // for Test Replay — end (not error) the stream so a partial capture is
    // delivered instead of discarded.
    it('ends (does not error) the stream on loadingFailed, preserving the partial capture', async () => {
      const { capture, dataReceived, loadingFailed } = createCapture()
      const { stream, chunks } = await armAndCollect(capture, 'network-1')
      const errored = vi.fn()

      stream.on('error', errored)

      dataReceived({ requestId: 'network-1', data: Buffer.from('partial').toString('base64') })
      loadingFailed({ requestId: 'network-1', errorText: 'net::ERR_FAILED' })

      await tick()

      expect(errored).not.toHaveBeenCalled()
      expect(Buffer.concat(chunks).toString()).toBe('partial')
    })
  })

  it('is a no-op for a networkId with no in-flight capture across dataReceived, loadingFinished, loadingFailed, and release', () => {
    const { capture, dataReceived, loadingFinished, loadingFailed } = createCapture()

    expect(() => {
      dataReceived({ requestId: 'unarmed-network', data: Buffer.from('x').toString('base64') })
      loadingFinished({ requestId: 'unarmed-network' })
      loadingFailed({ requestId: 'unarmed-network', errorText: 'net::ERR_FAILED' })
      capture.release('network-unknown')
    }).not.toThrow()
  })

  it('reset destroys and clears every in-flight capture', async () => {
    const { capture } = createCapture()
    const stream = await capture.arm('network-1')
    const closed = onceEvent(stream!, 'close')

    capture.reset()

    await closed

    // A capture armed under the same key after reset must not be confused
    // with the destroyed one.
    const nextStream = await capture.arm('network-1')

    expect(nextStream).not.toBe(stream)
  })

  it('release destroys and drops a single armed capture, leaving a sibling capture untouched and still pumping', async () => {
    const { capture, dataReceived } = createCapture()
    const released = await capture.arm('network-1', 'session-1')
    const kept = await armAndCollect(capture, 'network-2', 'session-1')
    const closed = onceEvent(released!, 'close')

    capture.release('network-1', 'session-1')

    await closed

    // the sibling capture is untouched and still pumping
    const sawData = onceEvent(kept.stream, 'data')

    dataReceived({ requestId: 'network-2', data: Buffer.from('still-live').toString('base64') }, 'session-1')

    await sawData

    expect(Buffer.concat(kept.chunks).toString()).toBe('still-live')
  })

  it('re-arming a live key ends the previous stream before replacing it', async () => {
    const { capture } = createCapture()
    const first = await capture.arm('network-1')
    const ended = onceEvent(first!, 'end')

    first!.resume()

    const second = await capture.arm('network-1')

    await ended

    expect(second).not.toBe(first)
  })
})
