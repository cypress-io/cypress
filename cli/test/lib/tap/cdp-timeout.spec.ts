import { describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_CDP_TIMEOUT_MS,
  DISCOVERY_TIMEOUT_MS,
  boundCdpClient,
  cdpBounds,
  isRendererUnresponsive,
  withCdpDeadline,
} from '../../../lib/tap/cdp-timeout'

// A CDP reply carries no timer of its own, so a target that stops answering
// leaves the promise pending forever. These cover the bound that replaces that
// silence with a coded failure.
const never = () => new Promise<never>(() => {})

const BOUND = 20

describe('lib/tap/cdp-timeout', () => {
  describe('withCdpDeadline', () => {
    it('rejects with RENDERER_UNRESPONSIVE when the call never answers', async () => {
      const err = await withCdpDeadline(never(), 'the probe', BOUND).catch((e) => e)

      expect(isRendererUnresponsive(err)).to.eq(true)
      expect(err.code).to.eq('RENDERER_UNRESPONSIVE')
      expect(err.message).to.contain('the probe')
      expect(err.message).to.contain(`${BOUND}ms`)
      expect(err.message).to.contain('--timeout')
    })

    it('resolves with the value when the call answers first', async () => {
      await expect(withCdpDeadline(Promise.resolve('answered'), 'a call', BOUND)).resolves.to.eq('answered')
    })

    it('passes a rejection through untouched rather than reporting a timeout', async () => {
      const failure = new Error('Session with given id not found')
      const err = await withCdpDeadline(Promise.reject(failure), 'a call', BOUND).catch((e) => e)

      expect(err).to.eq(failure)
      expect(isRendererUnresponsive(err)).to.eq(false)
    })

    it('clears its timer once the call answers, so a pending timeout cannot outlive it', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      await withCdpDeadline(Promise.resolve('answered'), 'a call', BOUND)

      expect(clearTimeoutSpy).toHaveBeenCalled()
      clearTimeoutSpy.mockRestore()
    })
  })

  describe('cdpBounds', () => {
    it('defaults the two waits apart: locating the runner page is a round trip, calling into it can wait on a spec', () => {
      expect(cdpBounds()).to.deep.eq({ call: DEFAULT_CDP_TIMEOUT_MS, discovery: DISCOVERY_TIMEOUT_MS })
      expect(DISCOVERY_TIMEOUT_MS).to.be.lessThan(DEFAULT_CDP_TIMEOUT_MS)
    })

    it('raises both waits together, so the shorter one cannot fail underneath an explicit --timeout', () => {
      expect(cdpBounds(90_000)).to.deep.eq({ call: 90_000, discovery: 90_000 })
    })
  })

  describe('isRendererUnresponsive', () => {
    it('is false for anything that is not the timeout failure', () => {
      expect(isRendererUnresponsive(new Error('boom'))).to.eq(false)
      expect(isRendererUnresponsive(undefined)).to.eq(false)
      expect(isRendererUnresponsive({ code: 'RENDERER_UNRESPONSIVE' })).to.eq(false)
    })
  })

  describe('boundCdpClient', () => {
    const fakeClient = (overrides: Record<string, unknown> = {}) => {
      return {
        Runtime: { evaluate: () => never() },
        Target: { getTargets: () => Promise.resolve({ targetInfos: [] }) },
        close: () => Promise.resolve(),
        host: '127.0.0.1',
        ...overrides,
      } as any
    }

    it('bounds a domain call that never answers', async () => {
      const client = boundCdpClient(fakeClient(), BOUND)

      const err = await client.Runtime.evaluate({ expression: '1' }).catch((e: unknown) => e)

      expect(isRendererUnresponsive(err)).to.eq(true)
      expect((err as Error).message).to.contain('Runtime.evaluate')
    })

    it('passes a domain call that answers straight through', async () => {
      const client = boundCdpClient(fakeClient(), BOUND)

      await expect(client.Target.getTargets()).resolves.to.deep.eq({ targetInfos: [] })
    })

    it('forwards arguments and receiver to the underlying call', async () => {
      const evaluate = vi.fn().mockResolvedValue({ result: {} })
      const client = boundCdpClient(fakeClient({ Runtime: { evaluate } }), BOUND)

      await client.Runtime.evaluate({ expression: 'window.x' }, 'session-1')

      expect(evaluate).toHaveBeenCalledWith({ expression: 'window.x' }, 'session-1')
    })

    // Domain properties double as event subscribers, which hand back an
    // unsubscribe function rather than a promise — racing one would swap it for a
    // promise and break the caller.
    it('leaves a non-promise return value alone', () => {
      const unsubscribe = () => {}
      const client = boundCdpClient(fakeClient({ Page: { loadEventFired: () => unsubscribe } }), BOUND)

      expect((client as any).Page.loadEventFired(() => {})).to.eq(unsubscribe)
    })

    it('leaves the client’s own members alone, so closing the connection is never bounded', async () => {
      const close = vi.fn().mockReturnValue(never())
      const client = boundCdpClient(fakeClient({ close }), BOUND)

      expect((client as any).host).to.eq('127.0.0.1')

      const settled = await Promise.race([
        client.close().then(() => 'closed'),
        new Promise((resolve) => setTimeout(() => resolve('still pending'), BOUND * 3)),
      ])

      expect(settled).to.eq('still pending')
    })

    it('hands back the same proxy for a domain each time it is read', () => {
      const client = boundCdpClient(fakeClient(), BOUND)

      expect(client.Runtime).to.eq(client.Runtime)
    })
  })
})
