describe "Specs List", ->
  beforeEach ->
    @firstProjectName = "My-Fake-Project"

    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win
        @agents = cy.agents()
        @ipc.handle("get:options", null, {})
        @agents.spy(@App, "ipc")
      .fixture("user").then (@user) ->
        @ipc.handle("get:current:user", null, @user)
      .fixture("projects").then (@projects) ->
        @ipc.handle("get:projects", null, @projects)
      .fixture("config").as("config")
      .fixture("specs").as("specs")

  it "navigates to project specs page", ->
    cy
      .get(".projects-list a")
        .contains("My-Fake-Project").click()
      .fixture("browsers").then (@browsers) ->
        @config.browsers = @browsers
        @ipc.handle("open:project", null, @config)
      .then ->
        @ipc.handle("get:specs", null, @specs)
      .location().its("hash").should("include", "specs")

  describe "no specs", ->
    beforeEach ->
      cy
        .get(".projects-list a")
          .contains("My-Fake-Project").click()
          .fixture("browsers").then (@browsers) ->
            @config.browsers = @browsers
            @ipc.handle("open:project", null, @config)
          .then ->
            @ipc.handle("get:specs", null, [])

    it "displays empty message", ->
      cy.contains("No files found")

    it "displays integration test folder path", ->
      cy.contains(@config.integrationFolder)

    it "triggers open:finder on click of text folder", ->
      cy
        .contains(@config.integrationFolder).click().then ->
          expect(@App.ipc).to.be.calledWith("open:finder", @config.integrationFolder)

    it "displays help link", ->
      cy.contains("a", "Need help?")

    it "opens link to docs on click of help link", ->
      cy.contains("a", "Need help?").click().then ->
        expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io/guides/writing-your-first-test#section-test-files")

  describe "first time onboarding specs", ->
    beforeEach ->
      cy
        .get(".projects-list a")
          .contains("My-Fake-Project").click()
        .fixture("browsers").then (@browsers) ->
          @config.browsers = @browsers
          @config.isNewProject = true
          @ipc.handle("open:project", null, @config)
        .then ->
          @ipc.handle("get:specs", null, @specs)

    it "displays modal", ->
      cy
        .contains(".modal", "To help you get started").should("be.visible")

    it "triggers open:finder on click of example file", ->
      cy
        .get(".modal").contains("example_spec.js").click().then ->
          expect(@App.ipc).to.be.calledWith("open:finder", @config.integrationExampleFile)

    it "triggers open:finder on click of text folder", ->
      cy
        .get(".modal").contains("cypress/integration").click().then ->
          expect(@App.ipc).to.be.calledWith("open:finder", @config.integrationFolder)

  describe "lists specs", ->
    beforeEach ->
      cy
        .get(".projects-list a")
          .contains("My-Fake-Project").click()
        .fixture("browsers").then (@browsers) ->
          @config.browsers = @browsers
          @ipc.handle("open:project", null, @config)
        .then ->
          @ipc.handle("get:specs", null, @specs)
        .location().its("hash").should("include", "specs")

    context "run all specs", ->
      it "displays run all specs button", ->
        cy.contains(".btn", "Run All Tests")

      it "has play icon", ->
        cy
          .contains(".btn", "Run All Tests")
            .find("i").should("have.class", "fa-play")

      it "triggers launch:browser on click of button", ->
        cy
          .contains(".btn", "Run All Tests").click().then ->
            @ipc.handle("get:open:browsers", null, [])
          .then ->
            ln = @App.ipc.args.length
            lastCallArgs = @App.ipc.args[ln-1]

            expect(lastCallArgs[0]).to.eq "launch:browser"
            expect(lastCallArgs[1].browser).to.eq "chrome"
            expect(lastCallArgs[1].spec).to.eq "__all"

      it "triggers change:browser:spec if browser is open", ->
        cy
          .contains(".btn", "Run All Tests").click()
          .fixture("browsers").then (@browsers) ->
            @ipc.handle("get:open:browsers", null, ["chrome"])
          .then ->
            expect(@App.ipc).to.be.calledWithExactly("change:browser:spec", {
              spec: "__all"
            })

      describe "all specs running in browser", ->
        beforeEach ->
          cy
            .contains(".btn", "Run All Tests").as("allSpecs")
              .click().then ->
                @ipc.handle("get:open:browsers", null, ["chrome"])
                @ipc.handle("change:browser:spec", null, {})

        it "updates spec icon", ->
          cy.get("@allSpecs").find("i").should("have.class", "fa-dot-circle-o")
          cy.get("@allSpecs").find("i").should("not.have.class", "fa-play")

        it "sets spec as active", ->
          cy.get("@allSpecs").should("have.class", "active")

    context "displays list of specs", ->
      it "lists main folders of specs", ->
        cy.contains(".folder", "integration")
        cy.contains(".folder", "unit")

      it "lists nested folders", ->
        cy.get(".folder .folder").contains("accounts")

      it "lists test specs", ->
        cy.get(".file a").contains("app_spec.coffee")

    context "click on spec", ->
      beforeEach ->
        cy.get(".file a").contains("app_spec.coffee").as("firstSpec")

      it "triggers get:open:browsers on click of file", ->
        cy
          .get("@firstSpec").click().then ->
            expect(@App.ipc).to.be.calledWith("get:open:browsers")

      it "triggers launch:browser if browser is not open", ->
        cy
          .get("@firstSpec").click().then ->
            @ipc.handle("get:open:browsers", null, [])
          .then ->
            ln = @App.ipc.args.length
            lastCallArgs = @App.ipc.args[ln-1]

            expect(lastCallArgs[0]).to.eq "launch:browser"
            expect(lastCallArgs[1].browser).to.eq "chrome"
            expect(lastCallArgs[1].spec).to.eq "integration/app_spec.coffee"

      it "triggers change:browser:spec if browser is open", ->
        cy
          .get("@firstSpec").click()
          .fixture("browsers").then (@browsers) ->
            @ipc.handle("get:open:browsers", null, ["chrome"])
          .then ->
            expect(@App.ipc).to.be.calledWithExactly("change:browser:spec", {
              spec: "integration/app_spec.coffee"
            })

    describe "spec running in browser", ->
      context "choose shallow spec", ->
        beforeEach ->
          cy
            .get(".file a").contains("a", "app_spec.coffee").as("firstSpec")
              .click().then ->
                @ipc.handle("get:open:browsers", null, ["chrome"])
              .then ->
                @ipc.handle("change:browser:spec", null, {})

        it "updates spec icon", ->
          cy.get("@firstSpec").find("i").should("have.class", "fa-dot-circle-o")
          cy.get("@firstSpec").find("i").should("not.have.class", "fa-file-code-o")

        it "sets spec as active", ->
          cy.get("@firstSpec").should("have.class", "active")

      context "choose deeper nested spec", ->
        beforeEach ->
          cy
            .get(".file a").contains("a", "baz_list_spec.coffee").as("deepSpec")
              .click().then ->
                @ipc.handle("get:open:browsers", null, ["chrome"])
              .then ->
                @ipc.handle("change:browser:spec", null, {})

        it "updates spec icon", ->
          cy.get("@deepSpec").find("i").should("have.class", "fa-dot-circle-o")

        it "sets spec as active", ->
          cy.get("@deepSpec").should("have.class", "active")

      context "running spec updates", ->
        beforeEach ->
          cy
            .get(".file a").contains("a", "app_spec.coffee").as("firstSpec")
              .click().then ->
                @ipc.handle("get:open:browsers", null, [])
              .then ->
                @ipc.handle("launch:browser", null, {browserOpened: true})

    describe "switching specs", ->
      beforeEach ->
        cy
          .get(".file").contains("a", "app_spec.coffee").as("firstSpec")
            .click().then ->
              @ipc.handle("get:open:browsers", null, ["chrome"])
              @ipc.handle("change:browser:spec", null, {})
          .get(".file").contains("a", "account_new_spec.coffee").as("secondSpec")
            .click().then ->
              @ipc.handle("get:open:browsers", null, ["chrome"])
              @ipc.handle("change:browser:spec", null, {})

      it "updates spec icon", ->
        cy.get("@firstSpec").find("i").should("not.have.class", "fa-dot-circle-o")
        cy.get("@secondSpec").find("i").should("have.class", "fa-dot-circle-o")

      it "updates active spec", ->
        cy.get("@firstSpec").should("not.have.class", "active")
        cy.get("@secondSpec").should("have.class", "active")

  describe "spec list updates", ->
    beforeEach ->
      cy
        .get(".projects-list a")
          .contains("My-Fake-Project").click()
        .fixture("browsers").then (@browsers) ->
          @config.browsers = @browsers
          @ipc.handle("open:project", null, @config)
        .then ->
          @ipc.handle("get:specs", null, @specs)
        .location().its("hash").should("include", "specs")

    it "updates spec list selected on specChanged", ->
      cy
        .contains("a", "app_spec.coffee").as("firstSpec")
        .then ->
          @config.specChanged = "integration/app_spec.coffee"
          @ipc.handle("open:project", null, @config)
        .get("@firstSpec").should("have.class", "active")
        .then ->
          @config.specChanged = "integration/accounts/account_new_spec.coffee"
          @ipc.handle("open:project", null, @config)
        .get("@firstSpec").should("not.have.class", "active")
      cy
        .contains("a", "account_new_spec.coffee")
          .should("have.class", "active")

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
        .get(".projects-list a")
          .contains("My-Fake-Project").click()
        .get(".error")
          .should("contain", @err.message)

    it "displays error message with html escaped", ->
      @err.message = "Error reading from: <span class='ansi-blur-gf'>/Users/cypress.json</span><br /><br /> <span class=ansi-yellow-fg'>SyntaxError</span>"
      @ipc.handle("open:project", @err, {})
      cy
        .get(".projects-list a")
          .contains("My-Fake-Project").click()
        .get(".error")
          .should("contain", "Error reading from: /Users/cypress.json")
          .should("not.contain", "<span")

    it "displays Port in Use instructions on err", ->
      @ipc.handle("open:project", @err, {})
      cy
        .get(".projects-list a")
          .contains("My-Fake-Project").click()
        .get(".error")
          .should("contain", @err.message)
          .and("contain", "To fix")

    it "word wraps long error message plus update bar", ->
      @ipc.handle("updater:check", null, "1.3.4")
      @longErrMessage = "Morbileorisus,portaacconsecteturac,vestibulumateros.Nullamquisrisusegeturnamollis ornare vel eu leo. Donec sed odio dui. Nullam quis risus eget urna mollis ornare vel eu leo. Etiam porta sem malesuada magna mollis euismod. Maecenas faucibus mollis interdum. Nullam id dolor id nibh ultricies vehicula ut id elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam id dolor id nibh ultricies vehicula ut id elit. Vestibulum id ligula porta felis euismod semper. Vestibulum id ligula porta felis euismod semper.Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Nullam id dolor id nibh ultricies vehicula ut id elit. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit. Donec id elit non mi porta gravida at eget metus. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Cras justo odio, dapibus ac facilisis in, egestas eget quam.Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Maecenas faucibus mollis interdum. Etiam porta sem malesuada magna mollis euismod."
      @ipc.handle("open:project", {name: "Error", message: @longErrMessage, stack: "[object Object]↵"}, {})
      cy
        .get(".projects-list a")
          .contains("My-Fake-Project").click()
        .get("#updates-available").should("be.visible")
        .contains("New updates are available")

      cy
        .get(".error")
          .and("contain", @longErrMessage)

    it "closes project on click of 'go back to projects' button", ->
      @ipc.handle("open:project", @err, {})
      cy
        .get(".projects-list a")
          .contains("My-Fake-Project").click()
        .get(".error").contains("Go Back to Projects").click().then ->
          expect(@App.ipc).to.be.calledWith("close:project")

