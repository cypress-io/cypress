import { describe, it, expect } from 'vitest'
import { URL } from 'url'

import { addDefaultPort, getPath, isLocalhost, origin, removeDefaultPort, stripProtocolAndDefaultPorts } from '../../lib'

describe('lib/uri', () => {
  describe('.getPath', () => {
    it('returns the pathname and search', () => {
      expect(getPath('http://localhost:9999/foo/bar?baz=quux#/index.html')).toEqual('/foo/bar?baz=quux')
    })

    it('supports encoded characters', () => {
      expect(getPath('http://localhost:9999?foo=0%3C1')).toEqual('/?foo=0%3C1')
    })

    it('does not encode the "|" character', () => {
      expect(getPath('http://localhost:9999?foo=bar|baz')).toEqual('/?foo=bar|baz')
    })

    it('works with relative urls', () => {
      expect(getPath('/foo/bar?foo=bar|baz')).toEqual('/foo/bar?foo=bar|baz')
    })
  })

  describe('.stripProtocolAndDefaultPorts', () => {
    it('strips the protocol', () => {
      expect(stripProtocolAndDefaultPorts('http://example.com/foo/bar')).toEqual('example.com')
      expect(stripProtocolAndDefaultPorts('https://example.com/foo/bar')).toEqual('example.com')
    })

    it('strips the default port for the protocol', () => {
      expect(stripProtocolAndDefaultPorts('http://example.com:80/foo')).toEqual('example.com')
      expect(stripProtocolAndDefaultPorts('https://example.com:443/foo')).toEqual('example.com')
    })

    it('keeps a non-default port', () => {
      expect(stripProtocolAndDefaultPorts('http://example.com:8080/foo')).toEqual('example.com:8080')
      expect(stripProtocolAndDefaultPorts('https://example.com:1234/foo')).toEqual('example.com:1234')
    })

    it('strips a default port regardless of the protocol', () => {
      // 443 is not the default for http, but is still stripped to preserve
      // existing block-host matching behavior
      expect(stripProtocolAndDefaultPorts('http://example.com:443/foo')).toEqual('example.com')
      expect(stripProtocolAndDefaultPorts('https://example.com:80/foo')).toEqual('example.com')
    })

    it('strips the scheme/path from invalid/unparseable urls (legacy-compatible fragment)', () => {
      // out-of-range port is invalid per the WHATWG URL parser; fall back to a
      // bare host[:port] fragment (no scheme) so block-host matching still works
      expect(stripProtocolAndDefaultPorts('http://localhost:66667/foo')).toEqual('localhost:66667')
    })
  })

  describe('.removeDefaultPort', () => {
    it('removes the default port for the protocol', () => {
      expect(removeDefaultPort('http://example.com:80/foo')).toEqual('http://example.com/foo')
      expect(removeDefaultPort('https://example.com:443/foo')).toEqual('https://example.com/foo')
    })

    it('keeps a non-default port', () => {
      expect(removeDefaultPort('http://example.com:8080/foo')).toEqual('http://example.com:8080/foo')
    })

    it('does not encode the "|" character', () => {
      expect(removeDefaultPort('http://example.com:80/?foo=bar|baz')).toEqual('http://example.com/?foo=bar|baz')
    })

    it('returns relative urls unchanged', () => {
      expect(removeDefaultPort('/foo/bar?baz=quux')).toEqual('/foo/bar?baz=quux')
    })
  })

  describe('.addDefaultPort', () => {
    it('adds the default port for the protocol', () => {
      expect(addDefaultPort('http://example.com/foo')).toEqual('http://example.com:80/foo')
      expect(addDefaultPort('https://example.com/foo')).toEqual('https://example.com:443/foo')
    })

    it('keeps an existing non-default port', () => {
      expect(addDefaultPort('http://example.com:8080/foo')).toEqual('http://example.com:8080/foo')
    })

    it('does not add a port for protocols without a known default', () => {
      expect(addDefaultPort('ftp://example.com/foo')).toEqual('ftp://example.com/foo')
    })

    it('preserves IPv6 host brackets', () => {
      expect(addDefaultPort('http://[::1]/foo')).toEqual('http://[::1]:80/foo')
      expect(addDefaultPort('http://[::1]:4444/foo')).toEqual('http://[::1]:4444/foo')
    })

    it('returns relative urls unchanged', () => {
      expect(addDefaultPort('/foo/bar?baz=quux')).toEqual('/foo/bar?baz=quux')
    })
  })

  describe('.isLocalhost', () => {
    it('http://localhost is localhost', () => {
      expect(isLocalhost(new URL('http://localhost'))).toBe(true)
    })

    it('https://localhost is localhost', () => {
      expect(isLocalhost(new URL('https://localhost'))).toBe(true)
    })

    it('http://127.0.0.1 is localhost', () => {
      expect(isLocalhost(new URL('http://127.0.0.1'))).toBe(true)
    })

    it('http://127.0.0.9 is localhost', () => {
      expect(isLocalhost(new URL('http://127.0.0.9'))).toBe(true)
    })

    it('http://[::1] is localhost', () => {
      expect(isLocalhost(new URL('http://[::1]'))).toBe(true)
    })

    it('http://128.0.0.1 is NOT localhost', () => {
      expect(isLocalhost(new URL('http://128.0.0.1'))).toBe(false)
    })

    it('http:foobar.com is NOT localhost', () => {
      expect(isLocalhost(new URL('http:foobar.com'))).toBe(false)
    })

    it('https:foobar.com is NOT localhost', () => {
      expect(isLocalhost(new URL('https:foobar.com'))).toBe(false)
    })
  })

  describe('.origin', () => {
    it('strips everything but the remote origin', () => {
      expect(
        origin('http://localhost:9999/foo/bar?baz=quux#/index.html'),
      ).toEqual('http://localhost:9999')

      expect(
        origin('https://www.google.com/'),
      ).toEqual('https://www.google.com')

      expect(
        origin('https://app.foobar.co.uk:1234/a=b'),
      ).toEqual('https://app.foobar.co.uk:1234')
    })

    it('strips an explicit default port (WHATWG URL.origin behavior)', () => {
      // NOTE: the legacy url.format path preserved an explicit ':80'/':443'; the
      // WHATWG URL.origin strips it, matching what the browser reports as
      // location.origin. This pins that contract for the published
      // RemoteState.origin type.
      expect(origin('http://example.com:80/foo')).toEqual('http://example.com')
      expect(origin('https://example.com:443/foo')).toEqual('https://example.com')
    })

    it('strips userinfo (WHATWG URL.origin behavior)', () => {
      // the legacy url.format path preserved userinfo; the WHATWG URL.origin
      // omits it, which is the standards-compliant origin
      expect(origin('http://user:pass@example.com/foo')).toEqual('http://example.com')
    })

    it('reduces invalid/unparseable urls to scheme + authority instead of throwing', () => {
      // out-of-range port is invalid per the WHATWG URL parser; the fallback
      // still strips path/query/hash like the successful URL.origin path does
      expect(origin('https://example.com:99999/foo?bar#baz')).toEqual('https://example.com:99999')
    })
  })
})
