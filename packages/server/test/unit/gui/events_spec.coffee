require("../../spec_helper")

_        = require("lodash")
EE       = require("events")
extension = require("@packages/extension")
electron = require("electron")
Promise  = require("bluebird")
chromePolicyCheck = require("#{root}../lib/util/chrome_policy_check")
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
ensureUrl = require("#{root}../lib/util/ensure-url")
konfig   = require("#{root}../lib/konfig")

describe "lib/gui/events", ->
  beforeEach ->
    @send    = sinon.spy()
    @options = {}
    @cookies = sinon.stub({
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
    @bus = new EE()

    sinon.stub(electron.ipcMain, "on")
    sinon.stub(electron.ipcMain, "removeAllListeners")

    @handleEvent = (type, arg) =>
      id = "#{type}-#{Math.random()}"
      Promise
      .try =>
        events.handleEvent(@options, @bus, @event, id, type, arg)
      .return({
        sendCalledWith: (data) =>
          expect(@send).to.be.calledWith("response", {id: id, data: data})
        sendErrCalledWith: (err) =>
          expect(@send).to.be.calledWith("response", {id: id, __error: errors.clone(err, {html: true})})
      })

  context ".stop", ->
    it "calls ipc#removeAllListeners", ->
      events.stop()
      expect(electron.ipcMain.removeAllListeners).to.be.calledOnce

  context ".start", ->
    it "ipc attaches callback on request", ->
      handleEvent = sinon.stub(events, "handleEvent")
      events.start({foo: "bar"})
      expect(electron.ipcMain.on).to.be.calledWith("request")

    it "partials in options in request callback", ->
      electron.ipcMain.on.yields("arg1", "arg2")
      handleEvent = sinon.stub(events, "handleEvent")

      events.start({foo: "bar"}, {})
      expect(handleEvent).to.be.calledWith({foo: "bar"}, {}, "arg1", "arg2")

  context "no ipc event", ->
    it "throws", ->
      @handleEvent("no:such:event").catch (err) ->
        expect(err.message).to.include("No ipc event registered for: 'no:such:event'")

  context "dialog", ->
    describe "show:directory:dialog", ->
      it "calls dialog.show and returns", ->
        sinon.stub(dialog, "show").resolves({foo: "bar"})
        @handleEvent("show:directory:dialog").then (assert) =>
          assert.sendCalledWith({foo: "bar"})

      it "catches errors", ->
        err = new Error("foo")
        sinon.stub(dialog, "show").rejects(err)

        @handleEvent("show:directory:dialog").then (assert) =>
          assert.sendErrCalledWith(err)

  context "user", ->
    describe "log:in", ->
      it "calls user.logIn and returns user", ->
        sinon.stub(user, "logIn").withArgs("12345").resolves({foo: "bar"})
        @handleEvent("log:in", "12345").then (assert) =>
          assert.sendCalledWith({foo: "bar"})

      it "catches errors", ->
        err = new Error("foo")
        sinon.stub(user, "logIn").rejects(err)

        @handleEvent("log:in").then (assert) =>
          assert.sendErrCalledWith(err)

    describe "log:out", ->
      it "calls user.logOut and returns user", ->
        sinon.stub(user, "logOut").resolves({foo: "bar"})
        @handleEvent("log:out").then (assert) =>
          assert.sendCalledWith({foo: "bar"})

      it "catches errors", ->
        err = new Error("foo")
        sinon.stub(user, "logOut").rejects(err)

        @handleEvent("log:out").then (assert) =>
          assert.sendErrCalledWith(err)

    describe "get:current:user", ->
      it "calls user.get and returns user", ->
        sinon.stub(user, "get").resolves({foo: "bar"})
        @handleEvent("get:current:user").then (assert) =>
          assert.sendCalledWith({foo: "bar"})

      it "catches errors", ->
        err = new Error("foo")
        sinon.stub(user, "get").rejects(err)

        @handleEvent("get:current:user").then (assert) =>
          assert.sendErrCalledWith(err)

  context "cookies", ->
    describe "clear:github:cookies", ->
      it "clears cookies and returns null", ->
        sinon.stub(Windows, "getBrowserAutomation")
        .withArgs(@event.sender)
        .returns({
          clearCookies: sinon.stub().withArgs({domain: "github.com"}).resolves()
        })

        @handleEvent("clear:github:cookies").then (assert) =>
          assert.sendCalledWith(null)

      it "catches errors", ->
        err = new Error("foo")

        sinon.stub(Windows, "getBrowserAutomation")
        .withArgs(@event.sender)
        .returns({
          clearCookies: sinon.stub().withArgs({domain: "github.com"}).rejects(err)
        })

        @handleEvent("clear:github:cookies", {foo: "bar"}).then (assert) =>
          assert.sendErrCalledWith(err)

  context "external shell", ->
    describe "external:open", ->
      it "shell.openExternal with arg", ->
        electron.shell.openExternal = sinon.spy()
        @handleEvent("external:open", {foo: "bar"}).then ->
          expect(electron.shell.openExternal).to.be.calledWith({foo: "bar"})

  context "window", ->
    describe "window:open", ->
      beforeEach ->
        @options.projectRoot = "/path/to/my/project"

        @win = sinon.stub({
          on: ->
          once: ->
          loadURL: ->
          webContents: {}
        })

        sinon.stub(Windows, "create").withArgs(@options.projectRoot).returns(@win)

      it "calls Windows#open with args and resolves with return of Windows.open", ->
        @handleEvent("window:open", {type: "INDEX"})
        .then (assert) =>
          assert.sendCalledWith(@win)

      it "catches errors", ->
        err = new Error("foo")
        sinon.stub(Windows, "open").withArgs(@options.projectRoot, {foo: "bar"}).rejects(err)

        @handleEvent("window:open", {foo: "bar"}).then (assert) =>
          assert.sendErrCalledWith(err)

    describe "window:close", ->
      it "calls destroy on Windows#getByWebContents", ->
        @destroy = sinon.stub()
        sinon.stub(Windows, "getByWebContents").withArgs(@event.sender).returns({destroy: @destroy})
        @handleEvent("window:close")
        expect(@destroy).to.be.calledOnce

  context "updating", ->
    describe "updater:check", ->
      it "returns version when new version", ->
        sinon.stub(Updater, "check").yieldsTo("onNewVersion", {version: "1.2.3"})
        @handleEvent("updater:check").then (assert) ->
          assert.sendCalledWith("1.2.3")

      it "returns false when no new version", ->
        sinon.stub(Updater, "check").yieldsTo("onNoNewVersion")
        @handleEvent("updater:check").then (assert) ->
          assert.sendCalledWith(false)

  context "log events", ->
    describe "get:logs", ->
      it "returns array of logs", ->
        sinon.stub(logger, "getLogs").resolves([])

        @handleEvent("get:logs").then (assert) =>
          assert.sendCalledWith([])

      it "catches errors", ->
        err = new Error("foo")
        sinon.stub(logger, "getLogs").rejects(err)

        @handleEvent("get:logs").then (assert) =>
          assert.sendErrCalledWith(err)

    describe "clear:logs", ->
      it "returns null", ->
        sinon.stub(logger, "clearLogs").resolves()

        @handleEvent("clear:logs").then (assert) =>
          assert.sendCalledWith(null)

      it "catches errors", ->
        err = new Error("foo")
        sinon.stub(logger, "clearLogs").rejects(err)

        @handleEvent("clear:logs").then (assert) =>
          assert.sendErrCalledWith(err)

    describe "on:log", ->
      it "sets send to onLog", ->
        onLog = sinon.stub(logger, "onLog")
        @handleEvent("on:log")
        expect(onLog).to.be.called
        expect(onLog.getCall(0).args[0]).to.be.a("function")

    describe "off:log", ->
      it "calls logger#off and returns null", ->
        sinon.stub(logger, "off")
        @handleEvent("off:log").then (assert) ->
          expect(logger.off).to.be.calledOnce
          assert.sendCalledWith(null)

  context "gui errors", ->
    describe "gui:error", ->
      it "calls logs.error with arg", ->
        err = new Error("foo")

        sinon.stub(logs, "error").withArgs(err).resolves()

        @handleEvent("gui:error", err).then (assert) =>
          assert.sendCalledWith(null)

      it "calls logger.createException with error", ->
        err = new Error("foo")

        sinon.stub(logger, "createException").withArgs(err).resolves()

        @handleEvent("gui:error", err).then (assert) =>
          expect(logger.createException).to.be.calledOnce
          assert.sendCalledWith(null)

      it "swallows logger.createException errors", ->
        err = new Error("foo")

        sinon.stub(logger, "createException").withArgs(err).rejects(new Error("err"))

        @handleEvent("gui:error", err).then (assert) =>
          expect(logger.createException).to.be.calledOnce
          assert.sendCalledWith(null)

      it "catches errors", ->
        err = new Error("foo")
        err2 = new Error("bar")

        sinon.stub(logs, "error").withArgs(err).rejects(err2)

        @handleEvent("gui:error", err).then (assert) =>
          assert.sendErrCalledWith(err2)

  context "user events", ->
    describe "get:orgs", ->
      it "returns array of orgs", ->
        sinon.stub(Project, "getOrgs").resolves([])

        @handleEvent("get:orgs").then (assert) =>
          assert.sendCalledWith([])

      it "catches errors", ->
        err = new Error("foo")
        sinon.stub(Project, "getOrgs").rejects(err)

        @handleEvent("get:orgs").then (assert) =>
          assert.sendErrCalledWith(err)

    describe "open:finder", ->
      it "opens with open lib", ->
        sinon.stub(open, "opn").resolves("okay")

        @handleEvent("open:finder", "path").then (assert) =>
          expect(open.opn).to.be.calledWith("path")
          assert.sendCalledWith("okay")

      it "catches errors", ->
        err = new Error("foo")
        sinon.stub(open, "opn").rejects(err)

        @handleEvent("open:finder", "path").then (assert) =>
          assert.sendErrCalledWith(err)

      it "works even after project is opened (issue #227)", ->
        sinon.stub(open, "opn").resolves("okay")
        sinon.stub(Project.prototype, "open").resolves()
        sinon.stub(Project.prototype, "getConfig").resolves({some: "config"})

        @handleEvent("open:project", "/_test-output/path/to/project")
        .then =>
          @handleEvent("open:finder", "path")
        .then (assert) =>
          expect(open.opn).to.be.calledWith("path")
          assert.sendCalledWith("okay")

  context "project events", ->
    describe "get:projects", ->
      it "returns array of projects", ->
        sinon.stub(Project, "getPathsAndIds").resolves([])

        @handleEvent("get:projects").then (assert) =>
          assert.sendCalledWith([])

      it "catches errors", ->
        err = new Error("foo")
        sinon.stub(Project, "getPathsAndIds").rejects(err)

        @handleEvent("get:projects").then (assert) =>
          assert.sendErrCalledWith(err)

    describe "get:project:statuses", ->
      it "returns array of projects with statuses", ->
        sinon.stub(Project, "getProjectStatuses").resolves([])

        @handleEvent("get:project:statuses").then (assert) =>
          assert.sendCalledWith([])

      it "catches errors", ->
        err = new Error("foo")
        sinon.stub(Project, "getProjectStatuses").rejects(err)

        @handleEvent("get:project:statuses").then (assert) =>
          assert.sendErrCalledWith(err)

    describe "get:project:status", ->
      it "returns project returned by Project.getProjectStatus", ->
        sinon.stub(Project, "getProjectStatus").resolves("project")

        @handleEvent("get:project:status").then (assert) =>
          assert.sendCalledWith("project")

      it "catches errors", ->
        err = new Error("foo")
        sinon.stub(Project, "getProjectStatus").rejects(err)

        @handleEvent("get:project:status").then (assert) =>
          assert.sendErrCalledWith(err)

    describe "add:project", ->
      it "adds project + returns result", ->
        sinon.stub(Project, "add").withArgs("/_test-output/path/to/project").resolves("result")

        @handleEvent("add:project", "/_test-output/path/to/project").then (assert) =>
          assert.sendCalledWith("result")

      it "catches errors", ->
        err = new Error("foo")
        sinon.stub(Project, "add").withArgs("/_test-output/path/to/project").rejects(err)

        @handleEvent("add:project", "/_test-output/path/to/project").then (assert) =>
          assert.sendErrCalledWith(err)

    describe "remove:project", ->
      it "remove project + returns arg", ->
        sinon.stub(cache, "removeProject").withArgs("/_test-output/path/to/project").resolves()

        @handleEvent("remove:project", "/_test-output/path/to/project").then (assert) =>
          assert.sendCalledWith("/_test-output/path/to/project")

      it "catches errors", ->
        err = new Error("foo")
        sinon.stub(cache, "removeProject").withArgs("/_test-output/path/to/project").rejects(err)

        @handleEvent("remove:project", "/_test-output/path/to/project").then (assert) =>
          assert.sendErrCalledWith(err)

    describe "open:project", ->
      beforeEach ->
        sinon.stub(extension, "setHostAndPath").resolves()
        sinon.stub(browsers, "getAllBrowsersWith")
        browsers.getAllBrowsersWith.resolves([])
        browsers.getAllBrowsersWith.withArgs("/usr/bin/baz-browser").resolves([{foo: 'bar'}])
        @open = sinon.stub(Project.prototype, "open").resolves()
        sinon.stub(Project.prototype, "close").resolves()
        sinon.stub(Project.prototype, "getConfig").resolves({some: "config"})

      afterEach ->
        ## close down 'open' projects
        ## to prevent side effects
        openProject.close()

      it "open project + returns config", ->
        @handleEvent("open:project", "/_test-output/path/to/project")
        .then (assert) =>
          assert.sendCalledWith({some: "config"})

      it "catches errors", ->
        err = new Error("foo")
        @open.rejects(err)

        @handleEvent("open:project", "/_test-output/path/to/project")
        .then (assert) =>
          assert.sendErrCalledWith(err)

      it "sends 'focus:tests' onFocusTests", ->
        @handleEvent("open:project", "/_test-output/path/to/project")
        .then =>
          @handleEvent("on:focus:tests")
        .then (assert) =>
          @open.lastCall.args[0].onFocusTests()
          assert.sendCalledWith(undefined)

      it "sends 'config:changed' onSettingsChanged", ->
        @handleEvent("open:project", "/_test-output/path/to/project")
        .then =>
          @handleEvent("on:config:changed")
        .then (assert) =>
          @open.lastCall.args[0].onSettingsChanged()
          assert.sendCalledWith(undefined)

      it "sends 'spec:changed' onSpecChanged", ->
        @handleEvent("open:project", "/_test-output/path/to/project")
        .then =>
          @handleEvent("on:spec:changed")
        .then (assert) =>
          @open.lastCall.args[0].onSpecChanged("/path/to/spec.coffee")
          assert.sendCalledWith("/path/to/spec.coffee")

      it "sends 'project:warning' onWarning", ->
        @handleEvent("open:project", "/_test-output/path/to/project")
        .then =>
          @handleEvent("on:project:warning")
        .then (assert) =>
          @open.lastCall.args[0].onWarning({name: "foo", message: "foo"})
          assert.sendCalledWith({name: "foo", message: "foo"})

      it "sends 'project:error' onError", ->
        @handleEvent("open:project", "/_test-output/path/to/project")
        .then =>
          @handleEvent("on:project:error")
        .then (assert) =>
          @open.lastCall.args[0].onError({name: "foo", message: "foo"})
          assert.sendCalledWith({name: "foo", message: "foo"})

      it "calls browsers.getAllBrowsersWith with no args when no browser specified", ->
        @handleEvent("open:project", "/_test-output/path/to/project").then ->
          expect(browsers.getAllBrowsersWith).to.be.calledWith()

      it "calls browsers.getAllBrowsersWith with browser when browser specified", ->
        sinon.stub(openProject, "create").resolves()
        @options.browser = "/usr/bin/baz-browser"

        @handleEvent("open:project", "/_test-output/path/to/project").then =>
          expect(browsers.getAllBrowsersWith).to.be.calledWith(@options.browser)
          expect(openProject.create).to.be.calledWithMatch(
            "/_test-output/path/to/project",
            {
              browser: "/usr/bin/baz-browser",
              config: {
                browsers: [
                  {
                    foo: "bar"
                  }
                ]
              }
            }
          )

      it "attaches warning to Chrome browsers when Chrome policy check fails", ->
        sinon.stub(openProject, "create").resolves()
        @options.browser = "/foo"

        browsers.getAllBrowsersWith.withArgs("/foo").resolves([{family: 'chrome'}, {family: 'some other'}])

        sinon.stub(chromePolicyCheck, "run").callsArgWith(0, new Error)

        @handleEvent("open:project", "/_test-output/path/to/project").then =>
          expect(browsers.getAllBrowsersWith).to.be.calledWith(@options.browser)
          expect(openProject.create).to.be.calledWithMatch(
            "/_test-output/path/to/project",
            {
              browser: "/foo",
              config: {
                browsers: [
                  {
                    family: "chrome"
                    warning: "Cypress detected policy settings on your computer that may cause issues with using this browser. For more information, see https://on.cypress.io/bad-browser-policy"
                  },
                  {
                    family: "some other"
                  }
                ]
              }
            }
          )

    describe "close:project", ->
      beforeEach ->
        sinon.stub(Project.prototype, "close").withArgs({sync: true}).resolves()

      it "is noop and returns null when no project is open", ->
        expect(openProject.getProject()).to.be.null

        @handleEvent("close:project").then (assert) =>
          assert.sendCalledWith(null)

      it "closes down open project and returns null", ->
        sinon.stub(Project.prototype, "getConfig").resolves({})
        sinon.stub(Project.prototype, "open").resolves()

        @handleEvent("open:project", "/_test-output/path/to/project")
        .then =>
          ## it should store the opened project
          expect(openProject.getProject()).not.to.be.null

          @handleEvent("close:project")
        .then (assert) =>
          ## it should store the opened project
          expect(openProject.getProject()).to.be.null

          assert.sendCalledWith(null)

    describe "get:runs", ->
      it "calls openProject.getRuns", ->
        sinon.stub(openProject, "getRuns").resolves([])

        @handleEvent("get:runs").then (assert) =>
          expect(openProject.getRuns).to.be.called

      it "returns array of runs", ->
        sinon.stub(openProject, "getRuns").resolves([])

        @handleEvent("get:runs").then (assert) =>
          assert.sendCalledWith([])

      it "sends UNAUTHENTICATED when statusCode is 401", ->
        err = new Error("foo")
        err.statusCode = 401
        sinon.stub(openProject, "getRuns").rejects(err)

        @handleEvent("get:runs").then (assert) =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("UNAUTHENTICATED")

      it "sends TIMED_OUT when cause.code is ESOCKETTIMEDOUT", ->
        err = new Error("foo")
        err.cause = { code: "ESOCKETTIMEDOUT" }
        sinon.stub(openProject, "getRuns").rejects(err)

        @handleEvent("get:runs").then (assert) =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("TIMED_OUT")

      it "sends NO_CONNECTION when code is ENOTFOUND", ->
        err = new Error("foo")
        err.code = "ENOTFOUND"
        sinon.stub(openProject, "getRuns").rejects(err)

        @handleEvent("get:runs").then (assert) =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("NO_CONNECTION")

      it "sends type when if existing for other errors", ->
        err = new Error("foo")
        err.type = "NO_PROJECT_ID"
        sinon.stub(openProject, "getRuns").rejects(err)

        @handleEvent("get:runs").then (assert) =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("NO_PROJECT_ID")

      it "sends UNKNOWN + name,message,stack for other errors", ->
        err = new Error("foo")
        err.name = "name"
        err.message = "message"
        err.stack = "stack"
        sinon.stub(openProject, "getRuns").rejects(err)

        @handleEvent("get:runs").then (assert) =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("UNKNOWN")

    describe "setup:dashboard:project", ->
      it "returns result of openProject.createCiProject", ->
        sinon.stub(openProject, "createCiProject").resolves("response")

        @handleEvent("setup:dashboard:project").then (assert) =>
          assert.sendCalledWith("response")

      it "catches errors", ->
        err = new Error("foo")
        sinon.stub(openProject, "createCiProject").rejects(err)

        @handleEvent("setup:dashboard:project").then (assert) =>
          assert.sendErrCalledWith(err)

    describe "get:record:keys", ->
      it "returns result of project.getRecordKeys", ->
        sinon.stub(openProject, "getRecordKeys").resolves(["ci-key-123"])

        @handleEvent("get:record:keys").then (assert) =>
          assert.sendCalledWith(["ci-key-123"])

      it "catches errors", ->
        err = new Error("foo")
        sinon.stub(openProject, "getRecordKeys").rejects(err)

        @handleEvent("get:record:keys").then (assert) =>
          assert.sendErrCalledWith(err)

    describe "request:access", ->
      it "returns result of project.requestAccess", ->
        sinon.stub(openProject, "requestAccess").resolves("response")

        @handleEvent("request:access", "org-id-123").then (assert) =>
          expect(openProject.requestAccess).to.be.calledWith("org-id-123")
          assert.sendCalledWith("response")

      it "catches errors", ->
        err = new Error("foo")
        sinon.stub(openProject, "requestAccess").rejects(err)

        @handleEvent("request:access", "org-id-123").then (assert) =>
          assert.sendErrCalledWith(err)

      it "sends ALREADY_MEMBER when statusCode is 403", ->
        err = new Error("foo")
        err.statusCode = 403
        sinon.stub(openProject, "requestAccess").rejects(err)

        @handleEvent("request:access", "org-id-123").then (assert) =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("ALREADY_MEMBER")

      it "sends ALREADY_REQUESTED when statusCode is 429 with certain error", ->
        err = new Error("foo")
        err.statusCode = 422
        err.errors = {
          userId: [ "This User has an existing MembershipRequest to this Organization." ]
        }

        sinon.stub(openProject, "requestAccess").rejects(err)

        @handleEvent("request:access", "org-id-123").then (assert) =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("ALREADY_REQUESTED")

      it "sends type when if existing for other errors", ->
        err = new Error("foo")
        err.type = "SOME_TYPE"
        sinon.stub(openProject, "requestAccess").rejects(err)

        @handleEvent("request:access", "org-id-123").then (assert) =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("SOME_TYPE")

      it "sends UNKNOWN for other errors", ->
        err = new Error("foo")
        sinon.stub(openProject, "requestAccess").rejects(err)

        @handleEvent("request:access", "org-id-123").then (assert) =>
          expect(@send).to.be.calledWith("response")
          expect(@send.firstCall.args[1].__error.type).to.equal("UNKNOWN")

    describe "ping:api:server", ->
      it "returns ensures url", ->
        sinon.stub(ensureUrl, "isListening").resolves()

        @handleEvent("ping:api:server").then (assert) =>
          expect(ensureUrl.isListening).to.be.calledWith(konfig("api_url"))
          assert.sendCalledWith()

      it "catches errors", ->
        err = new Error("foo")
        sinon.stub(ensureUrl, "isListening").rejects(err)

        @handleEvent("ping:api:server").then (assert) =>
          assert.sendErrCalledWith(err)
          expect(err.apiUrl).to.equal(konfig("api_url"))

      it "sends first of aggregate error", ->
        err = new Error("AggregateError")
        err.message = "aggregate error"
        err[0] = {
          code: "ECONNREFUSED"
          port: 1234
          address: "127.0.0.1"
        }
        err.length = 1
        sinon.stub(ensureUrl, "isListening").rejects(err)

        @handleEvent("ping:api:server").then (assert) =>
          assert.sendErrCalledWith(err)
          expect(err.name).to.equal("ECONNREFUSED 127.0.0.1:1234")
          expect(err.message).to.equal("ECONNREFUSED 127.0.0.1:1234")
          expect(err.apiUrl).to.equal(konfig("api_url"))
