require("../spec_helper")

cors = require("#{root}lib/util/cors")

describe "lib/util/cors", ->
  context ".parseUrlIntoDomainTldPort", ->
    beforeEach ->
      @isEq = (url, obj) ->
        expect(cors.parseUrlIntoDomainTldPort(url)).to.deep.eq(obj)

    it "parses https://www.google.com", ->
      @isEq("https://www.google.com", {
        port: "443"
        domain: "google"
        tld: "com"
      })

    it "parses http://localhost:8080", ->
      @isEq("http://localhost:8080", {
        port: "8080"
        domain: ""
        tld: "localhost"
      })

    it "parses http://app.localhost:8080", ->
      @isEq("http://app.localhost:8080", {
        port: "8080"
        domain: "app"
        tld: "localhost"
      })

    it "parses http://app.localhost.dev:8080", ->
      @isEq("http://app.localhost.dev:8080", {
        port: "8080"
        domain: "localhost"
        tld: "dev"
      })

    it "parses http://app.local:8080", ->
      @isEq("http://app.local:8080", {
        port: "8080"
        domain: "app"
        tld: "local"
      })

    ## public suffix example of a private tld
    it "parses https://example.herokuapp.com", ->
      @isEq("https://example.herokuapp.com", {
        port: "443"
        domain: "example"
        tld: "herokuapp.com"
      })

    it "parses http://www.local.nl", ->
      @isEq("http://www.local.nl", {
        port: "80"
        domain: "local"
        tld: "nl"
      })

    ## https://github.com/cypress-io/cypress/issues/3717
    it "parses http://dev.classea12.beta.gouv.fr", ->
      @isEq("http://dev.classea12.beta.gouv.fr", {
        port: "80"
        domain: "beta"
        tld: "gouv.fr"
      })

    it "parses http://www.local.nl:8080", ->
      @isEq("http://www.local.nl:8080", {
        port: "8080"
        domain: "local"
        tld: "nl"
      })

    it "parses 192.168.1.1:8080", ->
      @isEq("http://192.168.1.1:8080", {
        port: "8080"
        domain: ""
        tld: "192.168.1.1"
      })

  context ".urlMatchesOriginPolicyProps", ->
    beforeEach ->
      @isFalse = (url, props) =>
        expect(cors.urlMatchesOriginPolicyProps(url, props)).to.be.false

      @isTrue = (url, props) =>
        expect(cors.urlMatchesOriginPolicyProps(url, props)).to.be.true

    describe "domain + subdomain", ->
      beforeEach ->
        @props = cors.parseUrlIntoDomainTldPort("https://staging.google.com")

      it "does not match", ->
        @isFalse("https://foo.bar:443", @props)
        @isFalse("http://foo.bar:80", @props)
        @isFalse("http://foo.bar", @props)
        @isFalse("http://staging.google.com", @props)
        @isFalse("http://staging.google.com:80", @props)
        @isFalse("https://staging.google2.com:443", @props)
        @isFalse("https://staging.google.net:443", @props)
        @isFalse("https://google.net:443", @props)
        @isFalse("http://google.com", @props)

      it "matches", ->
        @isTrue("https://staging.google.com:443", @props)
        @isTrue("https://google.com:443", @props)
        @isTrue("https://foo.google.com:443", @props)
        @isTrue("https://foo.bar.google.com:443", @props)

    describe "public suffix", ->
      beforeEach ->
        @props = cors.parseUrlIntoDomainTldPort("https://example.gitlab.io")

      it "does not match", ->
        @isFalse("http://example.gitlab.io", @props)
        @isFalse("https://foo.gitlab.io:443", @props)

      it "matches", ->
        @isTrue("https://example.gitlab.io:443", @props)
        @isTrue("https://foo.example.gitlab.io:443", @props)

    describe "localhost", ->
      beforeEach ->
        @props = cors.parseUrlIntoDomainTldPort("http://localhost:4200")

      it "does not match", ->
        @isFalse("http://localhost:4201", @props)
        @isFalse("http://localhoss:4200", @props)

      it "matches", ->
        @isTrue("http://localhost:4200", @props)

    describe "app.localhost", ->
      beforeEach ->
        @props = cors.parseUrlIntoDomainTldPort("http://app.localhost:4200")

      it "does not match", ->
        @isFalse("http://app.localhost:4201", @props)
        @isFalse("http://app.localhoss:4200", @props)

      it "matches", ->
        @isTrue("http://app.localhost:4200", @props)
        @isTrue("http://name.app.localhost:4200", @props)

    describe "local", ->
      beforeEach ->
        @props = cors.parseUrlIntoDomainTldPort("http://brian.dev.local")

      it "does not match", ->
        @isFalse("https://brian.dev.local:443", @props)
        @isFalse("https://brian.dev.local", @props)
        @isFalse("http://brian.dev2.local:81", @props)

      it "matches", ->
        @isTrue("http://jennifer.dev.local:80", @props)
        @isTrue("http://jennifer.dev.local", @props)

    describe "ip address", ->
      beforeEach ->
        @props = cors.parseUrlIntoDomainTldPort("http://192.168.5.10")

      it "does not match", ->
        @isFalse("http://192.168.5.10:443", @props)
        @isFalse("https://192.168.5.10", @props)
        @isFalse("http://193.168.5.10", @props)
        @isFalse("http://193.168.5.10:80", @props)

      it "matches", ->
        @isTrue("http://192.168.5.10", @props)
        @isTrue("http://192.168.5.10:80", @props)

  context ".urlMatchesOriginProtectionSpace", ->
    isMatch = (urlStr, origin) ->
      expect(urlStr, "the url: '#{urlStr}' did not match origin protection space: '#{origin}'").to.satisfy ->
        cors.urlMatchesOriginProtectionSpace(urlStr, origin)

    isNotMatch = (urlStr, origin) ->
      expect(urlStr, "the url: '#{urlStr}' matched origin protection space: '#{origin}'")
      .not.to.satisfy ->
        cors.urlMatchesOriginProtectionSpace(urlStr, origin)

    it "ports", ->
      isMatch("http://example.com/", "http://example.com:80")
      isMatch("http://example.com:80/", "http://example.com")
      isMatch("http://example.com:80/", "http://example.com:80")
      isMatch("https://example.com:443/", "https://example.com:443")
      isMatch("https://example.com:443/", "https://example.com")
      isMatch("https://example.com/", "https://example.com:443")

      isNotMatch("https://example.com:1234/", "https://example.com")
      isNotMatch("https://example.com:1234/", "https://example.com:443")

    it "schemes", ->
      isNotMatch("http://example.com/", "https://example.com")
      isNotMatch("https://example.com/", "http://example.com")
      isNotMatch("http://example.com/", "ftp://example.com")
      isNotMatch("http://example.com/", "file://example.com")

    it "does not factor in path or search", ->
      isMatch("http://example.com/foo", "http://example.com")
      isMatch("http://example.com/foo/bar", "http://example.com")
      isMatch("http://example.com/?foo=bar", "http://example.com")
      isMatch("http://example.com/foo?bar=baz", "http://example.com")

    it "subdomains", ->
      isMatch("http://example.com/", "http://example.com")
      isMatch("http://www.example.com/", "http://www.example.com")
      isMatch("http://foo.bar.example.com/", "http://foo.bar.example.com")

      isNotMatch("http://www.example.com/", "http://example.com")
      isNotMatch("http://foo.example.com/", "http://bar.example.com")
      isNotMatch("http://foo.example.com/", "http://foo.bar.example.com")
