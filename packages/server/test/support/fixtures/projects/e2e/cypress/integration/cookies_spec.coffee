expectedDomain = Cypress.env('expectedDomain')
httpUrl = Cypress.env('httpUrl')
httpsUrl = Cypress.env('httpsUrl')
otherUrl = Cypress.env('otherUrl')
otherHttpsUrl = Cypress.env('otherHttpsUrl')

describe "cookies", ->
  before ->
    ## assert we're running on expected baseurl,
    ## otherwise these tests are useless
    if Cypress.env('noBaseUrl')
      return

    expect(Cypress.env('baseUrl')).to.be.a('string')
    .and.have.length.gt(0)
    .and.eq(Cypress.config('baseUrl'))

  beforeEach ->
    cy.wrap({foo: "bar"})

  context "with whitelist", ->
    before ->
      Cypress.Cookies.defaults({
        whitelist: "foo1"
      })

    it "can get all cookies", ->
      cy
        .clearCookie("foo1")
        .setCookie("foo", "bar").then (c) ->
          expect(c.domain).to.eq(expectedDomain)
          expect(c.httpOnly).to.eq(false)
          expect(c.name).to.eq("foo")
          expect(c.value).to.eq("bar")
          expect(c.path).to.eq("/")
          expect(c.secure).to.eq(false)
          expect(c.expiry).to.be.a("number")

          expect(c).to.have.keys(
            "domain", "name", "value", "path", "secure", "httpOnly", "expiry"
          )
        .getCookies()
          .should("have.length", 1)
          .then (cookies) ->
            c = cookies[0]

            expect(c.domain).to.eq(expectedDomain)
            expect(c.httpOnly).to.eq(false)
            expect(c.name).to.eq("foo")
            expect(c.value).to.eq("bar")
            expect(c.path).to.eq("/")
            expect(c.secure).to.eq(false)
            expect(c.expiry).to.be.a("number")

            expect(c).to.have.keys(
              "domain", "name", "value", "path", "secure", "httpOnly", "expiry"
            )
        .clearCookies()
          .should("be.null")
        .setCookie("wtf", "bob", {httpOnly: true, path: "/foo", secure: true})
        .getCookie("wtf").then (c) ->
          expect(c.domain).to.eq(expectedDomain)
          expect(c.httpOnly).to.eq(true)
          expect(c.name).to.eq("wtf")
          expect(c.value).to.eq("bob")
          expect(c.path).to.eq("/foo")
          expect(c.secure).to.eq(true)
          expect(c.expiry).to.be.a("number")

          expect(c).to.have.keys(
            "domain", "name", "value", "path", "secure", "httpOnly", "expiry"
          )
        .clearCookie("wtf")
          .should("be.null")
        .getCookie("doesNotExist")
          .should("be.null")
        .document()
          .its("cookie")
          .should("be.empty")

    it "resets cookies between tests correctly", ->
      Cypress.Cookies.preserveOnce("foo2")

      for i in [1..100]
        do (i) ->
          cy.setCookie("foo" + i, "#{i}")

      cy.getCookies().should("have.length", 100)

    it "should be only two left now", ->
      cy.getCookies().should("have.length", 2)

    it "handles undefined cookies", ->
      cy.visit("/cookieWithNoName")

  context "without whitelist", ->
    before ->
      Cypress.Cookies.defaults({
        whitelist: []
      })

    it "sends cookies to localhost:2121", ->
      cy
        .clearCookies()
        .setCookie("asdf", "jkl")
        .request("/requestCookies")
          .its("body").should("deep.eq", { asdf: "jkl" })

    it "handles expired cookies secure", ->
      cy
        .visit("/set")
        .getCookie("shouldExpire").should("exist")
        .visit("/expirationMaxAge")
        .getCookie("shouldExpire").should("not.exist")
        .visit("/set")
        .getCookie("shouldExpire").should("exist")
        .visit("/expirationExpires")
        .getCookie("shouldExpire").should("not.exist")

    it "issue: #224 sets expired cookies between redirects", ->
      cy
        .visit("/set")
        .getCookie("shouldExpire").should("exist")
        .visit("/expirationRedirect")
        .url().should("include", "/logout")
        .getCookie("shouldExpire").should("not.exist")

        .visit("/set")
        .getCookie("shouldExpire").should("exist")
        .request("/expirationRedirect")
        .getCookie("shouldExpire").should("not.exist")

    it "issue: #1321 failing to set or parse cookie", ->
      ## this is happening because the original cookie was set
      ## with a secure flag, and then expired without the secure
      ## flag.
      cy
        .visit("#{httpsUrl}/setOneHourFromNowAndSecure")
        .getCookies().should("have.length", 1)

        ## secure cookies should have been attached
        .request("#{httpsUrl}/requestCookies")
          .its("body").should("deep.eq", { shouldExpire: "oneHour" })

        ## secure cookies should not have been attached
        .request("#{httpUrl}/requestCookies")
          .its("body").should("deep.eq", {})

        .visit("#{httpsUrl}/expirationMaxAge")
        .getCookies().should("be.empty")

    it "issue: #2724 does not fail on invalid cookies", ->
      cy.request("#{httpsUrl}/invalidCookies")

    ## https://github.com/cypress-io/cypress/issues/5453
    it "can set and clear cookie", ->
      cy.setCookie('foo', 'bar')
      cy.clearCookie('foo')
      cy.getCookie('foo').should('be.null')

    [
      ['HTTPS', otherHttpsUrl],
      ['HTTP', otherUrl]
    ].forEach ([protocol, altUrl]) =>
      it "can set cookies on way too many redirects with #{protocol} intermediary", ->
        n = 8
        baseLoc = new Cypress.Location(Cypress.env('baseUrl'))
        otherLoc = new Cypress.Location(altUrl)

        expectedCookie = (loc, n, tag) =>
          {
            name: "name#{tag}#{n}"
            value: "val#{tag}#{n}"
            domain: if loc.remote.domain == 'localhost' then 'localhost' else ".#{loc.getSuperDomain()}"
            httpOnly: false
            secure: false
          }

        cy.request("/setCascadingCookies?n=#{n}&a=#{altUrl}&b=#{Cypress.env('baseUrl')}")

        cy.getCookies().then (cookies) ->
          cy.task('console:log', 'baseUrl cookies:', cookies)

        cy.getCookies({ domain: otherLoc.remote.domain }).then (cookies) ->
          cy.task('console:log', 'altUrl cookies:', cookies)
