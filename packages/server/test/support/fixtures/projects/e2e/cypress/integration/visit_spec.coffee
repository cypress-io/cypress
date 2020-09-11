describe "visits", ->
  it "scrolls automatically to div with id=foo", ->
    cy
      .visit("/hash.html#foo")
      .window().its("scrollY").should("eq", 1000)

  it "can load an http page with a huge amount of elements without timing out", ->
    cy.visit("http://localhost:3434/elements.html", {timeout: 5000})

  it "can load a local file with a huge amount of elements without timing out", ->
    cy.visit("/elements.html", {timeout: 5000})

  ## https://github.com/cypress-io/cypress/issues/5602
  it "can load a website which uses invalid HTTP header chars", ->
    cy.visit("http://localhost:3434/invalid-header-char")
    .contains('foo')

  ## https://github.com/cypress-io/cypress/issues/5446
  it "can load a site via TLSv1", ->
    cy.visit("https://localhost:6776")

  context "issue #225: hash urls", ->
    rand = Math.random()

    it "can visit a hash url and loads", ->
      cy
        .visit("/hash.html#foo", {timeout: 5000})
        .window().then (win) ->
          win[rand] = true

    it "can visit the same hash url and loads", ->
      cy
        .visit("/hash.html#foo", {timeout: 5000})
        .window().then (win) ->
          expect(win[rand]).to.be.undefined

    it "can visit a different hash url and loads", ->
      count = 0
      urls = []

      {origin} = Cypress.Location.create(window.location.href)

      cy.on "window:load", ->
        urls.push cy.getRemoteLocation("href")

        count += 1

      cy
        ## about:blank yes (1)
        .visit("/hash.html?foo#bar") ## yes (2)
        .visit("/hash.html?foo#foo") ## no (2)
        .window().its("scrollY").should("eq", 1000)
        .visit("/hash.html?bar#bar") ## yes (3)
        .window().its("scrollY").should("eq", 0)
        .visit("/index.html?bar#bar") ## yes (4)
        .visit("/index.html?baz#bar") ## yes (5)
        .visit("/index.html#bar") ## yes (6)
        .visit("/index.html") ## yes (7)
        .visit("/index.html#baz") ## no (7)
        .visit("/index.html#") ## no (7)
        .then ->
          expect(count).to.eq(7)
          expect(urls).to.deep.eq([
            "about:blank"
            origin + "/hash.html?foo#bar"
            origin + "/hash.html?bar#bar"
            origin + "/index.html?bar#bar"
            origin + "/index.html?baz#bar"
            origin + "/index.html#bar"
            origin + "/index.html"
          ])

  context "issue #230: User Agent headers", ->
    beforeEach ->
      cy.visit("http://localhost:3434/agent.html")

    it "submits user agent on cy.visit", ->
      cy.get("#agent").invoke("text").then (text) ->
        ua = JSON.parse(text)

        expect(navigator.userAgent).to.deep.eq(ua.source)

    it "submits user agent on page load", ->
      cy
        .get("a").click()
        .get("#agent").invoke("text").then (text) ->
          ua = JSON.parse(text)

          expect(navigator.userAgent).to.deep.eq(ua.source)

    it "submits user agent on cy.request", ->
      cy
        .request("http://localhost:3434/agent.json")
        .its("body")
        .then (body) ->
          expect(navigator.userAgent).to.deep.eq(body.agent.source)

  context "issue #255: url with like two domain", ->
    it "passes", ->
      cy
        .visit("http://localhost:3434/index.html")
        .visit("http://localhost:3434/jquery.html?email=brian@cypress.io")

  context "issue #309: request accept header not set", ->
    it "sets accept header to text/html,*/*", ->
      cy
        .visit("http://localhost:3434/headers.html")
        .get("#headers").invoke("text").then (text) ->
          headers = JSON.parse(text)

          expect(headers.accept).to.eq("text/html,*/*")
          expect(headers.host).to.eq("localhost:3434")

  # https://github.com/cypress-io/cypress/issues/8544
  context "can be redirected from initial POST", ->
    it "with status code 307", ->
      # 307 is slightly different, the request method must not change
      cy.visit({
        url: "http://localhost:3434/redirect-post?code",
        qs: {
          code: 307
        },
        method: 'POST'
      })
      .contains('it posted')

    [301, 302, 303, 308].forEach (code) ->
      it "with status code #{code}", ->
        cy.visit({
          url: "http://localhost:3434/redirect-post?code",
          qs: {
            code
          },
          method: 'POST'
        })
        .contains('timeout: 0')
