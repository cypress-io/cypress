{ EventEmitter } = require("events")
_ = Cypress._

addLog = (runner, log) ->
  defaultLog = {
    event: false
    hookName: "test"
    id: _.uniqueId('l')
    instrument: "command"
    renderProps: {}
    state: "passed"
    testId: "r3"
    type: "parent"
    url: "http://example.com"
  }

  runner.emit("reporter:log:add", _.extend(defaultLog, log))

describe "aliases", ->
  beforeEach ->
    cy.fixture("aliases_runnables").as("runnables")

    @runner = new EventEmitter()

    cy.visit("cypress/support/index.html").then (win) =>
      win.render({
        runner: @runner
        specPath: "/foo/bar"
      })

    cy.get(".reporter").then =>
      @runner.emit("runnables:ready", @runnables)
      @runner.emit("reporter:start", {})


  describe "without duplicates", ->
    beforeEach ->
      addLog(@runner, {
        alias: "getUsers"
        aliasType: "route"
        displayName: "xhr stub"
        event: true
        name: "xhr"
        renderProps: {message: "GET --- /users", indicator: "passed"}
      })
      addLog(@runner, {
        aliasType: "route"
        message: "@getUsers, function(){}"
        name: "wait"
        referencesAlias: [{
          cardinal: 1
          name: "getUsers"
          ordinal: "1st"
        }],
      })

    it "render without a count", ->
      cy.contains('.command-number', '1')
        .parent()
        .within ->
          cy.get('.command-alias-count').should('not.exist')
          cy.contains('.command-alias', '@getUsers')
            .trigger("mouseover")

      cy.get(".tooltip span").should ($tooltip) ->
        expect($tooltip).to.contain("Found an alias for: 'getUsers'")

  describe "with consecutive duplicates", ->
    beforeEach ->
      addLog(@runner, {
        alias: "getPosts"
        aliasType: "route"
        displayName: "xhr stub"
        event: true
        name: "xhr"
        renderProps: {message: "GET --- /posts", indicator: "passed"}
      })
      addLog(@runner, {
        alias: "getPosts"
        aliasType: "route"
        displayName: "xhr stub"
        event: true
        name: "xhr"
        renderProps: {message: "GET --- /posts", indicator: "passed"}
      })
      addLog(@runner, {
        aliasType: "route"
        message: "@getPosts, function(){}"
        name: "wait"
        referencesAlias: [{
          cardinal: 1
          name: "getPosts"
          ordinal: "1st"
        }],
      })
      addLog(@runner, {
        aliasType: "route"
        message: "@getPosts, function(){}"
        name: "wait"
        referencesAlias: [{
          cardinal: 2
          name: "getPosts"
          ordinal: "2nd"
        }],
      })

    it "render with counts in non-event commands", ->
      cy.contains('.command-number', '1')
        .parent()
        .within ->
          cy.contains('.command-alias-count', '1')
          cy.contains('.command-alias', '@getPosts')
            .trigger("mouseover")

      cy.get(".tooltip span").should ($tooltip) ->
        expect($tooltip).to.contain("Found 1st alias for: 'getPosts'")

      cy.contains('.command-number', '2')
        .parent()
        .within ->
          cy.contains('.command-alias-count', '2')
          cy.contains('.command-alias', '@getPosts')
            .trigger("mouseover")

      cy.get(".tooltip span").should ($tooltip) ->
        expect($tooltip).to.contain("Found 2nd alias for: 'getPosts'")

    it "render with counts in event commands when collapsed", ->
      cy.get(".command-wrapper")
        .first()
        .within ->
          cy.contains('.num-duplicates', '2')
          cy.contains('.command-alias', 'getPosts')

    it "render without counts in event commands when expanded", ->
      cy.get(".command-expander")
        .first()
        .click()

      cy.get(".command-wrapper")
        .first()
        .within ($commandWrapper) ->
          cy.get('.num-duplicates').should('not.be.visible')
          cy.contains('.command-alias', 'getPosts')

  describe "with non-consecutive duplicates", ->
    beforeEach ->
      addLog(@runner, {
        alias: "getPosts"
        aliasType: "route"
        displayName: "xhr stub"
        event: true
        name: "xhr"
        renderProps: {message: "GET --- /posts", indicator: "passed"}
      })
      addLog(@runner, {
        alias: "getUsers"
        aliasType: "route"
        displayName: "xhr stub"
        event: true
        name: "xhr"
        renderProps: {message: "GET --- /users", indicator: "passed"}
      })
      addLog(@runner, {
        alias: "getPosts"
        aliasType: "route"
        displayName: "xhr stub"
        event: true
        name: "xhr"
        renderProps: {message: "GET --- /posts", indicator: "passed"}
      })
      addLog(@runner, {
        aliasType: "route"
        message: "@getPosts, function(){}"
        name: "wait"
        referencesAlias: [{
          cardinal: 1
          name: "getPosts"
          ordinal: "1st"
        }],
      })
      addLog(@runner, {
        aliasType: "route"
        message: "@getUsers, function(){}"
        name: "wait"
        referencesAlias: [{
          cardinal: 1
          name: "getUsers"
          ordinal: "1st"
        }],
      })
      addLog(@runner, {
        aliasType: "route"
        message: "@getPosts, function(){}"
        name: "wait"
        referencesAlias: [{
          cardinal: 2
          name: "getPosts"
          ordinal: "2nd"
        }],
      })

    it "render with counts", ->
      cy.contains('.command-number', '1')
        .parent()
        .within ->
          cy.contains('.command-alias-count', '1')
          cy.contains('.command-alias', '@getPosts')
            .trigger("mouseover")

      cy.get(".tooltip span").should ($tooltip) ->
        expect($tooltip).to.contain("Found 1st alias for: 'getPosts'")

      cy.contains('.command-number', '3')
        .parent()
        .within ->
          cy.contains('.command-alias-count', '2')
          cy.contains('.command-alias', '@getPosts')
            .trigger("mouseover")

      cy.get(".tooltip span").should ($tooltip) ->
        expect($tooltip).to.contain("Found 2nd alias for: 'getPosts'")
