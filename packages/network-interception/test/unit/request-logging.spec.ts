import { describe, it, expect } from 'vitest'
import { shouldLogRequest } from '../../lib/core/request-logging'

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

  it('respects a route-level log option for spied (non-stubbed) intercepts', () => {
    expect(shouldLogRequest({
      matchingRoutes: [{ log: false, staticResponse: undefined }],
      resourceType: 'xhr',
    })).toBe(false)

    expect(shouldLogRequest({
      matchingRoutes: [{ log: true, staticResponse: undefined }],
      resourceType: 'image',
    })).toBe(true)
  })

  it('prefers the route-level log option over staticResponse.log', () => {
    expect(shouldLogRequest({
      matchingRoutes: [{ log: false, staticResponse: { log: true } }],
      resourceType: 'xhr',
    })).toBe(false)
  })

  it('logs xhr and fetch when no intercept routes match', () => {
    expect(shouldLogRequest({ resourceType: 'xhr' })).toBe(true)
    expect(shouldLogRequest({ resourceType: 'fetch' })).toBe(true)
    expect(shouldLogRequest({ resourceType: 'image' })).toBe(false)
  })
})
