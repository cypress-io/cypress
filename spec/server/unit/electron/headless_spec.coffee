require("../../spec_helper")

Promise  = require("bluebird")
inquirer = require("inquirer")
electron = require("electron")
user     = require("#{root}../lib/user")
Project  = require("#{root}../lib/project")
project  = require("#{root}../lib/electron/handlers/project")
headless = require("#{root}../lib/modes/headless")
Renderer = require("#{root}../lib/electron/handlers/renderer")
automation = require("#{root}../lib/electron/handlers/automation")

describe "electron/headless", ->
  beforeEach ->
    @projectInstance = Project("path/to/project")

  context ".getId", ->
    it "returns a random number", ->
      expect(headless.getId()).to.be.a("number")

  context ".ensureAndOpenProjectByPath", ->
    beforeEach ->
      @sandbox.stub(project, "open").resolves(@projectInstance)

    it "opens the project if it exists at projectPath", ->
      @sandbox.stub(Project, "exists").resolves(true)
      @sandbox.spy(headless, "promptAddProject")

      headless.ensureAndOpenProjectByPath(1234, {projectPath: "path/to/project"}).then ->
        expect(headless.promptAddProject).not.to.be.called
        expect(project.open).to.be.calledWith("path/to/project")

    it "prompts to add the project if it doesnt exist at projectPath", ->
      @sandbox.stub(Project, "exists").resolves(false)
      @sandbox.stub(headless, "promptAddProject").resolves()

      headless.ensureAndOpenProjectByPath(1234, {projectPath: "path/to/project"}).then ->
        expect(headless.promptAddProject).to.be.calledWith("path/to/project")
        expect(project.open).to.be.calledWith("path/to/project")

  context ".promptAddProject", ->
    beforeEach ->
      @log = @sandbox.spy(console, "log")
      @add = @sandbox.stub(Project, "add").resolves()

    it "prompts with questions", ->
      @sandbox.stub(inquirer, "prompt").yields({add: true})

      headless.promptAddProject().then ->
        questions = inquirer.prompt.firstCall.args[0]

        firstQuestion = questions[0]

        expect(questions).to.be.an("array")
        expect(firstQuestion.choices).to.deep.eq([
          {name: "Yes: add this project and run the tests.", value: true}
          {name: "No:  don't add this project.",             value: false}
        ])

    it "logs warning to console when choosing 'no'", ->
      @sandbox.stub(inquirer, "prompt").yields({add: false})

      headless.promptAddProject("foobarbaz")
        .then ->
          throw new Error("should have errored but did not")
        .catch (err) =>
          expect(err.type).to.eq("PROJECT_DOES_NOT_EXIST")
          expect(@add).not.to.be.called
          expect(@log).to.be.calledWithMatch(
            "We couldn't find a Cypress project at this path:",
            "foobarbaz"
          )

    it "adds the project when choosing 'yes'", ->
      @sandbox.stub(inquirer, "prompt").yields({add: true})

      headless.promptAddProject("path/to/project").then =>
        expect(@add).to.be.calledWith("path/to/project")
        expect(@log).to.be.calledWithMatch("Ok great, added the project.")

    it "gracefully handles problems with adding the project"
      ## TODO: implement gracefully exiting with a nice explanation
      ## when a project could not be added due to a problem talking
      ## to the api server

  context ".openProject", ->
    it "calls project.open with projectPath + options", ->
      @sandbox.stub(project, "open").resolves()

      options = {
        port: 8080
        environmentVariables: {foo: "bar"}
        projectPath: "path/to/project/foo"
      }

      headless.openProject(1234, options).then ->
        expect(project.open).to.be.calledWithMatch("path/to/project/foo", {
          port: 8080
          projectPath: "path/to/project/foo"
          environmentVariables: {foo: "bar"}
        }, {
          morgan: false
          socketId: 1234
          report: true
          isHeadless: true
          onAutomationRequest: automation.perform
        })

    ## TODO: write this test!
    it "binds onAutomationRequest to automation.perform"

  context ".createRenderer", ->
    beforeEach ->
      @win = @sandbox.stub({
        hide: ->
        setSize: ->
        center: ->
        webContents: {
          on: @sandbox.stub()
        }
      })

      @create = @sandbox.stub(Renderer, "create").resolves(@win)

    it "calls Renderer.create with url + options", ->
      headless.createRenderer("foo/bar/baz").then =>
        expect(@create).to.be.calledWith({
          url: "foo/bar/baz"
          width: 0
          height: 0
          show: false
          frame: false
          devTools: false
          type: "PROJECT"
        })

    it "calls win.hide + win.setSize on the resolved window", ->
      headless.createRenderer("foo/bar/baz").then =>
        expect(@win.hide).to.be.calledOnce
        expect(@win.setSize).to.be.calledWith(1280, 720)
        expect(@win.center).to.be.calledOnce

    it "can show window", ->
      headless.createRenderer("foo/bar/baz", true).then =>
        expect(@create).to.be.calledWith({
          url: "foo/bar/baz"
          width: 0
          height: 0
          show: true
          frame: true
          devTools: true
          type: "PROJECT"
        })

        expect(@win.hide).not.to.be.called

    it "sets options.show = false on new-window", ->
      options = {show: true}

      @win.webContents.on.withArgs("new-window").yields(
        {}, "foo", "bar", "baz", options
      )

      headless.createRenderer("foo/bar/baz").then =>
        expect(options.show).to.eq(false)

  context ".waitForRendererToConnect", ->
    it "resolves on waitForSocketConnection", ->
      @sandbox.stub(headless, "waitForRendererToConnect").resolves()
      headless.waitForRendererToConnect()

    it "passes project + id", ->
      @sandbox.stub(headless, "waitForRendererToConnect").resolves()
      headless.waitForRendererToConnect(@projectInstance, 1234).then =>
        expect(headless.waitForRendererToConnect).to.be.calledWith(@projectInstance, 1234)

    it "throws TESTS_DID_NOT_START after 10 seconds", ->
      clock = @sandbox.useFakeTimers("setTimeout")

      promise = ->
        new Promise (resolve, reject) =>
          ## create the situation where
          ## our clock ticks forward 10.001secs
          ## to simulate our promise hanging
          ## until the timeout is reached
          process.nextTick ->
            clock.tick(10001)

      ## force waitForRendererToConnect to return a promise which is never resolved
      @sandbox.stub(headless, "waitForSocketConnection", promise)

      headless.waitForRendererToConnect()
        .then ->
          throw new Error("should have failed but did not")
        .catch (err) ->
          expect(err.type).to.eq("TESTS_DID_NOT_START")

    it ".waitForSocketConnection"

  context ".waitForSocketConnection", ->
    beforeEach ->
      @projectStub = @sandbox.stub({
        on: ->
        removeListener: ->
      })

    it "returns promise instance", ->
      expect(headless.waitForSocketConnection(@projectStub, 1234)).to.be.instanceOf(Promise)

    it "attaches fn to 'socket:connected' event", ->
      headless.waitForSocketConnection(@projectStub, 1234)
      expect(@projectStub.on).to.be.calledWith("socket:connected")

    it "calls removeListener if socketId matches id", ->
      @projectStub.on.yields(1234)

      headless.waitForSocketConnection(@projectStub, 1234).then =>
        expect(@projectStub.removeListener).to.be.calledWith("socket:connected")

    describe "integration", ->
      it "resolves undefined when socket:connected fires", ->
        process.nextTick =>
          @projectInstance.emit("socket:connected", 1234)

        headless.waitForSocketConnection(@projectInstance, 1234).then (ret) ->
          expect(ret).to.be.undefined

      it "does not resolve if socketId does not match id", (done) ->
        process.nextTick =>
          @projectInstance.emit("socket:connected", 12345)

        headless
          .waitForSocketConnection(@projectInstance, 1234)
          .timeout(50)
          .catch Promise.TimeoutError, (err) ->
            done()

      it "actually removes the listener", ->
        process.nextTick =>
          @projectInstance.emit("socket:connected", 12345)
          expect(@projectInstance.listeners("socket:connected")).to.have.length(1)
          @projectInstance.emit("socket:connected", "1234")
          expect(@projectInstance.listeners("socket:connected")).to.have.length(1)
          @projectInstance.emit("socket:connected", 1234)
          expect(@projectInstance.listeners("socket:connected")).to.have.length(0)

        headless.waitForSocketConnection(@projectInstance, 1234)

  context ".waitForTestsToFinishRunning", ->
    it "resolves with end event + argument", ->
      process.nextTick =>
        @projectInstance.emit("end", {foo: "bar"})

      headless.waitForTestsToFinishRunning(@projectInstance).then (obj) ->
        expect(obj).to.deep.eq({foo: "bar"})

    it "stops listening to end event", ->
      process.nextTick =>
        expect(@projectInstance.listeners("end")).to.have.length(1)
        @projectInstance.emit("end", {foo: "bar"})
        expect(@projectInstance.listeners("end")).to.have.length(0)

      headless.waitForTestsToFinishRunning(@projectInstance)

  context ".run", ->
    beforeEach ->
      @sandbox.stub(@projectInstance, "getConfig").resolves({})
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      @sandbox.stub(user, "ensureSession").resolves("abc-123")
      @sandbox.stub(headless, "getId").returns(1234)
      @sandbox.stub(headless, "ensureAndOpenProjectByPath").resolves(@projectInstance)
      @sandbox.stub(headless, "waitForRendererToConnect").resolves()
      @sandbox.stub(headless, "waitForTestsToFinishRunning").resolves({failures: 10})
      @sandbox.stub(headless, "createRenderer").resolves()

    it "ensures user session", ->
      headless.run().then ->
        expect(user.ensureSession).to.be.calledOnce

    it "returns stats", ->
      headless.run().then (stats) ->
        expect(stats).to.deep.eq({failures: 10})

    it "passes id + options to ensureAndOpenProjectByPath", ->
      headless.run({foo: "bar"}).then ->
        expect(headless.ensureAndOpenProjectByPath).to.be.calledWith(1234, {foo: "bar"})

    it "passes project + id to waitForRendererToConnect", ->
      headless.run().then =>
        expect(headless.waitForRendererToConnect).to.be.calledWith(@projectInstance, 1234)

    it "passes project to waitForTestsToFinishRunning", ->
      headless.run().then =>
        expect(headless.waitForTestsToFinishRunning).to.be.calledWith(@projectInstance)

    it "passes project.ensureSpecUrl to createRenderer", ->
      @sandbox.stub(@projectInstance, "ensureSpecUrl").resolves("foo/bar")

      headless.run().then ->
        expect(headless.createRenderer).to.be.calledWith("foo/bar")

    it "passes showHeadlessGui to createRenderer", ->
      @sandbox.stub(@projectInstance, "ensureSpecUrl").resolves("foo/bar")

      headless.run({showHeadlessGui: true}).then ->
        expect(headless.createRenderer).to.be.calledWith("foo/bar", true)
