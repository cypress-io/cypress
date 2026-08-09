const { expect } = require('../../../spec_helper')

import { CookieJar } from '../../../../lib/automation/cookie/jar'

context('lib/automation/cookie/jar', () => {
  context('.removeCookie', () => {
    let cookieJar: CookieJar

    beforeEach(() => {
      cookieJar = new CookieJar()
    })

    it('removes the cookie at the given path', () => {
      cookieJar.setCookie('foo=bar', 'http://example.com/api/sign-in', undefined)
      cookieJar.setCookie('foo=baz', 'http://example.com/', undefined)

      cookieJar.removeCookie({ name: 'foo', domain: 'example.com', path: '/api' })

      expect(cookieJar.getAllCookies().map((cookie) => cookie.path)).to.deep.eq(['/'])
    })

    it('removes the cookie at every path when no path is given', () => {
      cookieJar.setCookie('foo=bar', 'http://example.com/api/sign-in', undefined)
      cookieJar.setCookie('foo=baz', 'http://example.com/', undefined)

      cookieJar.removeCookie({ name: 'foo', domain: 'example.com' })

      expect(cookieJar.getAllCookies()).to.be.empty
    })

    it('only removes cookies matching the name and domain when no path is given', () => {
      cookieJar.setCookie('foo=bar', 'http://example.com/api/sign-in', undefined)
      cookieJar.setCookie('qux=quux', 'http://example.com/api/sign-in', undefined)
      cookieJar.setCookie('foo=bar', 'http://other.com/api/sign-in', undefined)

      cookieJar.removeCookie({ name: 'foo', domain: 'example.com' })

      expect(cookieJar.getAllCookies().map((cookie) => `${cookie.domain}${cookie.path}:${cookie.key}`)).to.deep.eq([
        'example.com/api:qux',
        'other.com/api:foo',
      ])
    })
  })
})
