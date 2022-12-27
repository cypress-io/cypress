import { expect } from 'chai'
import { URL } from 'url'

import { uri } from '../../lib'

describe('lib/uri', () => {
  context('.isLocalhost', () => {
    it('http://localhost is localhost', () => {
      expect(uri.isLocalhost(new URL('http://localhost'))).to.be.true
    })

    it('https://localhost is localhost', () => {
      expect(uri.isLocalhost(new URL('https://localhost'))).to.be.true
    })

    it('http://127.0.0.1 is localhost', () => {
      expect(uri.isLocalhost(new URL('http://127.0.0.1'))).to.be.true
    })

    it('http://127.0.0.9 is localhost', () => {
      expect(uri.isLocalhost(new URL('http://127.0.0.9'))).to.be.true
    })

    it('http://[::1] is localhost', () => {
      expect(uri.isLocalhost(new URL('http://[::1]'))).to.be.true
    })

    it('http://128.0.0.1 is NOT localhost', () => {
      expect(uri.isLocalhost(new URL('http://128.0.0.1'))).to.be.false
    })

    it('http:foobar.com is NOT localhost', () => {
      expect(uri.isLocalhost(new URL('http:foobar.com'))).to.be.false
    })

    it('https:foobar.com is NOT localhost', () => {
      expect(uri.isLocalhost(new URL('https:foobar.com'))).to.be.false
    })
  })

  context('.origin', () => {
    it('strips everything but the remote origin', () => {
      expect(
        uri.origin('http://localhost:9999/foo/bar?baz=quux#/index.html'),
        'http://localhost:9999',
      )

      expect(
        uri.origin('https://www.google.com/'),
        'https://www.google.com',
      )

      expect(
        uri.origin('https://app.foobar.co.uk:1234/a=b'),
        'https://app.foobar.co.uk:1234',
      )
    })
  })
})
