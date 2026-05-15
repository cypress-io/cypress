import { describe, it, expect } from 'vitest'
import { parseDomain } from '../../lib/parse-domain'

describe('lib/parse-domain', () => {
  describe('.parseDomain', () => {
    it('returns null for empty input', () => {
      expect(parseDomain('')).toBeNull()
    })

    it('returns null for whitespace-only input', () => {
      expect(parseDomain('   ')).toBeNull()
    })

    it('strips a leading dot (cookie-style domain attribute)', () => {
      expect(parseDomain('.www.example.com')).toEqual({
        subdomain: 'www',
        domain: 'example',
        tld: 'com',
      })
    })

    it('trims surrounding whitespace before parsing', () => {
      expect(parseDomain('  www.example.com  ')).toEqual({
        subdomain: 'www',
        domain: 'example',
        tld: 'com',
      })
    })

    it('returns null for bare localhost (caller segment fallback)', () => {
      expect(parseDomain('localhost')).toBeNull()
    })

    it('parses app.localhost as a single registrable label before localhost', () => {
      expect(parseDomain('app.localhost')).toEqual({
        subdomain: '',
        domain: 'app',
        tld: 'localhost',
      })
    })

    it('parses deeper *.localhost with subdomain labels before the registrable host', () => {
      expect(parseDomain('name.app.localhost')).toEqual({
        subdomain: 'name',
        domain: 'app',
        tld: 'localhost',
      })
    })

    it('parses IPv4 addresses into empty domain and full host as tld', () => {
      expect(parseDomain('192.168.1.1')).toEqual({
        subdomain: '',
        domain: '',
        tld: '192.168.1.1',
      })
    })

    it('parses IPv6 loopback into empty domain and full host as tld', () => {
      expect(parseDomain('::1')).toEqual({
        subdomain: '',
        domain: '',
        tld: '::1',
      })
    })

    it('parses a documentation IPv6 address', () => {
      expect(parseDomain('2001:db8::1')).toEqual({
        subdomain: '',
        domain: '',
        tld: '2001:db8::1',
      })
    })

    it('treats herokuapp.com as the public suffix when privateTlds is true (default)', () => {
      expect(parseDomain('example.herokuapp.com')).toEqual({
        subdomain: '',
        domain: 'example',
        tld: 'herokuapp.com',
      })
    })

    it('treats herokuapp as the registrable label when privateTlds is false', () => {
      expect(parseDomain('example.herokuapp.com', { privateTlds: false })).toEqual({
        subdomain: 'example',
        domain: 'herokuapp',
        tld: 'com',
      })
    })

    it('parses a normal ICANN hostname with subdomain', () => {
      expect(parseDomain('www.example.co.uk')).toEqual({
        subdomain: 'www',
        domain: 'example',
        tld: 'co.uk',
      })
    })

    it('accepts customTlds in options without throwing (compat; not applied as RegExp)', () => {
      expect(parseDomain('www.example.com', {
        customTlds: /\.local$/,
      })).toEqual({
        subdomain: 'www',
        domain: 'example',
        tld: 'com',
      })
    })
  })
})
