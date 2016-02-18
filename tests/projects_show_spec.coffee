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
      @errName = "Port 2020"
      @errMsg = "There is already a port running"

    it "displays normal error message [00y]", ->
      @ipc.handle("open:project", {name: @errName, message: @errMsg}, {})

      cy
        .get(".error")
          .should("contain", @errName)
          .and("contain", @errMsg)

    it "displays Port in Use instructions on err [00z]", ->
      @ipc.handle("open:project", {portInUse: true, name: @errName, message: @errMsg}, {})

      cy
        .get(".error")
          .should("contain", @errName)
          .and("contain", @errMsg)
          .and("contain", "To Fix:")

    it "returns to projects on cancel button click [010]", ->
      @ipc.handle("open:project", {name: @errName, message: @errMsg}, {})

      cy
        .contains(".btn", "Cancel").click().then ->
          @ipc.handle("close:project", null, {})
          @ipc.handle("get:project:paths", null, @projects)
        .get("#projects-container")

