require('../spec_helper')

import * as netStubbing from '../../lib/net_stubbing'

type FakeProxyIncomingMessage = netStubbing.ProxyIncomingMessage

describe('lib/net_stubbing', function () {
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
      } as unknown as FakeProxyIncomingMessage

      const matchable = netStubbing._getMatchableForRequest(req)

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
    it('matches on a null matcher', function () {
      const req = {
        headers: {
          quuz: 'quux',
        },
        method: 'GET',
        proxiedUrl: 'https://google.com/asdf?1234=a',
      } as unknown as FakeProxyIncomingMessage

      const matched = netStubbing._doesRouteMatch({}, req)

      expect(matched).to.be.true
    })

    it('matches on auth matcher', function () {
      const req = {
        headers: {
          authorization: 'basic Zm9vOmJhcg==',
        },
        method: 'GET',
        proxiedUrl: 'https://google.com/asdf?1234=a',
      } as unknown as FakeProxyIncomingMessage

      const matched = netStubbing._doesRouteMatch({
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
      } as unknown as FakeProxyIncomingMessage

      const matched = netStubbing._doesRouteMatch({
        auth: {
          username: /^Fo[aob]$/i,
          password: /.*/,
        },
        method: 'POST',
      }, req)

      expect(matched).to.be.false
    })
  })
})
