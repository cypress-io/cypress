import { describe, it, expect, vi } from 'vitest'
import { HttpIntercept } from '../../lib/core/http-intercept'
import type { InterceptMiddleware } from '../../lib/ports/http-interception'

describe('HttpIntercept', () => {
  it('calls fulfillment when no middleware is registered', async () => {
    const httpIntercept = new HttpIntercept()
    const next = vi.fn(async () => {
      return {
        statusCode: 200,
        headers: {},
        body: 'origin',
      }
    })

    const response = await httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/',
      method: 'GET',
      headers: {},
    }, next)

    expect(next).toHaveBeenCalledOnce()
    expect(response.body).toBe('origin')
  })

  it('runs middleware outer-to-inner before fulfillment', async () => {
    const httpIntercept = new HttpIntercept()
    const order: string[] = []

    const outer: InterceptMiddleware = async (request, next) => {
      order.push('outer-before')
      const response = await next(request)

      order.push('outer-after')

      return response
    }

    const inner: InterceptMiddleware = async (request, next) => {
      order.push('inner-before')
      const response = await next(request)

      order.push('inner-after')

      return response
    }

    httpIntercept.use(outer)
    httpIntercept.use(inner)

    await httpIntercept.handle({
      inFlightInterceptId: 'intercept-1',
      url: 'http://example.com/',
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

    expect(order).toEqual([
      'outer-before',
      'inner-before',
      'fulfill',
      'inner-after',
      'outer-after',
    ])
  })
})
