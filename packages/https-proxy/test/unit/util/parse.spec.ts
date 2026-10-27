import { describe, it, expect } from 'vitest'
import { hostAndPort } from '../../../lib/util/parse'

describe('lib/util/parse', () => {
  describe('#hostAndPort', () => {
    it('reads the host and port from the host header', () => {
      expect(hostAndPort('example.com:8443', { host: 'example.com:8443' }, 443)).toEqual({
        host: 'example.com',
        port: 8443,
      })
    })

    it('falls back to the default port when the host header has none', () => {
      expect(hostAndPort('example.com', { host: 'example.com' }, 443)).toEqual({
        host: 'example.com',
        port: 443,
      })
    })

    it('prefers the host and port of a full http url over the host header', () => {
      expect(hostAndPort('http://example.com:8080/foo', { host: 'other.com:9090' }, 443)).toEqual({
        host: 'example.com',
        port: '8080',
      })
    })
  })
})
