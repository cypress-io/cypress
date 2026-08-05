import { describe, expect, it, vi } from 'vitest'
import type CRI from 'chrome-remote-interface'

import { boundCdpCalls, isRendererUnresponsive, withCdpDeadline } from '../../../lib/tap/cdp-timeout'

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

  describe('isRendererUnresponsive', () => {
    it('is false for anything that is not the timeout failure', () => {
      expect(isRendererUnresponsive(new Error('boom'))).to.eq(false)
      expect(isRendererUnresponsive(undefined)).to.eq(false)
      expect(isRendererUnresponsive({ code: 'RENDERER_UNRESPONSIVE' })).to.eq(false)
    })
  })

  describe('boundCdpCalls', () => {
    const unsubscribe = () => {}

    // Mirrors chrome-remote-interface: the domain shorthands are generated as
    // `client.send` calls, while events and `close` are their own members.
    const fakeClient = (commands: Record<string, (...args: any[]) => unknown> = {}) => {
      const behaviors: Record<string, (...args: any[]) => unknown> = {
        'Runtime.evaluate': () => never(),
        'Target.getTargets': () => Promise.resolve({ targetInfos: [] }),
        ...commands,
      }

      const client: any = {
        send: (command: string, ...args: unknown[]) => behaviors[command](...args),
        close: () => never(),
        Page: { loadEventFired: () => unsubscribe },
      }

      Object.keys(behaviors).forEach((command) => {
        const [domain, method] = command.split('.')

        client[domain] = client[domain] ?? {}
        client[domain][method] = (...args: unknown[]) => client.send(command, ...args)
      })

      return client as CRI.Client
    }

    it('bounds a domain call that never answers', async () => {
      const client = fakeClient()

      boundCdpCalls(client, BOUND)

      const err = await client.Runtime.evaluate({ expression: '1' }).catch((e: unknown) => e)

      expect(isRendererUnresponsive(err)).to.eq(true)
      expect((err as Error).message).to.contain('Runtime.evaluate')
    })

    it('passes a domain call that answers straight through', async () => {
      const client = fakeClient()

      boundCdpCalls(client, BOUND)

      await expect(client.Target.getTargets()).resolves.to.deep.eq({ targetInfos: [] })
    })

    it('forwards the params and session id to the underlying call', async () => {
      const evaluate = vi.fn().mockResolvedValue({ result: {} })
      const client = fakeClient({ 'Runtime.evaluate': evaluate })

      boundCdpCalls(client, BOUND)

      await client.Runtime.evaluate({ expression: 'window.x' }, 'session-1')

      expect(evaluate).toHaveBeenCalledWith({ expression: 'window.x' }, 'session-1')
    })

    // An event subscriber hands back an unsubscribe function rather than a promise,
    // so racing one would swap it for a promise and break the caller.
    it('leaves event subscriptions alone', () => {
      const client = fakeClient()

      boundCdpCalls(client, BOUND)

      expect((client as any).Page.loadEventFired(() => {})).to.eq(unsubscribe)
    })

    it('leaves closing the connection unbounded, since that is what settles an abandoned call', async () => {
      const client = fakeClient()

      boundCdpCalls(client, BOUND)

      const settled = await Promise.race([
        client.close().then(() => 'closed'),
        new Promise((resolve) => setTimeout(() => resolve('still pending'), BOUND * 3)),
      ])

      expect(settled).to.eq('still pending')
    })
  })
})
