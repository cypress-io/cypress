_            = require("lodash")
lookup       = require("../js/spec_helper")
cache        = lookup("lib/cache")
Routes       = lookup("lib/util/routes")

module.exports = (parentWindow, gui, loadApp) ->
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

    it "displays 'logging in'", ->
      @user = {
        id: 1
        name: "brian"
        email: "a@b.com"
        session_token: "1111-2222-3333-4444"
      }

      nock(Routes.api())
        .post("/signin")
        .query({code: "123-foo-bar"})
        .delay(300)
        .reply(200, @user)

      loadApp(@).then =>
        @App.vent.trigger("logging:in", "app://authentication.html?code=123-foo-bar")

        expect(@$("#login").find(".fa-spinner")).to.exist
        expect(@$("#login").find("span")).to.contain("Logging in...")

        Promise.delay(500).then =>
          well = @$(".well p.lead")
          expect(well).to.contain("No projects have been added.")

    it.only "displays login errors", ->
      @user = {
        id: 1
        name: "brian"
        email: "a@b.com"
        session_token: "1111-2222-3333-4444"
      }

      nock(Routes.api())
        .post("/signin")
        .query({code: "123-foo-bar"})
        .delay(300)
        .reply(401, "Your email: '#{@user.email}' has not been authorized.")

      loadApp(@).then =>
        @App.vent.trigger("logging:in", "app://authentication.html?code=123-foo-bar")

        Promise.delay(500).then =>
          expect(@$("#login").find("p.bg-danger")).to.contain(@user.email)
          expect(@$("#login").find("p.bg-danger")).to.contain("has not been authorized.")
          expect(@$("#login").find("p.bg-danger")).not.to.contain("401")

  describe "Platform Specific GUI", ->
    switch process.platform
      when "darwin"
        context "osx", ->
          it "sets native menu", ->
            loadApp(@).then =>
              expect(@currentWindow.menu).to.be.ok

          it "binds to blur event", ->
            loadApp(@).then =>
              expect(@currentWindow.listeners("blur")).to.have.length(1)

      when "linux"
        context "linux", ->
          it "does not set native menu", ->
            loadApp(@).then =>
              expect(@currentWindow.menu).to.be.undefined

          it "does not set tray"

          it "does not bind to blur event", ->
            loadApp(@).then =>
              expect(@currentWindow.listeners("blur")).to.have.length(0)

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

        Promise.delay(200)

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

    it "focuses on the window", (done) ->
      focus = @sandbox.spy global.Window.prototype, "focus"

      @$("#footer [data-toggle='dropdown']").click()
      @$(".dropdown-menu [data-about]").click()

      @App.vent.on "start:about:app", (region, @win) =>
        expect(focus).to.be.calledOn(@win)
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

    it "focuses on the window", (done) ->
      focus = @sandbox.spy global.Window.prototype, "focus"

      @$("#footer [data-toggle='dropdown']").click()
      @$(".dropdown-menu [data-updates]").click()

      @App.vent.on "start:updates:app", (region, @win) =>
        expect(focus).to.be.calledOn(@win)
        done()

  # describe "Preferences Window", ->
  #   win = null

  #   beforeEach ->
  #     nock.disableNetConnect()
  #     cache.setUser({name: "Brian", session_token: "abc123"}).then =>
  #       loadApp(@)

  #   afterEach ->
  #     nock.cleanAll()
  #     nock.enableNetConnect()
  #     win?.close()

  #   context "clicking Preferences in the footer", ->
  #     beforeEach ->
  #       @setup = (fn) =>
  #         @$("#footer [data-toggle='dropdown']").click()
  #         @$(".dropdown-menu [data-preferences]").click()

  #         @App.vent.on "start:preferences:app", (region, window) =>
  #           win = window
  #           view = @App.preferencesRegion.currentView
  #           Promise.delay(100).then =>
  #             fn.call(@, view, win)

  #     it "display Loading... as the token key", (done) ->
  #       nock(Routes.api())
  #         .get("/token")
  #         .delay(10000)
  #         .reply(200, {
  #           api_token: "foo-bar-baz-123"
  #         })

  #       @setup (view, win) ->
  #         expect(view.ui.key).to.have.value("Loading...")
  #         expect(view.ui.key.parents(".form-group")).not.to.have.class("has-error")
  #         expect(win.title).to.eq "Preferences"
  #         done()

  #     it "displays the token after it is fetched", (done) ->
  #       nock(Routes.api())
  #         .get("/token")
  #         .reply(200, {
  #           api_token: "foo-bar-baz-123"
  #         })

  #       @setup (view, win) ->
  #         expect(view.ui.key).to.have.value("foo-bar-baz-123")
  #         expect(view.ui.key.parents(".form-group")).not.to.have.class("has-error")
  #         done()

  #     it "can generate a new token", (done) ->
  #       nock(Routes.api())
  #         .get("/token")
  #         .reply(200, {
  #           api_token: "foo-bar-baz-123"
  #         })
  #         .put("/token")
  #         .delay(500)
  #         .reply(200, {
  #           api_token: "some-new-token-987"
  #         })

  #       @setup (view, win) ->
  #         ## when the token is in flight
  #         view.ui.generate.click()
  #         expect(view.ui.generate).to.have.attr("disabled")
  #         expect(view.ui.generate.find("i")).to.have.class("fa-spin")

  #         ## when the token comes back
  #         view.model.on "change:token", ->
  #           expect(view.ui.generate).not.to.have.attr("disabled")
  #           expect(view.ui.generate.find("i")).not.to.have.class("fa-spin")
  #           expect(view.ui.key).to.have.value("some-new-token-987")
  #           done()

  #     it "displays error if fetching token fails", (done) ->
  #       nock(Routes.api())
  #         .get("/token")
  #         .reply(401)

  #       @setup (view, win) ->
  #         expect(view.ui.generate).not.to.have.attr("disabled")
  #         expect(view.ui.generate.find("i")).not.to.have.class("fa-spin")
  #         expect(view.ui.key).to.have.value("Loading...")
  #         expect(view.$el.find(".help-block")).to.contain("An error occured receiving token.")
  #         done()

  #     it "displays error if generating token fails", (done) ->
  #       nock(Routes.api())
  #         .get("/token")
  #         .reply(200, {
  #           api_token: "foo-bar-baz-123"
  #         })
  #         .put("/token")
  #         .reply(401)

  #       @setup (view, win) ->
  #         ## when the token is in flight
  #         view.ui.generate.click()

  #         ## when the token comes back
  #         view.model.on "change:error", ->
  #           expect(view.ui.generate).not.to.have.attr("disabled")
  #           expect(view.ui.generate.find("i")).not.to.have.class("fa-spin")
  #           expect(view.ui.key).to.have.value("foo-bar-baz-123")
  #           expect(view.$el.find(".help-block")).to.contain("An error occured receiving token.")
  #           done()

  #     it "disables clicking generate while generating", (done) ->
  #       nock(Routes.api())
  #         .get("/token")
  #         .reply(200, {
  #           api_token: "foo-bar-baz-123"
  #         })
  #         .put("/token")
  #         .delay(2000)
  #         .reply(200, {
  #           api_token: "some-new-token-987"
  #         })

  #       @setup (view, win) =>
  #         view.ui.generate.click()

  #         generateToken = @sandbox.spy(view.model, "generateToken")

  #         setTimeout ->
  #           view.ui.generate.click()
  #           expect(generateToken).not.to.be.called
  #           done()
  #         , 100

  #     it "removes existing errors when generating", (done) ->
  #       nock(Routes.api())
  #         .get("/token")
  #         .reply(500)
  #         .put("/token")
  #         .delay(500)
  #         .reply(200, {
  #           api_token: "some-new-token-987"
  #         })

  #       @setup (view, win) ->
  #         ## should have initial error due to 500 returned
  #         expect(view.ui.key.parents(".form-group")).to.have.class("has-error")

  #         view.ui.generate.click()

  #         expect(view.ui.key.parents(".form-group")).not.to.have.class("has-error")

  #         ## when the token comes back
  #         view.model.on "change:token", ->
  #           expect(view.ui.key).to.have.value("some-new-token-987")
  #           expect(view.ui.key.parents(".form-group")).not.to.have.class("has-error")
  #           done()