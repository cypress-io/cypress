describe "Projects Nav", ->
  beforeEach ->

    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()

        @agents.spy(@App, "ipc")

        @ipc.handle("get:options", null, {})
      .fixture("user").then (@user) ->
        @ipc.handle("get:current:user", null, @user)
      .fixture("projects").then (@projects) ->
        @ipc.handle("get:project:paths", null, @projects)
      .fixture("config").as("config")

  context "project nav", ->
    beforeEach ->
      cy
        .fixture("browsers").then (browsers) ->
          @config.browsers = browsers
        .get(".projects-list a")
          .contains("My-Fake-Project").as("firstProject").click().then ->
            @ipc.handle("open:project", null, @config)

    it "displays projects nav", ->
      cy
        .get(".empty").should("not.be.visible")
        .get(".navbar-default")

    it "adds project name to title", ->
      cy.title().should("eq", "My-Fake-Project")

    describe "back button", ->
      it "does not display 'Add Project' button", ->
        cy.contains("Add Project").should("not.exist")

      it "displays Back button", ->
        cy.contains("Back to Projects")

      it "routes to projects on click of back button", ->
        cy
          .contains("Back to Projects").click({force: true})
          .location().then (location) ->
            expect(location.href).to.include("projects")
            expect(location.href).to.not.include("e40991dc055454a2f3598752dec39abc")

      it "removes project name from title", ->
        cy
          .contains("Back to Projects").click({force: true})
          .title().should("eq", "Cypress")

    describe "default page", ->
      it "displays 'tests' nav as active", ->
        cy
          .get(".navbar-default").contains("a", "Tests")
            .should("have.class", "active")

      it "displays 'tests' page", ->
        cy
          .fixture("specs").then (@specs) ->
            @ipc.handle("get:specs", null, @specs)
          .contains("integration")

    describe "config page", ->
      beforeEach ->
        cy
          .get(".navbar-default")
            .contains("a", "Config").as("configNav").click()

      it "highlights config on click", ->
        cy
          .get("@configNav")
            .should("have.class", "active")

      it "navigates to config url", ->
        cy
          .location().its("hash").should("include", "config")

      it "displays config page", ->
        cy
          .contains("h5", "configuration")

  context "browsers dropdown", ->
    describe "browsers available", ->
      beforeEach ->
        cy
          .fixture("browsers").then (@browsers) ->
            @config.browsers = @browsers
          .get(".projects-list a")
            .contains("My-Fake-Project").as("firstProject").click().then ->
              @ipc.handle("open:project", null, @config)

      context "normal browser list behavior", ->
        it "lists browsers", ->
          cy
            .get(".browsers-list").parent()
            .find(".dropdown-menu").first().find("li").should("have.length", 2)
            .should ($li) ->
              expect($li.first()).to.contain("Chromium")
              expect($li.last()).to.contain("Canary")

        it "displays default browser name in chosen", ->
          cy
            .get(".browsers-list>a").first()
              .should("contain", "Chrome")

        it "displays default browser icon in chosen", ->
          cy
            .get(".browsers-list>a").first()
              .find(".fa-chrome")

        it "does not display stop button", ->
          cy
            .get(".close-browser").should("not.exist")

      context "switch browser", ->
        beforeEach ->
          cy
            .get(".browsers-list>a").first().click()
            .get(".browsers-list").find(".dropdown-menu")
              .contains("Chromium").click()

        it "switches text in button on switching browser", ->
          cy
            .get(".browsers-list>a").first().contains("Chromium")

        it "swaps the chosen browser into the dropdown", ->
          cy
            .get(".browsers-list").find(".dropdown-menu")
            .find("li").should("have.length", 2)
            .should ($li) ->
              expect($li.first()).to.contain("Chrome")
              expect($li.last()).to.contain("Canary")

      context "opening browser by choosing spec", ->
        beforeEach ->
          cy
            .fixture("specs").then (@specs) ->
              @ipc.handle("get:specs", null, @specs)
          cy
            .contains(".file", "app_spec").click().then ->
              @ipc.handle("get:open:browsers", null, [])

        it "displays browser icon as spinner", ->
          cy
            .get(".browsers-list>a").first().find("i")
              .should("have.class", "fa fa-refresh fa-spin")

        it "disables browser dropdown", ->
          cy
            .get(".browsers-list>a").first()
              .and("have.class", "disabled")

      context "browser opened after choosing spec", ->
        beforeEach ->
          cy
            .fixture("specs").then (@specs) ->
              @ipc.handle("get:specs", null, @specs)

          cy
            .contains(".file", "app_spec").click().then ->
              @ipc.handle("get:open:browsers", null, [])
              @ipc.handle("launch:browser", null, {
                  browserOpened: true
                }
              )

        it "displays browser icon as opened", ->
          cy
            .get(".browsers-list>a").first().find("i")
              .should("have.class", "fa fa-wifi")

        it "disables browser dropdown", ->
          cy
            .get(".browsers-list>a").first()
              .should("have.class", "disabled")

        it "displays stop browser button", ->
          cy
            .get(".close-browser").should("be.visible")

        describe "stop browser", ->
          it "calls close:browser on click of stop button", ->
            cy
              .get(".close-browser").click().then ->
                expect(@App.ipc).to.be.calledWith("close:browser")

          it "hides close button on click of stop", ->
            cy
              .get(".close-browser").click()
                .should("not.exist")

          it "re-enables browser dropdown", ->
            cy
              .get(".close-browser").click()
              .get(".browsers-list>a").first()
                .should("not.have.class", "disabled")

          it "displays default browser icon", ->
            cy
              .get(".close-browser").click()
              .get(".browsers-list>a").first()
                .find(".fa-chrome")

        describe "browser is closed manually", ->
          it "hides close browser button", ->
            cy
              .get(".close-browser").should("be.visible").then ->
                @ipc.handle("launch:browser", null, {browserClosed: true})
              .get(".close-browser").should("not.be.visible")

          it "re-enables browser dropdown", ->
            cy
              .get(".close-browser").should("be.visible").then ->
                @ipc.handle("launch:browser", null, {browserClosed: true})
              .get(".browsers-list>a").first()
                .and("not.have.class", "disabled")

          it "displays default browser icon", ->
            cy
              .get(".close-browser").should("be.visible").then ->
                @ipc.handle("launch:browser", null, {browserClosed: true})
              .get(".browsers-list>a").first()
                .find(".fa-chrome")

    describe "only one browser available", ->
      beforeEach ->
        @oneBrowser = [{
          "name": "chrome",
          "version": "50.0.2661.86",
          "path": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "majorVersion": "50"
        }]

        cy
          .fixture("browsers").then ->
            @config.browsers = @oneBrowser
          .get(".projects-list a")
            .contains("My-Fake-Project").as("firstProject").click().then ->
              @ipc.handle("open:project", null, @config)

      context "displays no dropdown btn", ->
        it "displays the first browser and 2 others in the dropdown", ->
          cy
            .get(".browsers-list")
              .find(".dropdown-toggle").should("not.be.visible")

    describe "no browsers available", ->
      beforeEach ->
        cy
          .get(".projects-list a")
            .contains("My-Fake-Project").as("firstProject").click().then ->
              @config.browsers = []
              @ipc.handle("open:project", null, @config)

      it "does not list browsers", ->
        cy.get(".browsers-list").should("not.exist")

      it "displays browser error", ->
        cy.contains("We couldn't find any Chrome browsers")

      it "displays download browser button", ->
        cy.contains("Download Chrome")

      it "closes project on click of 'go back to projects' button", ->
        cy
          .get(".error").contains("Go Back to Projects").click().then ->
            expect(@App.ipc).to.be.calledWith("close:project")

      it "sets project as browser closed on 'go back'", ->

      describe "download browser", ->
        it "triggers external:open on click", ->
          cy
            .contains(".btn", "Download Chrome").click().then ->
              expect(@App.ipc).to.be.calledWith("external:open", "https://www.google.com/chrome/browser/desktop")

  context "unbind ipc listeners", ->
    it "empty's App.ipc()", ->
      obj = @App.ipc()

      ## clear out all the ipc listeners
      ## so we start from a clean slate
      for key, value of obj
        delete obj[key]

      cy
        .get(".projects-list a")
        .contains("My-Fake-Project").as("firstProject").click()
        .then ->
          @ipc.handle("open:project", null, @config)
          @ipc.handle("get:specs", null, [])

      cy
        .contains("Back to Projects").click({force: true})
        .then ->
          expect(@App.ipc()).to.be.empty

  context "switch project", ->
    beforeEach ->
      cy
        .get(".projects-list a")
          .contains("My-Fake-Project").as("firstProject").click().then ->
            @ipc.handle("open:project", null, @config)
            @ipc.handle("get:specs", null, [])

    it "closes project", ->
      cy.contains("Back to Projects").click({force: true}).then ->
        expect(@App.ipc).to.be.calledWith("close:project")

    describe "click on diff project", ->
      beforeEach ->
        cy
          .contains("Back to Projects").click({force: true})
          .get(".projects-list a")
            .contains("project1").click().then ->
              @ipc.handle("open:project", null, @config)

      it "displays projects nav", ->
        cy
          .get(".empty").should("not.be.visible")
          .get(".navbar-default")
