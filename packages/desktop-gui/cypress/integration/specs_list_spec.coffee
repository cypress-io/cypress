describe "Specs List", ->
  beforeEach ->
    cy.fixture("user").as("user")
    cy.fixture("config").as("config")
    cy.fixture("specs").as("specs")

    cy.visitIndex().then (win) ->
      { start, @ipc } = win.App

      cy.stub(@ipc, "getOptions").resolves({projectPath: "/foo/bar"})
      cy.stub(@ipc, "getCurrentUser").resolves(@user)
      cy.stub(@ipc, "getSpecs").yields(null, @specs)
      cy.stub(@ipc, "closeBrowser").resolves(null)
      cy.stub(@ipc, "launchBrowser")
      cy.stub(@ipc, "openFinder")
      cy.stub(@ipc, "externalOpen")
      cy.stub(@ipc, "onboardingClosed")
      cy.stub(@ipc, "onSpecChanged")

      @openProject = @util.deferred()
      cy.stub(@ipc, "openProject").returns(@openProject.promise)

      start()

  describe "no specs", ->
    beforeEach ->
      @ipc.getSpecs.yields(null, [])
      @openProject.resolve(@config)

    it "displays empty message", ->
      cy.contains("No files found")

    it "displays integration test folder path", ->
      cy.contains(@config.integrationFolder)

    it "triggers open:finder on click of text folder", ->
      cy
        .contains(@config.integrationFolder).click().then ->
          expect(@ipc.openFinder).to.be.calledWith(@config.integrationFolder)

    it "displays help link", ->
      cy.contains("a", "Need help?")

    it "opens link to docs on click of help link", ->
      cy.contains("a", "Need help?").click().then ->
        expect(@ipc.externalOpen).to.be.calledWith("https://on.cypress.io/writing-first-test")

  describe "first time onboarding specs", ->
    beforeEach ->
      @config.isNewProject = true
      @openProject.resolve(@config)

    it "displays modal", ->
      cy
        .contains(".modal", "To help you get started").should("be.visible")

    it "displays the scaffolded files", ->
      cy.get(".folder-preview-onboarding").within ->
        cy.contains("fixtures")
        cy.contains("example.json")
        cy.contains("integration")
        cy.contains("example_spec.js")
        cy.contains("support")
        cy.contains("commands.js")
        cy.contains("defaults.js")
        cy.contains("index.js")

    it "lists folders and files alphabetically", ->
      cy.get(".folder-preview-onboarding").within ->
        cy
          .contains("fixtures").parent().next()
          .contains("integration")

    it "can dismiss the modal", ->
      cy
        .contains("OK, got it!").click()
        .get(".modal").should("not.be.visible")
        .then ->
          expect(@ipc.onboardingClosed).to.be.called

    it "triggers open:finder on click of example file", ->
      cy
        .get(".modal").contains("example_spec.js").click().then ->
          expect(@ipc.openFinder).to.be.calledWith(@config.integrationExampleFile)

    it "triggers open:finder on click of text folder", ->
      cy
        .get(".modal").contains("cypress/integration").click().then ->
          expect(@ipc.openFinder).to.be.calledWith(@config.integrationFolder)

  describe "lists specs", ->
    beforeEach ->
      @ipc.getSpecs.yields(null, @specs)
      @openProject.resolve(@config)

    context "run all specs", ->
      it "displays run all specs button", ->
        cy.contains(".btn", "Run All Tests")

      it "has play icon", ->
        cy
          .contains(".btn", "Run All Tests")
            .find("i").should("have.class", "fa-play")

      it "triggers browser launch on click of button", ->
        cy
          .contains(".btn", "Run All Tests").click()
          .then ->
            launchArgs = @ipc.launchBrowser.lastCall.args

            expect(launchArgs[0].browser).to.eq "chrome"
            expect(launchArgs[0].spec).to.eq "__all"

      describe "all specs running in browser", ->
        beforeEach ->
          cy.contains(".btn", "Run All Tests").as("allSpecs").click()

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

    context "collapsing specs", ->
      it "sets folder collapsed when clicked", ->
        cy.get(".folder:first").should("have.class", "folder-expanded")
        cy.get(".folder .folder-display-name:first").click()
        cy.get(".folder:first").should("have.class", "folder-collapsed")

      it "hides children when folder clicked", ->
        cy.get(".file").should("have.length", 7)
        cy.get(".folder .folder-display-name:first").click()
        cy.get(".file").should("have.length", 2)

      it "sets folder expanded when clicked twice", ->
        cy.get(".folder .folder-display-name:first").click()
        cy.get(".folder:first").should("have.class", "folder-collapsed")
        cy.get(".folder .folder-display-name:first").click()
        cy.get(".folder:first").should("have.class", "folder-expanded")

      it "hides children for every folder collapsed", ->
        lastExpandedFolderSelector = ".folder-expanded:last > div > div > .folder-display-name:last"

        cy.get(".file").should("have.length", 7)

        cy.get(lastExpandedFolderSelector).click()
        cy.get(".file").should("have.length", 6)

        cy.get(lastExpandedFolderSelector).click()
        cy.get(".file").should("have.length", 6)

        cy.get(lastExpandedFolderSelector).click()
        cy.get(".file").should("have.length", 5)

        cy.get(lastExpandedFolderSelector).click()
        cy.get(".file").should("have.length", 5)

        cy.get(lastExpandedFolderSelector).click()
        cy.get(".file").should("have.length", 5)

        cy.get(lastExpandedFolderSelector).click()
        cy.get(".file").should("have.length", 5)

        cy.get(lastExpandedFolderSelector).click()
        cy.get(".file").should("have.length", 4)

        cy.get(lastExpandedFolderSelector).click()
        cy.get(".file").should("have.length", 3)

        cy.get(lastExpandedFolderSelector).click()
        cy.get(".file").should("have.length", 1)

        cy.get(lastExpandedFolderSelector).click()
        cy.get(".file").should("have.length", 0)


    context "click on spec", ->
      beforeEach ->
        cy.contains(".file a", "app_spec.coffee").as("firstSpec")

      it "closes then launches browser on click of file", ->
        cy
          .get("@firstSpec")
          .click()
          .then ->
            expect(@ipc.closeBrowser).to.be.called

            launchArgs = @ipc.launchBrowser.lastCall.args
            expect(launchArgs[0].browser).to.equal("chrome")
            expect(launchArgs[0].spec).to.equal("cypress/integration/app_spec.coffee")

      it "adds 'active' class on click", ->
        cy
          .get("@firstSpec")
          .should("not.have.class", "active")
          .click()
          .should("have.class", "active")

      it "maintains active selection if specs change", ->
        cy.get("@firstSpec").click().then =>
          @ipc.getSpecs.yield(null, @specs)
        cy.get("@firstSpec").should("have.class", "active")

    context "spec running in browser", ->
      context "choose shallow spec", ->
        beforeEach ->
          cy.get(".file a").contains("a", "app_spec.coffee").as("firstSpec").click()

        it "updates spec icon", ->
          cy.get("@firstSpec").find("i").should("have.class", "fa-dot-circle-o")
          cy.get("@firstSpec").find("i").should("not.have.class", "fa-file-code-o")

        it "sets spec as active", ->
          cy.get("@firstSpec").should("have.class", "active")

      context "choose deeper nested spec", ->
        beforeEach ->
          cy.get(".file a").contains("a", "baz_list_spec.coffee").as("deepSpec").click()

        it "updates spec icon", ->
          cy.get("@deepSpec").find("i").should("have.class", "fa-dot-circle-o")

        it "sets spec as active", ->
          cy.get("@deepSpec").should("have.class", "active")

    context "switching specs", ->
      beforeEach ->
        cy
          .get(".file").contains("a", "app_spec.coffee").as("firstSpec")
            .click()
          .get(".file").contains("a", "account_new_spec.coffee").as("secondSpec")
            .click()

      it "updates spec icon", ->
        cy.get("@firstSpec").find("i").should("not.have.class", "fa-dot-circle-o")
        cy.get("@secondSpec").find("i").should("have.class", "fa-dot-circle-o")

      it "updates active spec", ->
        cy.get("@firstSpec").should("not.have.class", "active")
        cy.get("@secondSpec").should("have.class", "active")

  describe "spec list updates", ->
    beforeEach ->
      @ipc.getSpecs.yields(null, @specs)
      @openProject.resolve(@config)

    it "updates spec list selected on specChanged", ->
      cy
        .get(".file a")
        .contains("a", "app_spec.coffee").as("firstSpec")
        .then ->
          @ipc.onSpecChanged.yield(null, "integration/app_spec.coffee")
        .get("@firstSpec").should("have.class", "active")
        .then ->
          @ipc.onSpecChanged.yield(null, "integration/accounts/account_new_spec.coffee")
        .get("@firstSpec").should("not.have.class", "active")
      cy
        .contains("a", "account_new_spec.coffee")
          .should("have.class", "active")
