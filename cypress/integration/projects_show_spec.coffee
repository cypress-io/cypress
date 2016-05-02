describe "Project Show", ->
  beforeEach ->
    cy
      .visit("/")
      .window().then (win) ->
        {@ipc, @App} = win

        @agents = cy.agents()

        @ipc.handle("get:options", null, {})

      .fixture("user").then (@user) ->
        @ipc.handle("get:current:user", null, @user)
      .fixture("projects").then (@projects) ->
        @ipc.handle("get:project:paths", null, @projects)
      .get("#projects-container>li").first().click()

  describe "begins starting server", ->
    it "displays folder name", ->
      cy.contains("h3", "My-Fake-Project")

    it "displays folder path", ->
      cy.contains(@projects[0])

    it "displays Starting Server... message", ->
      cy.contains("Starting server...")

  describe "server error", ->
    beforeEach ->
      @err = {
        name: "Port 2020"
        msg: "There is already a port running"
      }

    it "displays normal error message", ->
      @ipc.handle("open:project", {name: @err.name, message: @err.msg}, {})

      cy
        .get(".error")
          .should("contain", @err.name)
          .and("contain", @err.msg)

    it "displays Port in Use instructions on err", ->
      @ipc.handle("open:project", {portInUse: true, name: @err.name, message: @err.msg}, {})

      cy
        .get(".error")
          .should("contain", @err.name)
          .and("contain", @err.msg)
          .and("contain", "To fix")

    it "triggers close:project on dismiss button click", ->
      @ipc.handle("open:project", {name: @err.name, message: @err.msg}, {})
      @agents.spy(@App, "ipc")

      cy
        .contains(".btn", "Dismiss").click().then ->
          expect(@App.ipc).to.be.calledWith("close:project")
          @ipc.handle("close:project", null, {})
        .then ->
          expect(@App.ipc).to.be.calledWith("get:project:paths")

    it "returns to projects on dismiss button click", ->
      @ipc.handle("open:project", {name: @err.name, message: @err.msg}, {})

      cy
        .contains(".btn", "Dismiss").click().then ->
          @ipc.handle("close:project", null, {})
          @ipc.handle("get:project:paths", null, @projects)
        .get("#projects-container")

  describe "successfully starts server with browsers", ->
    beforeEach ->
      @agents.spy(@App, "ipc")

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

      it "triggers external:open to docs on click of question icon", ->
        cy
          .get("[data-js='host-info']").click().then ->
            expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io")

    context "list browsers", ->
      it "displays the first browser and 2 others in the dropdown", ->
        cy
          .get("[data-js='browser-text']").should("contain", "Run Chrome 50")
          .get(".dropdown-menu").first().find("li").should("have.length", 2)
          .then ($li) ->
            ## TODO: to.contain does not handle whitespace
            # expect($li.first()).to.contain("Run Chrome 50")
            # expect($li.last()).to.contain("Run Canary 50")

            expect($li.first()).to.contain("Chromium")
            expect($li.last()).to.contain("Canary")

      it "has a fa-chrome icon for chromium", ->
        cy.contains("Chromium").find("i").should("have.class", "fa-chrome")

      it "has a fa-chrome icon for canary", ->
        cy.contains("Canary").find("i").should("have.class", "fa-chrome")

    context "run browser", ->
      beforeEach ->
        cy.get("[data-js='run-browser']").first().as("browser")

      it "triggers launch:browser of browser on click of run", ->
        cy.get("@browser").click().then ->
          expect(@App.ipc).to.be.calledWith("launch:browser", "chrome")

      describe "closed state", ->
        it "is enabled", ->
          cy.get("@browser").should("be.enabled")

        it "disables then reenables", ->
          cy
            .get("@browser").click().should("be.disabled").then ->
              @ipc.handle("launch:browser", null, {browserClosed: true})
            .get("@browser").should("be.enabled")

      describe "opening state", ->
        beforeEach ->
          cy.get("@browser").click()

        it "disables button", ->
          cy.get("@browser").should("be.disabled")

        it "displays browser name", ->
          cy.get("@browser").should("contain", "Opening Chrome")

        it "sets spinner icon and opening text", ->
          cy
            .get("@browser").find("i")
              .should("have.length", 1).and("have.class", "fa-refresh fa-spin")

      describe "opened state", ->
        beforeEach ->
          cy.get("@browser").click().then ->
            @ipc.handle("launch:browser", null, {browserOpened: true})

        it "continues disabling button", ->
          cy.get("@browser").should("be.disabled")

        it "displays browser name", ->
          cy.get("@browser").should("contain", "Running Chrome")

        it "removes spinner, sets icon to check-circle, and says Running", ->
          cy
            .get("@browser").find("i")
              .should("have.length", 1).and("have.class", "fa-check-circle")

    context "switch browser", ->
      beforeEach ->
        cy
          .get(".browser-selector .dropdown-toggle").click()
          .get(".dropdown-menu").contains("Chromium").click()

      it "switches text in button on switching browser", ->
        cy.get("[data-js='run-browser']").first().contains("Chromium")

      it "sends the 'launch:browser' event immediately", ->
        cy.wrap(@App.ipc).should("be.calledWith", "launch:browser", "chromium")

      it "swaps the chosen browser into the dropdown", ->
        cy
          .get(".dropdown-menu").first().find("li").should("have.length", 2)
          .then ($li) ->
            ## TODO: to.contain does not handle whitespace
            # expect($li.first()).to.contain("Run Chrome 50")
            # expect($li.last()).to.contain("Run Canary 50")

            expect($li.first()).to.contain("Chrome")
            expect($li.last()).to.contain("Canary")

    context "stop server", ->
      it "triggers close:project on click of Stop", ->
        cy
          .contains(".btn", "Stop").click().then ->
            expect(@App.ipc).to.be.calledWith("close:project")
            @ipc.handle("close:project", null, {})
          .then ->
            expect(@App.ipc).to.be.calledWith("get:project:paths")

      it "returns to projects on Stop button click", ->
        cy
          .contains(".btn", "Stop").click().then ->
            @ipc.handle("close:project", null, {})
            @ipc.handle("get:project:paths", null, @projects)
          .get("#projects-container")

      it "attaches 'on:project:settings:change' after project opens", ->
        cy.wrap(@App.ipc).should("be.calledWith", "on:project:settings:change")

      it "closes existing server + reopens on 'on:project:settings:change'", ->
        @agents.spy(@App.ipc, "off")

        cy
          .contains(@config.clientUrlDisplay)
          .then ->
            @ipc.handle("close:project", null, {})
            @ipc.handle("open:project", null, {
              clientUrl: "http://localhost:8888",
              clientUrlDisplay: "http://localhost:8888"
            })

            ## cause a settings change event
            @ipc.handle("on:project:settings:change")

        cy
          .contains("http://localhost:8888")
          .then ->
            expect(@App.ipc.off).to.be.calledWith("on:project:settings:change")


  describe "removes dropdown button when only one browser", ->
    beforeEach ->
      @agents.spy(@App, "ipc")

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
          .get(".browser-selector")
            .find(".dropdown-toggle").should("not.be.visible")

  ## TODO: update error handling logic
  describe "shows error with no browsers", ->
    beforeEach ->
      @agents.spy(@App, "ipc")

      @config = {
        clientUrl: "http://localhost:2020",
        clientUrlDisplay: "http://localhost:2020"
        browsers: []
      }

      @ipc.handle("open:project", null, @config)

    it "displays browser error", ->
      cy.contains("We couldn't find any browsers")

    it "displays download browser button", ->
      cy.contains("Download Chrome")

    describe "download browser", ->
      it "triggers external:open on click", ->
        cy
          .get("[data-download-browser]").click().then ->
            expect(@App.ipc).to.be.calledWith("external:open", "https://www.google.com/chrome/browser/")

      it "triggers close:project on click", ->
        cy
          .contains(".btn", "Download Chrome").click().then ->
            expect(@App.ipc).to.be.calledWith("close:project")
            @ipc.handle("close:project", null, {})
          .then ->
            expect(@App.ipc).to.be.calledWith("get:project:paths")

      it "returns to projects on click", ->
        cy
          .contains(".btn", "Download Chrome").click().then ->
            @ipc.handle("close:project", null, {})
            @ipc.handle("get:project:paths", null, @projects)
          .get("#projects-container")