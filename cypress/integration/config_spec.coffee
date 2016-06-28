describe "Config", ->
  beforeEach ->
    @firstProjectName = "My-Fake-Project"

    @config = {
      clientUrl: "http://localhost:2020",
      clientUrlDisplay: "http://localhost:2020"
    }

    cy
      .visit("/#/projects/e40991dc055454a2f3598752dec39abc/config")
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

  context "displays page", ->
    it "navigates to config page", ->
      cy
        .location().its("hash").should("include", "config")

    it "highlight config nav", ->
      cy
        .contains("a", "Config").should("have.class", "active")

  context "displays config", ->
    it.only "wraps config line in proper classes", ->
      cy
        .get(".line").first().within ->
          cy
            .contains("port").should("have.class", "key").end()
            .contains(":").should("have.class", "colon").end()
            .contains("2020").should("have.class", "default").end()
            .contains(",").should("have.class", "comma")

  context "on:project:settings:change", ->
    beforeEach ->
      cy
        .contains("Config")
        .then ->
          @config.clientUrl = "http://localhost:8888"
          @config.clientUrlDisplay = "http://localhost:8888"
          @config.browsers = @browsers

          @ipc.handle("on:project:settings:change", null, {
            config: @config
            browser: null
          })

      cy.contains("Config")

    it.skip "displays updated config", ->
      @config.clientUrl = "http://localhost:7777"
      @config.clientUrlDisplay = "http://localhost:7777"
      @config.browsers = @browsers

      @ipc.handle("on:project:settings:change", null, {
        config: @config
        browser: null
      })

      cy.contains("http://localhost:7777")

    it "relaunches browser when present", ->
      @config.clientUrl = "http://localhost:7777"
      @config.clientUrlDisplay = "http://localhost:7777"
      @config.browsers = @browsers

      @ipc.handle("on:project:settings:change", null, {
        config: @config
        browser: "chrome"
      })

      cy
        .contains("http://localhost:7777")
        .then ->
          cy.wrap(@App.ipc).should("be.calledWith", "launch:browser", {
            browser: "chrome"
            url: undefined
          })

    it.skip "displays errors", ->
      @config.clientUrl = "http://localhost:7777"
      @config.clientUrlDisplay = "http://localhost:7777"
      @config.browsers = @browsers

      @ipc.handle("on:project:settings:change", null, {
        config: @config
        browser: null
      })

      cy
        .contains("http://localhost:7777")
        .then ->
          @ipc.handle("on:project:settings:change", {
            name: "Port 2020"
            msg: "There is already a port running"
          }, null)

      cy.contains("Can't start server")

