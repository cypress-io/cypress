{ EventEmitter } = require("events")

# TODO convert to JS, idk why it wasn't working
describe "test errors", ->
  beforeEach ->
    cy.fixture("test-error-runnables").as("runnables")

    @runner = new EventEmitter()

    cy.visit("cypress/support/index.html").then (win) =>
      win.render({
        runner: @runner
        specPath: "/foo/bar"
      })

    cy.get(".reporter").then =>
      @runner.emit("runnables:ready", @runnables)
      @runner.emit("reporter:start", {})

  describe "exist", ->
    it "renders markdown", ->
      cy.get(".test-error")
        .should("not.contain", "**markdown**")
        .contains("strong", "markdown")

    it "converts on.cypress.io URLs to links", ->
      cy.get(".test-error a").should("have.length", 1)
      cy.get(".test-error")
        .contains("a", "https://on.cypress.io/hover")

    it "doesn't convert non-on.cypress.io URLs to links", ->
      cy.get(".test-error a")
        .should("not.contain", "https://example.com")
