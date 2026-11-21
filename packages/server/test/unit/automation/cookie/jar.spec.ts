import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CookieJar, automationCookieToToughCookie, toughCookieToAutomationCookie } from '../../../../lib/automation/cookie/jar'

describe('lib/automation/cookie/jar', () => {
  let jar: CookieJar

  const stored = () => jar.getAllCookies().map(({ key, domain, path }) => `${key} ${domain} ${path}`).sort()

  beforeEach(() => {
    jar = new CookieJar()
    jar.setCookie('foo=1; Path=/', 'https://www.foobar.com/fixtures/page.html', undefined)
    jar.setCookie('foo=2; Path=/fixtures', 'https://www.foobar.com/fixtures/page.html', undefined)
    jar.setCookie('bar=3; Path=/fixtures', 'https://www.foobar.com/fixtures/page.html', undefined)
    jar.setCookie('foo=4; Path=/fixtures', 'https://app.foobar.com/fixtures/page.html', undefined)
  })

  describe('removeCookie', () => {
    it('removes the cookie at the given path only', () => {
      jar.removeCookie({ name: 'foo', domain: 'www.foobar.com', path: '/fixtures' })

      expect(stored()).toEqual(['bar www.foobar.com /fixtures', 'foo app.foobar.com /fixtures', 'foo www.foobar.com /'])
    })

    it('removes a cookie for an IPv6 host given with its brackets', () => {
      jar.removeAllCookies()
      jar.setCookie('foo=1; Path=/', 'http://[::1]:3500/', undefined)

      jar.removeCookie({ name: 'foo', domain: '[::1]' })

      expect(stored()).toEqual([])
    })

    it('removes the cookie at every path when none is given', () => {
      jar.removeCookie({ name: 'foo', domain: 'www.foobar.com' })

      expect(stored()).toEqual(['bar www.foobar.com /fixtures', 'foo app.foobar.com /fixtures'])
    })
  })

  describe('automationCookieToToughCookie', () => {
    const url = 'https://www.foobar.com/fixtures/page.html'

    // the trip a cookie makes from the server-side jar to a page's document.cookie
    const roundTrip = (setCookie: string) => {
      const source = new CookieJar()

      source.setCookie(setCookie, url, undefined)

      return automationCookieToToughCookie(toughCookieToAutomationCookie(source.getAllCookies()[0], 'www.foobar.com'), 'www.foobar.com')
    }

    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-11-20T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('keeps the expiry of a cookie set with Expires', () => {
      const cookie = roundTrip('sid=tok_d41c9b07aa; HttpOnly; Expires=Fri, 20 Nov 2026 12:01:00 GMT')

      expect(cookie.expiryTime()).toEqual(Date.parse('2026-11-20T12:01:00Z'))
    })

    it('counts Max-Age from when the cookie was set', () => {
      const source = new CookieJar()

      source.setCookie('sid=tok_d41c9b07aa; HttpOnly; Max-Age=60', url, undefined)
      vi.setSystemTime(new Date('2026-11-20T12:00:50Z'))

      const cookie = automationCookieToToughCookie(toughCookieToAutomationCookie(source.getAllCookies()[0], 'www.foobar.com'), 'www.foobar.com')

      expect(cookie.expiryTime()).toEqual(Date.parse('2026-11-20T12:01:00Z'))
    })

    it('never expires a session cookie', () => {
      expect(roundTrip('sid=tok_d41c9b07aa; HttpOnly').expiryTime()).toEqual(Infinity)
    })

    it('expires a cookie set with Max-Age=0', () => {
      expect(roundTrip('sid=; Max-Age=0').expiryTime()).toBeLessThan(Date.now())
    })
  })
})
