import { describe, it, expect, vi } from 'vitest'
import {
  applyCspAllowListToHeaders,
  createBlockConfiguredHosts,
  createCspConfiguredAllowList,
  HttpIntercept,
} from '../../lib'

describe('createBlockConfiguredHosts', () => {
  it('passes through when blockHosts is not configured', async () => {
    const middleware = createBlockConfiguredHosts({ config: {} })
    const next = vi.fn(async () => {
      return {
        statusCode: 200,
        headers: {},
        body: 'ok',
      }
    })

    const response = await middleware({
      inFlightInterceptId: 'req-1',
      url: 'http://evil.com/',
      method: 'GET',
      headers: {},
    }, next)

    expect(next).toHaveBeenCalledOnce()
    expect(response.body).toBe('ok')
  })

  it('returns 503 with matched-host header when blocked', async () => {
    const middleware = createBlockConfiguredHosts({
      config: { blockHosts: ['*.evil.com'] },
      matchesBlockedHost: () => 'evil.com',
    })
    const next = vi.fn()

    const response = await middleware({
      inFlightInterceptId: 'req-1',
      url: 'http://evil.com/path',
      method: 'GET',
      headers: {},
    }, next)

    expect(next).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(503)
    expect(response.headers['x-cypress-matched-blocked-host']).toBe('evil.com')
  })

  it('runs before inner middleware on HttpIntercept', async () => {
    const httpIntercept = new HttpIntercept()
    const order: string[] = []

    httpIntercept.use(createBlockConfiguredHosts({
      config: { blockHosts: ['*.evil.com'] },
      matchesBlockedHost: () => 'evil.com',
    }))

    httpIntercept.use(async (request, next) => {
      order.push('inner')

      return next(request)
    })

    await httpIntercept.handle({
      inFlightInterceptId: 'req-1',
      url: 'http://evil.com/',
      method: 'GET',
      headers: {},
    }, async () => {
      order.push('fulfill')

      return {
        statusCode: 200,
        headers: {},
        body: '',
      }
    })

    expect(order).toEqual([])
  })
})

describe('createCspConfiguredAllowList', () => {
  it('removes CSP headers when experimentalCspAllowList is false', async () => {
    const middleware = createCspConfiguredAllowList({ experimentalCspAllowList: false })
    const next = vi.fn(async () => {
      return {
        statusCode: 200,
        headers: {
          'content-security-policy': 'default-src \'self\'',
        },
        body: 'ok',
      }
    })

    const response = await middleware({
      inFlightInterceptId: 'req-1',
      url: 'http://example.com/',
      method: 'GET',
      headers: {},
    }, next)

    expect(response.headers['content-security-policy']).toBeUndefined()
  })

  it('strips unsupported directives when experimentalCspAllowList is true', async () => {
    const middleware = createCspConfiguredAllowList({ experimentalCspAllowList: true })
    const next = vi.fn(async () => {
      return {
        statusCode: 200,
        headers: {
          'content-security-policy': 'img-src \'self\'; frame-ancestors \'none\'',
        },
        body: 'ok',
      }
    })

    const response = await middleware({
      inFlightInterceptId: 'req-1',
      url: 'http://example.com/',
      method: 'GET',
      headers: {},
    }, next)

    expect(response.headers['content-security-policy']).toEqual(['img-src \'self\''])
  })

  it('allows listed directives when experimentalCspAllowList is an array', async () => {
    const middleware = createCspConfiguredAllowList({ experimentalCspAllowList: ['script-src'] })
    const next = vi.fn(async () => {
      return {
        statusCode: 200,
        headers: {
          'content-security-policy': 'script-src \'self\'; child-src \'none\'',
        },
        body: 'ok',
      }
    })

    const response = await middleware({
      inFlightInterceptId: 'req-1',
      url: 'http://example.com/',
      method: 'GET',
      headers: {},
    }, next)

    expect(response.headers['content-security-policy']).toEqual(['script-src \'self\''])
  })
})

describe('applyCspAllowListToHeaders', () => {
  it('is idempotent when CSP headers are already stripped', () => {
    const headers = { 'content-type': 'text/html' }
    const once = applyCspAllowListToHeaders(headers, { experimentalCspAllowList: false })
    const twice = applyCspAllowListToHeaders(once, { experimentalCspAllowList: false })

    expect(twice).toEqual(once)
  })
})
