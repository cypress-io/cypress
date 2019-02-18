{ EventEmitter } = require("events")

describe "controls", ->
  beforeEach ->
    cy.fixture("controls_runnables").as("runnables")

    @runner = new EventEmitter()

    cy.visit("cypress/support/index.html").then (win) =>
      win.render({
        runner: @runner
        specPath: "/foo/bar"
      })

    cy.get(".reporter").then =>
      @runner.emit("runnables:ready", @runnables)
      @runner.emit("reporter:start", {})

  describe "responsive design", ->
    describe ">= 400px wide", ->
      it "shows 'Tests'", ->
        cy.get(".focus-tests span").should("be.visible")

    describe "< 400px wide", ->
      beforeEach ->
        cy.viewport(399, 450)

      it "hides 'Tests'", ->
        cy.get(".focus-tests span").should("not.be.visible")
