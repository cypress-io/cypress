require("../../spec_helper")

Promise  = require("bluebird")
electron = require("electron")
user     = require("#{root}../lib/user")
video    = require("#{root}../lib/video")
errors   = require("#{root}../lib/errors")
config   = require("#{root}../lib/config")
Project  = require("#{root}../lib/project")
Reporter = require("#{root}../lib/reporter")
runMode = require("#{root}../lib/modes/run")
openProject = require("#{root}../lib/open_project")
env = require("#{root}../lib/util/env")
random = require("#{root}../lib/util/random")
specsUtil = require("#{root}../lib/util/specs")

describe "lib/modes/run", ->
  beforeEach ->
    @projectInstance = Project("/_test-output/path/to/project")

  context ".getProjectId", ->
    it "resolves if id", ->
      runMode.getProjectId("project", "id123")
      .then (ret) ->
        expect(ret).to.eq("id123")

    it "resolves if CYPRESS_PROJECT_ID set", ->
      @sandbox.stub(env, "get").withArgs("CYPRESS_PROJECT_ID").returns("envId123")

      runMode.getProjectId("project")
      .then (ret) ->
        expect(ret).to.eq("envId123")

    it "is null when no projectId", ->
      project = {
        getProjectId: @sandbox.stub().rejects(new Error)
      }

      runMode.getProjectId(project)
      .then (ret) ->
        expect(ret).to.be.null

  context ".openProjectCreate", ->
    beforeEach ->
      @sandbox.stub(openProject, "create").resolves()

      options = {
        port: 8080
        env: {foo: "bar"}
        projectRoot: "/_test-output/path/to/project/foo"
      }

      runMode.openProjectCreate(options.projectRoot, 1234, options)

    it "calls openProject.create with projectRoot + options", ->
      expect(openProject.create).to.be.calledWithMatch("/_test-output/path/to/project/foo", {
        port: 8080
        projectRoot: "/_test-output/path/to/project/foo"
        env: {foo: "bar"}
      }, {
        morgan: false
        socketId: 1234
        report: true
        isTextTerminal: true
      })

    it "emits 'exitEarlyWithErr' with error message onError", ->
      @sandbox.stub(openProject, "emit")
      expect(openProject.create.lastCall.args[2].onError).to.be.a("function")
      openProject.create.lastCall.args[2].onError({ message: "the message" })
      expect(openProject.emit).to.be.calledWith("exitEarlyWithErr", "the message")

  context ".getElectronProps", ->
    it "sets width and height", ->
      props = runMode.getElectronProps()

      expect(props.width).to.eq(1280)
      expect(props.height).to.eq(720)

    it "sets show to boolean", ->
      props = runMode.getElectronProps(false)
      expect(props.show).to.be.false

      props = runMode.getElectronProps(true)
      expect(props.show).to.be.true

    it "sets recordFrameRate and onPaint when write is true", ->
      write = @sandbox.stub()

      image = {
        toJPEG: @sandbox.stub().returns("imgdata")
      }

      props = runMode.getElectronProps(true, {}, write)

      expect(props.recordFrameRate).to.eq(20)

      props.onPaint({}, false, image)

      expect(write).to.be.calledWith("imgdata")

    it "does not set recordFrameRate or onPaint when write is falsy", ->
      props = runMode.getElectronProps(true, {}, false)

      expect(props).not.to.have.property("recordFrameRate")
      expect(props).not.to.have.property("onPaint")

    it "sets options.show = false onNewWindow callback", ->
      options = {show: true}

      props = runMode.getElectronProps()
      props.onNewWindow(null, null, null, null, options)

      expect(options.show).to.eq(false)

    it "emits exitEarlyWithErr when webContents crashed", ->
      @sandbox.spy(errors, "get")
      @sandbox.spy(errors, "log")

      emit = @sandbox.stub(@projectInstance, "emit")

      props = runMode.getElectronProps(true, @projectInstance)

      props.onCrashed()

      expect(errors.get).to.be.calledWith("RENDERER_CRASHED")
      expect(errors.log).to.be.calledOnce
      expect(emit).to.be.calledWithMatch("exitEarlyWithErr", "We detected that the Chromium Renderer process just crashed.")

  context ".launchBrowser", ->
    beforeEach ->
      @launch = @sandbox.stub(openProject, "launch")
      @sandbox.stub(runMode, "getElectronProps").returns({foo: "bar"})
      @sandbox.stub(runMode, "screenshotMetadata").returns({a: "a"})

    it "can launch electron", ->
      screenshots = []

      runMode.launchBrowser({
        browser: "electron"
        project: @projectInstance
        write: "write"
        gui: null
        screenshots: screenshots
        spec: {
          absolute: "/path/to/spec"
        }
      })

      expect(runMode.getElectronProps).to.be.calledWith(false, @projectInstance, "write")

      expect(@launch).to.be.calledWithMatch("electron", "/path/to/spec", {foo: "bar"})

      browserOpts = @launch.firstCall.args[2]

      onAfterResponse = browserOpts.automationMiddleware.onAfterResponse

      expect(onAfterResponse).to.be.a("function")

      onAfterResponse("take:screenshot")
      onAfterResponse("get:cookies")

      expect(screenshots).to.deep.eq([{a: "a"}])

    it "can launch chrome", ->
      runMode.launchBrowser({
        browser: "chrome"
        spec: {
          absolute: "/path/to/spec"
        }
      })

      expect(runMode.getElectronProps).not.to.be.called

      expect(@launch).to.be.calledWithMatch("chrome", "/path/to/spec", {})

  context ".postProcessRecording", ->
    beforeEach ->
      @sandbox.stub(video, "process").resolves()

    it "calls video process with name, cname and videoCompression", ->
      end = -> Promise.resolve()

      runMode.postProcessRecording(end, "foo", "foo-compress", 32, true)
      .then ->
        expect(video.process).to.be.calledWith("foo", "foo-compress", 32)

    it "does not call video process when videoCompression is false", ->
      end = -> Promise.resolve()

      runMode.postProcessRecording(end, "foo", "foo-compress", false, true)
      .then ->
        expect(video.process).not.to.be.called

    it "calls video process if we have been told to upload videos", ->
      end = -> Promise.resolve()

      runMode.postProcessRecording(end, "foo", "foo-compress", 32, true)
      .then ->
        expect(video.process).to.be.calledWith("foo", "foo-compress", 32)

    it "does not call video process if there are no failing tests and we have set not to upload video on passing", ->
      end = -> Promise.resolve()

      runMode.postProcessRecording(end, "foo", "foo-compress", 32, false)
      .then ->
        expect(video.process).not.to.be.called

  context ".waitForBrowserToConnect", ->
    it "throws TESTS_DID_NOT_START_FAILED after 3 connection attempts", ->
      @sandbox.spy(errors, "warning")
      @sandbox.spy(errors, "get")
      @sandbox.spy(openProject, "closeBrowser")
      @sandbox.stub(runMode, "launchBrowser").resolves()
      @sandbox.stub(runMode, "waitForSocketConnection").resolves(Promise.delay(1000))
      emit = @sandbox.stub(@projectInstance, "emit")

      runMode.waitForBrowserToConnect({project: @projectInstance, timeout: 10})
      .then ->
        expect(openProject.closeBrowser).to.be.calledThrice
        expect(runMode.launchBrowser).to.be.calledThrice
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

    it "attaches fn to 'socket:connected' event", ->
      runMode.waitForSocketConnection(@projectStub, 1234)
      expect(@projectStub.on).to.be.calledWith("socket:connected")

    it "calls removeListener if socketId matches id", ->
      @projectStub.on.yields(1234)

      runMode.waitForSocketConnection(@projectStub, 1234)
      .then =>
        expect(@projectStub.removeListener).to.be.calledWith("socket:connected")

    describe "integration", ->
      it "resolves undefined when socket:connected fires", ->
        process.nextTick =>
          @projectInstance.emit("socket:connected", 1234)

        runMode.waitForSocketConnection(@projectInstance, 1234)
        .then (ret) ->
          expect(ret).to.be.undefined

      it "does not resolve if socketId does not match id", ->
        process.nextTick =>
          @projectInstance.emit("socket:connected", 12345)

        runMode
        .waitForSocketConnection(@projectInstance, 1234)
        .timeout(50)
        .then ->
          throw new Error("should time out and not resolve")
        .catch Promise.TimeoutError, (err) ->

      it "actually removes the listener", ->
        process.nextTick =>
          @projectInstance.emit("socket:connected", 12345)
          expect(@projectInstance.listeners("socket:connected")).to.have.length(1)
          @projectInstance.emit("socket:connected", "1234")
          expect(@projectInstance.listeners("socket:connected")).to.have.length(1)
          @projectInstance.emit("socket:connected", 1234)
          expect(@projectInstance.listeners("socket:connected")).to.have.length(0)

        runMode.waitForSocketConnection(@projectInstance, 1234)

  context ".waitForTestsToFinishRunning", ->
    beforeEach ->
      @sandbox.stub(@projectInstance, "getConfig").resolves({})

    it "end event resolves with obj, displays stats, displays screenshots, sets video timestamps", ->
      started = new Date
      screenshots = [{}, {}, {}]
      cfg = {}
      end = ->
      results = {
        tests: [4,5,6]
        stats: {
          tests: 1
          passes: 2
          failures: 3
          pending: 4
          duration: 5
        }
      }

      @sandbox.stub(Reporter, "setVideoTimestamp").withArgs(started, results.tests).returns([1,2,3])
      @sandbox.stub(runMode, "postProcessRecording").resolves()
      @sandbox.spy(runMode,  "displayStats")
      @sandbox.spy(runMode,  "displayScreenshots")

      process.nextTick =>
        @projectInstance.emit("end", results)

      runMode.waitForTestsToFinishRunning({
        project: @projectInstance,
        name: "foo.mp4"
        cname: "foo-compressed.mp4"
        videoCompression: 32
        videoUploadOnPasses: true
        gui: false
        config: cfg
        screenshots
        started
        end
        spec: {
          path: "cypress/integration/spec.js"
        }
      })
      .then (obj) ->
        expect(runMode.postProcessRecording).to.be.calledWith(end, "foo.mp4", "foo-compressed.mp4", 32, true)

        results = runMode.collectTestResults(obj)

        expect(runMode.displayStats).to.be.calledWith(results)
        expect(runMode.displayScreenshots).to.be.calledWith(screenshots)

        expect(obj).to.deep.eq({
          screenshots
          config: cfg
          spec: "cypress/integration/spec.js"
          video:        "foo.mp4"
          shouldUploadVideo: true
          tests: [1,2,3]
          stats: {
            tests:        1
            passes:       2
            failures:     3
            pending:      4
            duration:     5
          }
        })

    it "exitEarlyWithErr event resolves with no tests, error, and empty failingTests", ->
      err = new Error("foo")
      started = new Date
      cfg = {}
      screenshots = [{}, {}, {}]
      end = ->

      @sandbox.stub(runMode, "postProcessRecording").resolves()
      @sandbox.spy(runMode,  "displayStats")
      @sandbox.spy(runMode,  "displayScreenshots")

      process.nextTick =>
        expect(@projectInstance.listeners("exitEarlyWithErr")).to.have.length(1)
        @projectInstance.emit("exitEarlyWithErr", err.message)
        expect(@projectInstance.listeners("exitEarlyWithErr")).to.have.length(0)

      runMode.waitForTestsToFinishRunning({
        project: @projectInstance,
        name: "foo.mp4"
        cname: "foo-compressed.mp4"
        videoCompression: 32
        videoUploadOnPasses: true
        gui: false
        screenshots
        started
        end
        config: cfg
        spec: {
          path: "cypress/integration/spec.js"
        }
      })
      .then (obj) ->
        expect(runMode.postProcessRecording).to.be.calledWith(end, "foo.mp4", "foo-compressed.mp4", 32, true)

        results = runMode.collectTestResults(obj)
        expect(runMode.displayStats).to.be.calledWith(results)
        expect(runMode.displayScreenshots).to.be.calledWith(screenshots)

        expect(obj).to.deep.eq({
          screenshots
          config: cfg
          error:      err.message
          spec:       "cypress/integration/spec.js"
          video:        "foo.mp4"
          shouldUploadVideo: true
          stats: {
            failures:     1
            tests:        0
            passes:       0
            pending:      0
            duration:     0
          }
        })

    it "should not upload video when videoUploadOnPasses is false and no failing tests", ->
      process.nextTick =>
        @projectInstance.emit("end", {
          failingTests: []
        })

      @sandbox.spy(runMode, "postProcessRecording")
      @sandbox.spy(video, "process")
      end = @sandbox.stub().resolves()

      runMode.waitForTestsToFinishRunning({
        project: @projectInstance,
        name: "foo.mp4"
        cname: "foo-compressed.mp4"
        videoCompression: 32
        videoUploadOnPasses: false
        gui: false
        end
      })
      .then (obj) ->
        expect(runMode.postProcessRecording).to.be.calledWith(end, "foo.mp4", "foo-compressed.mp4", 32, false)

        expect(video.process).not.to.be.called

  context ".listenForProjectEnd", ->
    it "resolves with end event + argument", ->
      process.nextTick =>
        @projectInstance.emit("end", {foo: "bar"})

      runMode.listenForProjectEnd(@projectInstance)
      .then (obj) ->
        expect(obj).to.deep.eq({
          foo: "bar"
        })

    it "stops listening to end event", ->
      process.nextTick =>
        expect(@projectInstance.listeners("end")).to.have.length(1)
        @projectInstance.emit("end", {foo: "bar"})
        expect(@projectInstance.listeners("end")).to.have.length(0)

      runMode.listenForProjectEnd(@projectInstance)

  context ".run browser vs video recording", ->
    beforeEach ->
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      @sandbox.stub(user, "ensureAuthToken")
      @sandbox.stub(Project, "ensureExists").resolves()
      @sandbox.stub(random, "id").returns(1234)
      @sandbox.stub(openProject, "create").resolves(openProject)
      @sandbox.stub(runMode, "waitForSocketConnection").resolves()
      @sandbox.stub(runMode, "waitForTestsToFinishRunning").resolves({ stats: { failures: 10 } })
      @sandbox.spy(runMode,  "waitForBrowserToConnect")
      @sandbox.stub(video, "start").resolves()
      @sandbox.stub(openProject, "launch").resolves()
      @sandbox.stub(openProject, "getProject").resolves(@projectInstance)
      @sandbox.spy(errors, "warning")
      @sandbox.stub(config, "get").resolves({
        proxyUrl: "http://localhost:12345",
        videoRecording: true,
        videosFolder: "videos",
        integrationFolder: "/path/to/integrationFolder"
      })
      @sandbox.stub(specsUtil, "find").resolves([
        {
          name: "foo_spec.js"
          path: "cypress/integration/foo_spec.js"
          absolute: "/path/to/spec.js"
        }
      ])

    it "shows no warnings for default browser", ->
      runMode.run()
      .then ->
        expect(errors.warning).to.not.be.called

    it "shows no warnings for electron browser", ->
      runMode.run({browser: "electron"})
      .then ->
        expect(errors.warning).to.not.be.calledWith("CANNOT_RECORD_VIDEO_FOR_THIS_BROWSER")

    it "disables video recording on interactive mode runs", ->
      runMode.run({headed: true})
      .then ->
        expect(errors.warning).to.be.calledWith("CANNOT_RECORD_VIDEO_HEADED")

    it "disables video recording for non-electron browser", ->
      runMode.run({browser: "chrome"})
      .then ->
        expect(errors.warning).to.be.calledWith("CANNOT_RECORD_VIDEO_FOR_THIS_BROWSER")

    it "names video file with spec name", ->
      runMode.run()
      .then =>
        expect(video.start).to.be.calledWith("videos/foo_spec.js.mp4")
        expect(runMode.waitForTestsToFinishRunning).to.be.calledWithMatch({
          cname: "videos/foo_spec.js-compressed.mp4"
        })

  context ".run", ->
    beforeEach ->
      @sandbox.stub(@projectInstance, "getConfig").resolves({proxyUrl: "http://localhost:12345"})
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      @sandbox.stub(user, "ensureAuthToken")
      @sandbox.stub(Project, "ensureExists").resolves()
      @sandbox.stub(random, "id").returns(1234)
      @sandbox.stub(openProject, "create").resolves(openProject)
      @sandbox.stub(runMode, "waitForSocketConnection").resolves()
      @sandbox.stub(runMode, "waitForTestsToFinishRunning").resolves({ stats: { failures: 10 } })
      @sandbox.spy(runMode,  "waitForBrowserToConnect")
      @sandbox.stub(openProject, "launch").resolves()
      @sandbox.stub(openProject, "getProject").resolves(@projectInstance)
      @sandbox.stub(specsUtil, "find").resolves([
        {
          name: "foo_spec.js"
          path: "cypress/integration/foo_spec.js"
          absolute: "/path/to/spec.js"
        }
      ])

    it "no longer ensures user session", ->
      runMode.run()
      .then ->
        expect(user.ensureAuthToken).not.to.be.called

    it "resolves with object and totalFailures", ->
      runMode.run()
      .then (results) ->
        expect(results).to.have.property("totalFailures", 10)

    it "passes projectRoot + options to openProject", ->
      opts = { projectRoot: "/path/to/project", foo: "bar" }

      runMode.run(opts)
      .then ->
        expect(openProject.create).to.be.calledWithMatch(opts.projectRoot, opts)

    it "passes project + id to waitForBrowserToConnect", ->
      runMode.run()
      .then =>
        expect(runMode.waitForBrowserToConnect).to.be.calledWithMatch({
          project: @projectInstance
          socketId: 1234
        })

    it "passes project to waitForTestsToFinishRunning", ->
      runMode.run()
      .then =>
        expect(runMode.waitForTestsToFinishRunning).to.be.calledWithMatch({
          project: @projectInstance
        })

    it "passes headed to openProject.launch", ->
      runMode.run({headed: true})
      .then ->
        expect(openProject.launch).to.be.calledWithMatch(
          "electron",
          "path/to/spec.js",
          {
            show: true
          }
        )
