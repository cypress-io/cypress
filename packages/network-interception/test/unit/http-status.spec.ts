import { describe, it, expect } from 'vitest'
import { isValidStatusCode, isValidStatusMessage } from '../../lib/core/http-status'

describe('isValidStatusCode', () => {
  it.each([100, 200, 503, 999])('accepts %o', (statusCode) => {
    expect(isValidStatusCode(statusCode)).toBe(true)
  })

  it.each([99, 1000, 200.5, '200', NaN, undefined, null])('rejects %o', (statusCode) => {
    expect(isValidStatusCode(statusCode)).toBe(false)
  })
})

describe('isValidStatusMessage', () => {
  it.each(['OK', '', 'Down For Maintenance', 'Tab\tSeparated'])('accepts %o', (statusMessage) => {
    expect(isValidStatusMessage(statusMessage)).toBe(true)
  })

  it.each(['Bad\r\nInjected: header', 'Bad\nLine', 'Null\u0000', 503, undefined, null])('rejects %o', (statusMessage) => {
    expect(isValidStatusMessage(statusMessage)).toBe(false)
  })
})
