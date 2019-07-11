describe "s1", ->
  context "without an afterEach hook", ->
    beforeEach ->
      cy
        .server()
        .visit("/js_errors.html")
        .get("body")

    ## fail
    it "t1", ->
      cy
        .get(".ref")
        .click()
        .should("have.class", "active")

    ## fail
    it "t2", ->
      cy
        .route(/foo/, "foo html").as("getFoo")
        .get(".xhr").click()
        .wait("@getFoo")
        .get(".xhr").should("have.class", "active")

    ## pass
    it "t3", ->
      cy.get("body")

  context "with an afterEach hook", ->
    runs = []

    beforeEach ->
      cy
        .server()
        .visit("/js_errors.html")
        .get("body")

    afterEach ->
      cy.wrap({}).then ->
        runs.push(true)

    ## fail
    it "t4", ->
      cy
        .get(".ref")
        .click()
        .should("have.class", "active")

    ## fail
    it "t5", ->
      cy.then ->
        throw new Error("baz")

    ## pass
    it "t6", ->
      ## should have runs two afterEach's
      expect(runs).to.have.length(2)

  context "cross origin script errors", ->
    ## fail
    it "explains where script errored", ->
      cy
        .visit("/cross_origin_script.html")
        .then ->
          throw new Error("should have failed but did not")

  context "bad gzipped content", ->
    it "destroys the request socket", ->
      cy
      .visit("http://localhost:1123/index.html")
      .then (win) ->
        new Cypress.Promise (resolve) ->
          script = win.document.createElement("script")
          script.src = "/gzip-bad.js"
          script.onerror = resolve
          win.document.body.appendChild(script)
