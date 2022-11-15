const { expect } = require('../../spec_helper')

import { cookieMatches, CyCookie } from '../../../lib/automation/util'

context('lib/automation/util', () => {
  context('.cookieMatches', () => {
    it('matches same superdomain', () => {
      const cookie = { domain: 'example.com' } as CyCookie
      const filter = { domain: 'example.com' }

      expect(cookieMatches(cookie, filter)).to.be.true
    })

    it('matches leading period on superdomain', () => {
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

    it('does not match superdomain and domain', () => {
      const cookie = { domain: 'example.com' } as CyCookie
      const filter = { domain: 'www.example.com' }

      expect(cookieMatches(cookie, filter)).to.be.false
    })

    it('does not match domain and superdomain', () => {
      const cookie = { domain: 'www.example.com' } as CyCookie
      const filter = { domain: 'example.com' }

      expect(cookieMatches(cookie, filter)).to.be.false
    })
  })
})
