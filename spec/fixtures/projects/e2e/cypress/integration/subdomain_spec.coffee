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