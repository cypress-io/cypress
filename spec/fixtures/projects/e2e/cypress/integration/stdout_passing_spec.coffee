describe "stdout_passing_spec", ->
  context "file", ->
    it "visits file", ->
      cy.visit("/index.html")

  context "google", ->
    it "visits google", ->
      cy.visit("https://www.google.com")

    it "google2", ->

  context "apple", ->
    it "apple1", ->

    it "visits apple", ->
      cy.visit("https://www.apple.com")

  context "subdomains", ->
    it "cypress1", ->

    it "visits cypress", ->
      cy
        .visit("https://www.cypress.io")
        .visit("https://docs.cypress.io")

    it "cypress3", ->