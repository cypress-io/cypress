require("../../spec_helper")

_        = require("lodash")
icons    = require("cypress-icons")
electron = require("electron")
cache    = require("#{root}../lib/cache")
logger   = require("#{root}../lib/logger")
Project  = require("#{root}../lib/project")
Updater  = require("#{root}../lib/updater")
user     = require("#{root}../lib/user")
errors   = require("#{root}../lib/errors")
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
    @options = {
      app: {
        exit: @sandbox.spy()
      }
    }
    @event   = {
      sender: {
        send: @send
        session: {
          cookies: @cookies
        }
      }
    }

    ## setup default options and event and id
    ## as the first three arguments
    @handleEvent = _.partial(events.handleEvent, @options, @event, @id)

    @expectSendCalledWith = (data) =>
      expect(@send).to.be.calledWith("response", {id: @id, data: data})

    @expectSendErrCalledWith = (err) =>
      expect(@send).to.be.calledWith("response", {id: @id, __error: errors.clone(err)})

  context ".stop", ->
    it "calls ipc#removeAllListeners", ->
      ral = electron.ipcMain.removeAllListeners = @sandbox.spy()
      events.stop()
      expect(ral).to.be.calledOnce

  context ".start", ->
    it "ipc attaches callback on request", ->
      onFn = electron.ipcMain.on = @sandbox.stub()
      handleEvent = @sandbox.stub(events, "handleEvent")
      events.start({foo: "bar"})
      expect(onFn).to.be.calledWith("request")

    it "partials in options in request callback", ->
      onFn = electron.ipcMain.on = @sandbox.stub()
      onFn.yields("arg1", "arg2")
      handleEvent = @sandbox.stub(events, "handleEvent")
      events.start({foo: "bar"})
      expect(handleEvent).to.be.calledWith({foo: "bar"}, "arg1", "arg2")

  context "no ipc event", ->
    it "throws", ->
      fn = =>
        @handleEvent("no:such:event")

      expect(fn).to.throw("No ipc event registered for: 'no:such:event'")

  context "quit", ->
    it "exits the app", ->
      @handleEvent("quit")
      expect(@options.app.exit).to.be.calledWith(0)

    it "calls logs.off", ->
      @sandbox.stub(logger, "off")
      @handleEvent("quit")
      expect(logger.off).to.be.calledOnce

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
    describe "updater:install", ->
      it "calls Updater#install with appPath, execPath, options and returns null", ->
        install = @sandbox.stub(Updater, "install")
        @handleEvent("updater:install", {
          appPath: "foo"
          execPath: "bar"
        })
        expect(install).to.be.calledWith("foo", "bar", @options)
        @expectSendCalledWith(null)

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

    describe "update", ->
      it.skip "does something"

  context "logo src", ->
    describe "get:about:logo:src", ->
      it "returns path to icon", ->
        @handleEvent("get:about:logo:src")
        @expectSendCalledWith(icons.getPathToIcon("icon_32x32@2x.png"))

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

  context "project events", ->
    describe "get:project:paths", ->
      it "returns array of project paths", ->
        @sandbox.stub(cache, "getProjectPaths").resolves([])

        @handleEvent("get:project:paths").then =>
          @expectSendCalledWith([])

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(cache, "getProjectPaths").rejects(err)

        @handleEvent("get:project:paths").then =>
          @expectSendErrCalledWith(err)

    describe "add:project", ->
      it "adds project + returns arg", ->
        @sandbox.stub(Project, "add").withArgs("path/to/project").resolves()

        @handleEvent("add:project", "path/to/project").then =>
          @expectSendCalledWith("path/to/project")

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
        @sandbox.stub(Project.prototype, "close").resolves()

      afterEach ->
        ## close down 'open' projects
        ## to prevent side effects
        project.close()

      it "open project + returns config", ->
        projectInstance = {getConfig: -> {some: "config"}}
        @sandbox.stub(Project.prototype, "open").withArgs({foo: "bar"}).resolves(projectInstance)

        @handleEvent("open:project", {
          path: "path/to/project"
          options: {foo: "bar"}
        })
        .then =>
          @expectSendCalledWith({some: "config"})

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(Project.prototype, "open").withArgs({foo: "bar"}).rejects(err)

        @handleEvent("open:project", {
          path: "path/to/project"
          options: {foo: "bar"}
        })
        .then =>
          @expectSendErrCalledWith(err)

    describe "close:project", ->
      beforeEach ->
        @sandbox.stub(Project.prototype, "close").resolves()

      it "is noop and returns null when no project is open", ->
        expect(project.opened()).to.be.null

        @handleEvent("close:project").then =>
          @expectSendCalledWith(null)

      it "closes down open project and returns null", ->
        @sandbox.stub(Project.prototype, "open").withArgs({foo: "bar"}).resolves()

        @handleEvent("open:project", {
          path: "path/to/project"
          options: {foo: "bar"}
        })
        .then =>
          ## it should store the opened project
          expect(project.opened()).not.to.be.null

          @handleEvent("close:project")
          .then =>
            ## it should store the opened project
            expect(project.opened()).to.be.null

            @expectSendCalledWith(null)

