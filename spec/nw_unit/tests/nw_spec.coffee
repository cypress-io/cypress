## these specs are bombing with seg faults when
## we boot our server.  probably needs to become
## a child process (via new-instance) or some
## other form.  potentially think about converting
## these tests like NW's automation is, or experiment
## with actually starting the REAL server as a forked
## process, instead of running as it is currently

## because we run these tests during the /dist
## process after obfuscation we no longer have
## access to individual modules and must walk
## back up to the root cypress-app dir and grab
## them from there because process.cwd() still
## matches wherever we're invoking this file from
lookup = (path) ->
  try
    require(path)
  catch e
    require("../../#{path}")

root = "../../../"

Promise      = require("bluebird")
chai         = require("chai")
fs           = require("fs")
cache        = lookup("#{root}lib/cache")
Log          = lookup("#{root}lib/log")
Routes       = lookup("#{root}lib/util/routes")
sinon        = require("sinon")
sinonChai    = require("sinon-chai")
sinonPromise = require("sinon-as-promised")
nock         = require("nock")
Fixtures     = require("#{root}/spec/server/helpers/fixtures")

fs = Promise.promisifyAll(fs)

chai.use(sinonChai)

expect = chai.expect

module.exports = (parentWindow, gui, loadApp) ->
  beforeEach ->
    @debug = (fn) =>
      setTimeout fn, 1000

    @sandbox = sinon.sandbox.create()
    cache.remove()
    Log.clearLogs()

  afterEach ->
    @sandbox.restore()
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

    context "boot errors", ->
      it "cypress.json parse errors", ->
        fs.writeFileSync @todos + "/cypress.json", "{'foo': 'bar}"
        @$("#projects-container .project").click()

        Promise.delay(1000).then =>
          project = @$("#project")
          expect(project.find("p.text-danger")).to.contain("Could not start server!")
          expect(project.find("p.bg-danger")).to.contain("Error reading from")
          expect(project.find("p.bg-danger")).to.contain("Unexpected token")
          expect(project.find("p.bg-danger br")).to.have.length(2)

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

  describe "Applying Updates", ->
    beforeEach ->
      loadApp(@, {start: false}).then =>
        @App.vent.on "app:entities:ready", =>
          @moveTo  = @sandbox.spy @currentWindow, "moveTo"
          @install = @sandbox.stub @App.updater, "install"

        ## trick the argv into thinking we are updating!
        @App.start argv: ["path/to/app_path", "path/to/exec_path", "--updating", "--coords=1136x30"]

    it "passes appPath and execPath to install", ->
      expect(@install).to.be.calledWith "path/to/app_path", "path/to/exec_path"

    it "informs the user we are applying updates!", ->
      expect(@$(".well")).to.contain("Applying Updates and Restarting...")

    it "moves the window to the coords arguments", ->
      expect(@moveTo).to.be.calledWith "1136", "30"

  describe "About Window", ->
    beforeEach ->
      cache.setUser({name: "Brian", session_token: "abc123"}).then =>
        loadApp(@)

    afterEach ->
      @win?.close()

    it "can click About in footer menu to bring up About Page", (done) ->
      @$("#footer [data-toggle='dropdown']").click()
      @$(".dropdown-menu [data-about]").click()

      @App.vent.on "start:about:app", (region, @win) =>
        expect(@App.aboutRegion.$el.find(".version")).to.contain("Version: 0.1.0")
        expect(@App.aboutRegion.currentView.ui.page).to.contain("www.cypress.io")
        expect(@win.title).to.eq "About"
        done()

  describe "Updates Window", ->
    beforeEach ->
      cache.setUser({name: "Brian", session_token: "abc123"}).then =>
        loadApp(@).then =>
          ## force there to be no updates
          @sandbox.stub(App.updater, "run").yieldsTo("onNone")

    afterEach ->
      @win?.close()

    it "can click Updates in footer menu to bring up Updates Page", (done) ->
      @$("#footer [data-toggle='dropdown']").click()
      @$(".dropdown-menu [data-updates]").click()

      @App.vent.on "start:updates:app", (region, @win) =>
        version = @App.updatesRegion.$el.find(".version")
        expect(version).to.contain("Current Version:")
        expect(version).to.contain("0.1.0")

        expect(@App.updatesRegion.currentView.ui.changelog).to.contain("View Changelog")
        expect(@App.updatesRegion.currentView.ui.state).to.contain("No updates available.")
        expect(@App.updatesRegion.currentView.ui.button).to.contain("Close")
        expect(@win.title).to.eq "Updates"
        done()

  describe "Preferences Window", ->
    win = null

    beforeEach ->
      nock.disableNetConnect()
      cache.setUser({name: "Brian", session_token: "abc123"}).then =>
        loadApp(@)

    afterEach ->
      nock.cleanAll()
      nock.enableNetConnect()
      win?.close()

    context "clicking Preferences in the footer", ->
      beforeEach ->
        @setup = (fn) =>
          @$("#footer [data-toggle='dropdown']").click()
          @$(".dropdown-menu [data-preferences]").click()

          @App.vent.on "start:preferences:app", (region, window) =>
            win = window
            view = @App.preferencesRegion.currentView
            Promise.delay(100).then =>
              fn.call(@, view, win)

      it "display Loading... as the token key", (done) ->
        nock(Routes.api())
          .get("/token")
          .delay(10000)
          .reply(200, {
            api_token: "foo-bar-baz-123"
          })

        @setup (view, win) ->
          expect(view.ui.key).to.have.value("Loading...")
          expect(view.ui.key.parents(".form-group")).not.to.have.class("has-error")
          expect(win.title).to.eq "Preferences"
          done()

      it "displays the token after it is fetched", (done) ->
        nock(Routes.api())
          .get("/token")
          .reply(200, {
            api_token: "foo-bar-baz-123"
          })

        @setup (view, win) ->
          expect(view.ui.key).to.have.value("foo-bar-baz-123")
          expect(view.ui.key.parents(".form-group")).not.to.have.class("has-error")
          done()

      it "can generate a new token", (done) ->
        nock(Routes.api())
          .get("/token")
          .reply(200, {
            api_token: "foo-bar-baz-123"
          })
          .put("/token")
          .delay(500)
          .reply(200, {
            api_token: "some-new-token-987"
          })

        @setup (view, win) ->
          ## when the token is in flight
          view.ui.generate.click()
          expect(view.ui.generate).to.have.attr("disabled")
          expect(view.ui.generate.find("i")).to.have.class("fa-spin")

          ## when the token comes back
          view.model.on "change:token", ->
            expect(view.ui.generate).not.to.have.attr("disabled")
            expect(view.ui.generate.find("i")).not.to.have.class("fa-spin")
            expect(view.ui.key).to.have.value("some-new-token-987")
            done()

      it "displays error if fetching token fails", (done) ->
        nock(Routes.api())
          .get("/token")
          .reply(401)

        @setup (view, win) ->
          expect(view.ui.generate).not.to.have.attr("disabled")
          expect(view.ui.generate.find("i")).not.to.have.class("fa-spin")
          expect(view.ui.key).to.have.value("Loading...")
          expect(view.$el.find(".help-block")).to.contain("An error occured receiving token.")
          done()

      it "displays error if generating token fails", (done) ->
        nock(Routes.api())
          .get("/token")
          .reply(200, {
            api_token: "foo-bar-baz-123"
          })
          .put("/token")
          .reply(401)

        @setup (view, win) ->
          ## when the token is in flight
          view.ui.generate.click()

          ## when the token comes back
          view.model.on "change:error", ->
            expect(view.ui.generate).not.to.have.attr("disabled")
            expect(view.ui.generate.find("i")).not.to.have.class("fa-spin")
            expect(view.ui.key).to.have.value("foo-bar-baz-123")
            expect(view.$el.find(".help-block")).to.contain("An error occured receiving token.")
            done()

      it "disables clicking generate while generating", (done) ->
        nock(Routes.api())
          .get("/token")
          .reply(200, {
            api_token: "foo-bar-baz-123"
          })
          .put("/token")
          .delay(2000)
          .reply(200, {
            api_token: "some-new-token-987"
          })

        @setup (view, win) =>
          view.ui.generate.click()

          generateToken = @sandbox.spy(view.model, "generateToken")

          setTimeout ->
            view.ui.generate.click()
            expect(generateToken).not.to.be.called
            done()
          , 100

      it "removes existing errors when generating", (done) ->
        nock(Routes.api())
          .get("/token")
          .reply(500)
          .put("/token")
          .delay(500)
          .reply(200, {
            api_token: "some-new-token-987"
          })

        @setup (view, win) ->
          ## should have initial error due to 500 returned
          expect(view.ui.key.parents(".form-group")).to.have.class("has-error")

          view.ui.generate.click()

          expect(view.ui.key.parents(".form-group")).not.to.have.class("has-error")

          ## when the token comes back
          view.model.on "change:token", ->
            expect(view.ui.key).to.have.value("some-new-token-987")
            expect(view.ui.key.parents(".form-group")).not.to.have.class("has-error")
            done()

  ## other tests which need writing
  ## 1. logging in (stub the github response)
  ## 2. adding a new project through the UI
  ## 3. updating to a new version
  ## 4. removing a project
  ## 5. logging out

