require("../../spec_helper")

Promise  = require("bluebird")
electron = require("electron")
user     = require("#{root}../lib/user")
errors   = require("#{root}../lib/errors")
config   = require("#{root}../lib/config")
Project  = require("#{root}../lib/project")
browsers   = require("#{root}../lib/browsers")
Reporter = require("#{root}../lib/reporter")
runMode = require("#{root}../lib/modes/run")
openProject = require("#{root}../lib/open_project")
videoCapture = require("#{root}../lib/video_capture")
env = require("#{root}../lib/util/env")
random = require("#{root}../lib/util/random")
system = require("#{root}../lib/util/system")
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
      sinon.stub(env, "get").withArgs("CYPRESS_PROJECT_ID").returns("envId123")

      runMode.getProjectId("project")
      .then (ret) ->
        expect(ret).to.eq("envId123")

    it "is null when no projectId", ->
      project = {
        getProjectId: sinon.stub().rejects(new Error)
      }

      runMode.getProjectId(project)
      .then (ret) ->
        expect(ret).to.be.null

  context ".openProjectCreate", ->
    beforeEach ->
      sinon.stub(openProject, "create").resolves()

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
      sinon.stub(openProject, "emit")
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
      write = sinon.stub()

      image = {
        toJPEG: sinon.stub().returns("imgdata")
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
      sinon.spy(errors, "get")
      sinon.spy(errors, "log")

      emit = sinon.stub(@projectInstance, "emit")

      props = runMode.getElectronProps(true, @projectInstance)

      props.onCrashed()

      expect(errors.get).to.be.calledWith("RENDERER_CRASHED")
      expect(errors.log).to.be.calledOnce
      expect(emit).to.be.calledWithMatch("exitEarlyWithErr", "We detected that the Chromium Renderer process just crashed.")

  context ".launchBrowser", ->
    beforeEach ->
      @launch = sinon.stub(openProject, "launch")
      sinon.stub(runMode, "getElectronProps").returns({foo: "bar"})
      sinon.stub(runMode, "screenshotMetadata").returns({a: "a"})

    it "can launch electron", ->
      screenshots = []

      spec = {
        absolute: "/path/to/spec"
      }

      browser = { name: "electron", isHeaded: false }

      runMode.launchBrowser({
        spec
        browser
        project: @projectInstance
        write: "write"
        screenshots: screenshots
      })

      expect(runMode.getElectronProps).to.be.calledWith(false, @projectInstance, "write")

      expect(@launch).to.be.calledWithMatch(browser, spec, { foo: "bar" })

      browserOpts = @launch.firstCall.args[2]

      onAfterResponse = browserOpts.automationMiddleware.onAfterResponse

      expect(onAfterResponse).to.be.a("function")

      onAfterResponse("take:screenshot", {}, {})
      onAfterResponse("get:cookies")

      expect(screenshots).to.deep.eq([{a: "a"}])

    it "can launch chrome", ->
      spec = {
        absolute: "/path/to/spec"
      }

      browser = { name: "chrome", isHeaded: true }

      runMode.launchBrowser({
        spec
        browser
      })

      expect(runMode.getElectronProps).not.to.be.called

      expect(@launch).to.be.calledWithMatch(browser, spec, {})

  context ".postProcessRecording", ->
    beforeEach ->
      sinon.stub(videoCapture, "process").resolves()

    it "calls video process with name, cname and videoCompression", ->
      end = -> Promise.resolve()

      runMode.postProcessRecording(end, "foo", "foo-compress", 32, true)
      .then ->
        expect(videoCapture.process).to.be.calledWith("foo", "foo-compress", 32)

    it "does not call video process when videoCompression is false", ->
      end = -> Promise.resolve()

      runMode.postProcessRecording(end, "foo", "foo-compress", false, true)
      .then ->
        expect(videoCapture.process).not.to.be.called

    it "calls video process if we have been told to upload videos", ->
      end = -> Promise.resolve()

      runMode.postProcessRecording(end, "foo", "foo-compress", 32, true)
      .then ->
        expect(videoCapture.process).to.be.calledWith("foo", "foo-compress", 32)

    it "does not call video process if there are no failing tests and we have set not to upload video on passing", ->
      end = -> Promise.resolve()

      runMode.postProcessRecording(end, "foo", "foo-compress", 32, false)
      .then ->
        expect(videoCapture.process).not.to.be.called

  context ".waitForBrowserToConnect", ->
    it "throws TESTS_DID_NOT_START_FAILED after 3 connection attempts", ->
      sinon.spy(errors, "warning")
      sinon.spy(errors, "get")
      sinon.spy(openProject, "closeBrowser")
      sinon.stub(runMode, "launchBrowser").resolves()
      sinon.stub(runMode, "waitForSocketConnection").callsFake ->
        Promise.delay(1000)

      emit = sinon.stub(@projectInstance, "emit")

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
      @projectStub = sinon.stub({
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
      sinon.stub(@projectInstance, "getConfig").resolves({})

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

      sinon.stub(Reporter, "setVideoTimestamp")
      .withArgs(started, results.tests)
      .returns([1,2,3])

      sinon.stub(runMode, "postProcessRecording").resolves()
      sinon.spy(runMode,  "displayResults")
      sinon.spy(runMode,  "displayScreenshots")

      process.nextTick =>
        @projectInstance.emit("end", results)

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
        spec: {
          path: "cypress/integration/spec.js"
        }
      })
      .then (obj) ->
        expect(runMode.postProcessRecording).to.be.calledWith(end, "foo.mp4", "foo-compressed.mp4", 32, true)

        expect(runMode.displayResults).to.be.calledWith(results)
        expect(runMode.displayScreenshots).to.be.calledWith(screenshots)

        expect(obj).to.deep.eq({
          screenshots
          video: "foo.mp4"
          error: null
          hooks: null
          reporterStats: null
          shouldUploadVideo: true
          tests: [1,2,3]
          spec: {
            path: "cypress/integration/spec.js"
          }
          stats: {
            tests:        1
            passes:       2
            failures:     3
            pending:      4
            duration:     5
          }
        })

    it "exitEarlyWithErr event resolves with no tests, and error", ->
      clock = sinon.useFakeTimers()

      err = new Error("foo")
      started = new Date
      wallClock = new Date()
      screenshots = [{}, {}, {}]
      end = ->

      sinon.stub(runMode, "postProcessRecording").resolves()
      sinon.spy(runMode,  "displayResults")
      sinon.spy(runMode,  "displayScreenshots")

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
        spec: {
          path: "cypress/integration/spec.js"
        }
      })
      .then (obj) ->
        expect(runMode.postProcessRecording).to.be.calledWith(end, "foo.mp4", "foo-compressed.mp4", 32, true)

        expect(runMode.displayResults).to.be.calledWith(obj)
        expect(runMode.displayScreenshots).to.be.calledWith(screenshots)

        expect(obj).to.deep.eq({
          screenshots
          error: err.message
          video: "foo.mp4"
          hooks: null
          tests: null
          reporterStats: null
          shouldUploadVideo: true
          spec: {
            path: "cypress/integration/spec.js"
          }
          stats: {
            failures: 1
            tests: 0
            passes: 0
            pending: 0
            suites: 0
            skipped: 0
            wallClockDuration: 0
            wallClockStartedAt: wallClock.toJSON()
            wallClockEndedAt: wallClock.toJSON()
          }
        })

    it "should not upload video when videoUploadOnPasses is false and no failures", ->
      process.nextTick =>
        @projectInstance.emit("end", {
          stats: {
            failures: 0
          }
        })

      sinon.spy(runMode, "postProcessRecording")
      sinon.spy(videoCapture, "process")
      end = sinon.stub().resolves()

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

        expect(videoCapture.process).not.to.be.called

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
      sinon.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      sinon.stub(user, "ensureAuthToken")
      sinon.stub(Project, "ensureExists").resolves()
      sinon.stub(random, "id").returns(1234)
      sinon.stub(openProject, "create").resolves(openProject)
      sinon.stub(runMode, "waitForSocketConnection").resolves()
      sinon.stub(runMode, "waitForTestsToFinishRunning").resolves({
        stats: { failures: 10 }
        spec: {}
      })
      sinon.spy(runMode,  "waitForBrowserToConnect")
      sinon.stub(videoCapture, "start").resolves()
      sinon.stub(openProject, "launch").resolves()
      sinon.stub(openProject, "getProject").resolves(@projectInstance)
      sinon.spy(errors, "warning")
      sinon.stub(config, "get").resolves({
        proxyUrl: "http://localhost:12345",
        video: true,
        videosFolder: "videos",
        integrationFolder: "/path/to/integrationFolder"
      })
      sinon.stub(specsUtil, "find").resolves([
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
        expect(videoCapture.start).to.be.calledWith("videos/foo_spec.js.mp4")
        expect(runMode.waitForTestsToFinishRunning).to.be.calledWithMatch({
          cname: "videos/foo_spec.js-compressed.mp4"
        })

  context ".run", ->
    beforeEach ->
      sinon.stub(@projectInstance, "getConfig").resolves({
        proxyUrl: "http://localhost:12345"
      })
      sinon.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      sinon.stub(user, "ensureAuthToken")
      sinon.stub(Project, "ensureExists").resolves()
      sinon.stub(random, "id").returns(1234)
      sinon.stub(openProject, "create").resolves(openProject)
      sinon.stub(system, "info").resolves({ osName: "osFoo", osVersion: "fooVersion" })
      sinon.stub(browsers, "ensureAndGetByName").resolves({
        name: "fooBrowser",
        path: "path/to/browser"
        version: "777"
      })
      sinon.stub(runMode, "waitForSocketConnection").resolves()
      sinon.stub(runMode, "waitForTestsToFinishRunning").resolves({
        stats: { failures: 10 }
        spec: {}
      })
      sinon.spy(runMode,  "waitForBrowserToConnect")
      sinon.spy(runMode,  "runSpecs")
      sinon.stub(openProject, "launch").resolves()
      sinon.stub(openProject, "getProject").resolves(@projectInstance)
      sinon.stub(specsUtil, "find").resolves([
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

    it "resolves with object and totalFailed", ->
      runMode.run()
      .then (results) ->
        expect(results).to.have.property("totalFailed", 10)

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
      browser = { name: "electron" }

      browsers.ensureAndGetByName.resolves(browser)

      runMode.run({ headed: true })
      .then ->
        expect(openProject.launch).to.be.calledWithMatch(
          browser,
          {
            name: "foo_spec.js"
            path: "cypress/integration/foo_spec.js"
            absolute: "/path/to/spec.js"
          },
          {
            show: true
          }
        )

    it "passes sys to runSpecs", ->
      runMode.run()
      .then ->
        expect(runMode.runSpecs).to.be.calledWithMatch({
          sys: {
            osName: "osFoo"
            osVersion: "fooVersion"
          }
        })

    it "passes browser to runSpecs", ->
      runMode.run()
      .then ->
        expect(runMode.runSpecs).to.be.calledWithMatch({
          browser: {
            name: "fooBrowser",
            path: "path/to/browser"
            version: "777"
          }
        })
