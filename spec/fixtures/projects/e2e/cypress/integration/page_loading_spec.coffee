describe "page_loading", ->
  it "sets __cypress.initial, properly injects, and avoids json injection", ->
    ## this tests that __cypress.initial is set correctly whilst navigating
    ## between pages, or during cy.reload
    ## additionally this creates an edge case where after __cypress.initial is
    ## set we send an XHR which should not inject because its requested for JSON
    ## but that another XHR which is requested for html should inject
      promise1 = Cypress.Promise.pending()
      promise2 = Cypress.Promise.pending()

      cy
        .visit("http://localhost:1717/first")
        .get("h1").should("contain", "first")
        .get("a").click()
        .url().should("match", /second/)
        .get("h1").should("contain", "second")
        .get("#count").should("contain", 1)
        .reload(true) ## force hard reload to increment count
        .get("#count").should("contain", 2)
        .window().then (win) ->
          a = Cypress.$("a")
          a.click ->
            ## we are delaying here because normally when cypress
            ## detects page:loading event it will cancel all outstanding
            ## XHR requests.
            ## so by delaying we force those to go out correctly
            Cypress.Promise
            .delay(500)
            .then ->
              xhr1 = new win.XMLHttpRequest
              xhr1.open("POST", "/json")
              xhr1.setRequestHeader("Content-Type", "application/json")
              xhr1.onload = ->
                promise1.resolve(JSON.parse(xhr1.response))
              xhr1.send(JSON.stringify({foo: "bar"}))

              xhr2 = new win.XMLHttpRequest
              xhr2.open("GET", "/html")
              xhr2.onload = ->
                promise2.resolve(xhr2.response)
              xhr2.send()
        .get("a").click()
        .then ->
          Cypress.Promise.all([promise1.promise, promise2.promise])
        .spread (resp1, resp2) ->
          expect(resp1).to.deep.eq({body: {foo: "bar"}})

          expect(resp2).to.include("document.domain = 'localhost'")
          expect(resp2).to.include("content")

  describe "issue #258: opener is undefined during snapshot", ->
    it "causes the xhr to be aborted while in flight", ->
      cy
        .visit("http://localhost:1717/form")
        .get("form").submit()
