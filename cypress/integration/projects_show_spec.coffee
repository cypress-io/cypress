describe "Project Show", ->
  beforeEach ->
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

    it "word wraps long error message plus update bar", ->
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
      @ipc.handle("open:project", {portInUse: true, name: @err.name, message: @err.msg}, {})

      cy
        .get(".error")
          .should("contain", @err.name)
          .and("contain", @err.msg)
          .and("contain", "To fix")

    it "triggers close:project on dismiss button click", ->
      @ipc.handle("open:project", {name: @err.name, message: @err.msg}, {})

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
          expect(@App.ipc).to.be.calledWith("launch:browser", {
            browser: "chrome"
            url: undefined
          })

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
        cy.wrap(@App.ipc).should("be.calledWith", "launch:browser", {
          browser: "chromium"
          url: undefined
        })

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
            expect(@App.ipc.off).to.be.calledWith("on:launch:browser")

    context "help link", ->
      it "displays help link", ->
        cy.contains("a", "Need help?")

      it "opens link to docs on click of help link", ->
        cy.contains("a", "Need help?").click().then ->
          expect(@App.ipc).to.be.calledWith("external:open", "https://docs.cypress.io")

    context "relaunch browser", ->
      it "attaches 'on:launch:browser' after project opens", ->
        cy.wrap(@App.ipc).should("be.calledWith", "on:launch:browser")

      it "relaunchers browser when 'on:launch:browser' fires", ->
        cy
          .get("[data-js='run-browser']").then ->
            @ipc.handle("on:launch:browser", null, {
              browser: "chromium"
              url: "http://localhost:2020/__/#tests/foo_spec.js"
            })
          .wrap(@App.ipc).should("be.calledWith", "launch:browser", {
            browser: "chromium"
            url: "http://localhost:2020/__/#tests/foo_spec.js"
          })
          .get("[data-js='run-browser']").first().contains("Chromium")

  describe "removes dropdown button when only one browser", ->
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
          .get(".browser-selector")
            .find(".dropdown-toggle").should("not.be.visible")

  ## TODO: update error handling logic
  describe "shows error with no browsers", ->
    beforeEach ->
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

    describe "cancel", ->
      it "displays Cancel button to go back to list", ->
        cy.contains("Cancel")

      it "triggers close:project on cancel button click", ->
        cy
          .contains(".btn", "Cancel").click().then ->
            expect(@App.ipc).to.be.calledWith("close:project")
            @ipc.handle("close:project", null, {})
          .then ->
            expect(@App.ipc).to.be.calledWith("get:project:paths")

      it "returns to projects on cancel button click", ->
        cy
          .contains(".btn", "Cancel").click().then ->
            @ipc.handle("close:project", null, {})
            @ipc.handle("get:project:paths", null, @projects)
        .get("#projects-container")