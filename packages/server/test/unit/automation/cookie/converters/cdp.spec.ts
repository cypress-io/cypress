import { describe, it, expect } from 'vitest'
import type { Protocol } from 'devtools-protocol'
import { convertCdpCookiesToCyCookies, convertCyCookieToCdpCookie } from '../../../../../lib/automation/cookie/converters/cdp'
import type { CyCookie } from '../../../../../lib/automation/cookie/util'

const cdpCookie = (props: Partial<Protocol.Network.Cookie> = {}): Protocol.Network.Cookie => {
  return {
    name: 'foo',
    value: 'f',
    domain: 'foo.com',
    path: '/',
    expires: 123,
    size: 4,
    httpOnly: false,
    secure: false,
    session: false,
    priority: 'Medium',
    sameParty: false,
    sourceScheme: 'Secure',
    sourcePort: 443,
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

describe('lib/automation/cookie/converters/cdp', () => {
  describe('.convertCdpCookiesToCyCookies', () => {
    it('renames expires to expirationDate', () => {
      const [cookie] = convertCdpCookiesToCyCookies([cdpCookie({ domain: 'localhost', expires: 456 })])

      expect(cookie.expirationDate).toBe(456)
      expect(cookie).not.toHaveProperty('expires')
    })

    it('drops the -1 session sentinel entirely', () => {
      const [cookie] = convertCdpCookiesToCyCookies([cdpCookie({ domain: 'localhost', expires: -1 })])

      expect(cookie.expirationDate).toBeUndefined()
      expect(cookie).not.toHaveProperty('expires')
    })

    it('stamps hostOnly on host-only-capable domains only', () => {
      const [hostOnly, domainCookie, localhost] = convertCdpCookiesToCyCookies([
        cdpCookie({ domain: 'foo.com' }),
        cdpCookie({ domain: '.foo.com' }),
        cdpCookie({ domain: 'localhost' }),
      ])

      expect(hostOnly.hostOnly).toBe(true)
      expect(domainCookie).not.toHaveProperty('hostOnly')
      expect(localhost).not.toHaveProperty('hostOnly')
    })

    it('converts CDP sameSite to the extension vocabulary', () => {
      const [none, lax, strict, unset] = convertCdpCookiesToCyCookies([
        cdpCookie({ domain: 'localhost', sameSite: 'None' }),
        cdpCookie({ domain: 'localhost', sameSite: 'Lax' }),
        cdpCookie({ domain: 'localhost', sameSite: 'Strict' }),
        cdpCookie({ domain: 'localhost' }),
      ])

      expect(none.sameSite).toBe('no_restriction')
      expect(lax.sameSite).toBe('lax')
      expect(strict.sameSite).toBe('strict')
      expect(unset.sameSite).toBeUndefined()
    })

    it('does not mutate the input cookies and drops CDP-only fields', () => {
      const input = cdpCookie({ domain: 'foo.com', expires: -1, sameSite: 'None' })

      const [result] = convertCdpCookiesToCyCookies([input])

      expect(result).not.toBe(input)
      expect(input).toStrictEqual(cdpCookie({ domain: 'foo.com', expires: -1, sameSite: 'None' }))
      expect(result).not.toHaveProperty('size')
      expect(result).not.toHaveProperty('session')
    })
  })

  describe('.convertCyCookieToCdpCookie', () => {
    it('maps expirationDate to expires and strips undefined params', () => {
      const request = convertCyCookieToCdpCookie(cyCookie({ domain: 'localhost', expirationDate: 123 }))

      expect(request).toStrictEqual({
        name: 'foo',
        value: 'f',
        domain: 'localhost',
        path: '/',
        secure: false,
        httpOnly: false,
        expires: 123,
      })
    })

    it('defaults name and value to empty strings', () => {
      const request = convertCyCookieToCdpCookie(cyCookie({ domain: 'localhost', name: undefined as any, value: undefined as any }))

      expect(request.name).toBe('')
      expect(request.value).toBe('')
    })

    it('converts extension sameSite to the CDP vocabulary', () => {
      expect(convertCyCookieToCdpCookie(cyCookie({ domain: 'localhost', sameSite: 'no_restriction' })).sameSite).toBe('None')
      expect(convertCyCookieToCdpCookie(cyCookie({ domain: 'localhost', sameSite: 'lax' })).sameSite).toBe('Lax')
      expect(convertCyCookieToCdpCookie(cyCookie({ domain: 'localhost', sameSite: 'strict' })).sameSite).toBe('Strict')
    })

    it('dot-prefixes a non-hostOnly registrable domain so subdomains receive the cookie', () => {
      const request = convertCyCookieToCdpCookie(cyCookie({ domain: 'foo.com', hostOnly: false }))

      expect(request.domain).toBe('.foo.com')
    })

    it('preserves the domain verbatim for a hostOnly cookie', () => {
      const request = convertCyCookieToCdpCookie(cyCookie({ domain: 'foo.com', hostOnly: true }))

      expect(request.domain).toBe('foo.com')
    })

    it('swaps domain for url on __Host- prefixed cookies', () => {
      const request = convertCyCookieToCdpCookie(cyCookie({ name: '__Host-session', domain: 'foo.com', secure: true }))

      expect(request.url).toBe('https://foo.com')
      expect(request).not.toHaveProperty('domain')
    })

    it('does not mutate the input cookie', () => {
      const cookie = cyCookie({ domain: 'localhost', hostOnly: true })

      convertCyCookieToCdpCookie(cookie)

      expect(cookie).toStrictEqual(cyCookie({ domain: 'localhost', hostOnly: true }))
    })
  })
})
