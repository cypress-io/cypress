require("../../spec_helper")

mockery.enable({
  warnOnUnregistered: false
})

mockery.registerMock("electron", {})

_       = require("lodash")
cache   = require("#{root}../lib/cache")
logger  = require("#{root}../lib/log")
Project = require("#{root}../lib/project")
events  = require("#{root}../lib/electron/handlers/events")
errors  = require("#{root}../lib/electron/handlers/errors")
project = require("#{root}../lib/electron/handlers/project")

describe.only "Events", ->
  after ->
    mockery.disable()

  beforeEach ->
    ## setup default options and event and id
    ## as the first three arguments
    @send    = @sandbox.stub()
    @options = {}
    @id      = Math.random()
    @event   = {
      sender: {
        send: @send
      }
    }

    @handleEvent = _.partial((events.handleEvent), @options, @event, @id)

    @expectSendCalledWith = (data) =>
      expect(@send).to.be.calledWith("response", {id: @id, data: data})

    @expectSendErrCalledWith = (err) =>
      expect(@send).to.be.calledWith("response", {id: @id, __error: errors.clone(err)})

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
        @sandbox.stub(cache, "addProject").withArgs("path/to/project").resolves()

        @handleEvent("add:project", "path/to/project").then =>
          @expectSendCalledWith("path/to/project")

      it "catches errors", ->
        err = new Error("foo")
        @sandbox.stub(cache, "addProject").withArgs("path/to/project").rejects(err)

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

      it "open project + returns null", ->
        @sandbox.stub(Project.prototype, "open").withArgs({foo: "bar"}).resolves()

        @handleEvent("open:project", {
          path: "path/to/project"
          options: {foo: "bar"}
        })
        .then =>
          @expectSendCalledWith(null)

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

