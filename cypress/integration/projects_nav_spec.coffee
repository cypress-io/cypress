describe "Projects Nav", ->
  beforeEach ->
    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()

        @agents.spy(@App, "ipc")

        @ipc.handle("get:options", null, {})

  describe "no projects", ->
    beforeEach ->
      cy
        .fixture("user").then (@user) ->
          @ipc.handle("get:current:user", null, @user)
          @ipc.handle("get:project:paths", null, [])

    it "hides projects nav", ->
      cy.get(".navbar-default").should("not.exist")

  describe "selected project", ->
    beforeEach ->
      @firstProjectName = "My-Fake-Project"
      @lastProjectName = "project5"

      cy
        .fixture("user").then (@user) ->
          @ipc.handle("get:current:user", null, @user)
        .fixture("projects").then (@projects) ->
          @ipc.handle("get:project:paths", null, @projects)

      cy
        .get(".projects-list .dropdown-menu a")
          .contains(@firstProjectName).as("firstProject").click()

    context "project nav", ->
      it "displays projects nav", ->
        cy
          .get(".empty").should("not.be.visible")
          .get(".navbar-default")

      describe.skip "default page", ->
        it "displays 'tests' nav as active", ->
          cy
            .get(".navbar-default").contains("Tests")
              .should("have.class", "active")

        it "displays 'tests' page", ->
          cy
            .contains("Integration")

      describe.skip "builds page", ->
        beforeEach ->
          cy
            .get(".navbar-default")
              .contains("Builds").as("buildsNav").click()

        it "highlights builds on click", ->
          cy
            .get("@buildsNav")
              .should("have.class", "active")

        it "displays builds page", ->
          cy
            .contains("h4", "Builds")

      describe.skip "config page", ->
        beforeEach ->
          cy
            .get(".navbar-default")
              .contains("Config").as("configNav").click()

        it "highlights builds on click", ->
          cy
            .get("@configNav")
              .should("have.class", "active")

        it "displays builds page", ->
          cy
            .contains("h4", "Config")

    context "browsers dropdown", ->
      beforeEach ->
        @config = {
          clientUrl: "http://localhost:2020",
          clientUrlDisplay: "http://localhost:2020"
        }

      describe "browsers available", ->
        beforeEach ->
          cy
            .fixture("browsers").then (@browsers) ->
              @config.browsers = @browsers
              @ipc.handle("open:project", null, @config)

        it.skip "lists browsers", ->
          cy
            .get(".browsers-list").parent()
            .find(".dropdown-menu").first().find("li").should("have.length", 2)
            .then ($li) ->
              expect($li.first()).to.contain("Chromium")
              expect($li.last()).to.contain("Canary")

        it.skip "displays default browser name in chosen", ->
          cy
            .get(".browsers-list>a").first()
              .should("contain", "Chrome")

        it "displays default browser icon in chosen", ->
          cy
            .get(".browsers-list>a").first()
              .find(".fa-chrome")

        context.skip "switch browser", ->
          beforeEach ->
            cy
              .get(".browsers-list>a").first().click()
              .get(".dropdown-menu")
                .contains("Chromium").click()

          it "switches text in button on switching browser", ->
            cy
              .get(".browsers-list>a").first().contains("Chromium")

          it "sends the 'launch:browser' event immediately", ->
            cy.wrap(@App.ipc).should("be.calledWith", "launch:browser", {
              browser: "chromium"
              url: undefined
            })

          it "swaps the chosen browser into the dropdown", ->
            cy
              .get(".dropdown-menu").first().find("li").should("have.length", 2)
              .then ($li) ->
                expect($li.first()).to.contain("Chrome")
                expect($li.last()).to.contain("Canary")

        context.skip "relaunch browser", ->
          beforeEach ->
            cy
              .get("@firstProject").click()

          it "attaches 'on:launch:browser' after project opens", ->
            cy.wrap(@App.ipc).should("be.calledWith", "on:launch:browser")

          it "relaunchers browser when 'on:launch:browser' fires", ->
            @ipc.handle("on:launch:browser", null, {
              browser: "chromium"
              url: "http://localhost:2020/__/#tests/foo_spec.js"
            })

            cy
              .wrap(@App.ipc).should("be.calledWith", "launch:browser", {
                browser: "chromium"
                url: "http://localhost:2020/__/#tests/foo_spec.js"
              })
              .get(".browsers-list>a").first().contains("Chromium")


      describe "only one browser available", ->
        beforeEach ->
          @config = {
            clientUrl: "http://localhost:2020",
            clientUrlDisplay: "http://localhost:2020"
          }

          @oneBrowser = [{
            "name": "chrome",
            "version": "50.0.2661.86",
            "path": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "majorVersion": "50"
          }]

          cy
            .fixture("browsers").then ->
              @config.browsers = @oneBrowser

              @ipc.handle("open:project", null, @config)

        context "displays no dropdown btn", ->
          it "displays the first browser and 2 others in the dropdown", ->
            cy
              .get(".browsers-list")
                .find(".dropdown-toggle").should("not.be.visible")

      describe "no browsers available", ->
        beforeEach ->
          @config.browsers = []
          @ipc.handle("open:project", null, @config)

        it "does not list browsers", ->
          cy.get(".browsers-list").should("not.exist")

        it.skip "displays browser error", ->
          cy.contains("We couldn't find any Chrome browsers")

        it.skip "displays download browser button", ->
          cy.contains("Download Chrome")

        describe.skip "download browser", ->
          it "triggers external:open on click", ->
            cy
              .contains(".btn", "Download Chrome").click().then ->
                expect(@App.ipc).to.be.calledWith("external:open", "https://www.google.com/chrome/browser/")

    context "server running status", ->
      it "displays as Running on project open", ->
        cy
          .get(".server-status>a").contains("Running")

      it.skip "displays Stopped on stop click", ->
        cy
          .get(".server-status").click()
          .find(".dropdown-menu").contains("Stop").click()
          .get(".server-status>a").contains("Stopped")

    context "switch project", ->
      beforeEach ->
        cy
          .contains(@firstProjectName).click()
          .get(".projects-list .dropdown-menu a")
            .contains(@lastProjectName).as("lastProject").click()

      it "displays projects nav", ->
        cy
          .get(".empty").should("not.be.visible")
          .get(".navbar-default")

      context "browsers dropdown", ->
        beforeEach ->
          @config = {
            clientUrl: "http://localhost:2020",
            clientUrlDisplay: "http://localhost:2020"
          }

          cy
            .fixture("browsers").then (@browsers) ->
              @config.browsers = @browsers
              @ipc.handle("close:project", null, {})
              @ipc.handle("open:project", null, @config)

        it "lists browsers", ->
          cy.get(".browsers-list")
