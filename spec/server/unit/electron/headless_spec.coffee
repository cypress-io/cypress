require("../../spec_helper")

random   = require("randomstring")
Promise  = require("bluebird")
inquirer = require("inquirer")
electron = require("electron")
user     = require("#{root}../lib/user")
video    = require("#{root}../lib/video")
errors   = require("#{root}../lib/errors")
Project  = require("#{root}../lib/project")
Reporter = require("#{root}../lib/reporter")
project  = require("#{root}../lib/electron/handlers/project")
headless = require("#{root}../lib/modes/headless")
Renderer = require("#{root}../lib/electron/handlers/renderer")
automation = require("#{root}../lib/electron/handlers/automation")

describe "electron/headless", ->
  beforeEach ->
    @projectInstance = Project("path/to/project")

  context ".getId", ->
    it "returns random.generate string", ->
      @sandbox.spy(random, "generate")

      id = headless.getId()
      expect(id.length).to.eq(5)

      expect(random.generate).to.be.calledWith({
        length: 5
        capitalization: "lowercase"
      })

  context ".ensureAndOpenProjectByPath", ->
    beforeEach ->
      @sandbox.stub(project, "open").resolves(@projectInstance)

    it "opens the project if it exists at projectPath", ->
      @sandbox.stub(Project, "exists").resolves(true)
      @sandbox.spy(Project, "add")

      headless.ensureAndOpenProjectByPath(1234, {projectPath: "path/to/project"})
      .then ->
        expect(Project.add).not.to.be.called
        expect(project.open).to.be.calledWith("path/to/project")

    it "prompts to add the project if it doesnt exist at projectPath", ->
      @sandbox.stub(Project, "exists").resolves(false)
      @sandbox.spy(Project, "add")
      @sandbox.spy(console, "log")

      headless.ensureAndOpenProjectByPath(1234, {projectPath: "path/to/project"})
      .then ->
        expect(console.log).to.be.calledWithMatch("Added this project:", "path/to/project")
        expect(Project.add).to.be.calledWith("path/to/project")
        expect(project.open).to.be.calledWith("path/to/project")

  context ".openProject", ->
    it "calls project.open with projectPath + options", ->
      @sandbox.stub(project, "open").resolves()

      fn1 = ->
      fn2 = ->

      options = {
        port: 8080
        environmentVariables: {foo: "bar"}
        projectPath: "path/to/project/foo"
        onAutomationRequest: fn1
        afterAutomationRequest: fn2
      }

      headless.openProject(1234, options)
      .then ->
        expect(project.open).to.be.calledWithMatch("path/to/project/foo", {
          port: 8080
          projectPath: "path/to/project/foo"
          environmentVariables: {foo: "bar"}
        }, {
          sync: false
          morgan: false
          socketId: 1234
          report: true
          isHeadless: true
          onAutomationRequest: fn1
          afterAutomationRequest: fn2
        })

  context ".setProxy", ->
    it "calls session.defaultSession.setProxy with proxyRules"

  context ".createRenderer", ->
    beforeEach ->
      @win = @sandbox.stub({
        setSize: ->
        center: ->
        webContents: {
          on: @sandbox.stub()
          getFrameRate: @sandbox.stub()
          setFrameRate: @sandbox.stub()
        }
      })

      @sandbox.stub(headless, "setProxy").withArgs("http://localhost:1234").resolves()

      @create = @sandbox.stub(Renderer, "create").resolves(@win)

    it "calls Renderer.create with url + options", ->
      headless.createRenderer("foo/bar/baz", "http://localhost:1234", false)
      .then =>
        expect(@create).to.be.calledWith({
          url: "foo/bar/baz"
          width: 1280
          height: 720
          show: false
          frame: false
          devTools: false
          chromeWebSecurity: undefined
          type: "PROJECT"
        })

    it "calls win.setSize on the resolved window", ->
      headless.createRenderer("foo/bar/baz", "http://localhost:1234")
      .then =>
        expect(@win.center).to.be.calledOnce

    it "resets framerate and writes images on paint", ->
      write = @sandbox.stub()

      image = {
        toJPEG: @sandbox.stub().returns("imgdata")
      }

      @win.webContents.on.withArgs("paint").yields({}, false, image)

      headless.createRenderer("foo/bar/baz", "http://localhost:1234", false, false, @projectInstance, write)
      .then =>
        expect(image.toJPEG).to.be.calledWith(100)
        expect(write).to.be.calledWith("imgdata")

    it "does not do anything on paint when write is null", ->
      headless.createRenderer("foo/bar/baz", "http://localhost:1234", false, false, @projectInstance, null)
      .then =>
        expect(@win.webContents.on).not.to.be.calledWith("paint")

    it "can show window", ->
      headless.createRenderer("foo/bar/baz", "http://localhost:1234", true, false)
      .then =>
        expect(@create).to.be.calledWith({
          url: "foo/bar/baz"
          width: 1280
          height: 720
          show: true
          frame: true
          devTools: true
          chromeWebSecurity: false
          type: "PROJECT"
        })

    it "sets options.show = false on new-window", ->
      options = {show: true}

      @win.webContents.on.withArgs("new-window").yields(
        {}, "foo", "bar", "baz", options
      )

      headless.createRenderer("foo/bar/baz", "http://localhost:1234")
      .then =>
        expect(options.show).to.eq(false)

    it "emits exitEarlyWithErr when webContents crashed", ->
      @sandbox.spy(errors, "get")
      @sandbox.spy(errors, "log")

      @win.webContents.on.withArgs("crashed").yields({}, false)

      emit = @sandbox.stub(@projectInstance, "emit")

      headless.createRenderer("foo/bar/baz", "http://localhost:1234", false, false, @projectInstance)
      .then ->
        expect(errors.get).to.be.calledWith("RENDERER_CRASHED")
        expect(errors.log).to.be.calledOnce
        expect(emit).to.be.calledWithMatch("exitEarlyWithErr", "We detected that the Chromium Renderer process just crashed.")

  context ".closeAnyOpenBrowser", ->
    beforeEach ->
      @sandbox.spy(Renderer, "destroy")
      @sandbox.spy(project, "closeBrowser")

      headless.closeAnyOpenBrowser()

    it "calls Renderer.destroy(PROJECT)", ->
      expect(Renderer.destroy).to.be.calledWith("PROJECT")

    it "calls project.closeBrowser", ->
      expect(project.closeBrowser).to.be.calledOnce

  context ".postProcessRecording", ->
    beforeEach ->
      @sandbox.stub(video, "process").resolves()

    it "calls video process with name, cname and videoCompression", ->
      end = -> Promise.resolve()

      headless.postProcessRecording(end, "foo", "foo-compress", 32)
      .then ->
        expect(video.process).to.be.calledWith("foo", "foo-compress", 32)

    it "does not call video process when videoCompression is false", ->
      end = -> Promise.resolve()

      headless.postProcessRecording(end, "foo", "foo-compress", false)
      .then ->
        expect(video.process).not.to.be.called

  context ".waitForRendererToConnect", ->
    it "resolves on waitForSocketConnection", ->
      @sandbox.stub(headless, "waitForRendererToConnect").resolves()
      headless.waitForRendererToConnect()

    it "passes project + id", ->
      @sandbox.stub(headless, "waitForRendererToConnect").resolves()
      headless.waitForRendererToConnect(@projectInstance, 1234)
      .then =>
        expect(headless.waitForRendererToConnect).to.be.calledWith(@projectInstance, 1234)

    it "throws TESTS_DID_NOT_START_FAILED after 3 connection attempts", ->
      @sandbox.spy(errors, "warning")
      @sandbox.spy(errors, "get")
      @sandbox.spy(headless, "closeAnyOpenBrowser")
      @sandbox.stub(headless, "waitForSocketConnection").resolves(Promise.delay(1000))
      @sandbox.stub(headless, "createRenderer").resolves()
      emit = @sandbox.stub(@projectInstance, "emit")

      headless.waitForRendererToConnect({openProject: @projectInstance, timeout: 10})
      .then ->
        expect(headless.closeAnyOpenBrowser).to.be.calledThrice
        expect(errors.warning).to.be.calledWith("TESTS_DID_NOT_START_RETRYING", "Retrying...")
        expect(errors.warning).to.be.calledWith("TESTS_DID_NOT_START_RETRYING", "Retrying again...")
        expect(errors.get).to.be.calledWith("TESTS_DID_NOT_START_FAILED")
        expect(emit).to.be.calledWith("exitEarlyWithErr", "The browser never connected. Something is wrong. The tests cannot run. Aborting...")

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

      headless.waitForSocketConnection(@projectStub, 1234)
      .then =>
        expect(@projectStub.removeListener).to.be.calledWith("socket:connected")

    describe "integration", ->
      it "resolves undefined when socket:connected fires", ->
        process.nextTick =>
          @projectInstance.emit("socket:connected", 1234)

        headless.waitForSocketConnection(@projectInstance, 1234)
        .then (ret) ->
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
    beforeEach ->
      @sandbox.stub(@projectInstance, "getConfig").resolves({})

    it "resolves with end event + argument", ->
      process.nextTick =>
        @projectInstance.emit("end", {foo: "bar"})

      headless.waitForTestsToFinishRunning({openProject: @projectInstance})
      .then (obj) ->
        expect(obj).to.deep.eq({
          foo: "bar"
          config: {}
        })

    it "stops listening to end event", ->
      process.nextTick =>
        expect(@projectInstance.listeners("end")).to.have.length(1)
        @projectInstance.emit("end", {foo: "bar"})
        expect(@projectInstance.listeners("end")).to.have.length(0)

      headless.waitForTestsToFinishRunning({openProject: @projectInstance})

    it "end event resolves with obj, displays stats, displays screenshots, setsFailingTests", ->
      started = new Date
      screenshots = [{}, {}, {}]
      end = ->
      stats = {
        tests: 1
        passes: 2
        failures: 3
        pending: 4
        duration: 5
        failingTests: [4,5,6]
      }

      @sandbox.stub(Reporter, "setVideoTimestamp").withArgs(started, stats.failingTests).returns([1,2,3])
      @sandbox.stub(headless, "postProcessRecording").resolves()
      @sandbox.spy(headless,  "displayStats")
      @sandbox.spy(headless,  "displayScreenshots")

      process.nextTick =>
        @projectInstance.emit("end", stats)

      headless.waitForTestsToFinishRunning({
        openProject: @projectInstance,
        name: "foo.mp4"
        cname: "foo-compressed.mp4"
        videoCompression: 32
        gui: false
        screenshots
        started
        end
      })
      .then (obj) ->
        expect(headless.postProcessRecording).to.be.calledWith(end, "foo.mp4", "foo-compressed.mp4", 32)

        expect(headless.displayStats).to.be.calledWith(obj)
        expect(headless.displayScreenshots).to.be.calledWith(screenshots)

        expect(obj).to.deep.eq({
          tests:        1
          passes:       2
          failures:     3
          pending:      4
          duration:     5
          config:       {}
          failingTests: [1,2,3]
          screenshots:  screenshots
          video:        "foo.mp4"
        })

    it "exitEarlyWithErr event resolves with no tests, error, and empty failingTests", ->
      err = new Error("foo")
      started = new Date
      screenshots = [{}, {}, {}]
      end = ->

      @sandbox.stub(headless, "postProcessRecording").resolves()
      @sandbox.spy(headless,  "displayStats")
      @sandbox.spy(headless,  "displayScreenshots")

      process.nextTick =>
        expect(@projectInstance.listeners("exitEarlyWithErr")).to.have.length(1)
        @projectInstance.emit("exitEarlyWithErr", err.message)
        expect(@projectInstance.listeners("exitEarlyWithErr")).to.have.length(0)

      headless.waitForTestsToFinishRunning({
        openProject: @projectInstance,
        name: "foo.mp4"
        cname: "foo-compressed.mp4"
        videoCompression: 32
        gui: false
        screenshots
        started
        end
      })
      .then (obj) ->
        expect(headless.postProcessRecording).to.be.calledWith(end, "foo.mp4", "foo-compressed.mp4", 32)

        expect(headless.displayStats).to.be.calledWith(obj)
        expect(headless.displayScreenshots).to.be.calledWith(screenshots)

        expect(obj).to.deep.eq({
          error:        err.message
          failures:     1
          tests:        0
          passes:       0
          pending:      0
          duration:     0
          config:       {}
          failingTests: []
          screenshots:  screenshots
          video:        "foo.mp4"
        })

  context ".run", ->
    beforeEach ->
      @sandbox.stub(@projectInstance, "getConfig").resolves({proxyUrl: "http://localhost:12345"})
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      @sandbox.stub(user, "ensureAuthToken")
      @sandbox.stub(headless, "getId").returns(1234)
      @sandbox.stub(headless, "ensureAndOpenProjectByPath").resolves(@projectInstance)
      @sandbox.stub(headless, "waitForSocketConnection").resolves()
      @sandbox.stub(headless, "waitForTestsToFinishRunning").resolves({failures: 10})
      @sandbox.stub(headless, "createRenderer").resolves()
      @sandbox.spy(headless,  "waitForRendererToConnect")

    it "no longer ensures user session", ->
      headless.run()
      .then ->
        expect(user.ensureAuthToken).not.to.be.called

    it "returns stats", ->
      headless.run()
      .then (stats) ->
        expect(stats).to.deep.eq({failures: 10})

    it "passes id + options to ensureAndOpenProjectByPath", ->
      headless.run({foo: "bar"})
      .then ->
        expect(headless.ensureAndOpenProjectByPath).to.be.calledWithMatch(1234, {foo: "bar"})

    it "passes project + id to waitForRendererToConnect", ->
      headless.run()
      .then =>
        expect(headless.waitForRendererToConnect).to.be.calledWithMatch({
          openProject: @projectInstance
          id: 1234
        })

    it "passes project to waitForTestsToFinishRunning", ->
      headless.run()
      .then =>
        expect(headless.waitForTestsToFinishRunning).to.be.calledWithMatch({
          openProject: @projectInstance
        })

    it "passes project.ensureSpecUrl to createRenderer", ->
      @sandbox.stub(@projectInstance, "ensureSpecUrl").resolves("foo/bar")

      headless.run()
      .then ->
        expect(headless.createRenderer).to.be.calledWith("foo/bar")

    it "passes showHeadlessGui to createRenderer", ->
      @sandbox.stub(@projectInstance, "ensureSpecUrl").resolves("foo/bar")

      headless.run({showHeadlessGui: true})
      .then ->
        expect(headless.createRenderer).to.be.calledWith("foo/bar", "http://localhost:12345", true)
