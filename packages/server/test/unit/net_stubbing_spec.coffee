require("../spec_helper")

netStubbing = require("#{root}lib/net_stubbing")

describe "lib/net_stubbing", ->
  context "._getMatchableForRequest", ->
    it "converts a fully-fledged req into a matchable shape", ->
      req = {
        headers: {
          authorization: 'basic Zm9vOmJhcg=='
          host: 'google.com'
          quuz: 'quux'
        }
        method: 'GET'
        proxiedUrl: 'https://google.com/asdf?1234=a'
      }

      matchable = netStubbing._getMatchableForRequest(req)

      expect(matchable).to.deep.eq({
        auth: {
          username: 'foo'
          password: 'bar'
        }
        method: req.method
        headers: req.headers
        hostname: 'google.com'
        path: '/asdf?1234=a'
        pathname: '/asdf'
        query: {
          '1234': 'a'
        }
        https: true
        port: 443
        url: 'https://google.com/asdf?1234=a'
      })

  context "._doesRouteMatch", ->
    it "matches on a null matcher", ->
      req = {
        headers: {
          quuz: 'quux'
        }
        method: 'GET'
        proxiedUrl: 'https://google.com/asdf?1234=a'
      }

      matched = netStubbing._doesRouteMatch({}, req)

      expect(matched).to.be.true

    it "matches on auth matcher", ->
      req = {
        headers: {
          authorization: 'basic Zm9vOmJhcg=='
        }
        method: 'GET'
        proxiedUrl: 'https://google.com/asdf?1234=a'
      }

      matched = netStubbing._doesRouteMatch({
        auth: {
          username: /^Fo[aob]$/i
          password: /.*/
        }
      }, req)

      expect(matched).to.be.true

    it "doesn't match on a partial match", ->
      req = {
        headers: {
          authorization: 'basic Zm9vOmJhcg=='
        }
        method: 'GET'
        proxiedUrl: 'https://google.com/asdf?1234=a'
      }

      matched = netStubbing._doesRouteMatch({
        auth: {
          username: /^Fo[aob]$/i
          password: /.*/
        }
        method: 'POST'
      }, req)

      expect(matched).to.be.false
