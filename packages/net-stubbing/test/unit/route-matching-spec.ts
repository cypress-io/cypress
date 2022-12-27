import {
  _doesRouteMatch,
  _getMatchableForRequest,
  getRoutesForRequest,
} from '../../lib/server/route-matching'
import { RouteMatcherOptions } from '../../lib/types'
import { expect } from 'chai'
import { CypressIncomingRequest } from '@packages/proxy'
import { BackendRoute } from '../../lib/server/types'

describe('intercept-request', function () {
  context('._getMatchableForRequest', function () {
    it('converts a fully-fledged req into a matchable shape', function () {
      const req = {
        headers: {
          authorization: 'basic Zm9vOmJhcg==',
          host: 'google.com',
          quuz: 'quux',
        },
        method: 'GET',
        proxiedUrl: 'https://google.com/asdf?1234=a',
      } as unknown as CypressIncomingRequest

      const matchable = _getMatchableForRequest(req)

      expect(matchable).to.deep.eq({
        auth: {
          username: 'foo',
          password: 'bar',
        },
        method: req.method,
        headers: req.headers,
        hostname: 'google.com',
        path: '/asdf?1234=a',
        pathname: '/asdf',
        query: {
          '1234': 'a',
        },
        https: true,
        port: 443,
        url: 'https://google.com/asdf?1234=a',
      })
    })
  })

  context('._doesRouteMatch', function () {
    const tryMatch = (req: Partial<CypressIncomingRequest>, matcher: RouteMatcherOptions, expected = true) => {
      req = {
        method: 'GET',
        headers: {},
        ...req,
      }

      expect(_doesRouteMatch(matcher, req as CypressIncomingRequest)).to.eq(expected)
    }

    it('matches exact URL', function () {
      tryMatch({
        proxiedUrl: 'https://google.com/foo',
      }, {
        url: 'https://google.com/foo',
      })
    })

    it('matches on url as regexp', function () {
      tryMatch({
        proxiedUrl: 'https://google.com/foo',
      }, {
        url: /foo/,
      })
    })

    it('matches on a null matcher', function () {
      tryMatch({
        proxiedUrl: 'https://google.com/asdf?1234=a',
      }, {})
    })

    it('matches on auth matcher', function () {
      tryMatch({
        headers: {
          authorization: 'basic Zm9vOmJhcg==',
        },
        proxiedUrl: 'https://google.com/asdf?1234=a',
      }, {
        auth: {
          username: /^Fo[aob]$/i,
          password: /.*/,
        },
      })
    })

    it(`doesn't match on a partial match`, function () {
      tryMatch({
        headers: {
          authorization: 'basic Zm9vOmJhcg==',
        },
        proxiedUrl: 'https://google.com/asdf?1234=a',
      }, {
        auth: {
          username: /^Fo[aob]$/i,
          password: /.*/,
        },
        method: 'POST',
      }, false)
    })

    it('handles querystrings as expected', function () {
      const req = {
        proxiedUrl: '/abc?foo=bar&baz=quux',
      }

      tryMatch(req, {
        query: {
          foo: 'b*r',
          baz: /quu[x]/,
        },
      })

      tryMatch(req, {
        path: '/abc?foo=bar&baz=qu*x',
      })

      tryMatch(req, {
        pathname: '/abc',
      })

      tryMatch(req, {
        url: '*',
      })
    })

    it('matches globs against path', function () {
      tryMatch({
        proxiedUrl: 'http://foo.com/bar/a1',
      }, {
        url: '/bar/*',
      })
    })

    it('matches nested glob against path', function () {
      tryMatch({
        proxiedUrl: 'http://foo.com/bar/a1/foo',
      }, {
        url: '/bar/*/foo',
      })
    })

    it('fails to match with missing queryparams', function () {
      tryMatch({
        proxiedUrl: 'http://foo.com/foo/nested?k=v',
      }, {
        url: '/*/nested',
      }, false)
    })

    it('can glob-match against queryparams', function () {
      tryMatch({
        proxiedUrl: 'http://foo.com/foo/nested?k=v',
      }, {
        url: '/*/nested?k=*',
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/14256
    it('matches when url has missing leading slash', function () {
      tryMatch({
        proxiedUrl: 'http://foo.com/services/api/agenda/Appointment?id=25',
      }, {
        url: 'services/api/agenda/Appointment?id=**',
      })
    })
  })

  context('.getRoutesForRequest', function () {
    it('matches middleware, then handlers', function () {
      const routes: Partial<BackendRoute>[] = [
        {
          id: '1',
          routeMatcher: {
            middleware: true,
            pathname: '/foo',
          },
        },
        {
          id: '2',
          routeMatcher: {
            pathname: '/foo',
          },
        },
        {
          id: '3',
          routeMatcher: {
            middleware: true,
            pathname: '/foo',
          },
        },
        {
          id: '4',
          routeMatcher: {
            pathname: '/foo',
          },
        },
      ]

      const req: Partial<CypressIncomingRequest> = {
        method: 'GET',
        headers: {},
        proxiedUrl: 'http://bar.baz/foo?_',
      }

      const e: string[] = []

      // @ts-ignore
      for (const route of getRoutesForRequest(routes, req)) {
        e.push(route.id)
      }

      expect(e).to.deep.eq(['1', '3', '4', '2'])
    })

    it('yields identical matches', function () {
      // This is a reproduction of issue #22693
      const routes: Partial<BackendRoute>[] = [
        {
          id: '1',
          routeMatcher: {
            pathname: '/foo',
          },
        },
        {
          id: '1',
          routeMatcher: {
            pathname: '/foo',
          },
        },
        {
          id: '2',
          routeMatcher: {
            pathname: '/bar',
          },
        },
      ]

      const req: Partial<CypressIncomingRequest> = {
        method: 'GET',
        headers: {},
        proxiedUrl: 'https://example.com/foo',
      }

      const matchedRouteIds: string[] = []

      // @ts-ignore
      for (const route of getRoutesForRequest(routes, req)) {
        matchedRouteIds.push(route.id)
      }

      expect(matchedRouteIds).to.deep.eq(['1', '1'])
    })
  })
})
