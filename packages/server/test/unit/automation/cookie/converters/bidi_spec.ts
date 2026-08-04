const { expect } = require('../../../../spec_helper')

import type { NetworkCookie } from 'webdriver/build/bidi/localTypes'
import {
  convertBiDiCookieToCyCookie,
  convertCyCookieToBiDiCookie,
  convertSameSiteExtensionToBiDi,
} from '../../../../../lib/automation/cookie/converters/bidi'
import type { BidiCyCookie } from '../../../../../lib/automation/cookie/converters/bidi'

const bidiCookie = (props: Partial<NetworkCookie> = {}): NetworkCookie => {
  return {
    name: 'foo',
    value: {
      type: 'string',
      value: 'f',
    },
    domain: 'foo.com',
    path: '/',
    size: 4,
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
    expiry: 123,
    ...props,
  }
}

const cyCookie = (props: Partial<BidiCyCookie> = {}): BidiCyCookie => {
  return {
    name: 'foo',
    value: 'f',
    domain: 'foo.com',
    path: '/',
    secure: false,
    httpOnly: false,
    hostOnly: false,
    expirationDate: 123,
    sameSite: 'lax',
    ...props,
  }
}

context('lib/automation/cookie/converters/bidi', () => {
  context('.convertSameSiteExtensionToBiDi', () => {
    it('maps no_restriction to none and passes lax/strict through', () => {
      expect(convertSameSiteExtensionToBiDi('no_restriction')).to.eq('none')
      expect(convertSameSiteExtensionToBiDi('lax')).to.eq('lax')
      expect(convertSameSiteExtensionToBiDi('strict')).to.eq('strict')
    })

    it('maps unspecified and undefined to default', () => {
      expect(convertSameSiteExtensionToBiDi('unspecified')).to.eq('default')
      expect(convertSameSiteExtensionToBiDi(undefined as any)).to.eq('default')
    })
  })

  context('.convertBiDiCookieToCyCookie', () => {
    it('maps the BiDi cookie shape to a CyCookie', () => {
      const cookie = convertBiDiCookieToCyCookie(bidiCookie({ sameSite: 'none', expiry: 456 }))

      expect(cookie).to.deep.eq({
        name: 'foo',
        value: 'f',
        domain: 'foo.com',
        path: '/',
        httpOnly: false,
        hostOnly: true,
        expirationDate: 456,
        secure: false,
        sameSite: 'no_restriction',
      })
    })

    it('converts the BiDi default sameSite to unspecified', () => {
      expect(convertBiDiCookieToCyCookie(bidiCookie({ sameSite: 'default' })).sameSite).to.eq('unspecified')
    })

    it('stamps hostOnly false for dot-prefixed and non-registrable domains', () => {
      expect(convertBiDiCookieToCyCookie(bidiCookie({ domain: '.foo.com' })).hostOnly).to.be.false
      expect(convertBiDiCookieToCyCookie(bidiCookie({ domain: 'localhost' })).hostOnly).to.be.false
    })

    it('converts a missing expiry to undefined expirationDate', () => {
      expect(convertBiDiCookieToCyCookie(bidiCookie({ expiry: undefined })).expirationDate).to.be.undefined
    })

    it('does not mutate the input cookie', () => {
      const input = bidiCookie({ sameSite: 'default' })

      const result = convertBiDiCookieToCyCookie(input)

      expect(result).to.not.eq(input)
      expect(input).to.deep.eq(bidiCookie({ sameSite: 'default' }))
    })
  })

  context('.convertCyCookieToBiDiCookie', () => {
    it('maps the CyCookie shape to a BiDi partial cookie', () => {
      const cookie = convertCyCookieToBiDiCookie(cyCookie({ domain: 'localhost', sameSite: 'no_restriction' }))

      expect(cookie).to.deep.eq({
        name: 'foo',
        value: {
          type: 'string',
          value: 'f',
        },
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'none',
        expiry: 123,
      })
    })

    it('truncates a float expirationDate to an integer expiry', () => {
      expect(convertCyCookieToBiDiCookie(cyCookie({ expirationDate: 123.789 })).expiry).to.eq(123)
    })

    it('converts a -Infinity expirationDate to 0 and a missing one to undefined', () => {
      expect(convertCyCookieToBiDiCookie(cyCookie({ expirationDate: -Infinity })).expiry).to.eq(0)
      expect(convertCyCookieToBiDiCookie(cyCookie({ expirationDate: undefined })).expiry).to.be.undefined
    })

    it('dot-prefixes a non-hostOnly registrable domain so subdomains receive the cookie', () => {
      expect(convertCyCookieToBiDiCookie(cyCookie({ domain: 'foo.com', hostOnly: false })).domain).to.eq('.foo.com')
      expect(convertCyCookieToBiDiCookie(cyCookie({ domain: 'foo.com', hostOnly: true })).domain).to.eq('foo.com')
    })

    it('sets hostOnly false when the domain cannot be host-only', () => {
      expect(convertCyCookieToBiDiCookie(cyCookie({ domain: 'localhost', hostOnly: true })).hostOnly).to.be.false
    })

    it('does not mutate the input cookie', () => {
      const input = cyCookie({ domain: 'foo.com', hostOnly: false })

      convertCyCookieToBiDiCookie(input)

      expect(input).to.deep.eq(cyCookie({ domain: 'foo.com', hostOnly: false }))
    })
  })
})
