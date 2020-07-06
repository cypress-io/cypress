Cypress.Cookies.defaults({
  preserve: "foo1"
})

describe "Cookies", ->
  beforeEach ->
    cy.wrap({foo: "bar"})

  it "can get all cookies", ->
    cy
      .setCookie("foo", "bar").then (c) ->
        expect(c.domain).to.eq("localhost")
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

          expect(c.domain).to.eq("localhost")
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
        expect(c.domain).to.eq("localhost")
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
    beforeEach ->
      Cypress.Cookies.preserveOnce("foo2")

    for i in [1..100]
      do (i) ->
        cy.setCookie("foo" + i, "#{i}")

    cy.getCookies().should("have.length", 100)

  it "should be zero now", ->
    cy.getCookies().should("have.length", 2)

  it "sends cookies to localhost:2121", ->
    cy
      .clearCookies()
      .setCookie("asdf", "jkl")
      .request("http://localhost:2121/foo")
        .its("body").should("deep.eq", {foo1: "1", asdf: "jkl"})
      .setCookie("wow", "bob", {domain: "brian.dev.local"})
      .request({
        url: "http://localhost:2121/foo",
        domain: "brian.dev.local"
      })
      .its("body").should("deep.eq", {wow: "bob"})
  