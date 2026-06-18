import { describe, it, expect } from 'vitest'
import {
  doesRouteMatch,
  getMatchableForRequest,
  matchRoutes,
} from '../../lib'
import { RouteMatcherOptions } from '../../lib/types'
import { CypressIncomingRequest } from '@packages/proxy'
import { BackendRoute } from '../../lib/types/backend-route'

describe('intercept-request', function () {
  describe('.getMatchableForRequest', function () {
    it('converts a fully-fledged req into a matchable shape', function () {
      const req = {
        headers: {
          authorization: 'basic Zm9vOmJhcg==',
          host: 'google.com',
          quuz: 'quux',
        },
        method: 'GET',
        url: 'https://google.com/asdf?1234=a',
      } as unknown as CypressIncomingRequest

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
    const tryMatch = (req: Partial<CypressIncomingRequest>, matcher: RouteMatcherOptions, expected = true) => {
      req = {
        method: 'GET',
        headers: {},
        ...req,
      }

      expect(doesRouteMatch(matcher, req as CypressIncomingRequest)).toEqual(expected)
    }

    it('matches exact URL', function () {
      tryMatch({
        url: 'https://google.com/foo',
      }, {
        url: 'https://google.com/foo',
      })
    })

    it('matches glob URL', function () {
      tryMatch({
        url: 'https://google.com/foo/bar',
      }, {
        url: 'https://google.com/**',
      })
    })

    it('matches regex URL', function () {
      tryMatch({
        url: 'https://google.com/foo/bar',
      }, {
        url: /\/foo\/bar$/,
      })
    })

    it('matches method', function () {
      tryMatch({
        url: 'https://google.com/foo',
        method: 'POST',
      }, {
        url: 'https://google.com/foo',
        method: 'POST',
      })
    })

    it('does not match method', function () {
      tryMatch({
        url: 'https://google.com/foo',
        method: 'POST',
      }, {
        url: 'https://google.com/foo',
        method: 'GET',
      }, false)
    })

    it('matches hostname', function () {
      tryMatch({
        url: 'https://google.com/foo',
      }, {
        hostname: 'google.com',
      })
    })

    it('matches pathname', function () {
      tryMatch({
        url: 'https://google.com/foo/bar',
      }, {
        pathname: '/foo/bar',
      })
    })

    it('matches path', function () {
      tryMatch({
        url: 'https://google.com/foo/bar?baz=quux',
      }, {
        path: '/foo/bar?baz=quux',
      })
    })

    it('matches query', function () {
      tryMatch({
        url: 'https://google.com/foo?baz=quux',
      }, {
        query: {
          baz: 'quux',
        },
      })
    })

    it('matches headers', function () {
      tryMatch({
        url: 'https://google.com/foo',
        headers: {
          'x-custom': 'foo',
        },
      }, {
        headers: {
          'x-custom': 'foo',
        },
      })
    })

    it('matches auth', function () {
      tryMatch({
        url: 'https://google.com/foo',
        headers: {
          authorization: 'basic Zm9vOmJhcg==',
        },
      }, {
        auth: {
          username: 'foo',
          password: 'bar',
        },
      })
    })

    it('matches https', function () {
      tryMatch({
        url: 'https://google.com/foo',
      }, {
        https: true,
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/14256
    it('matches when url has missing leading slash', function () {
      tryMatch({
        url: 'http://foo.com/services/api/agenda/Appointment?id=25',
      }, {
        url: 'services/api/agenda/Appointment?id=**',
      })
    })
  })

  describe('.matchRoutes', function () {
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
        url: 'http://bar.baz/foo?_',
      }

      // @ts-ignore
      const matched = matchRoutes(routes, req)

      expect(matched.map((route) => route.id)).toEqual(['1', '3', '4', '2'])
    })

    it('returns identical matches', function () {
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
        url: 'https://example.com/foo',
      }

      // @ts-ignore
      const matched = matchRoutes(routes, req)

      expect(matched.map((route) => route.id)).toEqual(['1', '1'])
    })
  })
})
