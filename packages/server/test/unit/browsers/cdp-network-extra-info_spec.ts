const { expect, sinon } = require('../../spec_helper')

import type { Protocol } from 'devtools-protocol'
import { CDPNetworkExtraInfo } from '../../../lib/browsers/cdp-protocol/cdp-network-extra-info'

function createClient () {
  return {
    on: sinon.stub(),
    off: sinon.stub(),
  }
}

function createLayer () {
  const client = createClient()
  const layer = new CDPNetworkExtraInfo(client as any)

  layer.start()

  const handler = (eventName: string) => client.on.withArgs(eventName).firstCall.args[1]

  return {
    client,
    layer,
    entries: () => (layer as any).extraInfo as Map<string, unknown>,
    entryFor: (requestId: string, sessionId?: string) => {
      return (layer as any).extraInfo.get(`${sessionId ?? 'root'}:${requestId}`) as { expectsExtraInfo: boolean, settled: boolean, consumed: boolean, responseReceived: boolean } | undefined
    },
    requestExtraInfo: handler('Network.requestWillBeSentExtraInfo') as (event: Partial<Protocol.Network.RequestWillBeSentExtraInfoEvent>, sessionId?: string) => void,
    responseReceived: handler('Network.responseReceived') as (event: Partial<Protocol.Network.ResponseReceivedEvent>, sessionId?: string) => void,
    responseExtraInfo: handler('Network.responseReceivedExtraInfo') as (event: Partial<Protocol.Network.ResponseReceivedExtraInfoEvent>, sessionId?: string) => void,
    loadingFinished: handler('Network.loadingFinished') as (event: Partial<Protocol.Network.LoadingFinishedEvent>, sessionId?: string) => void,
    loadingFailed: handler('Network.loadingFailed') as (event: Partial<Protocol.Network.LoadingFailedEvent>, sessionId?: string) => void,
  }
}

// Drains the microtask queue deep enough to cross responseExtraInfo's
// Promise.race, async resumption, and finally hops.
async function tick () {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve()
  }
}

// Tracks a promise's resolution without awaiting it, so tests using fake
// timers can assert whether a pause is being held or was released.
function track (promise: Promise<Protocol.Network.ResponseReceivedExtraInfoEvent | undefined>) {
  const state: { resolved: boolean, event?: Protocol.Network.ResponseReceivedExtraInfoEvent } = { resolved: false }

  void promise.then((event) => {
    state.resolved = true
    state.event = event
  })

  return state
}

describe('CDPNetworkExtraInfo', () => {
  describe('start/stop', () => {
    it('registers the Network handlers on start and removes them on stop', () => {
      const client = createClient()
      const layer = new CDPNetworkExtraInfo(client as any)

      layer.start()

      expect(client.on.getCalls().map((call) => call.args[0])).to.deep.equal([
        'Network.requestWillBeSentExtraInfo',
        'Network.responseReceived',
        'Network.responseReceivedExtraInfo',
        'Network.loadingFinished',
        'Network.loadingFailed',
      ])

      layer.stop()

      expect(client.off.getCalls().map((call) => call.args[0])).to.deep.equal([
        'Network.requestWillBeSentExtraInfo',
        'Network.responseReceived',
        'Network.responseReceivedExtraInfo',
        'Network.loadingFinished',
        'Network.loadingFailed',
      ])
    })

    it('releases parked consumers and empties the map on stop', async () => {
      sinon.useFakeTimers()
      const { layer, entries, requestExtraInfo } = createLayer()

      requestExtraInfo({ requestId: 'request-1' })

      const held = track(layer.responseExtraInfo('request-1'))

      await tick()

      expect(held.resolved).to.be.false

      layer.stop()
      await tick()

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined
      expect(entries().size).to.equal(0)
    })
  })

  describe('responseExtraInfo', () => {
    it('skips the hold entirely when no extraInfo was promised', async () => {
      sinon.useFakeTimers()
      const { layer, entries, responseReceived } = createLayer()

      // no request twin and no responseReceived: the transaction never hit
      // the instrumented wire path (cache / service worker) — resolve
      // immediately rather than paying any hold
      const held = track(layer.responseExtraInfo('request-1'))

      await tick()

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined

      responseReceived({ requestId: 'request-1', hasExtraInfo: false })

      expect(entries().size).to.equal(0)
    })

    it('resolves from an entry the extraInfo event created before anything else asked', async () => {
      const { layer, entries, responseReceived, responseExtraInfo } = createLayer()

      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'foo1=bar1',
        },
      })

      const event = await layer.responseExtraInfo('request-1')

      expect(event?.headers).to.deep.equal({ 'set-cookie': 'foo1=bar1' })

      // the consumed entry waits for its responseReceived (which fires only
      // after the pause is released) before it is dropped
      expect(entries().size).to.equal(1)

      responseReceived({ requestId: 'request-1', hasExtraInfo: true })

      expect(entries().size).to.equal(0)
    })

    it('holds after the request twin promises an extraInfo and resolves when it lands', async () => {
      sinon.useFakeTimers()
      const { layer, entries, requestExtraInfo, responseReceived, responseExtraInfo } = createLayer()

      // the request twin is emitted at wire-send time — the only signal that
      // precedes the response pause
      requestExtraInfo({ requestId: 'request-1' })

      const held = track(layer.responseExtraInfo('request-1'))

      await tick()

      expect(held.resolved).to.be.false

      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'foo1=bar1',
        },
      })

      await tick()

      expect(held.resolved).to.be.true
      expect(held.event?.headers).to.deep.equal({ 'set-cookie': 'foo1=bar1' })
      expect(entries().size).to.equal(1)

      responseReceived({ requestId: 'request-1', hasExtraInfo: true })

      expect(entries().size).to.equal(0)
    })

    it('does not open an entry for a request that never paused', async () => {
      const { entries, responseReceived, loadingFinished } = createLayer()

      // memory-cache hits are delivered without a Fetch pause: nothing will
      // ever consume an entry for them, so none should be opened
      responseReceived({ requestId: 'request-1', hasExtraInfo: false })

      expect(entries().size).to.equal(0)

      loadingFinished({ requestId: 'request-1' })

      expect(entries().size).to.equal(0)
    })

    it('settles the entry when responseReceived reports hasExtraInfo false on an open entry', async () => {
      sinon.useFakeTimers()
      const { layer, entries, requestExtraInfo, responseReceived } = createLayer()

      // hasExtraInfo is the documented authority: it settles an entry the
      // twin opened even though the twin expected an extraInfo event
      requestExtraInfo({ requestId: 'request-1' })
      responseReceived({ requestId: 'request-1', hasExtraInfo: false })

      const held = track(layer.responseExtraInfo('request-1'))

      await tick()

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined
      expect(entries().size).to.equal(0)
    })

    it('settles an entry whose extraInfo arrived before any consumer asked', async () => {
      const { layer, entries, requestExtraInfo, responseExtraInfo, loadingFinished } = createLayer()

      requestExtraInfo({ requestId: 'request-1' })
      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'foo1=bar1',
        },
      })

      const event = await layer.responseExtraInfo('request-1')

      expect(event?.headers).to.deep.equal({ 'set-cookie': 'foo1=bar1' })

      loadingFinished({ requestId: 'request-1' })

      expect(entries().size).to.equal(0)
    })
  })

  describe('terminal sweep', () => {
    it('drops an entry its request twin opened when the request never pauses', () => {
      const { entries, requestExtraInfo, loadingFailed } = createLayer()

      // an aborted request: the twin fired, but no response pause and no
      // responseReceived ever follow
      requestExtraInfo({ requestId: 'request-1' })

      expect(entries().size).to.equal(1)

      loadingFailed({ requestId: 'request-1', errorText: 'net::ERR_ABORTED' })

      expect(entries().size).to.equal(0)
    })

    it('releases a consumer parked on a request that dies on the wire', async () => {
      sinon.useFakeTimers()
      const { layer, entries, requestExtraInfo, loadingFailed } = createLayer()

      requestExtraInfo({ requestId: 'request-1' })

      const held = track(layer.responseExtraInfo('request-1'))

      await tick()

      expect(held.resolved).to.be.false

      loadingFailed({ requestId: 'request-1', errorText: 'net::ERR_CONNECTION_RESET' })
      await tick()

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined
      expect(entries().size).to.equal(0)
    })

    it('drops a consumed entry when loadingFinished arrives instead of responseReceived', async () => {
      const { layer, entries, requestExtraInfo, responseExtraInfo, loadingFinished } = createLayer()

      requestExtraInfo({ requestId: 'request-1' })
      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'foo1=bar1',
        },
      })

      await layer.responseExtraInfo('request-1')

      expect(entries().size).to.equal(1)

      loadingFinished({ requestId: 'request-1' })

      expect(entries().size).to.equal(0)
    })

    it('cannot clobber a payload the consumer is already awaiting', async () => {
      sinon.useFakeTimers()
      const { layer, entries, requestExtraInfo, responseExtraInfo, loadingFailed } = createLayer()

      requestExtraInfo({ requestId: 'request-1' })

      const held = track(layer.responseExtraInfo('request-1'))

      await tick()

      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'foo1=bar1',
        },
      })

      // an aborted stream terminates the request in the same turn the payload
      // landed — resolving an already-settled deferred is a no-op, so the
      // consumer keeps the cookies while the entry is still swept
      loadingFailed({ requestId: 'request-1', errorText: 'net::ERR_ABORTED' })

      await tick()

      expect(held.event?.headers).to.deep.equal({ 'set-cookie': 'foo1=bar1' })
      expect(entries().size).to.equal(0)
    })

    it('ignores terminal events for requests it never tracked', () => {
      const { entries, loadingFinished, loadingFailed } = createLayer()

      loadingFinished({ requestId: 'never-seen' })
      loadingFailed({ requestId: 'never-seen-either', errorText: 'net::ERR_FAILED' })

      expect(entries().size).to.equal(0)
    })
  })

  describe('entry lifecycle', () => {
    it('extraInfo first: the consume marks the entry consumed and the late responseReceived deletes it', async () => {
      const { layer, entries, entryFor, responseReceived, responseExtraInfo } = createLayer()

      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'foo1=bar1',
        },
      })

      expect(entryFor('request-1')).to.include({ settled: true, consumed: false, responseReceived: false })

      const event = await layer.responseExtraInfo('request-1')

      expect(event?.headers).to.deep.equal({ 'set-cookie': 'foo1=bar1' })
      expect(entryFor('request-1')).to.include({ consumed: true, responseReceived: false })

      responseReceived({ requestId: 'request-1', hasExtraInfo: true })

      expect(entries().size).to.equal(0)
    })

    it('twin then consume then extraInfo: the consume holds and the event settles it', async () => {
      sinon.useFakeTimers()
      const { layer, entries, entryFor, responseReceived, responseExtraInfo, requestExtraInfo } = createLayer()

      requestExtraInfo({ requestId: 'request-1' })

      expect(entryFor('request-1')).to.include({ expectsExtraInfo: true, settled: false, consumed: false, responseReceived: false })

      const held = track(layer.responseExtraInfo('request-1'))

      await tick()

      expect(held.resolved).to.be.false

      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'foo1=bar1',
        },
      })

      await tick()

      // the event only resolves the deferred — consumption belongs to the pause
      expect(held.event?.headers).to.deep.equal({ 'set-cookie': 'foo1=bar1' })
      expect(entryFor('request-1')).to.include({ settled: true, consumed: true, responseReceived: false })

      responseReceived({ requestId: 'request-1', hasExtraInfo: true })

      expect(entries().size).to.equal(0)
    })

    it('consume first with no signals: returns immediately and responseReceived sweeps', async () => {
      sinon.useFakeTimers()
      const { layer, entries, entryFor, responseReceived } = createLayer()

      const held = track(layer.responseExtraInfo('request-1'))

      await tick()

      // no hold at all — nothing promised an extraInfo
      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined
      expect(entryFor('request-1')).to.include({ consumed: true, responseReceived: false })

      responseReceived({ requestId: 'request-1', hasExtraInfo: false })

      expect(entries().size).to.equal(0)
    })
  })

  describe('timeout backstop', () => {
    it('resolves without the event when a twin-promised extraInfo never arrives', async () => {
      const clock = sinon.useFakeTimers()
      const { layer, entries, requestExtraInfo, responseReceived } = createLayer()

      // e.g. the connection died mid-response — the twin promised an
      // extraInfo that will never come
      requestExtraInfo({ requestId: 'request-1' })

      const held = track(layer.responseExtraInfo('request-1'))

      await clock.tickAsync(99)

      expect(held.resolved).to.be.false

      await clock.tickAsync(1)

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined

      // the consumed entry waits for its responseReceived sweep
      expect(entries().size).to.equal(1)

      responseReceived({ requestId: 'request-1', hasExtraInfo: false })

      expect(entries().size).to.equal(0)
    })

    it('deletes the entry when the wait times out so nothing dangles in the map', async () => {
      const clock = sinon.useFakeTimers()
      const { layer, entries, requestExtraInfo, responseReceived } = createLayer()

      // both signals promised an extraInfo that never arrives — the timeout
      // must still release the pause, and responseReceived already landed so
      // the entry completes its lifecycle at the consume
      requestExtraInfo({ requestId: 'request-1' })
      responseReceived({ requestId: 'request-1', hasExtraInfo: true })

      const held = track(layer.responseExtraInfo('request-1'))

      await clock.tickAsync(100)

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined
      expect(entries().size).to.equal(0)
    })

    it('does not delete an entry recreated after this consumer was released', async () => {
      const { layer, entries, requestExtraInfo, responseReceived, responseExtraInfo } = createLayer()

      requestExtraInfo({ requestId: 'request-1' })

      const held = track(layer.responseExtraInfo('request-1'))

      await tick()

      // release the consumer and drop its entry, then land the event before
      // the consumer's cleanup has a chance to see the recreated entry
      layer.clear('request-1')

      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'late=1',
        },
      })

      await tick()

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined

      // the recreated entry must have survived the released consumer's cleanup
      expect(entries().size).to.equal(1)

      const event = await layer.responseExtraInfo('request-1')

      expect(event?.headers).to.deep.equal({ 'set-cookie': 'late=1' })

      responseReceived({ requestId: 'request-1', hasExtraInfo: true })

      expect(entries().size).to.equal(0)
    })

    it('drops the entry instead of recreating one when responseReceived lands after the consume', async () => {
      const { layer, entries, responseReceived, responseExtraInfo } = createLayer()

      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'foo1=bar1',
        },
      })

      await layer.responseExtraInfo('request-1')

      expect(entries().size).to.equal(1)

      // the post-release responseReceived is the flow's last signal — it must
      // complete the entry's lifecycle, not strand a fresh entry in the map
      responseReceived({ requestId: 'request-1', hasExtraInfo: true })

      expect(entries().size).to.equal(0)

      await tick()

      expect(entries().size).to.equal(0)
    })
  })

  describe('redirect chains', () => {
    it('serves each response in a redirect chain from its own entry as the request id is reused', async () => {
      const { layer, entries, requestExtraInfo, responseReceived, responseExtraInfo } = createLayer()

      // a held pause blocks the browser from advancing the request, so each
      // response's events interleave strictly with their consumes
      requestExtraInfo({ requestId: 'request-1' })
      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'redirect=1',
        },
      })

      const redirectEvent = await layer.responseExtraInfo('request-1')

      expect(redirectEvent?.headers).to.deep.equal({ 'set-cookie': 'redirect=1' })

      // the redirect response never gets its own responseReceived — its
      // consumed entry waits to be replaced by the next response's events
      expect(entries().size).to.equal(1)

      requestExtraInfo({ requestId: 'request-1' })
      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'final=1',
        },
      })

      expect(entries().size).to.equal(1)

      const finalEvent = await layer.responseExtraInfo('request-1')

      expect(finalEvent?.headers).to.deep.equal({ 'set-cookie': 'final=1' })

      // responseReceived fires once, for the final response of the chain
      responseReceived({ requestId: 'request-1', hasExtraInfo: true })

      expect(entries().size).to.equal(0)
    })
  })

  describe('late extraInfo across redirect hops', () => {
    it('does not merge a previous hop\'s cookies when its extraInfo arrived after the timeout', async () => {
      const clock = sinon.useFakeTimers()
      const { layer, entries, requestExtraInfo, responseExtraInfo, responseReceived } = createLayer()

      // hop 1: the twin promises an extraInfo that misses the backstop window
      requestExtraInfo({ requestId: 'request-1' })

      const firstHeld = track(layer.responseExtraInfo('request-1'))

      await clock.tickAsync(100)

      expect(firstHeld.resolved).to.be.true
      expect(firstHeld.event).to.be.undefined

      // …and lands afterwards, settling an entry nothing consumed
      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'hop=1',
        },
      })

      // hop 2 starts a new response cycle under the same request id: its own
      // extraInfo must win, not the straggler from hop 1
      requestExtraInfo({ requestId: 'request-1' })
      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'final=1',
        },
      })

      const finalEvent = await layer.responseExtraInfo('request-1')

      expect(finalEvent?.headers).to.deep.equal({ 'set-cookie': 'final=1' })

      responseReceived({ requestId: 'request-1', hasExtraInfo: true })

      expect(entries().size).to.equal(0)
    })
  })

  describe('session scoping', () => {
    it('does not surface an event from a different session with a colliding request id', async () => {
      sinon.useFakeTimers()
      const { layer, entries, responseReceived, responseExtraInfo } = createLayer()

      // a service-worker session reuses the page flow's request id
      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'evil=1',
        },
      }, 'service-worker-session')

      const held = track(layer.responseExtraInfo('request-1'))

      await tick()

      // the other session's event neither satisfies nor holds the root
      // session's consume — no signals exist under the root key
      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined

      const event = await layer.responseExtraInfo('request-1', 'service-worker-session')

      expect(event?.headers).to.deep.equal({ 'set-cookie': 'evil=1' })

      // each session's responseReceived sweeps its own consumed entry
      responseReceived({ requestId: 'request-1', hasExtraInfo: false })
      responseReceived({ requestId: 'request-1', hasExtraInfo: true }, 'service-worker-session')

      expect(entries().size).to.equal(0)
    })
  })

  describe('clear', () => {
    it('releases a parked consumer and drops its entry', async () => {
      sinon.useFakeTimers()
      const { layer, entries, requestExtraInfo } = createLayer()

      requestExtraInfo({ requestId: 'request-1' })

      const held = track(layer.responseExtraInfo('request-1'))

      await tick()

      expect(held.resolved).to.be.false

      layer.clear('request-1')
      await tick()

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined
      expect(entries().size).to.equal(0)
    })

    it('drops a settled entry the flow never consumed', async () => {
      const { layer, entries, responseExtraInfo } = createLayer()

      // extraInfo arrived but the flow errored before its pause consumed it
      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'orphan=1',
        },
      })

      expect(entries().size).to.equal(1)

      layer.clear('request-1')

      expect(entries().size).to.equal(0)
    })
  })

  describe('flush', () => {
    it('releases every parked consumer and empties the map', async () => {
      sinon.useFakeTimers()
      const { layer, entries, requestExtraInfo, responseExtraInfo } = createLayer()

      requestExtraInfo({ requestId: 'request-1' })
      requestExtraInfo({ requestId: 'request-2' })

      const firstHeld = track(layer.responseExtraInfo('request-1'))
      const secondHeld = track(layer.responseExtraInfo('request-2'))

      responseExtraInfo({
        requestId: 'request-3',
        headers: {
          'set-cookie': 'buffered=1',
        },
      })

      await tick()

      expect(firstHeld.resolved).to.be.false
      expect(secondHeld.resolved).to.be.false

      layer.flush()
      await tick()

      expect(firstHeld.resolved).to.be.true
      expect(firstHeld.event).to.be.undefined
      expect(secondHeld.resolved).to.be.true
      expect(secondHeld.event).to.be.undefined
      expect(entries().size).to.equal(0)

      // the settled entry is gone too — a later consumer has no signals and
      // resolves immediately without it
      const held = track(layer.responseExtraInfo('request-3'))

      await tick()

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined
    })
  })
})
