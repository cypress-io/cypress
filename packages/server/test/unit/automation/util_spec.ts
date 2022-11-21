const { expect } = require('../../spec_helper')

import { cookieMatches, CyCookie, domainIncludesDomainsCookies } from '../../../lib/automation/util'

context('lib/automation/util', () => {
  context('.domainIncludesDomainsCookies', () => {
    ([
      ['example.com', 'example.com', true],
      ['www.example.com', 'www.example.com', true],
      ['www.example.com', 'example.com', true],
      ['sub2.sub1.example.com', 'example.com', true],
      ['www.example.co.uk', 'example.co.uk', true],
      ['sub2.sub1.example.co.uk', 'example.co.uk', true],
      ['sub2.sub1.example.co.uk', 'sub1.example.co.uk', true],
      ['localhost', 'localhost', true],
      ['127.0.0.1', '127.0.0.1', true],
      ['www.example.com', 'example.net', false],
      ['example.com', 'www.example.com', false],
      ['example.com', 'sub2.sub1.example.com', false],
    ] as [string, string, boolean][]).forEach(([domain1, domain2, shouldBe]) => {
      it(`${domain1} includes cookies for ${domain2}? ${shouldBe}`, () => {
        expect(domainIncludesDomainsCookies(domain1, domain2)).to.be[`${shouldBe}`]
      })
    })
  })

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
