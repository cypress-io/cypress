/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("cookies", function() {
  beforeEach(() => cy.wrap({foo: "bar"}));

  context("with whitelist", function() {
    before(() =>
      Cypress.Cookies.defaults({
        whitelist: "foo1"
      })
    );

    it("can get all cookies", () =>
      cy
        .clearCookie("foo1")
        .setCookie("foo", "bar").then(function(c) {
          expect(c.domain).to.eq("localhost");
          expect(c.httpOnly).to.eq(false);
          expect(c.name).to.eq("foo");
          expect(c.value).to.eq("bar");
          expect(c.path).to.eq("/");
          expect(c.secure).to.eq(false);
          expect(c.expiry).to.be.a("number");

          return expect(c).to.have.keys(
            "domain", "name", "value", "path", "secure", "httpOnly", "expiry"
          );}).getCookies()
          .should("have.length", 1)
          .then(function(cookies) {
            const c = cookies[0];

            expect(c.domain).to.eq("localhost");
            expect(c.httpOnly).to.eq(false);
            expect(c.name).to.eq("foo");
            expect(c.value).to.eq("bar");
            expect(c.path).to.eq("/");
            expect(c.secure).to.eq(false);
            expect(c.expiry).to.be.a("number");

            return expect(c).to.have.keys(
              "domain", "name", "value", "path", "secure", "httpOnly", "expiry"
            );}).clearCookies()
          .should("be.null")
        .setCookie("wtf", "bob", {httpOnly: true, path: "/foo", secure: true})
        .getCookie("wtf").then(function(c) {
          expect(c.domain).to.eq("localhost");
          expect(c.httpOnly).to.eq(true);
          expect(c.name).to.eq("wtf");
          expect(c.value).to.eq("bob");
          expect(c.path).to.eq("/foo");
          expect(c.secure).to.eq(true);
          expect(c.expiry).to.be.a("number");

          return expect(c).to.have.keys(
            "domain", "name", "value", "path", "secure", "httpOnly", "expiry"
          );}).clearCookie("wtf")
          .should("be.null")
        .getCookie("doesNotExist")
          .should("be.null")
        .document()
          .its("cookie")
          .should("be.empty")
    );

    it("resets cookies between tests correctly", function() {
      Cypress.Cookies.preserveOnce("foo2");

      for (let i = 1; i <= 100; i++) {
        (i => cy.setCookie(`foo${i}`, `${i}`))(i);
      }

      return cy.getCookies().should("have.length", 100);
    });

    it("should be only two left now", () => cy.getCookies().should("have.length", 2));

    return it("handles undefined cookies", () => cy.visit("http://localhost:2121/cookieWithNoName"));
  });

  return context("without whitelist", function() {
    before(() =>
      Cypress.Cookies.defaults({
        whitelist: []
      })
    );

    it("sends cookies to localhost:2121", () =>
      cy
        .clearCookies()
        .setCookie("asdf", "jkl")
        .request("http://localhost:2121/requestCookies")
          .its("body").should("deep.eq", { asdf: "jkl" })
    );

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
    );

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
    );

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
    );

    return it("issue: #2724 does not fail on invalid cookies", () => cy.request('https://localhost:2323/invalidCookies'));
  });
});
