import { describe, it, expect } from 'vitest'
import type playwright from 'playwright-webkit'
import { convertPlaywrightCookieToCyCookie, convertCyCookieToPlaywrightCookie } from '../../../../../lib/automation/cookie/converters/webkit'
import type { CyCookie } from '../../../../../lib/automation/cookie/util'

const playwrightCookie = (props: Partial<playwright.Cookie> = {}): playwright.Cookie => {
  return {
    name: 'foo',
    value: 'f',
    domain: 'foo.com',
    path: '/',
    expires: 123,
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
    ...props,
  }
}

const cyCookie = (props: Partial<CyCookie> = {}): CyCookie => {
  return {
    name: 'foo',
    value: 'f',
    domain: 'foo.com',
    path: '/',
    secure: false,
    httpOnly: false,
    hostOnly: false,
    expirationDate: 123,
    ...props,
  }
}

describe('lib/automation/cookie/converters/webkit', () => {
  describe('.convertPlaywrightCookieToCyCookie', () => {
    it('maps the playwright cookie shape to a CyCookie', () => {
      const cookie = convertPlaywrightCookieToCyCookie(playwrightCookie({ expires: 456 }))

      expect(cookie).toStrictEqual({
        name: 'foo',
        value: 'f',
        domain: 'foo.com',
        path: '/',
        secure: false,
        httpOnly: false,
        hostOnly: false,
        expirationDate: 456,
        sameSite: 'lax',
      })
    })

    it('omits expirationDate for the -1 session sentinel', () => {
      const cookie = convertPlaywrightCookieToCyCookie(playwrightCookie({ expires: -1 }))

      expect(cookie).not.toHaveProperty('expirationDate')
    })

    it('converts playwright sameSite to the extension vocabulary', () => {
      expect(convertPlaywrightCookieToCyCookie(playwrightCookie({ sameSite: 'None' })).sameSite).toBe('no_restriction')
      expect(convertPlaywrightCookieToCyCookie(playwrightCookie({ sameSite: 'Lax' })).sameSite).toBe('lax')
      expect(convertPlaywrightCookieToCyCookie(playwrightCookie({ sameSite: 'Strict' })).sameSite).toBe('strict')
      expect(convertPlaywrightCookieToCyCookie(playwrightCookie({ sameSite: undefined })).sameSite).toBeUndefined()
    })

    it('does not mutate the input cookie', () => {
      const input = playwrightCookie({ sameSite: 'None' })

      const result = convertPlaywrightCookieToCyCookie(input)

      expect(result).not.toBe(input)
      expect(input).toStrictEqual(playwrightCookie({ sameSite: 'None' }))
    })
  })

  describe('.convertCyCookieToPlaywrightCookie', () => {
    it('maps the CyCookie shape to a playwright cookie', () => {
      const cookie = convertCyCookieToPlaywrightCookie(cyCookie({ sameSite: 'lax' }))

      expect(cookie).toStrictEqual({
        name: 'foo',
        value: 'f',
        domain: 'foo.com',
        path: '/',
        secure: false,
        httpOnly: false,
        expires: 123,
        sameSite: 'Lax',
      })
    })

    it('converts extension sameSite to the playwright vocabulary', () => {
      expect(convertCyCookieToPlaywrightCookie(cyCookie({ sameSite: 'no_restriction' })).sameSite).toBe('None')
      expect(convertCyCookieToPlaywrightCookie(cyCookie({ sameSite: 'lax' })).sameSite).toBe('Lax')
      expect(convertCyCookieToPlaywrightCookie(cyCookie({ sameSite: 'strict' })).sameSite).toBe('Strict')
      expect(convertCyCookieToPlaywrightCookie(cyCookie({ sameSite: undefined })).sameSite).toBeUndefined()
    })

    it('does not mutate the input cookie', () => {
      const input = cyCookie({ sameSite: 'strict' })

      convertCyCookieToPlaywrightCookie(input)

      expect(input).toStrictEqual(cyCookie({ sameSite: 'strict' }))
    })
  })
})
