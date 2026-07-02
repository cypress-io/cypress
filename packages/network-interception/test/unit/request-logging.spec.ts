import { describe, it, expect, vi } from 'vitest'
import { debugRequest, shouldLogRequest } from '../../lib/core/request-logging'

describe('core/request-logging', () => {
  it('logs intercept routes without static responses by default', () => {
    expect(shouldLogRequest({
      matchingRoutes: [{ staticResponse: undefined }],
      resourceType: 'image',
    })).toBe(true)
  })

  it('respects staticResponse.log when set', () => {
    expect(shouldLogRequest({
      matchingRoutes: [{ staticResponse: { log: false } }],
      resourceType: 'xhr',
    })).toBe(false)
  })

  it('logs xhr and fetch when no intercept routes match', () => {
    expect(shouldLogRequest({ resourceType: 'xhr' })).toBe(true)
    expect(shouldLogRequest({ resourceType: 'fetch' })).toBe(true)
    expect(shouldLogRequest({ resourceType: 'image' })).toBe(false)
  })

  it('debugRequest calls next with the same request and returns the same response', async () => {
    const request = {
      inFlightInterceptId: 'req-1',
      url: 'https://example.test/',
      method: 'GET',
      headers: {},
    }
    const response = {
      statusCode: 200,
      headers: {},
    }
    const next = vi.fn().mockResolvedValue(response)

    const result = await debugRequest(request, next)

    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith(request)
    expect(result).toBe(response)
  })
})
