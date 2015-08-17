_            = require("lodash")
lookup       = require("../js/spec_helper")
cache        = lookup("lib/cache")
# Server       = lookup("lib/server")
# Chromium     = lookup("lib/chromium")
Routes       = lookup("lib/util/routes")

module.exports = (parentWindow, gui, loadApp) ->
  describe "CLI Args", ->
    beforeEach ->
      nock.disableNetConnect()

      Fixtures.scaffold()
      @todos = Fixtures.project("todos")

      ## need to pull these off of the backend instances
      ## because we may be minified and cannot access files directly
      @Server   = => @backend.Server
      @Chromium = => @backend.Chromium

      @argsAre = (args...) =>
        if _.isFunction(_.last(args))
          fn = args.pop()

        loadApp(@, {start: false}).then =>
          @App.vent.on "app:entities:ready", =>
            @exit       = @sandbox.stub process, "exit"
            @write      = @sandbox.stub process.stdout, "write"
            @trigger    = @sandbox.spy  @App.vent, "trigger"
            @runProject = @sandbox.spy  @App.config, "runProject"
            @open       = @sandbox.spy  @Server().prototype, "open"

            @App.commands.setHandler("start:chromium:run", ->)

            ## prevent the actual project from literally booting
            @_open = @sandbox.stub @Server().prototype, "_open", ->
              ## resolve with our own config object
              Promise.resolve(@config)

            fn() if fn

          {@backend} = @App.start({argv: [].concat(args)})

          # wait for our token to come back
          # because its async
          Promise.delay(200)

    afterEach ->
      Fixtures.remove()
      nock.cleanAll()
      nock.enableNetConnect()

    context "--get-key", ->
      it "writes out key and exits", ->
        nock(Routes.api())
          .get("/projects/e3e58d3f-3769-4b50-af38-e31b8989a938/token")
          .reply(200, {
            api_token: "foo-bar-baz-123"
          })

        cache.setUser({name: "Brian", session_token: "abc123"}).then =>
          cache.addProject(@todos).then =>
            @argsAre("--get-key", "--project", @todos).then =>
              expect(@write).to.be.calledWith("foo-bar-baz-123\n")
              expect(@exit).to.be.calledOnce

      it "requires a session_token", ->
        cache.setUser({name: "Brian"}).then =>
          @argsAre("--get-key").then =>
            expect(@write).not.to.be.calledWith("foo-bar-baz-123\n")
            expect(@exit).to.be.calledWith(1)

      it "notifies on fetch error", ->
        nock(Routes.api())
          .get("/projects/e3e58d3f-3769-4b50-af38-e31b8989a938/token")
          .reply(404)

        cache.setUser({name: "Brian", session_token: "abc123"}).then =>
          cache.addProject(@todos).then =>
            @argsAre("--get-key", "--project", @todos).then =>
              expect(@write).to.be.calledWithMatch("An error occured receiving token.")
              expect(@exit).to.be.calledWith(1)

      it "notfies when project path cannot be found", ->
        cache.setUser({name: "Brian", session_token: "abc123"}).then =>
          @argsAre("--get-key", "--project", "/foo/bar").then =>
            expect(@write).to.be.calledWithMatch("Sorry, could not retreive project key because no project was found:")
            expect(@write).to.be.calledWithMatch("/foo/bar")
            expect(@exit).to.be.calledWith(1)

    context "--new-key", ->
      it "writes out key and exits", ->
        nock(Routes.api())
          .put("/projects/e3e58d3f-3769-4b50-af38-e31b8989a938/token")
          .reply(200, {
            api_token: "new-key-987"
          })

        cache.setUser({name: "Brian", session_token: "abc123"}).then =>
          cache.addProject(@todos).then =>
            @argsAre("--new-key", "--project", @todos).then =>
              expect(@write).to.be.calledWith("new-key-987\n")
              expect(@exit).to.be.calledOnce

      it "requires a session_token", ->
        cache.setUser({name: "Brian"}).then =>
          @argsAre("--new-key").then =>
            expect(@write).not.to.be.calledWith("new-key-987\n")
            expect(@exit).to.be.calledWith(1)

      it "notifies on fetch error", ->
        nock(Routes.api())
          .put("/projects/e3e58d3f-3769-4b50-af38-e31b8989a938/token")
          .reply(500)

        cache.setUser({name: "Brian", session_token: "abc123"}).then =>
          cache.addProject(@todos).then =>
            @argsAre("--new-key", "--project", @todos).then =>
              expect(@write).to.be.calledWithMatch("An error occured receiving token.")
              expect(@exit).to.be.calledWith(1)

      it "notfies when project path cannot be found", ->
        cache.setUser({name: "Brian", session_token: "abc123"}).then =>
          @argsAre("--get-key", "--project", "/foo/bar").then =>
            expect(@write).to.be.calledWithMatch("Sorry, could not retreive project key because no project was found:")
            expect(@write).to.be.calledWithMatch("/foo/bar")
            expect(@exit).to.be.calledWith(1)

    context "--run-project --ci --key", ->
      it "requires linux env", ->
        @sandbox.stub(os, "platform").returns("darwin")

        @argsAre("--run-project", @todos, "--ci", "abc123").then =>
          expect(@write).to.be.calledWithMatch("Sorry, running in CI requires a valid CI provider and environment.")
          expect(@exit).to.be.calledWith(1)

      it "ensures there is no user session", ->
        @sandbox.stub(os, "platform").returns("linux")

        cache.setUser({name: "Brian", session_token: "abc123"}).then =>
          @argsAre("--run-project", @todos, "--ci", "abc123").then =>
            expect(@write).to.be.calledWithMatch("Sorry, running in CI requires a valid CI provider and environment.")
            expect(@exit).to.be.calledWith(1)

      it "requires valid project key", ->
        @sandbox.stub(os, "platform").returns("linux")

        nock(Routes.api())
          .post("/ci/e3e58d3f-3769-4b50-af38-e31b8989a938")
          .matchHeader("x-project-token", "abc123")
          .reply(401)

        cache.setUser({name: "Brian"}).then =>
          @argsAre("--run-project", @todos, "--ci", "--key", "abc123").then =>
            expect(@write).to.be.calledWithMatch("Sorry, your project's API Key: 'abc123' was not valid. This project cannot run in CI.")
            expect(@exit).to.be.calledWith(1)
            expect(@trigger).not.to.be.calledWith("start:projects:app")

      it "can start projects in ci mode", ->
        @sandbox.stub(os, "platform").returns("linux")

        nock(Routes.api())
          .post("/ci/e3e58d3f-3769-4b50-af38-e31b8989a938")
          .matchHeader("x-project-token", "abc123")
          .reply(200)

        cache.setUser({name: "Brian"}).then =>
          @argsAre("--run-project", @todos, "--ci", "--key", "abc123").then =>
            expect(@trigger).to.be.calledWith("start:projects:app")

      it "calls start:chromium:app with src to all tests", (done) ->
        @sandbox.stub(os, "platform").returns("linux")

        nock(Routes.api())
          .post("/ci/e3e58d3f-3769-4b50-af38-e31b8989a938")
          .matchHeader("x-project-token", "abc123")
          .reply(200)

        fn = =>
          @App.commands.setHandler "start:chromium:run", (src, options) ->
            expect(src).to.eq "http://localhost:8888/__/#/tests/__all?__ui=satellite"
            done()

        cache.setUser({name: "Brian"}).then =>
          cache.addProject(@todos).then =>
            @argsAre("--run-project", @todos, "--ci", "--key", "abc123", fn)

      it "calls Chromium#override with {ci: true}", (done) ->
        @sandbox.stub(os, "platform").returns("linux")

        override = @sandbox.stub(@Chromium().prototype, "override")

        nock(Routes.api())
          .post("/ci/e3e58d3f-3769-4b50-af38-e31b8989a938")
          .matchHeader("x-project-token", "abc123")
          .reply(200)

        fn = =>
          win = {}

          @App.commands.setHandler "start:chromium:run", (src, options) =>
            options.onReady(win)
            expect(override).to.be.calledWith({ci: true, reporter: undefined})

            done()

        cache.setUser({name: "Brian"}).then =>
          cache.addProject(@todos).then =>
            @argsAre("--run-project", @todos, "--ci", "--key", "abc123", fn)

      it "calls Chromium#override with custom reporter", (done) ->
        @sandbox.stub(os, "platform").returns("linux")

        override = @sandbox.stub(@Chromium().prototype, "override")

        nock(Routes.api())
          .post("/ci/e3e58d3f-3769-4b50-af38-e31b8989a938")
          .matchHeader("x-project-token", "abc123")
          .reply(200)

        fn = =>
          win = {}

          @App.commands.setHandler "start:chromium:run", (src, options) =>
            options.onReady(win)
            expect(override).to.be.calledWith({ci: true, reporter: "junit"})

            done()

        cache.setUser({name: "Brian"}).then =>
          cache.addProject(@todos).then =>
            @argsAre("--run-project", @todos, "--reporter", "junit", "--ci", "--key", "abc123", fn)

    context "--run-project", ->
      it "requires a session_token", ->
        cache.setUser({name: "Brian"}).then =>
          @argsAre("--get-key").then =>
            expect(@write).not.to.be.calledWith("foo-bar-baz-123\n")
            expect(@exit).to.be.calledWith(1)

      it "can start a project", ->
        cache.setUser({name: "Brian", session_token: "abc123"}).then =>
          @argsAre("--run-project", @todos).then =>
            expect(@trigger).to.be.calledWithMatch("start:projects:app", {
              ci: undefined
              spec: undefined
              reporter: undefined
              projectPath: @todos
            })

      it "throws when cannot find path to project", ->
        cache.setUser({name: "Brian", session_token: "abc123"}).then =>
          @argsAre("--run-project", "/foo/bar").then =>
            expect(@write).to.be.calledWithMatch("Sorry, could not run project because it was not found:")
            expect(@write).to.be.calledWithMatch("/foo/bar")
            expect(@exit).to.be.calledWith(1)

      it "immediately starts the project", ->
        cache.setUser({name: "Brian", session_token: "abc123"}).then =>
          cache.addProject(@todos).then =>
            @argsAre("--run-project", @todos).then =>
              expect(@runProject).to.be.calledWithMatch(@todos, {
                morgan: false
              })

      it "calls start:chromium:app with src to all tests", (done) ->
        fn = =>
          @App.commands.setHandler "start:chromium:run", (src, options) ->
            expect(src).to.eq "http://localhost:8888/__/#/tests/__all?__ui=satellite"
            done()

        cache.setUser({name: "Brian", session_token: "abc123"}).then =>
          cache.addProject(@todos).then =>
            @argsAre("--run-project", @todos, fn)

      it "calls start:chromium:app with src to specific test", (done) ->
        fn = =>
          @App.commands.setHandler "start:chromium:run", (src, options) ->
            expect(src).to.eq "http://localhost:8888/__/#/tests/sub/sub_test.coffee?__ui=satellite"
            done()

        cache.setUser({name: "Brian", session_token: "abc123"}).then =>
          cache.addProject(@todos).then =>
            @argsAre("--run-project", @todos, "--spec", "sub/sub_test.coffee", fn)

      it "validates that specific spec exists", ->
        cache.setUser({name: "Brian", session_token: "abc123"}).then =>
          cache.addProject(@todos).then =>
            @argsAre("--run-project", @todos, "--spec", "foo/bar/baz_spec.js").then =>
              Promise.delay(100).then =>
                expect(@write).to.be.calledWithMatch("Sorry, could not run this specific spec because it was not found:")
                expect(@write).to.be.calledWithMatch("foo/bar/baz_spec.js")
                expect(@exit).to.be.calledWith(1)

      it "calls Chromium#override which extends window", (done) ->
        fn = =>
          win = {
            window: {
              console: {}
              $Cypress: {}
              Mocha: {
                process: {}
              }
            }
          }

          @App.commands.setHandler "start:chromium:run", (src, options) =>
            options.onReady(win)

            expect(win.window.require).to.be.ok
            expect(win.window.Mocha.process).not.to.be.empty
            expect(win.window.$Cypress.reporter).to.be.ok
            expect(win.window.$Cypress.isHeadless).to.be.true
            expect(win.window.console.log).to.be.a("function")

            done()

        cache.setUser({name: "Brian", session_token: "abc123"}).then =>
          cache.addProject(@todos).then =>
            @argsAre("--run-project", @todos, fn)

    context "--run-project --port", ->
      beforeEach ->
        @setup = (fn = ->) =>
          cache.setUser({name: "Brian", session_token: "abc123"}).then =>
            cache.addProject(@todos).then =>
              @argsAre("--port", "7878", "--run-project", @todos, fn).then ->
                Promise.delay(100)

      it "can change default port", ->
        @setup().then =>
          expect(@runProject).to.be.calledWithMatch(@todos, {
            port: 7878
          })

          expect(@open).to.be.calledWithMatch({
            port: 7878
          })

      it "displays client port", ->
        @setup().then =>
          expect(@$("#project").find("a")).to.contain("http://localhost:7878")

      it "handles port in use errors", ->
        fn = =>
          @_open.restore()
          err = @Server().prototype.portInUseErr(7878)
          @sandbox.stub(@Server().prototype, "_open").rejects(err)

        @setup(fn).then =>
          expect(@write).to.be.calledWithMatch("port is currently in use:")
          expect(@write).to.be.calledWithMatch("7878")
          expect(@write).to.be.calledWithMatch("or shut down the other process")
          expect(@exit).to.be.calledWith(1)



