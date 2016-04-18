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

  describe "successfully starts server", ->
    beforeEach ->
      @agents.spy(@App, "ipc")

      @config = {
        clientUrl: "http://localhost:2020",
        clientUrlDisplay: "http://localhost:2020"
      }

      @ipc.handle("open:project", null, @config)

    context "server host url", ->
      it "displays server url", ->
        cy.contains(@config.clientUrlDisplay)

      it "triggers external:open to docs on click of question icon", ->
        cy
          .get("[data-js='host-info']").click().then ->
            expect(@App.ipc).to.be.calledWith("external:open", "https://on.cypress.io")

    context "switch browser", ->
      it "switches text in button on switching browser", ->
        cy
          .get(".browser-selector .dropdown-toggle").click()
          .get(".dropdown-menu").contains("Run Chrome").click()
          .get("[data-js='run-browser']").contains("Run Chrome")

    context "run browser", ->
      it.skip "triggers external:open of browser on click of run", ->
        cy
          .get("[data-js='run-browser']").click().then ->
            # expect(@App.ipc)

      it "disabled Run button click of Run", ->
        cy
          .get("[data-js='run-browser']").click()
            .should("be.disabled")

      it "updates text and icon in button on click of Run", ->
        cy
          .get("[data-js='run-browser']").click()
            .should("contain", "Running Chromium")
          .get("[data-js='run-browser']").find(".fa-refresh")

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

