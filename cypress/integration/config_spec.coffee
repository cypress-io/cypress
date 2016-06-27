describe "Config", ->
  beforeEach ->
    @firstProjectName = "My-Fake-Project"

    @config = {
      clientUrl: "http://localhost:2020",
      clientUrlDisplay: "http://localhost:2020"
    }

    cy
      .visit("/#/projects/123-456/config")
      .window().then (win) ->
        {@ipc, @App} = win
        @agents = cy.agents()
        @ipc.handle("get:options", null, {})
        @agents.spy(@App, "ipc")
      .fixture("user").then (@user) ->
        @ipc.handle("get:current:user", null, @user)
      .fixture("projects").then (@projects) ->
        @ipc.handle("get:project:paths", null, @projects)
      .fixture("browsers").then (@browsers) ->
        @config.browsers = @browsers
        @ipc.handle("open:project", null, @config)

  it "navigates to config page", ->
    cy
      .location().its("hash").should("include", "config")
