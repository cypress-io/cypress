describe "subdomains", ->
  beforeEach ->
    cy.visit("http://www.foobar.com:2292")

  it "can swap to help.foobar.com:2292", ->
    cy
      .get("a").click()
      .get("h1").should("contain", "Help")

  it "can directly visit a subdomain in another test", ->
    cy
      .visit("http://help.foobar.com:2292")
      .get("h1").should("contain", "Help")
      .document().then (document) ->
        ## set cookies that are just on this subdomain
        ## and cookies on the superdomain
        ## and then regular cookies too
        document.cookie = "help=true; domain=help.foobar.com"
        document.cookie = "asdf=asdf; domain=foobar.com"
        document.cookie = "foo=bar"
      .getCookies().then (cookies) ->
        expect(cookies.length).to.eq(3)

  it "issue: #207: does not duplicate or hostOnly cookies as a domain cookie", ->
    cy
      .visit("http://session.foobar.com:2292")
      .getCookies().should("have.length", 1)
      .window().then (win) ->
        new Cypress.Promise (resolve) ->
          xhr = new win.XMLHttpRequest
          xhr.open("GET", "/cookies")
          xhr.send()
          xhr.onload = ->
            resolve(JSON.parse(xhr.response).cookie)
      .then (cookie) ->
        ## there should have been only a single secret-session
        ## request cookie sent on this XHR request
        occurences = Cypress._.compact(cookie.split("secret-session"))
        expect(occurences).to.have.length(1)

  it "correctly sets domain based cookies", ->
    cy
      .visit("http://domain.foobar.com:2292")
      .getCookies().should("have.length", 1)
      .getCookie("nomnom").should("include", {
        domain: ".foobar.com"
        name: "nomnom"
        value: "good"
        path: "/"
        secure: false
        httpOnly: false
      })
      .window().then (win) ->
        new Cypress.Promise (resolve) ->
          xhr = new win.XMLHttpRequest
          xhr.withCredentials = true
          xhr.open("GET", "http://www.foobar.com:2292/cookies")
          xhr.send()
          xhr.onload = ->
            resolve(JSON.parse(xhr.response).cookie)
      .then (cookie) ->
        ## only a single nomnom cookie should have been sent
        ## since we set a domain cookie that matches this request
        expect(cookie).to.eq("nomnom=good")

  it.skip "issue #362: do not set domain based (non hostOnly) cookies by default", ->
    cy
      .setCookie("foobar", "1", {
        domain: "subdomain.foobar.com"
      })

      ## send a request to localhost but get
      ## redirected back to foobar
      .request("http://localhost:2292/redirect")
      .its("body.cookie")
      .should("not.exist")

  it.skip "sets a hostOnly cookie by default", ->
    cy
      ## this should set a hostOnly cookie for
      ## www.foobar.com
      .setCookie("foobar", "1")

      .request("http://domain.foobar.com:2292/cookies")
      .its("body.cookie")
      .should("not.exist")

  it "issue #361: incorrect cookie synchronization between cy.request redirects", ->
    cy
      ## start with a cookie on foobar
      .setCookie("foobar", "1")

      ## send a request to localhost but get
      ## redirected back to foobar
      .request("http://localhost:2292/redirect")
      .its("body.cookie")
      .should("eq", "foobar=1")

  it "issue #362: incorrect cookie synchronization between cy.visit redirects", ->
    cy
      ## start with a cookie on foobar specifically for www
      .setCookie("foobar", "1", {domain: "www.foobar.com"})

      ## send a request to domain.foobar but get
      ## redirected back to www.foobar.com
      .visit("http://domain.foobar.com:2292/domainRedirect")
      .get("#cookie")
      .should("have.text", "foobar=1")

  it "issue #600 can visit between nested subdomains", ->
    cy
      .visit("http://qa.sub.foobar.com:2292")
      .contains("Nested Subdomains")
      .visit("http://staging.sub.foobar.com:2292")
      .contains("Nested Subdomains")
