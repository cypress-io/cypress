import {
  isHostInterceptable,
} from '../../lib/server/is-host-interceptable'
import { expect } from 'chai'
import { RouteMatcherOptions } from '../../lib/types'

const testMatchers = (host: string, matchers: RouteMatcherOptions[], expected: boolean) => {
  const routes = matchers.map((routeMatcher) => {
    return { routeMatcher }
  })

  // @ts-ignore
  expect(isHostInterceptable(host, { routes })).to.eq(expected)
}

describe('is host interceptable?', () => {
  it('returns false if no routes set', () => {
    testMatchers('foo.com:123', [], false)
  })

  it('returns false if host mismatch', () => {
    testMatchers('foo.com:123', [
      {
        hostname: 'bar.com',
      },
    ], false)
  })

  it('returns true if matcher doesn\'t constrain host or port', () => {
    testMatchers('foo.com:123', [{}], true)
    testMatchers('foo.com:123', [{
      pathname: 'foo',
    }], true)
  })

  it('returns true if host equals', () => {
    testMatchers('foo.com:123', [
      {
        hostname: 'foo.com',
      },
    ], true)
  })

  it('returns true if host matches regex', () => {
    testMatchers('foo.com:123', [
      {
        hostname: /foo/,
      },
    ], true)
  })

  it('returns false if port mismatch', () => {
    testMatchers('foo.com:123', [
      {
        port: 456,
      },
    ], false)
  })

  it('returns true if port equals', () => {
    testMatchers('foo.com:123', [
      {
        port: 123,
      },
    ], true)
  })

  it('returns true if port in list', () => {
    testMatchers('foo.com:123', [
      {
        port: [123],
      },
    ], true)
  })

  it('returns true if url is a RegExp', () => {
    testMatchers('foo.com:123', [
      {
        url: /anything-is-possible/,
      },
    ], true)
  })

  it('returns true if url has same hostname', () => {
    testMatchers('foo.com:123', [
      {
        url: 'http://foo.com:123/anything/really',
      },
    ], true)
  })

  it('returns true if url is a fragment glob', () => {
    testMatchers('foo.com:123', [
      {
        url: '/foo',
      },
    ], true)
  })

  it('returns true if url domain matches', () => {
    testMatchers('foo.com:80', [
      {
        url: 'http://foo.com',
      },
    ], true)
  })

  it('returns true if url domain glob matches', () => {
    testMatchers('foobar.com:80', [
      {
        url: 'http://foo*ar.com',
      },
    ], true)
  })

  it('returns false if url domain glob does not match', () => {
    testMatchers('foobar.com:80', [
      {
        url: 'http://bar*ar.com',
      },
    ], false)
  })
})
