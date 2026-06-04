import { describe, it, expect } from 'vitest'
import {
  doesRouteMatch,
  getMatchableForRequest,
  getRoutesForRequest,
  matchesRoutePreflight,
  type RouteMatchableRequest,
} from '../../lib/core/route-matching'

type RouteMatcher = Parameters<typeof doesRouteMatch>[0]
type BackendRouteList = Parameters<typeof getRoutesForRequest>[0]

describe('core/route-matching', function () {
  describe('.getMatchableForRequest', function () {
    it('converts a fully-fledged req into a matchable shape', function () {
      const req = {
        headers: {
          authorization: 'basic Zm9vOmJhcg==',
          host: 'google.com',
          quuz: 'quux',
        },
        method: 'GET',
        proxiedUrl: 'https://google.com/asdf?1234=a',
      } as RouteMatchableRequest

      const matchable = getMatchableForRequest(req)

      expect(matchable).toEqual({
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

  describe('.doesRouteMatch', function () {
    const tryMatch = (req: Partial<RouteMatchableRequest>, matcher: RouteMatcher, expected = true) => {
      expect(doesRouteMatch(matcher, {
        method: 'GET',
        headers: {},
        ...req,
      })).toEqual(expected)
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

  describe('.getRoutesForRequest', function () {
    it('matches middleware, then handlers', function () {
      const routes = [
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
      ] as BackendRouteList

      const req: Partial<RouteMatchableRequest> = {
        method: 'GET',
        headers: {},
        proxiedUrl: 'http://bar.baz/foo?_',
      }

      const e: string[] = []

      for (const route of getRoutesForRequest(routes, req as RouteMatchableRequest)) {
        e.push(route.id)
      }

      expect(e).toEqual(['1', '3', '4', '2'])
    })

    it('yields identical matches', function () {
      // This is a reproduction of issue #22693
      const routes = [
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
      ] as BackendRouteList

      const req: Partial<RouteMatchableRequest> = {
        method: 'GET',
        headers: {},
        proxiedUrl: 'https://example.com/foo',
      }

      const matchedRouteIds: string[] = []

      for (const route of getRoutesForRequest(routes, req as RouteMatchableRequest)) {
        matchedRouteIds.push(route.id)
      }

      expect(matchedRouteIds).toEqual(['1', '1'])
    })
  })

  describe('.matchesRoutePreflight', function () {
    const preflightReq = (overrides: Partial<RouteMatchableRequest> = {}): RouteMatchableRequest => {
      return {
        method: 'OPTIONS',
        headers: {
          'access-control-request-method': 'DELETE',
          origin: 'http://example.com',
        },
        proxiedUrl: 'http://api.example.com/no-cors',
        ...overrides,
      }
    }

    const makeRoutes = (...matchers: RouteMatcher[]): BackendRouteList => {
      return matchers.map((routeMatcher, index) => {
        return {
          id: String(index + 1),
          routeMatcher,
          hasInterceptor: false,
          getFixture: async () => '',
          matches: 0,
        }
      }) as BackendRouteList
    }

    it('returns false for non-OPTIONS requests', function () {
      expect(matchesRoutePreflight(
        makeRoutes({ url: '**/no-cors' }),
        {
          method: 'DELETE',
          headers: { 'access-control-request-method': 'DELETE' },
          proxiedUrl: 'http://api.example.com/no-cors',
        },
      )).toBe(false)
    })

    it('returns false for OPTIONS without access-control-request-method', function () {
      expect(matchesRoutePreflight(
        makeRoutes({ url: '**/no-cors' }),
        {
          method: 'OPTIONS',
          headers: {},
          proxiedUrl: 'http://api.example.com/no-cors',
        },
      )).toBe(false)
    })

    it('returns true when a registered route matches the preflight URL', function () {
      expect(matchesRoutePreflight(
        makeRoutes({ url: '**/no-cors' }),
        preflightReq(),
      )).toBe(true)
    })

    it('returns false when no route matches', function () {
      expect(matchesRoutePreflight(
        makeRoutes({ url: '/other' }),
        preflightReq(),
      )).toBe(false)
    })

    it('returns false when a matching route explicitly targets OPTIONS', function () {
      expect(matchesRoutePreflight(
        makeRoutes({ method: 'OPTIONS', url: '**/no-cors' }),
        preflightReq(),
      )).toBe(false)
    })

    it('matches preflight against routes registered for non-OPTIONS methods', function () {
      expect(matchesRoutePreflight(
        makeRoutes({ method: 'DELETE', url: '**/no-cors' }),
        preflightReq(),
      )).toBe(true)
    })

    it('ignores route header matchers for preflight requests', function () {
      expect(matchesRoutePreflight(
        makeRoutes({
          url: '**/no-cors',
          headers: { 'x-custom': 'required' },
        }),
        preflightReq(),
      )).toBe(true)
    })
  })
})
