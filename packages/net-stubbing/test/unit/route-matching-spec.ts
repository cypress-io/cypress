import {
  _doesRouteMatch,
  _getMatchableForRequest,
  getRouteForRequest,
} from '../../lib/server/route-matching'
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
    it('matches on url as regexp', function () {
      const req = {
        headers: {
          quuz: 'quux',
        },
        method: 'GET',
        proxiedUrl: 'https://google.com/foo',
      } as unknown as CypressIncomingRequest

      const matched = _doesRouteMatch({
        url: /foo/,
      }, req)

      expect(matched).to.be.true
    })

    it('matches on a null matcher', function () {
      const req = {
        headers: {
          quuz: 'quux',
        },
        method: 'GET',
        proxiedUrl: 'https://google.com/asdf?1234=a',
      } as unknown as CypressIncomingRequest

      const matched = _doesRouteMatch({}, req)

      expect(matched).to.be.true
    })

    it('matches on auth matcher', function () {
      const req = {
        headers: {
          authorization: 'basic Zm9vOmJhcg==',
        },
        method: 'GET',
        proxiedUrl: 'https://google.com/asdf?1234=a',
      } as unknown as CypressIncomingRequest

      const matched = _doesRouteMatch({
        auth: {
          username: /^Fo[aob]$/i,
          password: /.*/,
        },
      }, req)

      expect(matched).to.be.true
    })

    it('doesn\'t match on a partial match', function () {
      const req = {
        headers: {
          authorization: 'basic Zm9vOmJhcg==',
        },
        method: 'GET',
        proxiedUrl: 'https://google.com/asdf?1234=a',
      } as unknown as CypressIncomingRequest

      const matched = _doesRouteMatch({
        auth: {
          username: /^Fo[aob]$/i,
          password: /.*/,
        },
        method: 'POST',
      }, req)

      expect(matched).to.be.false
    })

    it('handles querystrings as expected', function () {
      const req = {
        headers: {},
        method: 'GET',
        proxiedUrl: '/abc?foo=bar&baz=quux',
      } as unknown as CypressIncomingRequest

      expect(_doesRouteMatch({
        query: {
          foo: 'b*r',
          baz: /quu[x]/,
        },
      }, req)).to.be.true

      expect(_doesRouteMatch({
        path: '/abc?foo=bar&baz=qu*x',
      }, req)).to.be.true

      expect(_doesRouteMatch({
        pathname: '/abc',
      }, req)).to.be.true

      expect(_doesRouteMatch({
        url: '*',
      }, req)).to.be.true
    })
  })

  context('.getRouteForRequest', function () {
    it('returns the matching route for the request', function () {
      const routes = [
        {
          routeMatcher: {
            url: '**/abc*',
          },
          handlerId: '123',
        },
        {
          routeMatcher: {
            url: '**/def*',
          },
          handlerId: '456',
        },
      ] as unknown as BackendRoute[]

      const req = {
        headers: {},
        method: 'GET',
        proxiedUrl: '/abc?foo=bar&baz=quux',
      } as unknown as CypressIncomingRequest

      expect(getRouteForRequest(routes, req)).to.deep.eq({
        routeMatcher: {
          url: '**/abc*',
        },
        handlerId: '123',
      })
    })

    it('returns undefined when no route was matched', function () {
      const routes = [
        {
          routeMatcher: {
            url: '**/quuz*',
          },
          handlerId: '123',
        },
      ] as unknown as BackendRoute[]

      const req = {
        headers: {},
        method: 'GET',
        proxiedUrl: '/abc?foo=bar&baz=quux',
      } as unknown as CypressIncomingRequest

      expect(getRouteForRequest(routes, req)).to.eq(undefined)
    })

    // https://github.com/cypress-io/cypress/issues/9302
    it('returns last found matched route for the request', function () {
      const routes = [
        {
          routeMatcher: {
            url: '**/abc*',
          },
          handlerId: '123',
        },
        {
          routeMatcher: {
            url: '**/abc*',
          },
          handlerId: '456',
        },
      ] as unknown as BackendRoute[]

      const req = {
        headers: {},
        method: 'GET',
        proxiedUrl: '/abc?foo=bar&baz=quux',
      } as unknown as CypressIncomingRequest

      expect(getRouteForRequest(routes, req)).to.deep.eq({
        routeMatcher: {
          url: '**/abc*',
        },
        handlerId: '456',
      })
    })
  })
})
