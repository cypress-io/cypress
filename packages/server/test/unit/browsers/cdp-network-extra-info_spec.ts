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
    requestExtraInfo: handler('Network.requestWillBeSentExtraInfo') as (event: Partial<Protocol.Network.RequestWillBeSentExtraInfoEvent>, sessionId?: string) => void,
    responseReceived: handler('Network.responseReceived') as (event: Partial<Protocol.Network.ResponseReceivedEvent>, sessionId?: string) => void,
    responseExtraInfo: handler('Network.responseReceivedExtraInfo') as (event: Partial<Protocol.Network.ResponseReceivedExtraInfoEvent>, sessionId?: string) => void,
  }
}

async function tick () {
  await Promise.resolve()
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
      ])

      layer.stop()

      expect(client.off.getCalls().map((call) => call.args[0])).to.deep.equal([
        'Network.requestWillBeSentExtraInfo',
        'Network.responseReceived',
        'Network.responseReceivedExtraInfo',
      ])
    })

    it('releases parked waiters on stop', async () => {
      sinon.useFakeTimers()
      const { layer, requestExtraInfo } = createLayer()

      requestExtraInfo({ requestId: 'request-1' })

      const held = track(layer.responseExtraInfo('request-1', 200))

      await tick()

      expect(held.resolved).to.be.false

      layer.stop()
      await tick()

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined
    })
  })

  describe('responseExtraInfo', () => {
    it('resolves without holding when no extraInfo signals were seen', async () => {
      sinon.useFakeTimers()
      const { layer } = createLayer()

      // cache hits and service worker responses produce no extraInfo events —
      // holding would only delay every such response
      const held = track(layer.responseExtraInfo('request-1', 200))

      await tick()

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined
    })

    it('resolves an extraInfo event buffered before the pause asks for it', async () => {
      const { layer, responseExtraInfo } = createLayer()

      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'foo1=bar1',
        },
      })

      const event = await layer.responseExtraInfo('request-1', 200)

      expect(event?.headers).to.deep.equal({ 'set-cookie': 'foo1=bar1' })
    })

    it('holds the pause for an expected extraInfo event and resolves when it lands', async () => {
      sinon.useFakeTimers()
      const { layer, requestExtraInfo, responseExtraInfo } = createLayer()

      // the request-side twin is the only signal that reliably precedes the pause
      requestExtraInfo({ requestId: 'request-1' })

      const held = track(layer.responseExtraInfo('request-1', 200))

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
    })

    it('resolves without the event at the timeout when the expected extraInfo never arrives', async () => {
      const clock = sinon.useFakeTimers()
      const { layer, requestExtraInfo } = createLayer()

      requestExtraInfo({ requestId: 'request-1' })

      const held = track(layer.responseExtraInfo('request-1', 200))

      await clock.tickAsync(99)

      expect(held.resolved).to.be.false

      await clock.tickAsync(1)

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined
    })

    it('does not hold when responseReceived reports hasExtraInfo false', async () => {
      sinon.useFakeTimers()
      const { layer, requestExtraInfo, responseReceived } = createLayer()

      // request-side extraInfo fired, but the authoritative flag says the
      // response-side one is not coming — the pause must not hold
      requestExtraInfo({ requestId: 'request-1' })
      responseReceived({ requestId: 'request-1', hasExtraInfo: false })

      const held = track(layer.responseExtraInfo('request-1', 200))

      await tick()

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined
    })

    it('holds when responseReceived reports hasExtraInfo true without a request-side event', async () => {
      sinon.useFakeTimers()
      const { layer, responseReceived, responseExtraInfo } = createLayer()

      responseReceived({ requestId: 'request-1', hasExtraInfo: true })

      const held = track(layer.responseExtraInfo('request-1', 200))

      await tick()

      expect(held.resolved).to.be.false

      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'foo1=bar1',
        },
      })

      await tick()

      expect(held.event?.headers).to.deep.equal({ 'set-cookie': 'foo1=bar1' })
    })

    it('consumes per-request tracking when the pause resolves', async () => {
      const { layer, requestExtraInfo, responseReceived } = createLayer()

      requestExtraInfo({ requestId: 'request-1' })
      responseReceived({ requestId: 'request-1', hasExtraInfo: false })

      await layer.responseExtraInfo('request-1', 200)

      expect((layer as any).extraInfoExpected.size).to.equal(0)
      expect((layer as any).hasExtraInfoByRequest.size).to.equal(0)
      expect((layer as any).responseExtraInfos.size).to.equal(0)
    })
  })

  describe('redirect hops and status matching', () => {
    it('matches buffered events to their pause by status code, keeping sibling hops', async () => {
      const { layer, responseExtraInfo } = createLayer()

      // redirect hops and Early Hints reuse the request id
      responseExtraInfo({
        requestId: 'request-1',
        statusCode: 302,
        headers: {
          'set-cookie': 'hop=1',
        },
      })

      responseExtraInfo({
        requestId: 'request-1',
        statusCode: 200,
        headers: {
          'set-cookie': 'final=1',
        },
      })

      const finalEvent = await layer.responseExtraInfo('request-1', 200)

      expect(finalEvent?.headers).to.deep.equal({ 'set-cookie': 'final=1' })

      // the other hop's entry must have survived the first consume
      const hopEvent = await layer.responseExtraInfo('request-1', 302)

      expect(hopEvent?.headers).to.deep.equal({ 'set-cookie': 'hop=1' })
    })

    it('consumes a lone buffered event despite a status skew', async () => {
      const { layer, responseExtraInfo } = createLayer()

      // e.g. a revalidated response: the pause reports 200, the wire said 304
      responseExtraInfo({
        requestId: 'request-1',
        statusCode: 304,
        headers: {
          'set-cookie': 'foo1=bar1',
        },
      })

      const event = await layer.responseExtraInfo('request-1', 200)

      expect(event?.headers).to.deep.equal({ 'set-cookie': 'foo1=bar1' })
    })

    it('does not let a parked waiter accept a different hop\'s event', async () => {
      sinon.useFakeTimers()
      const { layer, requestExtraInfo, responseExtraInfo } = createLayer()

      requestExtraInfo({ requestId: 'request-1' })

      const held = track(layer.responseExtraInfo('request-1', 200))

      await tick()

      // an interim hop's event lands while the 200 pause is holding — it must
      // be buffered, not consumed by the waiter
      responseExtraInfo({
        requestId: 'request-1',
        statusCode: 302,
        headers: {
          'set-cookie': 'hop=1',
        },
      })

      await tick()

      expect(held.resolved).to.be.false

      responseExtraInfo({
        requestId: 'request-1',
        statusCode: 200,
        headers: {
          'set-cookie': 'final=1',
        },
      })

      await tick()

      expect(held.event?.headers).to.deep.equal({ 'set-cookie': 'final=1' })
    })

    it('falls back to a lone status-skewed buffered event at the waiter timeout', async () => {
      const clock = sinon.useFakeTimers()
      const { layer, requestExtraInfo, responseExtraInfo } = createLayer()

      requestExtraInfo({ requestId: 'request-1' })

      const held = track(layer.responseExtraInfo('request-1', 200))

      await tick()

      // the skewed event buffers instead of satisfying the 200 waiter…
      responseExtraInfo({
        requestId: 'request-1',
        statusCode: 304,
        headers: {
          'set-cookie': 'foo1=bar1',
        },
      })

      // …and the timeout picks it up rather than dropping the merge
      await clock.tickAsync(100)

      expect(held.resolved).to.be.true
      expect(held.event?.headers).to.deep.equal({ 'set-cookie': 'foo1=bar1' })
    })
  })

  describe('session scoping', () => {
    it('does not surface an event from a different session with a colliding request id', async () => {
      sinon.useFakeTimers()
      const { layer, responseExtraInfo } = createLayer()

      // a service-worker session reuses the page flow's request id
      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'evil=1',
        },
      }, 'service-worker-session')

      const held = track(layer.responseExtraInfo('request-1', 200))

      await tick()

      // no signals on the root session — resolves without the other session's event
      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined

      const event = await layer.responseExtraInfo('request-1', 200, 'service-worker-session')

      expect(event?.headers).to.deep.equal({ 'set-cookie': 'evil=1' })
    })
  })

  describe('clear', () => {
    it('releases a parked waiter and drops the request\'s tracking', async () => {
      sinon.useFakeTimers()
      const { layer, requestExtraInfo } = createLayer()

      requestExtraInfo({ requestId: 'request-1' })

      const held = track(layer.responseExtraInfo('request-1', 200))

      await tick()

      expect(held.resolved).to.be.false

      layer.clear('request-1')
      await tick()

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined
      expect((layer as any).extraInfoExpected.size).to.equal(0)
      expect((layer as any).responseExtraInfoWaiters.size).to.equal(0)
    })

    it('cancels the cleared waiter\'s timer so it cannot remove a newer waiter under a reused request id', async () => {
      const clock = sinon.useFakeTimers()
      const { layer, requestExtraInfo, responseExtraInfo } = createLayer()

      requestExtraInfo({ requestId: 'request-1' })

      const first = track(layer.responseExtraInfo('request-1', 200))

      await clock.tickAsync(50)

      layer.clear('request-1')
      await tick()

      expect(first.resolved).to.be.true

      // the next hop reuses the request id and parks its own waiter
      requestExtraInfo({ requestId: 'request-1' })

      const second = track(layer.responseExtraInfo('request-1', 200))

      // move past the cleared waiter's original deadline — a stale timer
      // would have deleted the newer waiter here
      await clock.tickAsync(60)

      expect((layer as any).responseExtraInfoWaiters.size).to.equal(1)

      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'foo1=bar1',
        },
      })

      await tick()

      expect(second.event?.headers).to.deep.equal({ 'set-cookie': 'foo1=bar1' })
    })
  })

  describe('flush', () => {
    it('clears all tracking and releases every parked waiter', async () => {
      sinon.useFakeTimers()
      const { layer, requestExtraInfo, responseExtraInfo } = createLayer()

      requestExtraInfo({ requestId: 'request-1' })
      requestExtraInfo({ requestId: 'request-2' })

      const firstHeld = track(layer.responseExtraInfo('request-1', 200))
      const secondHeld = track(layer.responseExtraInfo('request-2', 200))

      responseExtraInfo({
        requestId: 'request-3',
        headers: {
          'set-cookie': 'buffered=1',
        },
      })

      await tick()

      layer.flush()
      await tick()

      expect(firstHeld.resolved).to.be.true
      expect(firstHeld.event).to.be.undefined
      expect(secondHeld.resolved).to.be.true
      expect(secondHeld.event).to.be.undefined

      // the buffered event is gone too — a later pause resolves without it
      const held = track(layer.responseExtraInfo('request-3', 200))

      await tick()

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined
    })
  })
})
