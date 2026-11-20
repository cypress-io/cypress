import { describe, it, expect } from 'vitest'
import { isRedirectStatus } from '../../lib/core/redirect-status'

describe('core/redirect-status', () => {
  it.each([301, 302, 303, 307, 308])('treats %i as a redirect', (statusCode) => {
    expect(isRedirectStatus(statusCode)).toBe(true)
  })

  // 300 and 305 are 3xx, but browsers don't follow their Location; 304 has none.
  it.each([200, 300, 304, 305, 400, undefined])('does not treat %s as a redirect', (statusCode) => {
    expect(isRedirectStatus(statusCode)).toBe(false)
  })
})
