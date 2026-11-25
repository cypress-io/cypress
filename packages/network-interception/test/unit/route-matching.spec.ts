import { describe, it, expect } from 'vitest'
import {
  doesRouteMatch,
  getMatchableForRequest,
  getRoutesForRequest,
  matchesRoutePreflight,
  matchRoutes,
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

    it('preserves colons in a basic-auth password', function () {
      const credentials = Buffer.from('foo:b:a:r').toString('base64')

      const matchable = getMatchableForRequest({
        headers: {
          authorization: `basic ${credentials}`,
        },
        method: 'GET',
        proxiedUrl: 'https://google.com/',
      } as RouteMatchableRequest)

      expect(matchable.auth).toEqual({
        username: 'foo',
        password: 'b:a:r',
      })
    })

    it('handles an empty basic-auth password', function () {
      const credentials = Buffer.from('foo:').toString('base64')

      const matchable = getMatchableForRequest({
        headers: {
          authorization: `basic ${credentials}`,
        },
        method: 'GET',
        proxiedUrl: 'https://google.com/',
      } as RouteMatchableRequest)

      expect(matchable.auth).toEqual({
        username: 'foo',
        password: '',
      })
    })

    it('ignores malformed basic-auth credentials with no separator', function () {
      const credentials = Buffer.from('foobar').toString('base64')

      const matchable = getMatchableForRequest({
        headers: {
          authorization: `basic ${credentials}`,
        },
        method: 'GET',
        proxiedUrl: 'https://google.com/',
      } as RouteMatchableRequest)

      expect(matchable.auth).toBeUndefined()
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

    // https://github.com/cypress-io/cypress/issues/34973
    describe('with a stateful (g or y) regexp matcher', function () {
      const userIds = [1042, 1043, 1044, 1045]

      const requestForUser = (id: number): Partial<RouteMatchableRequest> => {
        return {
          headers: {
            authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.dXNlci0${id}.c2lnbmF0dXJl`,
          },
          proxiedUrl: `https://api.example.com/api/users/${id}?include=profile`,
        }
      }

      const expectEveryRequestToMatch = (matcher: RouteMatcher) => {
        const results = userIds.map((id) => {
          return doesRouteMatch(matcher, { method: 'GET', headers: {}, ...requestForUser(id) } as RouteMatchableRequest)
        })

        expect(results).toEqual([true, true, true, true])
      }

      it('matches every request on pathname with the g flag', function () {
        expectEveryRequestToMatch({ pathname: /^\/api\/users\/\d+$/g })
      })

      it('matches every request on pathname with the y flag', function () {
        expectEveryRequestToMatch({ pathname: /\/api\/users\/\d+$/y })
      })

      it('matches every request on a header with the g flag', function () {
        expectEveryRequestToMatch({ headers: { authorization: /^Bearer /g } })
      })

      it('matches every request on hostname, method and query with the g flag', function () {
        expectEveryRequestToMatch({
          hostname: /example\.com$/g,
          method: /^GET$/g,
          query: { include: /^profile$/g },
        })
      })

      it('matches every request on url with the g flag', function () {
        expectEveryRequestToMatch({ url: /\/api\/users\/\d+\?include=profile$/g })
      })

      it('matches every request when only the url fallback to path matches', function () {
        expectEveryRequestToMatch({ url: /^\/api\/users\/\d+/g })
      })

      it('keeps the y flag anchored to the start of the value', function () {
        const matcher = { pathname: /users\/\d+$/y }

        for (const id of userIds) {
          tryMatch(requestForUser(id), matcher, false)
        }
      })

      it('keeps other flags working alongside g', function () {
        expectEveryRequestToMatch({ headers: { authorization: /^bearer /gi } })
      })

      it('matches every request on auth and resourceType with the g flag', function () {
        const matcher = { auth: { username: /^jane\.doe$/g }, resourceType: /^fetch$/g }
        const credentials = Buffer.from('jane.doe:c0rrect-h0rse-battery').toString('base64')

        const results = userIds.map((id) => {
          return doesRouteMatch(matcher, {
            method: 'GET',
            headers: { authorization: `Basic ${credentials}` },
            proxiedUrl: `https://api.example.com/api/users/${id}`,
            resourceType: 'fetch',
          })
        })

        expect(results).toEqual([true, true, true, true])
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

    it('matches on a numeric port', function () {
      tryMatch({
        proxiedUrl: 'http://localhost:8080/foo',
      }, {
        port: 8080,
      })
    })

    it('matches when the port is one of an array of ports', function () {
      tryMatch({
        proxiedUrl: 'http://localhost:8080/foo',
      }, {
        port: [3000, 8080],
      })
    })

    it(`doesn't match a different port`, function () {
      tryMatch({
        proxiedUrl: 'http://localhost:8080/foo',
      }, {
        port: 9090,
      }, false)
    })

    it('handles querystrings as expected', function () {
      const req = {
        proxiedUrl: '/abc?foo=bar&baz=quux',
      }

      tryMatch(req, {
        query: {
          foo: 'b*r',
          baz: /quux/,
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

  describe('.matchRoutes', function () {
    // https://github.com/cypress-io/cypress/issues/34973
    it('keeps a g-flag route in the matched set for every request', function () {
      const routes = [
        { id: 'spy', routeMatcher: { middleware: true, url: '**/api/**' } },
        { id: 'users', routeMatcher: { pathname: /^\/api\/users\/\d+$/g } },
        { id: 'orders', routeMatcher: { pathname: /^\/api\/orders\//g } },
      ] as BackendRouteList

      const matchedIds = ['users/1042', 'users/1043', 'orders/7731', 'users/1044', 'orders/7732'].map((path) => {
        return matchRoutes(routes, { method: 'GET', headers: {}, proxiedUrl: `https://api.example.com/api/${path}` }).map(({ id }) => id)
      })

      expect(matchedIds).toEqual([
        ['spy', 'users'],
        ['spy', 'users'],
        ['spy', 'orders'],
        ['spy', 'users'],
        ['spy', 'orders'],
      ])
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

    // https://github.com/cypress-io/cypress/issues/34973
    it('matches the request that follows each preflight with a g matcher', function () {
      const routes = makeRoutes({ method: 'DELETE', pathname: /^\/api\/users\/\d+$/g })

      const results = [1042, 1043].flatMap((id) => {
        const proxiedUrl = `http://api.example.com/api/users/${id}`

        return [
          matchesRoutePreflight(routes, preflightReq({ proxiedUrl })),
          matchRoutes(routes, { method: 'DELETE', headers: { origin: 'http://example.com' }, proxiedUrl }).length === 1,
        ]
      })

      expect(results).toEqual([true, true, true, true])
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
