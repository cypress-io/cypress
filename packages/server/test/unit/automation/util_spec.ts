const { expect } = require('../../spec_helper')

import { cookieMatches, CyCookie } from '../../../lib/automation/util'

context('lib/automation/util', () => {
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
  })
})
