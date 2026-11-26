import { describe, it, expect } from 'vitest'
import { hostAndPort } from '../../../lib/util/parse'

describe('lib/util/parse', () => {
  describe('#hostAndPort', () => {
    it('reads host and port from a host:port header', () => {
      expect(hostAndPort('/foo', { host: 'localhost:8080' }, 443)).toEqual({ host: 'localhost', port: 8080 })
    })

    it('falls back to the default port when the host header has none', () => {
      expect(hostAndPort('/', { host: 'example.com' }, 443)).toEqual({ host: 'example.com', port: 443 })
    })

    it('parses a host header that is a full http url', () => {
      expect(hostAndPort('/', { host: 'http://example.com:3000' }, 443)).toEqual({ host: 'example.com', port: '3000' })
    })

    it('does not treat an https host header as a url', () => {
      expect(hostAndPort('/', { host: 'https://example.com' }, 443)).toEqual({ host: 'https', port: NaN })
    })

    it('prefers the host and port of a full http request url with a path', () => {
      expect(hostAndPort('http://other.com:8000/path/to?q=1', { host: 'localhost:8080' }, 443)).toEqual({ host: 'other.com', port: '8000' })
    })

    it('prefers the host of a full http request url without a path', () => {
      expect(hostAndPort('http://other.com', { host: 'localhost:8080' }, 443)).toEqual({ host: 'other.com', port: null })
    })

    it('prefers the host of a full http request url with only a trailing slash', () => {
      expect(hostAndPort('http://other.com:9000/', { host: 'localhost:8080' }, 443)).toEqual({ host: 'other.com', port: '9000' })
    })

    it('keeps the host header for a relative request url that contains an http url', () => {
      expect(hostAndPort('/redirect?to=http://other.com/', { host: 'localhost:8080' }, 443)).toEqual({ host: 'localhost', port: 8080 })
    })

    it('keeps the host header for an https request url', () => {
      expect(hostAndPort('https://other.com/path', { host: 'localhost:8080' }, 443)).toEqual({ host: 'localhost', port: 8080 })
    })

    it('matches the http scheme case-sensitively', () => {
      expect(hostAndPort('HTTP://other.com/path', { host: 'localhost:8080' }, 443)).toEqual({ host: 'localhost', port: 8080 })
    })
  })
})
