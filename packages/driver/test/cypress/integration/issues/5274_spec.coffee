_ = Cypress._
Promise = Cypress.Promise
RESPONSE_TIMEOUT = 22222

describe "issue 5274", ->
  describe "UNESCAPED_CHARACTERS error", ->
    beforeEach ->
      cy.stub(Cypress, "backend").callThrough()
      Cypress.config("responseTimeout", RESPONSE_TIMEOUT)
      Cypress.config("defaultCommandTimeout", RESPONSE_TIMEOUT)

      return null

    it "should request url with ’ character in pathname without UNESCAPED_CHARACTERS error", (done) ->
      cy.on "fail", (err) ->
        expect(err.message).to.contain "cy.request() failed trying to load:"
        expect(err.message).to.not.contain "ERR_UNESCAPED_CHARACTERS"
        done()

      cy.request("http://localhost:1234/’")

    it "should request url with % character in pathname without UNESCAPED_CHARACTERS error", (done) ->
      cy.on "fail", (err) ->
        expect(err.message).to.contain "cy.request() failed trying to load:"
        expect(err.message).to.not.contain "ERR_UNESCAPED_CHARACTERS"
        done()

      cy.request("http://localhost:1234/%")

    it "should request url with ’ escaped in pathname without UNESCAPED_CHARACTERS error", (done) ->
      cy.on "fail", (err) ->
        expect(err.message).to.contain "cy.request() failed trying to load:"
        expect(err.message).to.not.contain "ERR_UNESCAPED_CHARACTERS"
        done()

      cy.request(encodeURI('http://localhost:1234/’'))

    it "should request url with Unicode in pathname from BMP to Astral Plane without UNESCAPED_CHARACTERS error", (done) ->
      cy.on "fail", (err) ->
        expect(err.message).to.contain "cy.request() failed trying to load:"
        expect(err.message).to.not.contain "ERR_UNESCAPED_CHARACTERS"
        done()

      cy.request('http://localhost:1234/😀')

    it "should request url with any Unicode escaped character in pathname without UNESCAPED_CHARACTERS error", (done) ->
      cy.on "fail", (err) ->
        expect(err.message).to.contain "cy.request() failed trying to load:"
        expect(err.message).to.not.contain "ERR_UNESCAPED_CHARACTERS"
        done()

      cy.request(encodeURI('http://localhost:1234/😀'))

  describe "Invalid URL error", ->
    beforeEach ->
      cy.stub(Cypress, "backend").callThrough()
      Cypress.config("responseTimeout", RESPONSE_TIMEOUT)
      Cypress.config("defaultCommandTimeout", RESPONSE_TIMEOUT)

      return null

    it "should throw an error when invalid url is provided", (done) ->
      cy.on "fail", (err) ->
        expect(err.message).to.contain "cy.request() must be provided a fully qualified url"
        done()

      Cypress.config({ baseUrl: false })
      cy.request('invalid://url.foo/bar')

  describe "encoded url value", ->
    beforeEach ->
      cy.stub(Cypress, "backend").callThrough()
      Cypress.config("responseTimeout", RESPONSE_TIMEOUT)
      Cypress.config("defaultCommandTimeout", RESPONSE_TIMEOUT)
      backend = Cypress.backend
        .withArgs("http:request")
        .resolves({ isOkStatusCode: true, status: 200 })

      @expectOptionsToBe = (opts) ->
        _.defaults(opts, {
          failOnStatusCode: true
          retryOnNetworkFailure: true
          retryOnStatusCodeFailure: false
          gzip: true
          followRedirect: true
          timeout: RESPONSE_TIMEOUT
          method: "GET"
        })

        options = backend.firstCall.args[1]

        _.each options, (value, key) ->
          expect(options[key]).to.deep.eq(opts[key], "failed on property: (#{key})")
        _.each opts, (value, key) ->
          expect(opts[key]).to.deep.eq(options[key], "failed on property: (#{key})")

    it "should request url with ’ character in pathname", ->
      cy.request({ url: 'http://localhost:1234/’' }).then ->
        @expectOptionsToBe({
          url: "http://localhost:1234/%E2%80%99"
        })

    it "should request url with ’ escaped in pathname", ->
      cy.request({ url: encodeURI('http://localhost:1234/’') }).then ->
        @expectOptionsToBe({
          url: "http://localhost:1234/%E2%80%99"
        })

    it "should request url with % character in pathname", ->
      cy.request({ url: 'http://localhost:1234/%' }).then ->
        @expectOptionsToBe({
          url: "http://localhost:1234/%"
        })

    it "should request url with % escaped in pathname without alteration", ->
      cy.request({ url: encodeURI('http://localhost:1234/%') }).then ->
        @expectOptionsToBe({
          url: "http://localhost:1234/%25"
        })

    it "should request url with Unicode in pathname from BMP to Astral Plane", ->
      cy.request({ url: 'http://localhost:1234/😀' }).then ->
        @expectOptionsToBe({
          url: "http://localhost:1234/%F0%9F%98%80"
        })

    it "should request url with any Unicode escaped character in pathname", ->
      cy.request({ url: encodeURI('http://localhost:1234/😀') }).then ->
        @expectOptionsToBe({
          url: "http://localhost:1234/%F0%9F%98%80"
        })

    it "should percent escape unicode in path and convert domain name properly", ->
      cy.request({ url: 'http://localhost😀:1234/😀' }).then ->
        @expectOptionsToBe({
          url: "http://xn--localhost-ob26h:1234/%F0%9F%98%80"
        })

    it "should percent escape unicode in path and convert domain name properly with encodedURI", ->
      cy.request({ url: encodeURI('http://localhost😀:1234/😀') }).then ->
        @expectOptionsToBe({
          url: "http://xn--localhost-ob26h:1234/%F0%9F%98%80"
        })
