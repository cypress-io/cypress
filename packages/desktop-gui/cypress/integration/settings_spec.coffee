describe "Settings", ->
  beforeEach ->
    cy.fixture("user").as("user")
    cy.fixture("config").as("config")
    cy.fixture("projects").as("projects")
    cy.fixture("projects_statuses").as("projectStatuses")
    cy.fixture("specs").as("specs")
    cy.fixture("runs").as("runs")
    cy.fixture("keys").as("keys")

    @goToSettings = ->
      cy
        .get(".navbar-default")
        .get("a").contains("Settings").click()

    cy.visitIndex().then (win) ->
      { start, @ipc } = win.App

      cy.stub(@ipc, "getOptions").resolves({projectRoot: "/foo/bar"})
      cy.stub(@ipc, "getCurrentUser").resolves(@user)
      cy.stub(@ipc, "updaterCheck").resolves(false)
      cy.stub(@ipc, "getSpecs").yields(null, @specs)
      cy.stub(@ipc, "closeBrowser").resolves()
      cy.stub(@ipc, "closeProject").resolves()
      cy.stub(@ipc, "pingApiServer").resolves()
      cy.stub(@ipc, "onConfigChanged")
      cy.stub(@ipc, "onFocusTests")
      cy.stub(@ipc, "externalOpen")

      @openProject = @util.deferred()
      cy.stub(@ipc, "openProject").returns(@openProject.promise)

      @getProjectStatus = @util.deferred()
      cy.stub(@ipc, "getProjectStatus").returns(@getProjectStatus.promise)

      @getRecordKeys = @util.deferred()
      cy.stub(@ipc, "getRecordKeys").returns(@getRecordKeys.promise)

      start()

  describe "any case / project is set up for ci", ->
    beforeEach ->
      @openProject.resolve(@config)
      @projectStatuses[0].id = @config.projectId
      @getProjectStatus.resolve(@projectStatuses[0])
      @goToSettings()

    it "navigates to settings page", ->
      cy.contains("Configuration")

    it "highlight settings nav", ->
      cy.contains("a", "Settings").should("have.class", "active")

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
        cy.get("table>tbody>tr").should("have.length", 6)

      it "wraps config line in proper classes", ->
        cy
          .get(".line").first().within ->
            cy.contains("animationDistanceThreshold").should("have.class", "key")
            cy.contains(":").should("have.class", "colon")
            cy.contains("5").should("have.class", "default")
            cy.contains(",").should("have.class", "comma")

      it "displays 'true' values", ->
        cy.get(".line").contains("true")

      it "displays 'null' values", ->
        cy.get(".line").contains("null")

      it "displays 'object' values for env and hosts", ->
        cy
          .get(".nested-obj").eq(0)
            .contains("fixturesFolder")
          .get(".nested-obj").eq(1)
            .contains("*.foobar.com")

      it "displays 'array' values for blacklistHosts", ->
        cy
          .get(".nested-arr")
          .parent()
            .should('contain', '[')
            .and('contain', ']')
            .and('not.contain', '0')
            .and('not.contain', '1')
          .find('.line .config').should ($lines) ->
            expect($lines).to.have.length(2)
            expect($lines).to.contain('www.google-analytics.com')
            expect($lines).to.contain('hotjar.com')

      it "opens help link on click", ->
        cy
          .get(".settings-config .learn-more").click().then ->
            expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/guides/configuration")

    describe "when project id panel is opened", ->
      beforeEach ->
        cy.contains("Project ID").click()

      it "displays project id section", ->
        cy.contains(@config.projectId)

    describe "when record key panel is opened", ->
      beforeEach ->
        cy.contains("Record Key").click()

      it "displays record key section", ->
        cy.contains("A Record Key sends")

      it "opens ci guide when learn more is clicked", ->
        cy
          .get(".settings-record-key").contains("Learn More").click().then ->
            expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/what-is-a-record-key")

      it "loads the project's record key", ->
        expect(@ipc.getRecordKeys).to.be.called

      it "shows spinner", ->
        cy.get(".settings-record-key .fa-spinner")

      describe "when record key loads", ->
        beforeEach ->
          @getRecordKeys.resolve(@keys)

        it "displays first Record Key", ->
          cy
            .get(".loading-record-keys").should("not.exist")
            .get(".settings-record-key")
              .contains("cypress run --record --key #{@keys[0].id}")

        it "opens admin project settings when record key link is clicked", ->
          cy
            .get(".settings-record-key").contains("You can change").click().then ->
              expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/dashboard/projects/#{@config.projectId}/settings")

      describe "when there are no keys", ->
        beforeEach ->
          @getRecordKeys.resolve([])

        it "displays empty message", ->
          cy.get(".settings-record-key .empty-well").should("contain", "This project has no record keys")

        it "opens dashboard project settings when clicking 'Dashboard'", ->
          cy.get(".settings-record-key .empty-well a").click().then ->
            expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/dashboard/projects/#{@config.projectId}/settings")

      describe "when the user is logged out", ->
        beforeEach ->
          @getRecordKeys.resolve([])
          cy.logOut()

        it "shows message that user must be logged in to view record keys", ->
          cy.get(".empty-well").should("contain", "must be logged in")

        it "opens login modal after clicking 'Log In'", ->
          cy.get(".empty-well button").click()
          cy.get(".login")

        it "re-loads and shows the record key when user logs in", ->
          cy.stub(@ipc, "windowOpen").resolves("code-123")
          cy.stub(@ipc, "logIn").resolves(@user)
          @ipc.getRecordKeys.onCall(1).resolves(@keys)

          cy.get(".empty-well button").click()
          cy.contains("Log In with GitHub").click().should =>
            expect(@ipc.getRecordKeys).to.be.calledTwice
          cy.get(".settings-record-key")
            .contains("cypress run --record --key #{@keys[0].id}")

    describe "when proxy settings panel is opened", ->
      beforeEach ->
        cy.contains("Proxy Settings").click()

      it "with no proxy config set informs the user no proxy configuration is active", ->
        cy.get(".settings-proxy").should("contain", "There is no active proxy configuration.")

      it "opens help link on click", ->
        cy.get(".settings-proxy .learn-more").click().then ->
          expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/proxy-configuration")

      it "with Windows proxy settings indicates proxy and the source", ->
        cy.setAppStore({
          projectRoot: "/foo/bar",
          proxySource: "win32",
          proxyServer: "http://foo-bar.baz",
          proxyBypassList: "a,b,c,d"
        })
        cy.get(".settings-proxy").should("contain", "from Windows system settings")
        cy.get(".settings-proxy tr:nth-child(1) > td > code").should("contain", "http://foo-bar.baz")
        cy.get(".settings-proxy tr:nth-child(2) > td > code").should("contain", "a, b, c, d")

      it "with environment proxy settings indicates proxy and the source", ->
        cy.setAppStore({
          projectRoot: "/foo/bar",
          proxyServer: "http://foo-bar.baz",
          proxyBypassList: "a,b,c,d"
        })
        cy.get(".settings-proxy").should("contain", "from environment variables")
        cy.get(".settings-proxy tr:nth-child(1) > td > code").should("contain", "http://foo-bar.baz")
        cy.get(".settings-proxy tr:nth-child(2) > td > code").should("contain", "a, b, c, d")

      it "with no bypass list but a proxy set shows 'none' in bypass list", ->
        cy.setAppStore({
          projectRoot: "/foo/bar",
          proxyServer: "http://foo-bar.baz",
        })
        cy.get(".settings-proxy tr:nth-child(2) > td").should("contain", "none")

    context "on:focus:tests clicked", ->
      beforeEach ->
        @ipc.onFocusTests.yield()

      it "routes to specs page", ->
        cy.shouldBeOnProjectSpecs()

  context "on config changes", ->
    beforeEach ->
      @projectStatuses[0].id = @config.projectId
      @getProjectStatus.resolve(@projectStatuses[0])
      newConfig = @util.deepClone(@config)
      newConfig.clientUrl = "http://localhost:8888"
      newConfig.clientUrlDisplay = "http://localhost:8888"
      newConfig.browsers = @browsers
      @openProject.resolve(newConfig)

      @goToSettings()
      cy.contains("Configuration").click()

    it "displays updated config", ->
      newConfig = @util.deepClone(@config)
      newConfig.resolved.baseUrl.value = "http://localhost:7777"
      @ipc.openProject.onCall(1).resolves(newConfig)
      @ipc.onConfigChanged.yield()

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

      @projectStatuses[0].id = @config.projectId
      @getProjectStatus.resolve(@projectStatuses[0])
      @openProject.resolve(@config)
      @goToSettings()
      cy.contains("Configuration").click()
      cy.contains("http://localhost:7777").then =>
        @ipc.openProject.onCall(1).rejects(@err)
        @ipc.onConfigChanged.yield()

    it "displays errors", ->
      cy.contains("Can't start server")

    it "displays config after error is fixed", ->
      cy.contains("Can't start server").then =>
        @ipc.openProject.onCall(1).resolves(@config)
        @ipc.onConfigChanged.yield()
      cy.contains("Configuration")

  context "when project is not set up for CI", ->
    it "does not show ci Keys section when project has no id", ->
      newConfig = @util.deepClone(@config)
      newConfig.projectId = null
      @openProject.resolve(newConfig)
      @getProjectStatus.resolve(@projectStatuses)
      @goToSettings()

      cy.contains("h5", "Record Keys").should("not.exist")

    it "does not show ci Keys section when project is invalid", ->
      @openProject.resolve(@config)
      @projectStatuses[0].state = "INVALID"
      @getProjectStatus.resolve(@projectStatuses[0])
      @goToSettings()

      cy.contains("h5", "Record Keys").should("not.exist")

  context "when you are not a user of this project's org", ->
    beforeEach ->
      @openProject.resolve(@config)

    it "does not show record key", ->
      @projectStatuses[0].state = "UNAUTHORIZED"
      @getProjectStatus.resolve(@projectStatuses[0])
      @goToSettings()

      cy.contains("h5", "Record Keys").should("not.exist")
