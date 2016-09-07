describe "redirects + requests", ->
  it "gets and sets cookies from cy.request", ->
    oneMinuteFromNow = Cypress.moment().add(1, "minute").unix()

    cy
      .request("http://localhost:2293/")
      .request("http://localhost:2293/cookies")
        .its("body").should("deep.eq", {
          "2293": "true"
          "2293-session": "true"
        })
      .getCookies().then (cookies) ->
        console.log cookies

        expect(cookies[0].domain).to.eq("localhost")
        expect(cookies[0].name).to.eq("2293")
        expect(cookies[0].value).to.eq("true")
        expect(cookies[0].httpOnly).to.eq(true)
        expect(cookies[0].path).to.eq("/")
        expect(cookies[0].secure).to.eq(false)
        expect(cookies[0].expiry).to.be.closeTo(oneMinuteFromNow, 5)

        expect(cookies[1]).to.deep.eq({
          domain: "localhost"
          name: "2293-session"
          value: "true"
          httpOnly: false
          path: "/"
          secure: false
        })

  it "visits idempotant", ->
    cy
      .visit("http://localhost:2290")
      .url()
        .should("eq", "http://localhost:2292/")
      .request("http://localhost:2290/cookies/one")
        .its("body").should("deep.eq", {"2290": "true"})
      .request("http://localhost:2291/cookies/two")
        .its("body").should("deep.eq", {"2291": "true"})
      .request("http://localhost:2292/cookies/three")
        .its("body").should("deep.eq", {"2292": "true"})
      .request("http://localhost:2292/counts")
        .its("body").should("deep.eq", {
          "localhost:2290": 1
          "localhost:2291": 1
          "localhost:2292": 1
          "localhost:2293": 1 ## from the previous test
        })