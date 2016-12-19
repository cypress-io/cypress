require("../../spec_helper")

_        = require("lodash")
icons    = require("@cypress/core-icons")
extension = require("@cypress/core-extension")
electron = require("electron")
cache    = require("#{root}../lib/cache")
logger   = require("#{root}../lib/logger")
Project  = require("#{root}../lib/project")
Updater  = require("#{root}../lib/updater")
user     = require("#{root}../lib/user")
errors   = require("#{root}../lib/errors")
launcher = require("#{root}../lib/launcher")
logs     = require("#{root}../lib/electron/handlers/logs")
events   = require("#{root}../lib/electron/handlers/events")
dialog   = require("#{root}../lib/electron/handlers/dialog")
project  = require("#{root}../lib/electron/handlers/project")
cookies  = require("#{root}../lib/electron/handlers/cookies")
Renderer = require("#{root}../lib/electron/handlers/renderer")

describe "lib/electron/handlers/events", ->
  beforeEach ->
    @id      = Math.random()
    @send    = @sandbox.spy()
    @cookies = {}
    @options = {}
    @event   = {
      sender: {
        send: @send
        session: {
          cookies: @cookies
        }
      }
    }

    @sandbox.stub(electron.ipcMain, "on")
    @sandbox.stub(electron.ipcMain, "removeAllListeners")

    ## setup default options and event and id
    ## as the first three arguments
    @handleEvent = _.partial(events.handleEvent, @options, {}, @event, @id)

    @expectSendCalledWith = (data) =>
      expect(@send).to.be.calledWith("response", {id: @id, data: data})

    @expectSendErrCalledWith = (err) =>
      expect(@send).to.be.calledWith("response", {id: @id, __error: errors.clone(err, {html: true})})

  context ".stop", ->
    it "calls ipc#removeAllListeners", ->
      events.stop()
      expect(electron.ipcMain.removeAllListeners).to.be.calledOnce

  context ".start", ->
    it "ipc attaches callback on request", ->
      handleEvent = @sandbox.stub(events, "handleEvent")
      events.start({foo: "bar"})
      expect(electron.ipcMain.on).to.be.calledWith("request")

    it "partials in options in request callback", ->
      electron.ipcMain.on.yields("arg1", "arg2")
      handleEvent = @sandbox.stub(events, "handleEvent")

      events.start({foo: "bar"}, {})
      expect(handleEvent).to.be.calledWith({foo: "bar"}, {}, "arg1", "arg2")

  context "no ipc event", ->
    it "throws", ->
      fn = =>
        @handleEvent("no:such:event")

      expect(fn).to.throw("No ipc event registered for: 'no:such:event'")

  context "dialog", ->
    describe "show:directory:dialog", ->
      it "calls dialog.show and returns", ->
        @sandbox.stub(dialog, "show").resolves({foo: "bar"})
        @handleEvent("show:directory:dialog").then =>
          @expectSendCalledWith({foo: "bar"})

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(dialog, "show").rejects(err)

        @handleEvent("show:directory:dialog").then =>
          @expectSendErrCalledWith(err)

  context "user", ->
    describe "log:in", ->
      it "calls user.logIn and returns user", ->
        @sandbox.stub(user, "logIn").withArgs("12345").resolves({foo: "bar"})
        @handleEvent("log:in", "12345").then =>
          @expectSendCalledWith({foo: "bar"})

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(user, "logIn").rejects(err)

        @handleEvent("log:in").then =>
          @expectSendErrCalledWith(err)

    describe "log:out", ->
      it "calls user.logOut and returns user", ->
        @sandbox.stub(user, "logOut").resolves({foo: "bar"})
        @handleEvent("log:out").then =>
          @expectSendCalledWith({foo: "bar"})

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(user, "logOut").rejects(err)

        @handleEvent("log:out").then =>
          @expectSendErrCalledWith(err)

    describe "get:current:user", ->
      it "calls user.get and returns user", ->
        @sandbox.stub(user, "get").resolves({foo: "bar"})
        @handleEvent("get:current:user").then =>
          @expectSendCalledWith({foo: "bar"})

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(user, "get").rejects(err)

        @handleEvent("get:current:user").then =>
          @expectSendErrCalledWith(err)

  context "cookies", ->
    describe "clear:github:cookies", ->
      it "clears cookies and returns", ->
        clearGithub = @sandbox.stub(cookies, "clearGithub").resolves({foo: "bar"})
        @handleEvent("clear:github:cookies").then =>
          @expectSendCalledWith({foo: "bar"})
          expect(clearGithub).to.be.calledWith(@cookies)

      it "catches errors", ->
        err = new Error("foo")
        clearGithub = @sandbox.stub(cookies, "clearGithub").rejects(err)

        @handleEvent("clear:github:cookies", {foo: "bar"}).then =>
          @expectSendErrCalledWith(err)

  context "external shell", ->
    describe "external:open", ->
      it "shell.openExternal with arg", ->
        electron.shell.openExternal = @sandbox.spy()
        @handleEvent("external:open", {foo: "bar"})
        expect(electron.shell.openExternal).to.be.calledWith({foo: "bar"})

  context "window", ->
    describe "window:open", ->
      it "calls Renderer#create with args and resolves with return of Renderer.create", ->
        @sandbox.stub(Renderer, "create").withArgs({foo: "bar"}).resolves({bar: "baz"})
        @handleEvent("window:open", {foo: "bar"}).then =>
          @expectSendCalledWith({bar: "baz"})

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(Renderer, "create").withArgs({foo: "bar"}).rejects(err)

        @handleEvent("window:open", {foo: "bar"}).then =>
          @expectSendErrCalledWith(err)

    describe "window:close", ->
      it "calls destroy on Renderer#getByWebContents", ->
        @destroy = @sandbox.stub()
        @sandbox.stub(Renderer, "getByWebContents").withArgs(@event.sender).returns({destroy: @destroy})
        @handleEvent("window:close")
        expect(@destroy).to.be.calledOnce

  context "updating", ->
    describe "updater:check", ->
      it "returns true when new version", ->
        @sandbox.stub(Updater, "check").yieldsTo("onNewVersion")
        @handleEvent("updater:check")
        @expectSendCalledWith(true)

      it "returns false when no new version", ->
        @sandbox.stub(Updater, "check").yieldsTo("onNoNewVersion")
        @handleEvent("updater:check")
        @expectSendCalledWith(false)

    describe "updater:run", ->
      beforeEach ->
        @once = @sandbox.stub()
        @sandbox.stub(Renderer, "getByWebContents").withArgs(@event.sender).returns({once: @once})

      it "calls cancel when win is closed", ->
        cancel = @sandbox.spy()
        run    = @sandbox.stub(Updater, "run").returns({cancel: cancel})
        @once.withArgs("closed").yields()
        @handleEvent("updater:run")
        expect(cancel).to.be.calledOnce

      _.each {
        onStart: "start"
        onApply: "apply"
        onError: "error"
        onDone:  "done"
        onNone:  "none"
      }, (val, key) ->
        it "returns #{val} on #{key}", ->
          @sandbox.stub(Updater, "run").yieldsTo(key)
          @handleEvent("updater:run")
          @expectSendCalledWith({event: val, version: undefined})

      it "returns down + version on onDownload", ->
        @sandbox.stub(Updater, "run").yieldsTo("onDownload", "0.14.0")
        @handleEvent("updater:run")
        @expectSendCalledWith({event: "download", version: "0.14.0"})

  context "log events", ->
    describe "get:logs", ->
      it "returns array of logs", ->
        @sandbox.stub(logger, "getLogs").resolves([])

        @handleEvent("get:logs").then =>
          @expectSendCalledWith([])

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(logger, "getLogs").rejects(err)

        @handleEvent("get:logs").then =>
          @expectSendErrCalledWith(err)

    describe "clear:logs", ->
      it "returns null", ->
        @sandbox.stub(logger, "clearLogs").resolves()

        @handleEvent("clear:logs").then =>
          @expectSendCalledWith(null)

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(logger, "clearLogs").rejects(err)

        @handleEvent("clear:logs").then =>
          @expectSendErrCalledWith(err)

    describe "on:log", ->
      it "sets send to onLog", ->
        onLog = @sandbox.stub(logger, "onLog")
        @handleEvent("on:log")
        expect(onLog).to.be.called
        expect(onLog.getCall(0).args[0]).to.be.a("function")

    describe "off:log", ->
      it "calls logger#off and returns null", ->
        @sandbox.stub(logger, "off")
        @handleEvent("off:log")
        expect(logger.off).to.be.calledOnce
        @expectSendCalledWith(null)

  context "gui errors", ->
    describe "gui:error", ->
      it "calls logs.error with arg", ->
        err = new Error("foo")

        @sandbox.stub(logs, "error").withArgs(err).resolves()

        @handleEvent("gui:error", err).then =>
          @expectSendCalledWith(null)

      it "calls logger.createException with error", ->
        err = new Error("foo")

        @sandbox.stub(logger, "createException").withArgs(err).resolves()

        @handleEvent("gui:error", err).then =>
          expect(logger.createException).to.be.calledOnce
          @expectSendCalledWith(null)

      it "swallows logger.createException errors", ->
        err = new Error("foo")

        @sandbox.stub(logger, "createException").withArgs(err).rejects(new Error("err"))

        @handleEvent("gui:error", err).then =>
          expect(logger.createException).to.be.calledOnce
          @expectSendCalledWith(null)

      it "catches errors", ->
        err = new Error("foo")
        err2 = new Error("bar")

        @sandbox.stub(logs, "error").withArgs(err).rejects(err2)

        @handleEvent("gui:error", err).then =>
          @expectSendErrCalledWith(err2)

  context "user events", ->
    describe "get:orgs", ->
      it "returns array of orgs", ->
        @sandbox.stub(Project, "getOrgs").resolves([])

        @handleEvent("get:orgs").then =>
          @expectSendCalledWith([])

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(Project, "getOrgs").rejects(err)

        @handleEvent("get:orgs").then =>
          @expectSendErrCalledWith(err)

  context "project events", ->
    describe "get:projects", ->
      it "returns array of projects", ->
        @sandbox.stub(Project, "getPathsAndIds").resolves([])

        @handleEvent("get:projects").then =>
          @expectSendCalledWith([])

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(Project, "getPathsAndIds").rejects(err)

        @handleEvent("get:projects").then =>
          @expectSendErrCalledWith(err)

    describe "get:project:statuses", ->
      it "returns array of projects with statuses", ->
        @sandbox.stub(Project, "getProjectStatuses").resolves([])

        @handleEvent("get:project:statuses").then =>
          @expectSendCalledWith([])

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(Project, "getProjectStatuses").rejects(err)

        @handleEvent("get:project:statuses").then =>
          @expectSendErrCalledWith(err)

    describe "get:project:status", ->
      it "returns project returned by Project.getProjectStatus", ->
        @sandbox.stub(Project, "getProjectStatus").resolves("project")

        @handleEvent("get:project:status").then =>
          @expectSendCalledWith("project")

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(Project, "getProjectStatus").rejects(err)

        @handleEvent("get:project:status").then =>
          @expectSendErrCalledWith(err)

    describe "add:project", ->
      it "adds project + returns result", ->
        @sandbox.stub(Project, "add").withArgs("path/to/project").resolves("result")

        @handleEvent("add:project", "path/to/project").then =>
          @expectSendCalledWith("result")

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(Project, "add").withArgs("path/to/project").rejects(err)

        @handleEvent("add:project", "path/to/project").then =>
          @expectSendErrCalledWith(err)

    describe "remove:project", ->
      it "remove project + returns arg", ->
        @sandbox.stub(cache, "removeProject").withArgs("path/to/project").resolves()

        @handleEvent("remove:project", "path/to/project").then =>
          @expectSendCalledWith("path/to/project")

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(cache, "removeProject").withArgs("path/to/project").rejects(err)

        @handleEvent("remove:project", "path/to/project").then =>
          @expectSendErrCalledWith(err)

    describe "open:project", ->
      beforeEach ->
        @sandbox.stub(extension, "setHostAndPath").resolves()
        @sandbox.stub(launcher, "getBrowsers").resolves([])
        @sandbox.stub(Project.prototype, "close").resolves()

      afterEach ->
        ## close down 'open' projects
        ## to prevent side effects
        project.close()

      it "open project + returns config", ->
        @sandbox.stub(Project.prototype, "open")
        @sandbox.stub(Project.prototype, "getConfig").resolves({some: "config"})

        @handleEvent("open:project", "path/to/project")
        .then =>
          @expectSendCalledWith({some: "config"})

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(Project.prototype, "open").rejects(err)

        @handleEvent("open:project", "path/to/project")
        .then =>
          @expectSendErrCalledWith(err)

      it "reboots onSettingsChanged"

      it "emits bus 'focus:tests' onFocustTests"

    describe "close:project", ->
      beforeEach ->
        @sandbox.stub(Project.prototype, "close").withArgs({sync: true}).resolves()

      it "is noop and returns null when no project is open", ->
        expect(project.opened()).to.be.null

        @handleEvent("close:project").then =>
          @expectSendCalledWith(null)

      it "closes down open project and returns null", ->
        @sandbox.stub(Project.prototype, "getConfig").resolves({})
        @sandbox.stub(Project.prototype, "open").withArgs({sync: true}).resolves()

        @handleEvent("open:project", "path/to/project")
        .then =>
          ## it should store the opened project
          expect(project.opened()).not.to.be.null

          @handleEvent("close:project")
          .then =>
            ## it should store the opened project
            expect(project.opened()).to.be.null

            @expectSendCalledWith(null)

    describe "get:builds", ->
      it "returns array of builds", ->
        @sandbox.stub(project, "getBuilds").resolves([])

        @handleEvent("get:builds").then =>
          @expectSendCalledWith([])

      it "sends UNAUTHENTICATED when statusCode is 401", ->
        err = new Error("foo")
        err.statusCode = 401
        @sandbox.stub(project, "getBuilds").rejects(err)

        @handleEvent("get:builds").then =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("UNAUTHENTICATED")

      it "sends TIMED_OUT when cause.code is ESOCKETTIMEDOUT", ->
        err = new Error("foo")
        err.cause = { code: "ESOCKETTIMEDOUT" }
        @sandbox.stub(project, "getBuilds").rejects(err)

        @handleEvent("get:builds").then =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("TIMED_OUT")

      it "sends NO_CONNECTION when code is ENOTFOUND", ->
        err = new Error("foo")
        err.code = "ENOTFOUND"
        @sandbox.stub(project, "getBuilds").rejects(err)

        @handleEvent("get:builds").then =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("NO_CONNECTION")

      it "sends type when if existing for other errors", ->
        err = new Error("foo")
        err.type = "NO_PROJECT_ID"
        @sandbox.stub(project, "getBuilds").rejects(err)

        @handleEvent("get:builds").then =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("NO_PROJECT_ID")

      it "sends UNKNOWN + name,message,stack for other errors", ->
        err = new Error("foo")
        err.name = "name"
        err.message = "message"
        err.stack = "stack"
        @sandbox.stub(project, "getBuilds").rejects(err)

        @handleEvent("get:builds").then =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("UNKNOWN")

    describe "setup:ci:project", ->
      it "returns result of project.createCiProject", ->
        @sandbox.stub(project, "createCiProject").resolves("response")

        @handleEvent("setup:ci:project").then =>
          @expectSendCalledWith("response")

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(project, "createCiProject").rejects(err)

        @handleEvent("setup:ci:project").then =>
          @expectSendErrCalledWith(err)

    describe "get:ci:keys", ->
      it "returns result of project.getCiKeys", ->
        @sandbox.stub(project, "getCiKeys").resolves(["ci-key-123"])

        @handleEvent("get:ci:keys").then =>
          @expectSendCalledWith(["ci-key-123"])

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(project, "getCiKeys").rejects(err)

        @handleEvent("get:ci:keys").then =>
          @expectSendErrCalledWith(err)
