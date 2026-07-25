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
      return (layer as any).extraInfo.get(`${sessionId ?? 'root'}:${requestId}`) as { consumed: boolean, responseReceived: boolean } | undefined
    },
    responseReceived: handler('Network.responseReceived') as (event: Partial<Protocol.Network.ResponseReceivedEvent>, sessionId?: string) => void,
    responseExtraInfo: handler('Network.responseReceivedExtraInfo') as (event: Partial<Protocol.Network.ResponseReceivedExtraInfoEvent>, sessionId?: string) => void,
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
        'Network.responseReceived',
        'Network.responseReceivedExtraInfo',
      ])

      layer.stop()

      expect(client.off.getCalls().map((call) => call.args[0])).to.deep.equal([
        'Network.responseReceived',
        'Network.responseReceivedExtraInfo',
      ])
    })

    it('releases parked consumers and empties the map on stop', async () => {
      sinon.useFakeTimers()
      const { layer, entries } = createLayer()

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

    it('holds a parked consumer and resolves it when the extraInfo event lands', async () => {
      sinon.useFakeTimers()
      const { layer, entries, responseReceived, responseExtraInfo } = createLayer()

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

    it('does not hold when responseReceived reports hasExtraInfo false', async () => {
      sinon.useFakeTimers()
      const { layer, entries, responseReceived } = createLayer()

      // the authoritative flag says no extraInfo is coming — settle empty
      responseReceived({ requestId: 'request-1', hasExtraInfo: false })

      const held = track(layer.responseExtraInfo('request-1'))

      await tick()

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined
      expect(entries().size).to.equal(0)
    })

    it('keeps holding a slot responseReceived promised until its extraInfo lands', async () => {
      sinon.useFakeTimers()
      const { layer, entries, responseReceived, responseExtraInfo } = createLayer()

      responseReceived({ requestId: 'request-1', hasExtraInfo: true })

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

      expect(held.event?.headers).to.deep.equal({ 'set-cookie': 'foo1=bar1' })
      // responseReceived already landed, so consuming completed the lifecycle
      expect(entries().size).to.equal(0)
    })

    it('settles a slot responseReceived opened before any consumer asked', async () => {
      const { layer, entries, responseReceived, responseExtraInfo } = createLayer()

      responseReceived({ requestId: 'request-1', hasExtraInfo: true })

      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'foo1=bar1',
        },
      })

      const event = await layer.responseExtraInfo('request-1')

      expect(event?.headers).to.deep.equal({ 'set-cookie': 'foo1=bar1' })
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

      expect(entryFor('request-1')).to.include({ consumed: false, responseReceived: false })

      const event = await layer.responseExtraInfo('request-1')

      expect(event?.headers).to.deep.equal({ 'set-cookie': 'foo1=bar1' })
      expect(entryFor('request-1')).to.include({ consumed: true, responseReceived: false })

      responseReceived({ requestId: 'request-1', hasExtraInfo: true })

      expect(entries().size).to.equal(0)
    })

    it('responseReceived first with hasExtraInfo true: the consume completes the pair and deletes', async () => {
      const { layer, entries, entryFor, responseReceived, responseExtraInfo } = createLayer()

      responseReceived({ requestId: 'request-1', hasExtraInfo: true })

      expect(entryFor('request-1')).to.include({ consumed: false, responseReceived: true })

      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'foo1=bar1',
        },
      })

      // the event only resolves the deferred — consumption belongs to the pause
      expect(entryFor('request-1')).to.include({ consumed: false, responseReceived: true })

      const event = await layer.responseExtraInfo('request-1')

      expect(event?.headers).to.deep.equal({ 'set-cookie': 'foo1=bar1' })
      expect(entries().size).to.equal(0)
    })

    it('responseReceived first with hasExtraInfo false: the consume returns empty and deletes', async () => {
      const { layer, entries, entryFor, responseReceived } = createLayer()

      responseReceived({ requestId: 'request-1', hasExtraInfo: false })

      expect(entryFor('request-1')).to.include({ consumed: false, responseReceived: true })

      const event = await layer.responseExtraInfo('request-1')

      expect(event).to.be.undefined
      expect(entries().size).to.equal(0)
    })

    it('consume first with no signals: the timeout marks consumed and responseReceived sweeps', async () => {
      const clock = sinon.useFakeTimers()
      const { layer, entries, entryFor, responseReceived } = createLayer()

      const held = track(layer.responseExtraInfo('request-1'))

      await tick()

      expect(entryFor('request-1')).to.include({ consumed: false, responseReceived: false })

      await clock.tickAsync(100)

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined
      expect(entryFor('request-1')).to.include({ consumed: true, responseReceived: false })

      responseReceived({ requestId: 'request-1', hasExtraInfo: false })

      expect(entries().size).to.equal(0)
    })
  })

  describe('timeout', () => {
    it('resolves without the event at the timeout and lets responseReceived sweep the entry', async () => {
      const clock = sinon.useFakeTimers()
      const { layer, entries, responseReceived } = createLayer()

      const held = track(layer.responseExtraInfo('request-1'))

      await clock.tickAsync(99)

      expect(held.resolved).to.be.false

      await clock.tickAsync(1)

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined

      // no responseReceived yet (it fires only after the pause is released) —
      // the consumed entry waits for it rather than dangling forever
      expect(entries().size).to.equal(1)

      responseReceived({ requestId: 'request-1', hasExtraInfo: false })

      expect(entries().size).to.equal(0)
    })

    it('deletes the entry when the wait times out so nothing dangles in the map', async () => {
      const clock = sinon.useFakeTimers()
      const { layer, entries, responseReceived } = createLayer()

      // hasExtraInfo promised an event that never arrives (the response
      // failed) — the timeout must still clear the entry
      responseReceived({ requestId: 'request-1', hasExtraInfo: true })

      const held = track(layer.responseExtraInfo('request-1'))

      await clock.tickAsync(100)

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined
      expect(entries().size).to.equal(0)
    })

    it('does not delete an entry recreated after this consumer was released', async () => {
      const { layer, entries, responseReceived, responseExtraInfo } = createLayer()

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
      const { layer, entries, responseReceived, responseExtraInfo } = createLayer()

      // a held pause blocks the browser from advancing the request, so each
      // response's events interleave strictly with their consumes
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

  describe('session scoping', () => {
    it('does not surface an event from a different session with a colliding request id', async () => {
      const clock = sinon.useFakeTimers()
      const { layer, entries, responseReceived, responseExtraInfo } = createLayer()

      // a service-worker session reuses the page flow's request id
      responseExtraInfo({
        requestId: 'request-1',
        headers: {
          'set-cookie': 'evil=1',
        },
      }, 'service-worker-session')

      const held = track(layer.responseExtraInfo('request-1'))

      // the other session's event must not satisfy the root session's hold
      await clock.tickAsync(100)

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
      const { layer, entries } = createLayer()

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
      const clock = sinon.useFakeTimers()
      const { layer, entries, responseExtraInfo } = createLayer()

      const firstHeld = track(layer.responseExtraInfo('request-1'))
      const secondHeld = track(layer.responseExtraInfo('request-2'))

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
      expect(entries().size).to.equal(0)

      // the settled entry is gone too — a later consumer holds and then
      // resolves without it at the timeout
      const held = track(layer.responseExtraInfo('request-3'))

      await clock.tickAsync(100)

      expect(held.resolved).to.be.true
      expect(held.event).to.be.undefined
    })
  })
})
