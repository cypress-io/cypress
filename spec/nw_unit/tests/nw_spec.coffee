## these specs are bombing with seg faults when
## we boot our server.  probably needs to become
## a child process (via new-instance) or some
## other form.  potentially think about converting
## these tests like NW's automation is, or experiment
## with actually starting the REAL server as a forked
## process, instead of running as it is currently

root = "../../../"

Promise    = require("bluebird")
expect     = require("chai").expect
# Cypress    = require("#{root}lib/cypress")
cache      = require("#{root}lib/cache")
Log        = require("#{root}lib/log")
Fixtures   = require "#{root}/spec/server/helpers/fixtures"

module.exports = (parentWindow, loadApp) ->

  beforeEach ->
    cache.remove()
    Log.clearLogs()

  afterEach ->
    Promise.delay(100)

  ## Project must be the very first test because
  ## we load up everything in node at that time
  ## and it crashes if its the 2nd window to open
  describe "Projects", ->
    beforeEach ->
      Fixtures.scaffold()

      @todos = Fixtures.project("todos")

      cache.setUser({name: "Brian", session_token: "abc123"}).then =>
        cache.addProject(@todos).then =>
          loadApp(@)

    afterEach ->
      Fixtures.remove()

    # context "starting the server", ->
    #   it "displays loading indicator", ->
    #     project = @$("#projects-container .project")
    #     project.click()

    #     loading = @$("i.fa.fa-spinner.fa-spin")
    #     expect(loading).to.exist

    #     span = @$("#project span")
    #     expect(span).to.contain("Starting Server...")

    context "server started", ->
      beforeEach ->
        @$("#projects-container .project").click()

        Promise.delay(1500).then =>
          @project = @$("#project")

      afterEach ->
        @project.find("[data-stop]").click()

        ## it should stop and go back to the projects view
        Promise.delay(500).then =>
          expect(@$("project")).not.to.exist
        .delay(1000)

      it "displays project information", ->
        expect(@project.find("h3")).to.contain("todos")
        expect(@project.find(".well")).to.contain("Server Running")
        expect(@project.find("a")).to.contain("http://localhost:8888")
        expect(@project.find("button[data-stop]")).to.contain("Stop")

    context "projects list", ->
      it "displays added project", ->
        project = @$("#projects-container .project")
        expect(project).to.have.length(1)

        expect(project.find("h4")).to.contain("todos")
        expect(project.find("small")).to.contain(@todos)

  describe "Login", ->
    it "displays login", ->
      loadApp(@).then =>
        button = @$("#login button")
        expect(button).to.contain("Login with Github")

    it "displays login when session_token is null", ->
      cache.setUser({name: "brian", session_token: null}).then =>
        loadApp(@).then =>
          button = @$("#login button")
          expect(button).to.contain("Login with Github")

  describe "Logged In", ->
    beforeEach ->
      cache.setUser({name: "Brian", session_token: "abc123"}).then =>
        loadApp(@)

    it "greets the user", ->
      header = @$("header")
      expect(header).to.contain("Hi,")
      expect(header).to.contain("Brian")

    it "displays empty project well", ->
      well = @$(".well p.lead")
      expect(well).to.contain("No projects have been added.")

  describe "Secret Sauce", ->
    beforeEach ->
      loadApp(@)

    it "has SecretSauce defined globally", ->
      expect(@contentWindow.SecretSauce).to.be.an("object")

  ## other tests which need writing
  ## 1. logging in (stub the github response)
  ## 2. adding a new project through the UI
  ## 3. updating to a new version
  ## 4. removing a project
  ## 5. logging out

