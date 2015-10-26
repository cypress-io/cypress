describe "Async Integration Tests", ->
  enterCommandTestingMode()

  context "waiting", ->
    beforeEach ->
      @loadDom("html/async").then =>
        @setup({replaceIframeContents: false})
        @Cypress.trigger "test:before:hooks", {id: 123}
        @Cypress.set @currentTest

    it "will find 'form success' message by default (after retrying)", ->
      @cy
        .visit("/fixtures/html/async.html")
        .server()
        .route("POST", "/users", {})
        .get("input[name=name]").type("brian")
        .get("#submit").click()
        .get("form span").then ($span) ->
          expect($span).to.contain("form success!")

    it "fails without an explicit wait when an element is immediately found", (done) ->
      @allowErrors()

      @cy.on "fail", (err) ->
        done()

      @cy
        .server()
        .route("POST", "/users", {})
        .get("input[name=name]").type("brian")
        .get("#submit").click()
        .get("form").then ($form) ->
          expect($form).to.contain("form success!")

    it "needs an explicit should when an element is immediately found", ->
      @cy
        .server()
        .route("POST", "/users", {})
        .get("input[name=name]").type("brian")
        .get("#submit").click()
        .get("form").should ($form) ->
          expect($form).to.contain("form success!")