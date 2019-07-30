describe("cookies", () => {
  beforeEach(() => {
    cy.wrap({foo: "bar"})
  })

  context("with whitelist", () => {
    before(() => {
      Cypress.Cookies.defaults({
        whitelist: "foo1"
      })
    })

    it("can get all cookies", () => {
      cy.clearCookie("foo1")
      cy.setCookie("foo", "bar").then((c) => {
        expect(c.domain).to.eq("localhost")
        expect(c.httpOnly).to.eq(false)
        expect(c.name).to.eq("foo")
        expect(c.value).to.eq("bar")
        expect(c.path).to.eq("/")
        expect(c.secure).to.eq(false)
        expect(c.expiry).to.be.a("number")

        expect(c).to.have.keys(
          "domain", "name", "value", "path", "secure", "httpOnly", "expiry"
        )})

      cy.getCookies().should("have.length", 1)
        .then((cookies) => {
          const c = cookies[0]

          expect(c.domain).to.eq("localhost")
          expect(c.httpOnly).to.eq(false)
          expect(c.name).to.eq("foo")
          expect(c.value).to.eq("bar")
          expect(c.path).to.eq("/")
          expect(c.secure).to.eq(false)
          expect(c.expiry).to.be.a("number")

          expect(c).to.have.keys(
            "domain", "name", "value", "path", "secure", "httpOnly", "expiry"
          )})

      cy.clearCookies()
        .should("be.null")
      cy.setCookie("wtf", "bob", {httpOnly: true, path: "/foo", secure: true})
      cy.getCookie("wtf").then((c) => {
        expect(c.domain).to.eq("localhost")
        expect(c.httpOnly).to.eq(true)
        expect(c.name).to.eq("wtf")
        expect(c.value).to.eq("bob")
        expect(c.path).to.eq("/foo")
        expect(c.secure).to.eq(true)
        expect(c.expiry).to.be.a("number")

        expect(c).to.have.keys(
          "domain", "name", "value", "path", "secure", "httpOnly", "expiry"
        )})
      cy.clearCookie("wtf")
        .should("be.null")
      cy.getCookie("doesNotExist")
        .should("be.null")
      cy.document()
        .its("cookie")
        .should("be.empty")
    })

    it("resets cookies between tests correctly", () => {
      Cypress.Cookies.preserveOnce("foo2")

      for (let i = 1; i <= 100; i++) {
        (i => {
          cy.setCookie(`foo${i}`, `${i}`)
        })(i)
      }

      cy.getCookies().should("have.length", 100)
    })

    it("should be only two left now", () => {
      cy.getCookies().should("have.length", 2)
    })

    it("handles undefined cookies", () => {
      cy.visit("http://localhost:2121/cookieWithNoName")
    })
  })

  context("without whitelist", () => {
    before(() => {
      Cypress.Cookies.defaults({
        whitelist: []
      })
    })

    it("sends cookies to localhost:2121", () => {
      cy.clearCookies()
      cy.setCookie("asdf", "jkl")
      cy.request("http://localhost:2121/requestCookies")
        .its("body").should("deep.eq", { asdf: "jkl" })
    })

    it("handles expired cookies secure", () =>
      cy
        .visit("http://localhost:2121/set")
        .getCookie("shouldExpire").should("exist")
        .visit("http://localhost:2121/expirationMaxAge")
        .getCookie("shouldExpire").should("not.exist")
        .visit("http://localhost:2121/set")
        .getCookie("shouldExpire").should("exist")
        .visit("http://localhost:2121/expirationExpires")
        .getCookie("shouldExpire").should("not.exist")
    )

    it("issue: #224 sets expired cookies between redirects", () =>
      cy
        .visit("http://localhost:2121/set")
        .getCookie("shouldExpire").should("exist")
        .visit("http://localhost:2121/expirationRedirect")
        .url().should("include", "/logout")
        .getCookie("shouldExpire").should("not.exist")

        .visit("http://localhost:2121/set")
        .getCookie("shouldExpire").should("exist")
        .request("http://localhost:2121/expirationRedirect")
        .getCookie("shouldExpire").should("not.exist")
    )

    it("issue: #1321 failing to set or parse cookie", () =>
      //# this is happening because the original cookie was set
      //# with a secure flag, and then expired without the secure
      //# flag.
      cy
        .visit("https://localhost:2323/setOneHourFromNowAndSecure")
        .getCookies().should("have.length", 1)

        //# secure cookies should have been attached
        .request("https://localhost:2323/requestCookies")
          .its("body").should("deep.eq", { shouldExpire: "oneHour" })

        //# secure cookies should not have been attached
        .request("http://localhost:2121/requestCookies")
          .its("body").should("deep.eq", {})

        .visit("https://localhost:2323/expirationMaxAge")
        .getCookies().should("be.empty")
    )

    return it("issue: #2724 does not fail on invalid cookies", () => cy.request('https://localhost:2323/invalidCookies'))
  })
})
