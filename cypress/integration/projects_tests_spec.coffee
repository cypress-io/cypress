describe "Project Tests", ->
  beforeEach ->
    @firstProjectName = "My-Fake-Project"

    @config = {
      clientUrl: "http://localhost:2020",
      clientUrlDisplay: "http://localhost:2020"
    }

    cy
      .visit("/#/projects/e40991dc055454a2f3598752dec39abc")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()

        @ipc.handle("get:options", null, {})

        @agents.spy(@App, "ipc")

      .fixture("user").then (@user) ->
        @ipc.handle("get:current:user", null, @user)
      .fixture("projects").then (@projects) ->
        @ipc.handle("get:project:paths", null, @projects)

  it "navigates to project tests page", ->
    cy
      .fixture("browsers").then (@browsers) ->
        @config.browsers = @browsers
        @ipc.handle("open:project", null, @config)
      .get("#tests-list-page")
      .location().its("hash").should("include", "specs")

  describe "nav", ->
    beforeEach ->
      cy
        .fixture("browsers").then (@browsers) ->
          @config.browsers = @browsers
          @ipc.handle("open:project", null, @config)

    it "does not display 'Add Project' button", ->
      cy.contains("Add Project").should("not.exist")

    it "displays Back button", ->
      cy.contains("Back to Projects")

    it "routes to projects on click of back button", ->
      cy
        .contains("Back to Projects").click()
        .location().then (location) ->
          expect(location.href).to.include("projects")
          expect(location.href).to.not.include("123-456")

  describe "server error", ->
    beforeEach ->
      @err = {
        message: "Port '2020' is already in use."
        name: "Error"
        port: 2020
        portInUse: true
        stack: "[object Object]↵  at Object.API.get (/Users/jennifer/Dev/Projects/cypress-app/lib/errors.coffee:55:15)↵  at Object.wrapper [as get] (/Users/jennifer/Dev/Projects/cypress-app/node_modules/lodash/lodash.js:4414:19)↵  at Server.portInUseErr (/Users/jennifer/Dev/Projects/cypress-app/lib/server.coffee:58:16)↵  at Server.onError (/Users/jennifer/Dev/Projects/cypress-app/lib/server.coffee:86:19)↵  at Server.g (events.js:273:16)↵  at emitOne (events.js:90:13)↵  at Server.emit (events.js:182:7)↵  at emitErrorNT (net.js:1253:8)↵  at _combinedTickCallback (internal/process/next_tick.js:74:11)↵  at process._tickDomainCallback (internal/process/next_tick.js:122:9)↵From previous event:↵    at fn (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:57919:14)↵    at Object.appIpc [as ipc] (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:57939:10)↵    at openProject (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:59135:24)↵    at new Project (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:58848:34)↵    at ReactCompositeComponentMixin._constructComponentWithoutOwner (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44052:27)↵    at ReactCompositeComponentMixin._constructComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44034:21)↵    at ReactCompositeComponentMixin.mountComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:43953:21)↵    at Object.ReactReconciler.mountComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:51315:35)↵    at ReactCompositeComponentMixin.performInitialMount (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44129:34)↵    at ReactCompositeComponentMixin.mountComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44016:21)↵    at Object.ReactReconciler.mountComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:51315:35)↵    at ReactDOMComponent.ReactMultiChild.Mixin._mountChildAtIndex (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:50247:40)↵    at ReactDOMComponent.ReactMultiChild.Mixin._updateChildren (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:50163:43)↵    at ReactDOMComponent.ReactMultiChild.Mixin.updateChildren (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:50123:12)↵    at ReactDOMComponent.Mixin._updateDOMChildren (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:45742:12)↵    at ReactDOMComponent.Mixin.updateComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:45571:10)↵    at ReactDOMComponent.Mixin.receiveComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:45527:10)↵    at Object.ReactReconciler.receiveComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:51396:22)↵    at ReactCompositeComponentMixin._updateRenderedComponent (file:///Users/jennifer/Dev/Projects/cypress-core-desktop-gui/dist/app.js:44547:23)"
        type: "PORT_IN_USE_SHORT"
      }

    it "displays normal error message", ->
      @ipc.handle("open:project", @err, {})
      cy
        .get(".error")
          .should("contain", @err.message)

    it.skip "word wraps long error message plus update bar", ->
      @longErrMessage = "Morbileorisus,portaacconsecteturac,vestibulumateros.Nullamquisrisusegeturnamollis ornare vel eu leo. Donec sed odio dui. Nullam quis risus eget urna mollis ornare vel eu leo. Etiam porta sem malesuada magna mollis euismod. Maecenas faucibus mollis interdum. Nullam id dolor id nibh ultricies vehicula ut id elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam id dolor id nibh ultricies vehicula ut id elit. Vestibulum id ligula porta felis euismod semper. Vestibulum id ligula porta felis euismod semper.Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Nullam id dolor id nibh ultricies vehicula ut id elit. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit. Donec id elit non mi porta gravida at eget metus. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Cras justo odio, dapibus ac facilisis in, egestas eget quam.Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Maecenas faucibus mollis interdum. Etiam porta sem malesuada magna mollis euismod."
      @ipc.handle("updater:check", null, "1.3.4")
      cy.get("#updates-available").should("be.visible")
      cy.contains("New updates are available")

      @ipc.handle("open:project", {name: @err.name, message: @longErrMessage}, {})
      cy
        .get(".error")
          .should("contain", @err.name)
          .and("contain", @longErrMessage)

    it "displays Port in Use instructions on err", ->
      @ipc.handle("open:project", @err, {})
      cy
        .get(".error")
          .and("contain", @err.message)
          .and("contain", "To fix")

  describe.skip "successfully starts server with browsers", ->
    beforeEach ->
      @config = {
        clientUrl: "http://localhost:2020",
        clientUrlDisplay: "http://localhost:2020"
      }

      cy
        .fixture("browsers").then (@browsers) ->
          @config.browsers = @browsers

          @ipc.handle("open:project", null, @config)

    context "server host url", ->
      it "displays server url", ->
        cy.contains(@config.clientUrlDisplay)

      ## TODO: add this back in when we support changing the hostname
      # it "triggers external:open to docs on click of question icon", ->
      #   cy
      #     .get("[data-js='host-info']").click().then ->
      #       expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io")

    context "on:project:settings:change", ->
      beforeEach ->
        cy
          .contains(@config.clientUrlDisplay)
          .then ->
            @config.clientUrl = "http://localhost:8888"
            @config.clientUrlDisplay = "http://localhost:8888"
            @config.browsers = @browsers

            @ipc.handle("on:project:settings:change", null, {
              config: @config
              browser: null
            })

        cy.contains("http://localhost:8888")

      it "displays updated config", ->
        @config.clientUrl = "http://localhost:7777"
        @config.clientUrlDisplay = "http://localhost:7777"
        @config.browsers = @browsers

        @ipc.handle("on:project:settings:change", null, {
          config: @config
          browser: null
        })

        cy.contains("http://localhost:7777")

      it "relaunches browser when present", ->
        @config.clientUrl = "http://localhost:7777"
        @config.clientUrlDisplay = "http://localhost:7777"
        @config.browsers = @browsers

        @ipc.handle("on:project:settings:change", null, {
          config: @config
          browser: "chrome"
        })

        cy
          .contains("http://localhost:7777")
          .then ->
            cy.wrap(@App.ipc).should("be.calledWith", "launch:browser", {
              browser: "chrome"
              url: undefined
            })

      it "displays errors", ->
        @config.clientUrl = "http://localhost:7777"
        @config.clientUrlDisplay = "http://localhost:7777"
        @config.browsers = @browsers

        @ipc.handle("on:project:settings:change", null, {
          config: @config
          browser: null
        })

        cy
          .contains("http://localhost:7777")
          .then ->
            @ipc.handle("on:project:settings:change", {
              name: "Port 2020"
              msg: "There is already a port running"
            }, null)

        cy.contains("Can't start server")
