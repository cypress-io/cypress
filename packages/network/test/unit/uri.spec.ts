import { describe, it, expect } from 'vitest'
import { URL } from 'url'

import { uri } from '../../lib'

describe('lib/uri', () => {
  describe('.getPath', () => {
    it('returns the pathname and search', () => {
      expect(uri.getPath('http://localhost:9999/foo/bar?baz=quux#/index.html')).toEqual('/foo/bar?baz=quux')
    })

    it('supports encoded characters', () => {
      expect(uri.getPath('http://localhost:9999?foo=0%3C1')).toEqual('/?foo=0%3C1')
    })

    it('does not encode the "|" character', () => {
      expect(uri.getPath('http://localhost:9999?foo=bar|baz')).toEqual('/?foo=bar|baz')
    })

    it('works with relative urls', () => {
      expect(uri.getPath('/foo/bar?foo=bar|baz')).toEqual('/foo/bar?foo=bar|baz')
    })
  })

  describe('.isLocalhost', () => {
    it('http://localhost is localhost', () => {
      expect(uri.isLocalhost(new URL('http://localhost'))).toBe(true)
    })

    it('https://localhost is localhost', () => {
      expect(uri.isLocalhost(new URL('https://localhost'))).toBe(true)
    })

    it('http://127.0.0.1 is localhost', () => {
      expect(uri.isLocalhost(new URL('http://127.0.0.1'))).toBe(true)
    })

    it('http://127.0.0.9 is localhost', () => {
      expect(uri.isLocalhost(new URL('http://127.0.0.9'))).toBe(true)
    })

    it('http://[::1] is localhost', () => {
      expect(uri.isLocalhost(new URL('http://[::1]'))).toBe(true)
    })

    it('http://128.0.0.1 is NOT localhost', () => {
      expect(uri.isLocalhost(new URL('http://128.0.0.1'))).toBe(false)
    })

    it('http:foobar.com is NOT localhost', () => {
      expect(uri.isLocalhost(new URL('http:foobar.com'))).toBe(false)
    })

    it('https:foobar.com is NOT localhost', () => {
      expect(uri.isLocalhost(new URL('https:foobar.com'))).toBe(false)
    })
  })

  describe('.origin', () => {
    it('strips everything but the remote origin', () => {
      expect(
        uri.origin('http://localhost:9999/foo/bar?baz=quux#/index.html'),
      ).toEqual('http://localhost:9999')

      expect(
        uri.origin('https://www.google.com/'),
      ).toEqual('https://www.google.com')

      expect(
        uri.origin('https://app.foobar.co.uk:1234/a=b'),
      ).toEqual('https://app.foobar.co.uk:1234')
    })
  })
})
