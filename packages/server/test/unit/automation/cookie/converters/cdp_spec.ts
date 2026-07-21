const { expect } = require('../../../../spec_helper')

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

context('lib/automation/cookie/converters/cdp', () => {
  context('.convertCdpCookiesToCyCookies', () => {
    it('renames expires to expirationDate', () => {
      const [cookie] = convertCdpCookiesToCyCookies([cdpCookie({ domain: 'localhost', expires: 456 })])

      expect(cookie.expirationDate).to.eq(456)
      expect(cookie).to.not.have.property('expires')
    })

    it('drops the -1 session sentinel entirely', () => {
      const [cookie] = convertCdpCookiesToCyCookies([cdpCookie({ domain: 'localhost', expires: -1 })])

      expect(cookie.expirationDate).to.be.undefined
      expect(cookie).to.not.have.property('expires')
    })

    it('stamps hostOnly on host-only-capable domains only', () => {
      const [hostOnly, domainCookie, localhost] = convertCdpCookiesToCyCookies([
        cdpCookie({ domain: 'foo.com' }),
        cdpCookie({ domain: '.foo.com' }),
        cdpCookie({ domain: 'localhost' }),
      ])

      expect(hostOnly.hostOnly).to.be.true
      expect(domainCookie).to.not.have.property('hostOnly')
      expect(localhost).to.not.have.property('hostOnly')
    })

    it('converts CDP sameSite to the extension vocabulary', () => {
      const [none, lax, strict, unset] = convertCdpCookiesToCyCookies([
        cdpCookie({ domain: 'localhost', sameSite: 'None' }),
        cdpCookie({ domain: 'localhost', sameSite: 'Lax' }),
        cdpCookie({ domain: 'localhost', sameSite: 'Strict' }),
        cdpCookie({ domain: 'localhost' }),
      ])

      expect(none.sameSite).to.eq('no_restriction')
      expect(lax.sameSite).to.eq('lax')
      expect(strict.sameSite).to.eq('strict')
      expect(unset.sameSite).to.be.undefined
    })

    it('does not mutate the input cookies and drops CDP-only fields', () => {
      const input = cdpCookie({ domain: 'foo.com', expires: -1, sameSite: 'None' })

      const [result] = convertCdpCookiesToCyCookies([input])

      expect(result).to.not.eq(input)
      expect(input).to.deep.eq(cdpCookie({ domain: 'foo.com', expires: -1, sameSite: 'None' }))
      expect(result).to.not.have.property('size')
      expect(result).to.not.have.property('session')
    })
  })

  context('.convertCyCookieToCdpCookie', () => {
    it('maps expirationDate to expires and strips undefined params', () => {
      const request = convertCyCookieToCdpCookie(cyCookie({ domain: 'localhost', expirationDate: 123 }))

      expect(request).to.deep.eq({
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

      expect(request.name).to.eq('')
      expect(request.value).to.eq('')
    })

    it('converts extension sameSite to the CDP vocabulary', () => {
      expect(convertCyCookieToCdpCookie(cyCookie({ domain: 'localhost', sameSite: 'no_restriction' })).sameSite).to.eq('None')
      expect(convertCyCookieToCdpCookie(cyCookie({ domain: 'localhost', sameSite: 'lax' })).sameSite).to.eq('Lax')
      expect(convertCyCookieToCdpCookie(cyCookie({ domain: 'localhost', sameSite: 'strict' })).sameSite).to.eq('Strict')
    })

    it('dot-prefixes a non-hostOnly registrable domain so subdomains receive the cookie', () => {
      const request = convertCyCookieToCdpCookie(cyCookie({ domain: 'foo.com', hostOnly: false }))

      expect(request.domain).to.eq('.foo.com')
    })

    it('preserves the domain verbatim for a hostOnly cookie', () => {
      const request = convertCyCookieToCdpCookie(cyCookie({ domain: 'foo.com', hostOnly: true }))

      expect(request.domain).to.eq('foo.com')
    })

    it('swaps domain for url on __Host- prefixed cookies', () => {
      const request = convertCyCookieToCdpCookie(cyCookie({ name: '__Host-session', domain: 'foo.com', secure: true }))

      expect(request.url).to.eq('https://foo.com')
      expect(request).to.not.have.property('domain')
    })

    it('does not mutate the input cookie', () => {
      const cookie = cyCookie({ domain: 'localhost', hostOnly: true })

      convertCyCookieToCdpCookie(cookie)

      expect(cookie).to.deep.eq(cyCookie({ domain: 'localhost', hostOnly: true }))
    })
  })
})
