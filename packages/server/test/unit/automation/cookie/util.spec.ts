import { describe, it, expect } from 'vitest'
import type { CyCookie } from '../../../../lib/automation/cookie/util'
import { cookieMatches, isHostOnlyCookie } from '../../../../lib/automation/cookie/util'

describe('lib/automation/cookie/util', () => {
  describe('.cookieMatches', () => {
    it('matches same apex domain', () => {
      const cookie = { domain: 'example.com' } as CyCookie
      const filter = { domain: 'example.com' }

      expect(cookieMatches(cookie, filter)).toBe(true)
    })

    it('matches leading period on apex domain', () => {
      const cookie = { domain: 'example.com' } as CyCookie
      const filter = { domain: '.example.com' }

      expect(cookieMatches(cookie, filter)).toBe(true)
    })

    it('matches same domain', () => {
      const cookie = { domain: 'www.example.com' } as CyCookie
      const filter = { domain: 'www.example.com' }

      expect(cookieMatches(cookie, filter)).toBe(true)
    })

    it('matches leading period on domain', () => {
      const cookie = { domain: 'www.example.com' } as CyCookie
      const filter = { domain: '.www.example.com' }

      expect(cookieMatches(cookie, filter)).toBe(true)
    })

    it('matches apex domain and domain', () => {
      const cookie = { domain: 'example.com' } as CyCookie
      const filter = { domain: 'www.example.com' }

      expect(cookieMatches(cookie, filter)).toBe(true)
    })

    it('does not match domain and apex domain', () => {
      const cookie = { domain: 'www.example.com' } as CyCookie
      const filter = { domain: 'example.com' }

      expect(cookieMatches(cookie, filter)).toBe(false)
    })

    it('strict matches exact domain with strictDomain=true', () => {
      const cookie = { domain: 'www.example.com' } as CyCookie
      const filter = { domain: 'www.example.com' }

      expect(cookieMatches(cookie, filter, { strictDomain: true })).toBe(true)
    })

    it('fails apex domain match with strictDomain=true', () => {
      const cookie = { domain: 'example.com' } as CyCookie
      const filter = { domain: 'www.example.com' }

      expect(cookieMatches(cookie, filter, { strictDomain: true })).toBe(false)
    })
  })

  describe('.isHostOnlyCookie', () => {
    it('is false for a dot-prefixed (domain) cookie', () => {
      expect(isHostOnlyCookie({ domain: '.foo.com' })).toBe(false)
    })

    it('is true for a registrable domain', () => {
      expect(isHostOnlyCookie({ domain: 'foo.com' })).toBe(true)
      expect(isHostOnlyCookie({ domain: 'www.foo.com' })).toBe(true)
    })

    it('is falsy for localhost', () => {
      expect(isHostOnlyCookie({ domain: 'localhost' })).toBeFalsy()
    })

    it('is falsy for an IP address', () => {
      expect(isHostOnlyCookie({ domain: '127.0.0.1' })).toBeFalsy()
    })
  })
})
