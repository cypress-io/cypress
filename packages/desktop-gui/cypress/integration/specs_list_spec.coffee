describe "Specs List", ->
  beforeEach ->
    cy.fixture("user").as("user")
    cy.fixture("config").as("config")
    cy.fixture("specs").as("specs")
    cy.fixture("specs_windows").as("specsWindows")

    cy.visitIndex().then (win) ->
      { start, @ipc } = win.App

      cy.stub(@ipc, "getOptions").resolves({projectRoot: "/foo/bar"})
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
      cy.contains(@config.integrationFolder).click().then ->
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
      cy.contains(".modal", "To help you get started").should("be.visible")

    it "displays the scaffolded files", ->
      cy.get(".folder-preview-onboarding").within ->
        cy.contains("span", "fixtures").siblings("ul").within ->
        cy.contains("example.json")
        cy.contains("span", "integration").siblings("ul").within ->
          cy.contains("examples")
        cy.contains("span", "support").siblings("ul").within ->
          cy.contains("commands.js")
          cy.contains("defaults.js")
          cy.contains("index.js")
        cy.contains("span", "plugins").siblings("ul").within ->
          cy.contains("index.js")

    it "lists folders and files alphabetically", ->
      cy.get(".folder-preview-onboarding").within ->
        cy.contains("fixtures").parent().next()
          .contains("integration")

    it "truncates file lists with more than 3 items", ->
      cy.get(".folder-preview-onboarding").within ->
        cy.contains("examples").closest(".new-item").find("li")
          .should("have.length", 3)
        cy.get(".is-more").should("have.text", " ... 17 more files ...")

    it "can dismiss the modal", ->
      cy.contains("OK, got it!").click()
      cy.get(".modal").should("not.be.visible")
        .then ->
          expect(@ipc.onboardingClosed).to.be.called

    it "triggers open:finder on click of example folder", ->
      cy.get(".modal").contains("examples").click().then =>
        expect(@ipc.openFinder).to.be.calledWith(@config.integrationExamplePath)

    it "triggers open:finder on click of text folder", ->
      cy.get(".modal").contains("cypress/integration").click().then =>
        expect(@ipc.openFinder).to.be.calledWith(@config.integrationFolder)

  describe "lists specs", ->
    context "Windows paths", ->
      beforeEach ->
        @ipc.getSpecs.yields(null, @specsWindows)
        @openProject.resolve(@config)

      context "displays list of specs", ->
        it "lists nested folders", ->
          cy.get(".folder .folder").contains("accounts")

        it "lists test specs", ->
          cy.get(".file a").last().should("contain", "baz_list_spec.coffee")
          cy.get(".file a").last().should("not.contain", "admin_users")

    context "Linux paths", ->
      beforeEach ->
        @ipc.getSpecs.yields(null, @specs)
        @openProject.resolve(@config)

      context "run all specs", ->
        it "displays run all specs button", ->
          cy.contains(".btn", "Run all specs")

        it "has play icon", ->
          cy
            .contains(".btn", "Run all specs")
            .find("i").should("have.class", "fa-play")

        it "triggers browser launch on click of button", ->
          cy
            .contains(".btn", "Run all specs").click()
            .then ->
              launchArgs = @ipc.launchBrowser.lastCall.args

              expect(launchArgs[0].browser.name).to.eq "chrome"
              expect(launchArgs[0].spec.name).to.eq "All Specs"

        describe "all specs running in browser", ->
          beforeEach ->
            cy.contains(".btn", "Run all specs").as("allSpecs").click()

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

    context "filtering specs", ->
      describe "typing the filter", ->
        beforeEach ->
          @ipc.getSpecs.yields(null, @specs)
          @openProject.resolve(@config)
          cy.get(".filter").type("new")

        it "displays only matching spec", ->
          cy.get(".outer-files-container .file")
            .should("have.length", 1)
            .and("contain", "account_new_spec.coffee")

        it "only shows matching folders", ->
          cy.get(".outer-files-container .folder")
            .should("have.length", 2)

        it "clears the filter on clear button click", ->
          cy.get(".clear-filter").click()
          cy.get(".filter")
            .should("have.value", "")
          cy.get(".outer-files-container .file")
            .should("have.length", 7)

        it "clears the filter if the user press ESC key", ->
          cy.get(".filter").type("{esc}")
            .should("have.value", "")
          cy.get(".outer-files-container .file")
            .should("have.length", 7)

        it "shows empty message if no results", ->
          cy.get(".filter").clear().type("foobarbaz")
          cy.get(".outer-files-container").should("not.exist")
          cy.get(".empty-well").should("have.text", "No files match the filter 'foobarbaz'")

        it "saves the filter to local storage for the project", ->
          cy.window().then (win) =>
            expect(win.localStorage["specsFilter-#{@config.projectId}"]).to.be.a("string")
            expect(JSON.parse(win.localStorage["specsFilter-#{@config.projectId}"])).to.equal("new")

      describe "when there's a saved filter", ->
        beforeEach ->
          @ipc.getSpecs.yields(null, @specs)
          cy.window().then (win) ->
            win.localStorage["specsFilter-#{@config.projectId}"] = JSON.stringify("app")

        it "applies it for the appropriate project", ->
          @openProject.resolve(@config)
          cy.get(".filter").should("have.value", "app")

        it "does not apply it for a different project", ->
          @config.projectId = "different"
          @openProject.resolve(@config)
          cy.get(".filter").should("have.value", "")


    context "click on spec", ->
      beforeEach ->
        @ipc.getSpecs.yields(null, @specs)
        @openProject.resolve(@config)
        cy.contains(".file a", "app_spec.coffee").as("firstSpec")

      it "closes then launches browser on click of file", ->
        cy.get("@firstSpec")
          .click()
          .then ->
            expect(@ipc.closeBrowser).to.be.called

            launchArgs = @ipc.launchBrowser.lastCall.args

            expect(launchArgs[0].browser.name).to.equal("chrome")
            expect(launchArgs[0].spec.relative).to.equal("cypress/integration/app_spec.coffee")

      it "adds 'active' class on click", ->
        cy.get("@firstSpec")
          .should("not.have.class", "active")
          .click()
          .should("have.class", "active")

      it "maintains active selection if specs change", ->
        cy.get("@firstSpec").click().then =>
          @ipc.getSpecs.yield(null, @specs)
        cy.get("@firstSpec").should("have.class", "active")

    context "spec running in browser", ->
      beforeEach ->
        @ipc.getSpecs.yields(null, @specs)
        @openProject.resolve(@config)

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
        @ipc.getSpecs.yields(null, @specs)
        @openProject.resolve(@config)
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

  ## We aren't properly handling this event so skipping
  ## this test for now until its implemented
  describe.skip "spec list updates", ->
    beforeEach ->
      @ipc.getSpecs.yields(null, @specs)
      @openProject.resolve(@config)

    it "updates spec list selected on specChanged", ->
      cy.get(".file a")
        .contains("a", "app_spec.coffee").as("firstSpec")
        .then ->
          @ipc.onSpecChanged.yield(null, "integration/app_spec.coffee")
      cy.get("@firstSpec").should("have.class", "active")
        .then ->
          @ipc.onSpecChanged.yield(null, "integration/accounts/account_new_spec.coffee")
      cy.get("@firstSpec").should("not.have.class", "active")
      cy.contains("a", "account_new_spec.coffee")
        .should("have.class", "active")
