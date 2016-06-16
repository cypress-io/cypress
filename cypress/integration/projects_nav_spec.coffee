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

  describe "projects nav", ->
    beforeEach ->
      cy
        .fixture("user").then (@user) ->
          @ipc.handle("get:current:user", null, @user)
        .fixture("projects").then (@projects) ->
          @ipc.handle("get:project:paths", null, @projects)

       cy
        .contains("Projects").click()
        .get(".projects-list .dropdown-menu a").first().click().should ->
          expect(@App.ipc).to.be.calledWith("open:project")

    it "displays projects nav", ->
      cy
        .get(".empty").should("not.be.visible")
        .get(".navbar-default")
