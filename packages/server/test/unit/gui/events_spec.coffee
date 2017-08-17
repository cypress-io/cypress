require("../../spec_helper")

_        = require("lodash")
extension = require("@packages/extension")
electron = require("electron")
cache    = require("#{root}../lib/cache")
logger   = require("#{root}../lib/logger")
Project  = require("#{root}../lib/project")
Updater  = require("#{root}../lib/updater")
user     = require("#{root}../lib/user")
errors   = require("#{root}../lib/errors")
browsers = require("#{root}../lib/browsers")
openProject = require("#{root}../lib/open_project")
open     = require("#{root}../lib/util/open")
logs     = require("#{root}../lib/gui/logs")
events   = require("#{root}../lib/gui/events")
dialog   = require("#{root}../lib/gui/dialog")
Windows  = require("#{root}../lib/gui/windows")

describe "lib/gui/events", ->
  beforeEach ->
    @id      = Math.random()
    @send    = @sandbox.spy()
    @options = {}
    @cookies = @sandbox.stub({
      get: ->
      set: ->
      remove: ->
    })
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
      it "clears cookies and returns null", ->
        @sandbox.stub(Windows, "getBrowserAutomation")
        .withArgs(@event.sender)
        .returns({
          clearCookies: @sandbox.stub().withArgs({domain: "github.com"}).resolves()
        })

        @handleEvent("clear:github:cookies").then =>
          @expectSendCalledWith(null)

      it "catches errors", ->
        err = new Error("foo")

        @sandbox.stub(Windows, "getBrowserAutomation")
        .withArgs(@event.sender)
        .returns({
          clearCookies: @sandbox.stub().withArgs({domain: "github.com"}).rejects(err)
        })

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
      it "calls Windows#open with args and resolves with return of Windows.open", ->
        @sandbox.stub(Windows, "open").withArgs({foo: "bar"}).resolves({bar: "baz"})

        @handleEvent("window:open", {foo: "bar"}).then =>
          @expectSendCalledWith({bar: "baz"})

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(Windows, "open").withArgs({foo: "bar"}).rejects(err)

        @handleEvent("window:open", {foo: "bar"}).then =>
          @expectSendErrCalledWith(err)

    describe "window:close", ->
      it "calls destroy on Windows#getByWebContents", ->
        @destroy = @sandbox.stub()
        @sandbox.stub(Windows, "getByWebContents").withArgs(@event.sender).returns({destroy: @destroy})
        @handleEvent("window:close")
        expect(@destroy).to.be.calledOnce

  context "updating", ->
    describe "updater:check", ->
      it "returns version when new version", ->
        @sandbox.stub(Updater, "check").yieldsTo("onNewVersion", {version: "1.2.3"})
        @handleEvent("updater:check")
        @expectSendCalledWith("1.2.3")

      it "returns false when no new version", ->
        @sandbox.stub(Updater, "check").yieldsTo("onNoNewVersion")
        @handleEvent("updater:check")
        @expectSendCalledWith(false)

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

    describe "open:finder", ->
      it "opens with open lib", ->
        @sandbox.stub(open, "opn").resolves("okay")

        @handleEvent("open:finder", "path").then =>
          expect(open.opn).to.be.calledWith("path")
          @expectSendCalledWith("okay")

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(open, "opn").rejects(err)

        @handleEvent("open:finder", "path").then =>
          @expectSendErrCalledWith(err)

      it "works even after project is opened (issue #227)", ->
        @sandbox.stub(open, "opn").resolves("okay")
        @sandbox.stub(Project.prototype, "open")
        @sandbox.stub(Project.prototype, "getConfig").resolves({some: "config"})

        @handleEvent("open:project", "/_test-output/path/to/project")
        .then =>
          @handleEvent("open:finder", "path")
        .then =>
          expect(open.opn).to.be.calledWith("path")
          @expectSendCalledWith("okay")

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
        @sandbox.stub(Project, "add").withArgs("/_test-output/path/to/project").resolves("result")

        @handleEvent("add:project", "/_test-output/path/to/project").then =>
          @expectSendCalledWith("result")

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(Project, "add").withArgs("/_test-output/path/to/project").rejects(err)

        @handleEvent("add:project", "/_test-output/path/to/project").then =>
          @expectSendErrCalledWith(err)

    describe "remove:project", ->
      it "remove project + returns arg", ->
        @sandbox.stub(cache, "removeProject").withArgs("/_test-output/path/to/project").resolves()

        @handleEvent("remove:project", "/_test-output/path/to/project").then =>
          @expectSendCalledWith("/_test-output/path/to/project")

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(cache, "removeProject").withArgs("/_test-output/path/to/project").rejects(err)

        @handleEvent("remove:project", "/_test-output/path/to/project").then =>
          @expectSendErrCalledWith(err)

    describe "open:project", ->
      beforeEach ->
        @sandbox.stub(extension, "setHostAndPath").resolves()
        @sandbox.stub(browsers, "get").resolves([])
        @sandbox.stub(Project.prototype, "close").resolves()

      afterEach ->
        ## close down 'open' projects
        ## to prevent side effects
        openProject.close()

      it "open project + returns config", ->
        @sandbox.stub(Project.prototype, "open")
        @sandbox.stub(Project.prototype, "getConfig").resolves({some: "config"})

        @handleEvent("open:project", "/_test-output/path/to/project")
        .then =>
          @expectSendCalledWith({some: "config"})

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(Project.prototype, "open").rejects(err)

        @handleEvent("open:project", "/_test-output/path/to/project")
        .then =>
          @expectSendErrCalledWith(err)

      it "emits bus 'focus:tests' onFocustTests"

    describe "close:project", ->
      beforeEach ->
        @sandbox.stub(Project.prototype, "close").withArgs({sync: true}).resolves()

      it "is noop and returns null when no project is open", ->
        expect(openProject.getProject()).to.be.null

        @handleEvent("close:project").then =>
          @expectSendCalledWith(null)

      it "closes down open project and returns null", ->
        @sandbox.stub(Project.prototype, "getConfig").resolves({})
        @sandbox.stub(Project.prototype, "open").withArgs({sync: true}).resolves()

        @handleEvent("open:project", "/_test-output/path/to/project")
        .then =>
          ## it should store the opened project
          expect(openProject.getProject()).not.to.be.null

          @handleEvent("close:project")
          .then =>
            ## it should store the opened project
            expect(openProject.getProject()).to.be.null

            @expectSendCalledWith(null)

    describe "get:runs", ->
      it "calls openProject.getRuns", ->
        @sandbox.stub(openProject, "getRuns").resolves([])

        @handleEvent("get:runs").then =>
          expect(openProject.getRuns).to.be.called

      it "returns array of runs", ->
        @sandbox.stub(openProject, "getRuns").resolves([])

        @handleEvent("get:runs").then =>
          @expectSendCalledWith([])

      it "sends UNAUTHENTICATED when statusCode is 401", ->
        err = new Error("foo")
        err.statusCode = 401
        @sandbox.stub(openProject, "getRuns").rejects(err)

        @handleEvent("get:runs").then =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("UNAUTHENTICATED")

      it "sends TIMED_OUT when cause.code is ESOCKETTIMEDOUT", ->
        err = new Error("foo")
        err.cause = { code: "ESOCKETTIMEDOUT" }
        @sandbox.stub(openProject, "getRuns").rejects(err)

        @handleEvent("get:runs").then =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("TIMED_OUT")

      it "sends NO_CONNECTION when code is ENOTFOUND", ->
        err = new Error("foo")
        err.code = "ENOTFOUND"
        @sandbox.stub(openProject, "getRuns").rejects(err)

        @handleEvent("get:runs").then =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("NO_CONNECTION")

      it "sends type when if existing for other errors", ->
        err = new Error("foo")
        err.type = "NO_PROJECT_ID"
        @sandbox.stub(openProject, "getRuns").rejects(err)

        @handleEvent("get:runs").then =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("NO_PROJECT_ID")

      it "sends UNKNOWN + name,message,stack for other errors", ->
        err = new Error("foo")
        err.name = "name"
        err.message = "message"
        err.stack = "stack"
        @sandbox.stub(openProject, "getRuns").rejects(err)

        @handleEvent("get:runs").then =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("UNKNOWN")

    describe "setup:dashboard:project", ->
      it "returns result of openProject.createCiProject", ->
        @sandbox.stub(openProject, "createCiProject").resolves("response")

        @handleEvent("setup:dashboard:project").then =>
          @expectSendCalledWith("response")

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(openProject, "createCiProject").rejects(err)

        @handleEvent("setup:dashboard:project").then =>
          @expectSendErrCalledWith(err)

    describe "get:record:keys", ->
      it "returns result of project.getRecordKeys", ->
        @sandbox.stub(openProject, "getRecordKeys").resolves(["ci-key-123"])

        @handleEvent("get:record:keys").then =>
          @expectSendCalledWith(["ci-key-123"])

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(openProject, "getRecordKeys").rejects(err)

        @handleEvent("get:record:keys").then =>
          @expectSendErrCalledWith(err)

    describe "request:access", ->
      it "returns result of project.requestAccess", ->
        @sandbox.stub(openProject, "requestAccess").resolves("response")

        @handleEvent("request:access", "org-id-123").then =>
          expect(openProject.requestAccess).to.be.calledWith("org-id-123")
          @expectSendCalledWith("response")

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(openProject, "requestAccess").rejects(err)

        @handleEvent("request:access", "org-id-123").then =>
          @expectSendErrCalledWith(err)

      it "sends ALREADY_MEMBER when statusCode is 403", ->
        err = new Error("foo")
        err.statusCode = 403
        @sandbox.stub(openProject, "requestAccess").rejects(err)

        @handleEvent("request:access", "org-id-123").then =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("ALREADY_MEMBER")

      it "sends ALREADY_REQUESTED when statusCode is 429 with certain error", ->
        err = new Error("foo")
        err.statusCode = 422
        err.errors = {
          userId: [ "This User has an existing MembershipRequest to this Organization." ]
        }

        @sandbox.stub(openProject, "requestAccess").rejects(err)

        @handleEvent("request:access", "org-id-123").then =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("ALREADY_REQUESTED")

      it "sends type when if existing for other errors", ->
        err = new Error("foo")
        err.type = "SOME_TYPE"
        @sandbox.stub(openProject, "requestAccess").rejects(err)

        @handleEvent("request:access", "org-id-123").then =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("SOME_TYPE")

      it "sends UNKNOWN for other errors", ->
        err = new Error("foo")
        @sandbox.stub(openProject, "requestAccess").rejects(err)

        @handleEvent("request:access", "org-id-123").then =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("UNKNOWN")
