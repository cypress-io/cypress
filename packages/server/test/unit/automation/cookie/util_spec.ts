const { expect } = require('../../../spec_helper')

import { cookieMatches, isHostOnlyCookie, CyCookie } from '../../../../lib/automation/cookie/util'

context('lib/automation/cookie/util', () => {
  context('.cookieMatches', () => {
    it('matches same apex domain', () => {
      const cookie = { domain: 'example.com' } as CyCookie
      const filter = { domain: 'example.com' }

      expect(cookieMatches(cookie, filter)).to.be.true
    })

    it('matches leading period on apex domain', () => {
      const cookie = { domain: 'example.com' } as CyCookie
      const filter = { domain: '.example.com' }

      expect(cookieMatches(cookie, filter)).to.be.true
    })

    it('matches same domain', () => {
      const cookie = { domain: 'www.example.com' } as CyCookie
      const filter = { domain: 'www.example.com' }

      expect(cookieMatches(cookie, filter)).to.be.true
    })

    it('matches leading period on domain', () => {
      const cookie = { domain: 'www.example.com' } as CyCookie
      const filter = { domain: '.www.example.com' }

      expect(cookieMatches(cookie, filter)).to.be.true
    })

    it('matches apex domain and domain', () => {
      const cookie = { domain: 'example.com' } as CyCookie
      const filter = { domain: 'www.example.com' }

      expect(cookieMatches(cookie, filter)).to.be.true
    })

    it('does not match domain and apex domain', () => {
      const cookie = { domain: 'www.example.com' } as CyCookie
      const filter = { domain: 'example.com' }

      expect(cookieMatches(cookie, filter)).to.be.false
    })

    it('strict matches exact domain with strictDomain=true', () => {
      const cookie = { domain: 'www.example.com' } as CyCookie
      const filter = { domain: 'www.example.com' }

      expect(cookieMatches(cookie, filter, { strictDomain: true })).to.be.true
    })

    it('fails apex domain match with strictDomain=true', () => {
      const cookie = { domain: 'example.com' } as CyCookie
      const filter = { domain: 'www.example.com' }

      expect(cookieMatches(cookie, filter, { strictDomain: true })).to.be.false
    })
  })

  context('.isHostOnlyCookie', () => {
    it('is false for a dot-prefixed (domain) cookie', () => {
      expect(isHostOnlyCookie({ domain: '.foo.com' })).to.be.false
    })

    it('is true for a registrable domain', () => {
      expect(isHostOnlyCookie({ domain: 'foo.com' })).to.be.true
      expect(isHostOnlyCookie({ domain: 'www.foo.com' })).to.be.true
    })

    it('is falsy for localhost', () => {
      expect(isHostOnlyCookie({ domain: 'localhost' })).to.not.be.ok
    })

    it('is falsy for an IP address', () => {
      expect(isHostOnlyCookie({ domain: '127.0.0.1' })).to.not.be.ok
    })
  })
})
