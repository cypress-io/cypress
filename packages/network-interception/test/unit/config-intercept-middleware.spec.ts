import { describe, it, expect, vi } from 'vitest'
import {
  applyCspAllowListToHeaders,
  createBlockConfiguredHosts,
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

describe('applyCspAllowListToHeaders', () => {
  it('is idempotent when CSP headers are already stripped', () => {
    const headers = { 'content-type': 'text/html' }
    const once = applyCspAllowListToHeaders(headers, { experimentalCspAllowList: false })
    const twice = applyCspAllowListToHeaders(once, { experimentalCspAllowList: false })

    expect(twice).toEqual(once)
  })
})
