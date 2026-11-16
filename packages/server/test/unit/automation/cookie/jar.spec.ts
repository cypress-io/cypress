import { beforeEach, describe, expect, it } from 'vitest'
import { CookieJar } from '../../../../lib/automation/cookie/jar'

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

    it('removes the cookie at every path when none is given', () => {
      jar.removeCookie({ name: 'foo', domain: 'www.foobar.com' })

      expect(stored()).toEqual(['bar www.foobar.com /fixtures', 'foo app.foobar.com /fixtures'])
    })
  })
})
