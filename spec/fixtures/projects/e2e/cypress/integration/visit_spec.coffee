describe "visits", ->
  it "scrolls automatically to div with id=foo", ->
    cy
      .visit("/hash.html#foo")
      .window().its("scrollY").should("eq", 1000)

  it "can load an http page with a huge amount of elements without timing out", ->
    cy.visit("http://localhost:3434/elements.html", {timeout: 5000})

  it "can load a local file with a huge amount of elements without timing out", ->
    cy.visit("/elements.html", {timeout: 5000})

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

      cy.private("$remoteIframe").on "load", =>
        urls.push cy.private("window").location.href

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