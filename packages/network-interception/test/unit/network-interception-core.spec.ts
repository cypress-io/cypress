import { describe, it, expect, vi } from 'vitest'
import {
  NetworkInterceptionCore,
  planSubscriptions,
  mergeIncomingRequestChanges,
} from '../../lib'
import type { BackendRoute } from '../../lib/types/backend-route'

describe('core/plan-subscriptions', () => {
  it('plans default subscriptions for matched routes', () => {
    const routes = [{
      id: 'route-1',
      hasInterceptor: true,
      routeMatcher: {},
      getFixture: async () => {},
      matches: 0,
    }] as BackendRoute[]

    const planned = planSubscriptions({ matchingRoutes: routes })

    expect(planned).toHaveLength(1)
    expect(planned[0].subscriptions.map((s) => s.eventName)).toEqual([
      'before:request',
      'response:callback',
      'after:response',
      'network:error',
    ])

    expect(planned[0].subscriptions[0].await).toBe(true)
  })

  it('skips sync XHR routes with interceptors', () => {
    const onSyncInterceptSkipped = vi.fn()
    const routes = [{
      id: 'route-1',
      hasInterceptor: true,
      routeMatcher: {},
      getFixture: async () => {},
      matches: 0,
    }] as BackendRoute[]

    const planned = planSubscriptions({
      matchingRoutes: routes,
      isSyncRequest: true,
      proxiedUrl: 'http://example.com',
      onSyncInterceptSkipped,
    })

    expect(planned).toHaveLength(0)
    expect(onSyncInterceptSkipped).toHaveBeenCalledWith('http://example.com')
  })
})

describe('core/merge-handler-result', () => {
  it('merges handler changes and resolves relative URLs', () => {
    const before = {
      url: 'http://example.com/base/',
      headers: { 'content-length': '4' },
      body: 'body',
      method: 'GET',
    } as any

    const after = {
      url: 'relative',
      headers: { 'content-length': '4' },
      body: 'body',
      method: 'GET',
    } as any

    const resolved = mergeIncomingRequestChanges(before, after, {
      baseUrl: 'http://example.com/base/',
      resolveUrl: (base, relative) => `${base}${relative}`,
    })

    expect(resolved).toBe('http://example.com/base/relative')
    expect(before.url).toBe('http://example.com/base/relative')
  })

  // https://github.com/cypress-io/cypress/issues/25767
  it('preserves empty-string request header values set by handler', () => {
    const before = {
      url: 'http://example.com/',
      headers: { foo: 'original', bar: 'keep' },
      body: '',
      method: 'GET',
    } as any

    const after = {
      url: 'http://example.com/',
      headers: { foo: '', bar: 'keep' },
      body: '',
      method: 'GET',
    } as any

    mergeIncomingRequestChanges(before, after, {
      baseUrl: 'http://example.com/',
      resolveUrl: (base, relative) => `${base}${relative}`,
    })

    expect(before.headers.foo).toBe('')
    expect(before.headers.bar).toBe('keep')
  })

  it('removes request headers deleted or set to undefined by handler', () => {
    const before = {
      url: 'http://example.com/',
      headers: { foo: 'original', bar: 'remove-me' },
      body: '',
      method: 'GET',
    } as any

    const after = {
      url: 'http://example.com/',
      headers: { foo: 'original' },
      body: '',
      method: 'GET',
    } as any

    mergeIncomingRequestChanges(before, after, {
      baseUrl: 'http://example.com/',
      resolveUrl: (base, relative) => `${base}${relative}`,
    })

    expect(before.headers.foo).toBe('original')
    expect(before.headers.bar).toBeUndefined()
  })
})

describe('NetworkInterceptionCore', () => {
  it('delegates matchRoutes and handleRequest to supplied runner', async () => {
    const core = new NetworkInterceptionCore()
    const run = vi.fn().mockResolvedValue(undefined)

    await core.handleRequest(run)

    expect(run).toHaveBeenCalledWith(core)
  })

  it('delegates correlateBrowserPreRequest to requestInterception port', async () => {
    const correlateBrowserPreRequest = vi.fn().mockResolvedValue(undefined)
    const core = new NetworkInterceptionCore({
      requestInterception: { correlateBrowserPreRequest, forwardToOrigin: vi.fn() },
    })
    const ctx = { req: {} }

    await core.correlateBrowserPreRequest(ctx)

    expect(correlateBrowserPreRequest).toHaveBeenCalledWith(ctx)
  })

  it('delegates forwardToOrigin to requestInterception port', () => {
    const forwardToOrigin = vi.fn()
    const core = new NetworkInterceptionCore({
      requestInterception: { correlateBrowserPreRequest: vi.fn(), forwardToOrigin },
    })
    const ctx = { req: {} }

    core.forwardToOrigin(ctx)

    expect(forwardToOrigin).toHaveBeenCalledWith(ctx)
  })

  it('delegates interceptResponse to responseInterception port', async () => {
    const interceptResponse = vi.fn().mockResolvedValue(undefined)
    const core = new NetworkInterceptionCore({
      responseInterception: { interceptResponse },
    })
    const ctx = { req: {} }

    await core.interceptResponse(ctx)

    expect(interceptResponse).toHaveBeenCalledWith(ctx)
  })

  it('throws when requestInterception port is missing', async () => {
    const core = new NetworkInterceptionCore()

    await expect(core.correlateBrowserPreRequest({})).rejects.toThrow(/requestInterception/)
    expect(() => core.forwardToOrigin({})).toThrow(/requestInterception/)
  })

  it('throws when responseInterception port is missing', async () => {
    const core = new NetworkInterceptionCore()

    await expect(core.interceptResponse({})).rejects.toThrow(/responseInterception/)
  })

  it('delegates document preparation methods to documentPreparation port', async () => {
    const setInjectionLevel = vi.fn().mockResolvedValue(undefined)
    const injectHtml = vi.fn().mockResolvedValue(undefined)
    const removeSecurity = vi.fn().mockResolvedValue(undefined)
    const core = new NetworkInterceptionCore({
      documentPreparation: { setInjectionLevel, injectHtml, removeSecurity },
    })
    const ctx = { res: {} }

    await core.setInjectionLevel(ctx)
    await core.injectHtml(ctx)
    await core.removeSecurity(ctx)

    expect(setInjectionLevel).toHaveBeenCalledWith(ctx)
    expect(injectHtml).toHaveBeenCalledWith(ctx)
    expect(removeSecurity).toHaveBeenCalledWith(ctx)
  })

  it('throws when documentPreparation port is missing', async () => {
    const core = new NetworkInterceptionCore()

    await expect(core.setInjectionLevel({})).rejects.toThrow(/documentPreparation/)
    await expect(core.injectHtml({})).rejects.toThrow(/documentPreparation/)
    await expect(core.removeSecurity({})).rejects.toThrow(/documentPreparation/)
  })
})
