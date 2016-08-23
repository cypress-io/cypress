describe "redirects + requests", ->
  it "gets and sets cookies from cy.request", ->
    oneMinuteFromNow = Cypress.moment().add(1, "minute").unix()

    cy
      .request("http://localhost:2223/")
      .request("http://localhost:2223/cookies")
        .its("body").should("deep.eq", {
          "2223": "true"
          "2223-session": "true"
        })
      .getCookies().then (cookies) ->
        console.log cookies

        expect(cookies[0].domain).to.eq("localhost")
        expect(cookies[0].name).to.eq("2223")
        expect(cookies[0].value).to.eq("true")
        expect(cookies[0].httpOnly).to.eq(true)
        expect(cookies[0].path).to.eq("/")
        expect(cookies[0].secure).to.eq(false)
        expect(cookies[0].expiry).to.be.closeTo(oneMinuteFromNow, 1)

        expect(cookies[1]).to.deep.eq({
          domain: "localhost"
          name: "2223-session"
          value: "true"
          httpOnly: false
          path: "/"
          secure: false
        })

  it "visits idempotant", ->
    cy
      .visit("http://localhost:2220")
      .url()
        .should("eq", "http://localhost:2222/")
      .request("http://localhost:2220/cookies/one")
        .its("body").should("deep.eq", {"2220": "true"})
      .request("http://localhost:2221/cookies/two")
        .its("body").should("deep.eq", {"2221": "true"})
      .request("http://localhost:2222/cookies/three")
        .its("body").should("deep.eq", {"2222": "true"})
      .request("http://localhost:2222/counts")
        .its("body").should("deep.eq", {
          "localhost:2220": 1
          "localhost:2221": 1
          "localhost:2222": 1
          "localhost:2223": 1 ## from the previous test
        })