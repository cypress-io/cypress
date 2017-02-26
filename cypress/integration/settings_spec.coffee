md5 = require("md5")
{deferred, stubIpc} = require("../support/util")

describe "Settings", ->
  beforeEach ->
    @firstProjectName = "My-Fake-Project"

    cy
      .visit("/")
      .fixture("keys").as("keys")
      .fixture("user").as("user")
      .fixture("config").as("config")
      .fixture("browsers").as("browsers")
      .fixture("projects").as("projects")
      .fixture("projects_statuses").as("projectStatuses")
      .fixture("runs").as("runs")
      .window().then (win) ->
        {@App} = win
        cy.stub(@App, "ipc").as("ipc")

        @getRecordKeys = deferred()
        @getProjectStatuses = deferred()

        stubIpc(@App.ipc, {
          "get:options": (stub) => stub.resolves({})
          "get:current:user": (stub) => stub.resolves(@user)
          "updater:check": (stub) => stub.resolves(false)
          "get:projects": (stub) => stub.resolves(@projects)
          "get:project:statuses": (stub) => stub.returns(@getProjectStatuses.promise)
          "open:project": (stub) => stub.yields(null, @config)
          "get:record:keys": (stub) => stub.returns(@getRecordKeys.promise)
          "get:builds": (stub) => stub.resolves(@runs)
          "get:orgs": (stub) => stub.resolves([])
        })

        @App.start()

  describe "any case / project is set up for ci", ->
    beforeEach ->
      @getProjectStatuses.resolve(@projectStatuses)
      cy
      .get(".projects-list a")
        .contains("My-Fake-Project").click()
      .get(".navbar-default")
      .get("a").contains("Settings").click()

    it "navigates to settings page", ->
      cy
        .location().its("hash").should("include", "config")

    it "highlight settings nav", ->
      cy
        .contains("a", "Settings").should("have.class", "active")

    it "collapses panels by default", ->
      cy.contains("Your project's configuration is displayed").should("not.exist")
      cy.contains("Record Keys allow you to").should("not.exist")
      cy.contains(@config.projectId).should("not.exist")

    describe "when config panel is opened", ->
      beforeEach ->
        cy.contains("Configuration").click()

      it "displays config section", ->
        cy.contains("Your project's configuration is displayed")

      it "displays legend in table", ->
        cy.get("table>tbody>tr").should("have.length", 5)

      it "wraps config line in proper classes", ->
        cy
          .get(".line").first().within ->
            cy
              .contains("animationDistanceThreshold").should("have.class", "key").end()
              .contains(":").should("have.class", "colon").end()
              .contains("5").should("have.class", "default").end()
              .contains(",").should("have.class", "comma")

      it "displays 'true' values", ->
        cy.get(".line").contains("true")

      it "displays 'null' values", ->
        cy.get(".line").contains("null")

      it "displays 'object' values for environmentVariables and hosts", ->
        cy
          .get(".nested").first()
            .contains("fixturesFolder")
          .get(".nested").eq(1)
            .contains("*.asdf.com")

      it "opens help link on click", ->
        cy
          .get(".fa-info-circle").first().click().then ->
            expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/guides/configuration")

    describe "when project id panel is opened", ->
      beforeEach ->
        cy.contains("Project ID").click()

      it "displays project id section", ->
        cy.contains(@config.projectId)

    describe "when record keys panels is opened", ->
      beforeEach ->
        cy.contains("Record Key").click()

      it "displays record keys section", ->
        cy.contains("A Record Key sends")

      it "opens ci guide when learn more is clicked", ->
        cy
          .get(".config-record-keys").contains("Learn More").click().then ->
            expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/what-is-a-record-key")

      it "loads the project's record keys", ->
        expect(@App.ipc).to.be.calledWith("get:record:keys")

      it "shows spinner", ->
        cy.get(".config-record-keys .fa-spinner")

      it "opens admin project settings when record keys link is clicked", ->
        cy
          .get(".config-record-keys").contains("You can change").click().then ->
            expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/dashboard/projects/#{@config.projectId}/settings")

      describe "when record keys load", ->
        beforeEach ->
          @getRecordKeys.resolve(@keys)

        it "displays first Record Key", ->
          cy
            .get(".config-record-keys").contains("cypress run --record --key " + @keys[0].id)

      describe "when there are no keys", ->
        beforeEach ->
          @getRecordKeys.resolve([])

        it "does not display cypress run command", ->
          cy
            .get(".config-record-keys").should("not.contain", "cypress run")

    context "on config changes", ->
      beforeEach ->
        cy
          .then ->
            @config.clientUrl = "http://localhost:8888"
            @config.clientUrlDisplay = "http://localhost:8888"
            @config.browsers = @browsers
            @App.ipc.withArgs("open:project").yield(null, @config)

        cy.contains("Settings")
        cy.contains("Configuration").click()

      it "displays updated config", ->
        @config.resolved.baseUrl.value = "http://localhost:7777"

        @App.ipc.withArgs("open:project").yield(null, @config)

        cy.contains("http://localhost:7777")

      describe "errors", ->
        beforeEach ->
          @err = {
            message: "Port '2020' is already in use."
            name: "Error"
            port: 2020
            portInUse: true
            stack: "[object Object]↵  at Object.API.get (/Users/jennifer/Dev/Projects/cypress-app/lib/errors.coffee:55:15)↵  at Object.wrapper [as get] (/Users/jennifer/Dev/Projects/cypress-app/node_modules/lodash/lodash.js:4414:19)↵  at Server.portInUseErr (/Users/jennifer/Dev/Projects/cypress-app/lib/server.coffee:58:16)↵  at Server.onError (/Users/jennifer/Dev/Projects/cypress-app/lib/server.coffee:86:19)↵  at Server.g (events.js:273:16)↵  at emitOne (events.js:90:13)↵  at Server.emit (events.js:182:7)↵  at emitErrorNT (net.js:1253:8)↵  at _combinedTickCallback (internal/process/next_tick.js:74:11)↵  at process._tickDomainCallback (internal/process/next_tick.js:122:9)↵From previous event:↵    at fn (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:57919:14)↵    at Object.appIpc [as ipc] (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:57939:10)↵    at openProject (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:59135:24)↵    at new Project (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:58848:34)↵    at ReactCompositeComponentMixin._constructComponentWithoutOwner (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44052:27)↵    at ReactCompositeComponentMixin._constructComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44034:21)↵    at ReactCompositeComponentMixin.mountComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:43953:21)↵    at Object.ReactReconciler.mountComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:51315:35)↵    at ReactCompositeComponentMixin.performInitialMount (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44129:34)↵    at ReactCompositeComponentMixin.mountComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44016:21)↵    at Object.ReactReconciler.mountComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:51315:35)↵    at ReactDOMComponent.ReactMultiChild.Mixin._mountChildAtIndex (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:50247:40)↵    at ReactDOMComponent.ReactMultiChild.Mixin._updateChildren (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:50163:43)↵    at ReactDOMComponent.ReactMultiChild.Mixin.updateChildren (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:50123:12)↵    at ReactDOMComponent.Mixin._updateDOMChildren (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:45742:12)↵    at ReactDOMComponent.Mixin.updateComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:45571:10)↵    at ReactDOMComponent.Mixin.receiveComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:45527:10)↵    at Object.ReactReconciler.receiveComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:51396:22)↵    at ReactCompositeComponentMixin._updateRenderedComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44547:23)"
            type: "PORT_IN_USE_SHORT"
          }

          @config.resolved.baseUrl.value = "http://localhost:7777"

          @App.ipc.withArgs("open:project").yield(null, @config)

          cy
            .contains("http://localhost:7777")
            .then ->
              @App.ipc.withArgs("open:project").yield(@err)

        it "displays errors", ->
          cy.contains("Can't start server")

        it "displays config after error is fixed", ->
          cy.contains("Can't start server").then ->
            @App.ipc.withArgs("open:project").yield(null, @config)
          cy.contains("Settings")

    context "on:focus:tests clicked", ->
      beforeEach ->
        cy
          .contains("Settings")
          .then =>
            @App.ipc.withArgs("on:focus:tests").yield()

      it "routes to specs page", ->
        cy
          .location().then (location) ->
            expect(location.href).to.include("projects")
            expect(location.href).to.include(md5(@projects[0].path))
            expect(location.href).to.include("specs")

  context "when project is not set up for CI", ->
    it "does not show ci Keys section when project has no id", ->
      @config.projectId = null
      @App.ipc.withArgs("open:project").yields(null, @config)
      @getProjectStatuses.resolve(@projectStatuses)
      cy
        .get(".projects-list a")
          .contains("My-Fake-Project").click()
        .get(".navbar-default")
        .get("a").contains("Settings").click()

      cy.contains("h5", "Record Keys").should("not.exist")

    it "does not show ci Keys section when project is invalid", ->
      @projectStatuses[0].valid = false
      @getProjectStatuses.resolve(@projectStatuses)
      cy
        .get(".projects-list a")
          .contains("My-Fake-Project").click()
        .get(".navbar-default")
        .get("a").contains("Settings").click()

      cy.contains("h5", "Record Keys").should("not.exist")

  context "when you are not a user of this project's org", ->
    it "does not show record key", ->
      @projectStatuses[0].state = 'UNAUTHORIZED'
      @App.ipc.withArgs("open:project").yields(null, @config)
      @getProjectStatuses.resolve(@projectStatuses)

      cy
        .get(".projects-list a")
          .contains("My-Fake-Project").click()
        .get(".navbar-default")
        .get("a").contains("Settings").click()

      cy.contains("h5", "Record Keys").should("not.exist")
