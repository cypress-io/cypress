describe "Project", ->
  beforeEach ->
    cy.fixture("user").as("user")
    cy.fixture("config").as("config")
    cy.fixture("specs").as("specs")
    cy.fixture("projects_statuses").as("projectStatuses")

    cy.visitIndex().then (win) =>
      { @start, @ipc } = win.App

      cy.stub(@ipc, "getOptions").resolves({projectRoot: "/foo/bar"})
      cy.stub(@ipc, "getCurrentUser").resolves(@user)
      cy.stub(@ipc, "openProject").resolves(@config)
      cy.stub(@ipc, "getSpecs").yields(null, @specs)
      cy.stub(@ipc, "closeProject").resolves()
      cy.stub(@ipc, "onConfigChanged")
      cy.stub(@ipc, "onProjectWarning")

      @getProjectStatus = @util.deferred()
      cy.stub(@ipc, "getProjectStatus").returns(@getProjectStatus.promise)

      @updaterCheck = @util.deferred()
      cy.stub(@ipc, "updaterCheck").resolves(@updaterCheck.promise)

  describe "general behavior", ->
    beforeEach ->
      @start()

    it "shows project specs", ->
      cy.shouldBeOnProjectSpecs()

    it "opens project", ->
      cy.shouldBeOnProjectSpecs().then =>
        expect(@ipc.openProject).to.be.calledWith("/foo/bar")

    it "gets project status", ->
      cy.shouldBeOnProjectSpecs().then =>
        expect(@ipc.getProjectStatus).to.be.calledWith({id: @config.projectId, path: "/foo/bar"})

    it "logs out user when getting project status returns 401", ->
      cy.shouldBeOnProjectSpecs().then =>
        @getProjectStatus.reject({name: "", message: "", statusCode: 401})
      cy.shouldBeLoggedOut()

    it "re-opens project if config changes", ->
      cy.shouldBeOnProjectSpecs().then =>
        @ipc.onConfigChanged.yield()
        expect(@ipc.closeProject).to.be.called
        expect(@ipc.openProject).to.be.called
        cy.shouldBeOnProjectSpecs()

  describe "warnings", ->
    beforeEach ->
      @start()
      cy.shouldBeOnProjectSpecs().then =>
        @ipc.onProjectWarning.yield(null, {type: "NOT_GOOD_BUT_NOT_TOO_BAD", name: "Fairly serious warning", message: "Some warning\nmessage"})

    it "shows warning", ->
      cy.get(".alert-warning")
        .should("be.visible")
        .should("contain", "Some warning")

    it "can dismiss the warning", ->
      cy.get(".alert-warning button").click()
      cy.get(".alert-warning").should("not.exist")

    it "stays dismissed after receiving same warning again", ->
      cy.get(".alert-warning button").click()
      cy.get(".alert-warning").should("not.exist").then =>
        @ipc.onProjectWarning.yield(null, {type: "NOT_GOOD_BUT_NOT_TOO_BAD", name: "Fairly serious warning", message: "Some warning\nmessage"})
      cy.get(".alert-warning").should("not.exist")

    it "shows new, different warning after dismissing old warning", ->
      cy.get(".alert-warning button").click()
      cy.get(".alert-warning").should("not.exist").then =>
        @ipc.onProjectWarning.yield(null, {type: "PRETTY_BAD_WARNING", name: "Totally serious warning", message: "Some warning\nmessage"})
      cy.get(".alert-warning").should("be.visible")

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

    it "displays normal error message", ->
      @ipc.openProject.rejects(@err)
      @start()
      cy
        .get(".error")
          .should("contain", @err.message)

    it "displays error message with html escaped", ->
      @err.message = "Error reading from: <span class='ansi-blur-gf'>/Users/cypress.json</span><br /><br /> <span class=ansi-yellow-fg'>SyntaxError</span>"
      @ipc.openProject.rejects(@err)
      @start()
      cy
        .get(".error")
          .should("contain", "Error reading from: /Users/cypress.json")
          .should("not.contain", "<span")

    it "displays Port in Use instructions on err", ->
      @ipc.openProject.rejects(@err)
      @start()
      cy
        .get(".error")
          .should("contain", @err.message)
          .and("contain", "To fix")

    it "displays miscellaneous project error", ->
      cy.stub(@ipc, "onProjectError").yields(null, @err)
      @start()
      cy
        .get(".error")
          .should("contain", @err.message)
          .and("contain", "To fix")

    it "word wraps long error message plus update bar", ->
      @updaterCheck.resolve("1.3.4")
      @longErrMessage = "Morbileorisus,portaacconsecteturac,vestibulumateros.Nullamquisrisusegeturnamollis ornare vel eu leo. Donec sed odio dui. Nullam quis risus eget urna mollis ornare vel eu leo. Etiam porta sem malesuada magna mollis euismod. Maecenas faucibus mollis interdum. Nullam id dolor id nibh ultricies vehicula ut id elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam id dolor id nibh ultricies vehicula ut id elit. Vestibulum id ligula porta felis euismod semper. Vestibulum id ligula porta felis euismod semper.Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Nullam id dolor id nibh ultricies vehicula ut id elit. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit. Donec id elit non mi porta gravida at eget metus. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Cras justo odio, dapibus ac facilisis in, egestas eget quam.Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Maecenas faucibus mollis interdum. Etiam porta sem malesuada magna mollis euismod."
      @ipc.openProject.rejects({name: "Error", message: @longErrMessage, stack: "[object Object]↵"})
      @start()

      cy
        .get("#updates-available").should("be.visible")
        .contains("New updates are available")

      cy
        .get(".error")
        .and("contain", @longErrMessage)

    it "re-opens project on click of 'Try again' button", ->
      @ipc.openProject.rejects(@err)
      @start()
      cy
        .get(".error").contains("Try Again").click().should =>
          expect(@ipc.closeProject).to.be.called
          expect(@ipc.openProject).to.be.called

  describe "polling", ->
    beforeEach ->
      @ipc.getProjectStatus.resolves(@projectStatuses[0])
      cy.clock().then =>
        @start()

    it "gets project status every 10 seconds", ->
      cy.tick(10000).then =>
        expect(@ipc.getProjectStatus).to.be.calledTwice
