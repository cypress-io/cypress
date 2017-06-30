{ EventEmitter } = require("events")

describe "controls", ->
  beforeEach ->
    cy.fixture("runnables").as("runnables")

    @runner = new EventEmitter()

    cy.visit("cypress/support/index.html").then (win) =>
      win.render({
        runner: @runner
        specPath: "/foo/bar"
      })

    cy.get(".reporter").then =>
      @runner.emit("runnables:ready", @runnables)
      @runner.emit("reporter:start", {})

  it "shows reporter", ->
