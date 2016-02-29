describe "Project Show [00r]", ->
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

  describe "begins starting server [00h]", ->
    it "displays folder name [00v]", ->
      cy.contains("h3", "My-Fake-Project")

    it "displays folder path [00v]", ->
      cy.contains(@projects[0])

    it "displays Starting Server... message [00w]", ->
      cy.contains("Starting server...")

  describe "server error [00x]", ->
    beforeEach ->
      @err = {
        name: "Port 2020"
        msg: "There is already a port running"
      }

    it "displays normal error message [00y]", ->
      @ipc.handle("open:project", {name: @err.name, message: @err.msg}, {})

      cy
        .get(".error")
          .should("contain", @err.name)
          .and("contain", @err.msg)

    it "displays Port in Use instructions on err [00z]", ->
      @ipc.handle("open:project", {portInUse: true, name: @err.name, message: @err.msg}, {})

      cy
        .get(".error")
          .should("contain", @err.name)
          .and("contain", @err.msg)
          .and("contain", "To fix")

    it "triggers close:project on dismiss button click [013]", ->
      @ipc.handle("open:project", {name: @err.name, message: @err.msg}, {})
      @agents.spy(@App, "ipc")

      cy
        .contains(".btn", "Dismiss").click().then ->
          expect(@App.ipc).to.be.calledWith("close:project")
          @ipc.handle("close:project", null, {})
        .then ->
          expect(@App.ipc).to.be.calledWith("get:project:paths")

    it "returns to projects on dismiss button click [010]", ->
      @ipc.handle("open:project", {name: @err.name, message: @err.msg}, {})

      cy
        .contains(".btn", "Dismiss").click().then ->
          @ipc.handle("close:project", null, {})
          @ipc.handle("get:project:paths", null, @projects)
        .get("#projects-container")

  describe "successfully starts server [011]", ->
    beforeEach ->
      @agents.spy(@App, "ipc")

      @config = {
        clientUrl: "http://localhost:2020",
        clientUrlDisplay: "http://localhost:2020"
      }

      @ipc.handle("open:project", null, @config)

    it "displays Server url [00v]", ->
      cy.contains(@config.clientUrlDisplay)

    it "triggers external:open on click of url [012]", ->
      cy
        .contains("a", @config.clientUrlDisplay).click().then ->
          expect(@App.ipc).to.be.calledWith("external:open", "http://localhost:2020")

    it "triggers close:project on click of Stop [014]", ->
      cy
        .contains(".btn", "Stop").click().then ->
          expect(@App.ipc).to.be.calledWith("close:project")
          @ipc.handle("close:project", null, {})
        .then ->
          expect(@App.ipc).to.be.calledWith("get:project:paths")


    it "returns to projects on Stop button click [010]", ->
      cy
        .contains(".btn", "Stop").click().then ->
          @ipc.handle("close:project", null, {})
          @ipc.handle("get:project:paths", null, @projects)
        .get("#projects-container")

    it "attaches 'on:project:settings:change' after project opens [02z]", ->
      cy.wrap(@App.ipc).should("be.calledWith", "on:project:settings:change")

    it "closes existing server + reopens on 'on:project:settings:change' [030]", ->
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
        .contains("http://localhost:8888")
        .then ->
          expect(@App.ipc.off).to.be.calledWith("on:project:settings:change")

