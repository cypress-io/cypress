md5 = require("md5")

describe "Settings", ->
  beforeEach ->
    @firstProjectName = "My-Fake-Project"

    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win
        @agents = cy.agents()
        @ipc.handle("get:options", null, {})
        @agents.spy(@App, "ipc")
      .fixture("ci_keys").as("ciKeys")
      .fixture("user").then (@user) ->
        @ipc.handle("get:current:user", null, @user)
      .fixture("projects").as("projects")
      .fixture("projects_statuses").as("projectStatuses")

  describe "any case / project is set up for ci", ->
    beforeEach ->
      cy.then ->
        @ipc.handle("get:projects", null, @projects)
      .get(".projects-list a")
        .contains("My-Fake-Project").click()
      .fixture("browsers").as("browsers")
      .fixture("config").then (@config) ->
        @ipc.handle("open:project", null, @config)
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
      cy.contains("CI Keys allow you to").should("not.exist")

    describe "when config panel is opened", ->
      beforeEach ->
        cy.contains("Resolved Configuration").click()

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
            .contains("*.foobar.com")

      it "opens help link on click", ->
        cy
          .get(".fa-info-circle").first().click().then ->
            expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/guides/configuration")

    describe "when ci keys panels is opened", ->
      beforeEach ->
        cy.contains("CI Keys").click()

      it "displays ci keys section", ->
        cy.contains("CI Keys allow you to")

      it "opens ci guide when learn more is clicked", ->
        cy
          .get(".config-ci-keys").contains("Learn More").click().then ->
            expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/guides/continuous-integration")

      it "loads the project's ci keys", ->
        expect(@App.ipc).to.be.calledWith("get:ci:keys")

      it "shows spinner", ->
        cy.get(".config-ci-keys .fa-spinner")

      it "opens admin project settings when ci keys link is clicked", ->
        cy
          .get(".config-ci-keys").contains("Add or Remove CI Keys").click().then ->
            expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/dashboard/projects/#{@config.projectId}/settings")

      describe "when ci keys load", ->
        beforeEach ->
          @ipc.handle("get:ci:keys", null, @ciKeys)

        it "displays first CI key", ->
          cy
            .get(".config-ci-keys").contains("cypress ci " + @ciKeys[0].id)

      describe "when there are no keys", ->
        beforeEach ->
          @ipc.handle("get:ci:keys", null, [])

        it "does not display cypress ci command", ->
          cy
            .get(".config-ci-keys").should("not.contain", "cypress ci")

    context "on config changes", ->
      beforeEach ->
        cy
          .then ->
            @config.clientUrl = "http://localhost:8888"
            @config.clientUrlDisplay = "http://localhost:8888"
            @config.browsers = @browsers

            @ipc.handle("open:project", null, @config)

        cy.contains("Settings")
        cy.contains("Resolved Configuration").click()

      it "displays updated config", ->
        @config.resolved.baseUrl.value = "http://localhost:7777"

        @ipc.handle("open:project", null, @config)

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

          @ipc.handle("open:project", null, @config)

          cy
            .contains("http://localhost:7777")
            .then ->
              @ipc.handle("open:project", @err, {})

        it "displays errors", ->
          cy.contains("Can't start server")

        it "displays config after error is fixed.", ->
          cy
            .contains("Can't start server").then ->
              @ipc.handle("open:project", null, @config)
          cy.contains("Settings")

    context "on:focus:tests clicked", ->
      beforeEach ->
        cy
          .contains("Settings")

      it "routes to specs page", ->
        @ipc.handle("on:focus:tests")
        cy
          .location().then (location) ->
            expect(location.href).to.include("projects")
            expect(location.href).to.include(md5(@projects[0].path))
            expect(location.href).to.include("specs")

  context "when project is not set up for CI", ->
    it "does not show ci Keys section when project has no id", ->
      cy.then ->
        @projects[0].id = null
        @ipc.handle("get:projects", null, @projects)
      .get(".projects-list a")
        .contains("My-Fake-Project").click()
      .fixture("browsers").as("browsers")
      .fixture("config").then (@config) ->
        @config.projectId = null
        @ipc.handle("open:project", null, @config)
      .get(".navbar-default")
      .get("a").contains("Settings").click()
      .end().contains("h5", "CI Keys").should("not.exist")

    it "does not show ci Keys section when project is invalid", ->
      cy.then ->
        @ipc.handle("get:projects", null, @projects)
      .then ->
        @projectStatuses[0].valid = false
        @ipc.handle("get:project:statuses", null, @projectStatuses)
      .get(".projects-list a")
        .contains("My-Fake-Project").click()
      .fixture("browsers").as("browsers")
      .fixture("config").then (@config) ->
        @ipc.handle("open:project", null, @config)
      .get(".navbar-default")
      .get("a").contains("Settings").click()
      .end().contains("h5", "CI Keys").should("not.exist")
