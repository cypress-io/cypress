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
    beforeEach ->
      @ipc.handle("open:project", null, {})

    it "displays folder name [00v]", ->
      cy.contains("h3", "My-Fake-Project")

    it "displays Starting Server... message [00w]", ->
      cy.contains("Starting Server...")

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
          .and("contain", "To Fix:")

    it "returns to projects on cancel button click [010]", ->
      @ipc.handle("open:project", {name: @err.name, message: @err.msg}, {})

      cy
        .contains(".btn", "Cancel").click().then ->
          @ipc.handle("close:project", null, {})
          @ipc.handle("get:project:paths", null, @projects)
        .get("#projects-container")

