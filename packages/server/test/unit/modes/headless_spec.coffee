require("../../spec_helper")

random   = require("randomstring")
Promise  = require("bluebird")
electron = require("electron")
user     = require("#{root}../lib/user")
video    = require("#{root}../lib/video")
errors   = require("#{root}../lib/errors")
Project  = require("#{root}../lib/project")
Reporter = require("#{root}../lib/reporter")
headless = require("#{root}../lib/modes/headless")
openProject = require("#{root}../lib/open_project")

describe "lib/modes/headless", ->
  beforeEach ->
    @projectInstance = Project("/_test-output/path/to/project")

  context ".getId", ->
    it "returns random.generate string", ->
      @sandbox.spy(random, "generate")

      id = headless.getId()
      expect(id.length).to.eq(5)

      expect(random.generate).to.be.calledWith({
        length: 5
        capitalization: "lowercase"
      })

  context ".openProject", ->
    beforeEach ->
      @sandbox.stub(openProject, "create").resolves()

      options = {
        port: 8080
        environmentVariables: {foo: "bar"}
        projectPath: "/_test-output/path/to/project/foo"
      }

      headless.openProject(1234, options)

    it "calls openProject.create with projectPath + options", ->
      expect(openProject.create).to.be.calledWithMatch("/_test-output/path/to/project/foo", {
        port: 8080
        projectPath: "/_test-output/path/to/project/foo"
        environmentVariables: {foo: "bar"}
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
      props = headless.getElectronProps()

      expect(props.width).to.eq(1280)
      expect(props.height).to.eq(720)

    it "sets show to boolean", ->
      props = headless.getElectronProps(false)
      expect(props.show).to.be.false

      props = headless.getElectronProps(true)
      expect(props.show).to.be.true

    it "sets recordFrameRate and onPaint when write is true", ->
      write = @sandbox.stub()

      image = {
        toJPEG: @sandbox.stub().returns("imgdata")
      }

      props = headless.getElectronProps(true, {}, write)

      expect(props.recordFrameRate).to.eq(20)

      props.onPaint({}, false, image)

      expect(write).to.be.calledWith("imgdata")

    it "does not set recordFrameRate or onPaint when write is falsy", ->
      props = headless.getElectronProps(true, {}, false)

      expect(props).not.to.have.property("recordFrameRate")
      expect(props).not.to.have.property("onPaint")

    it "sets options.show = false onNewWindow callback", ->
      options = {show: true}

      props = headless.getElectronProps()
      props.onNewWindow(null, null, null, null, options)

      expect(options.show).to.eq(false)

    it "emits exitEarlyWithErr when webContents crashed", ->
      @sandbox.spy(errors, "get")
      @sandbox.spy(errors, "log")

      emit = @sandbox.stub(@projectInstance, "emit")

      props = headless.getElectronProps(true, @projectInstance)

      props.onCrashed()

      expect(errors.get).to.be.calledWith("RENDERER_CRASHED")
      expect(errors.log).to.be.calledOnce
      expect(emit).to.be.calledWithMatch("exitEarlyWithErr", "We detected that the Chromium Renderer process just crashed.")

  context ".launchBrowser", ->
    beforeEach ->
      @launch = @sandbox.stub(openProject, "launch")

      @sandbox.stub(headless, "getElectronProps").returns({foo: "bar"})

      @sandbox.stub(headless, "screenshotMetadata").returns({a: "a"})

    it "gets electron props by default", ->
      screenshots = []

      headless.launchBrowser({
        browser: undefined
        spec: null
        project: @projectInstance
        write: "write"
        gui: null
        screenshots: screenshots
      })

      expect(headless.getElectronProps).to.be.calledWith(false, @projectInstance, "write")

      expect(@launch).to.be.calledWithMatch("electron", null, {foo: "bar"})

      browserOpts = @launch.firstCall.args[2]

      onAfterResponse = browserOpts.automationMiddleware.onAfterResponse

      expect(onAfterResponse).to.be.a("function")

      onAfterResponse("take:screenshot")
      onAfterResponse("get:cookies")

      expect(screenshots).to.deep.eq([{a: "a"}])

    it "can launch chrome", ->
      headless.launchBrowser({
        browser: "chrome"
        spec: "spec"
      })

      expect(headless.getElectronProps).not.to.be.called

      expect(@launch).to.be.calledWithMatch("chrome", "spec", {})

  context ".postProcessRecording", ->
    beforeEach ->
      @sandbox.stub(video, "process").resolves()

    it "calls video process with name, cname and videoCompression", ->
      end = -> Promise.resolve()

      headless.postProcessRecording(end, "foo", "foo-compress", 32, true)
      .then ->
        expect(video.process).to.be.calledWith("foo", "foo-compress", 32)

    it "does not call video process when videoCompression is false", ->
      end = -> Promise.resolve()

      headless.postProcessRecording(end, "foo", "foo-compress", false, true)
      .then ->
        expect(video.process).not.to.be.called

    it "calls video process if we have been told to upload videos", ->
      end = -> Promise.resolve()

      headless.postProcessRecording(end, "foo", "foo-compress", 32, true)
      .then ->
        expect(video.process).to.be.calledWith("foo", "foo-compress", 32)

    it "does not call video process if there are no failing tests and we have set not to upload video on passing", ->
      end = -> Promise.resolve()

      headless.postProcessRecording(end, "foo", "foo-compress", 32, false)
      .then ->
        expect(video.process).not.to.be.called

  context ".waitForBrowserToConnect", ->
    it "throws TESTS_DID_NOT_START_FAILED after 3 connection attempts", ->
      @sandbox.spy(errors, "warning")
      @sandbox.spy(errors, "get")
      @sandbox.spy(openProject, "closeBrowser")
      @sandbox.stub(headless, "launchBrowser").resolves()
      @sandbox.stub(headless, "waitForSocketConnection").resolves(Promise.delay(1000))
      emit = @sandbox.stub(@projectInstance, "emit")

      headless.waitForBrowserToConnect({project: @projectInstance, timeout: 10})
      .then ->
        expect(openProject.closeBrowser).to.be.calledThrice
        expect(headless.launchBrowser).to.be.calledThrice
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

      it "does not resolve if socketId does not match id", ->
        process.nextTick =>
          @projectInstance.emit("socket:connected", 12345)

        headless
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

        headless.waitForSocketConnection(@projectInstance, 1234)

  context ".waitForTestsToFinishRunning", ->
    beforeEach ->
      @sandbox.stub(@projectInstance, "getConfig").resolves({})

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
        project: @projectInstance,
        name: "foo.mp4"
        cname: "foo-compressed.mp4"
        videoCompression: 32
        videoUploadOnPasses: true
        gui: false
        screenshots
        started
        end
      })
      .then (obj) ->
        expect(headless.postProcessRecording).to.be.calledWith(end, "foo.mp4", "foo-compressed.mp4", 32, true)

        results = headless.collectTestResults(obj)
        expect(headless.displayStats).to.be.calledWith(results)
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
          shouldUploadVideo: true
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
        project: @projectInstance,
        name: "foo.mp4"
        cname: "foo-compressed.mp4"
        videoCompression: 32
        videoUploadOnPasses: true
        gui: false
        screenshots
        started
        end
      })
      .then (obj) ->
        expect(headless.postProcessRecording).to.be.calledWith(end, "foo.mp4", "foo-compressed.mp4", 32, true)

        results = headless.collectTestResults(obj)
        expect(headless.displayStats).to.be.calledWith(results)
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
          shouldUploadVideo: true
        })

    it "should not upload video when videoUploadOnPasses is false and no failing tests", ->
      process.nextTick =>
        @projectInstance.emit("end", {
          failingTests: []
        })

      @sandbox.spy(headless, "postProcessRecording")
      @sandbox.spy(video, "process")
      end = @sandbox.stub().resolves()

      headless.waitForTestsToFinishRunning({
        project: @projectInstance,
        name: "foo.mp4"
        cname: "foo-compressed.mp4"
        videoCompression: 32
        videoUploadOnPasses: false
        gui: false
        end
      })
      .then (obj) ->
        expect(headless.postProcessRecording).to.be.calledWith(end, "foo.mp4", "foo-compressed.mp4", 32, false)

        expect(video.process).not.to.be.called

  context ".listenForProjectEnd", ->
    it "resolves with end event + argument", ->
      process.nextTick =>
        @projectInstance.emit("end", {foo: "bar"})

      headless.listenForProjectEnd(@projectInstance)
      .then (obj) ->
        expect(obj).to.deep.eq({
          foo: "bar"
        })

    it "stops listening to end event", ->
      process.nextTick =>
        expect(@projectInstance.listeners("end")).to.have.length(1)
        @projectInstance.emit("end", {foo: "bar"})
        expect(@projectInstance.listeners("end")).to.have.length(0)

      headless.listenForProjectEnd(@projectInstance)

  context ".run browser vs video recording", ->
    beforeEach ->
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      @sandbox.stub(user, "ensureAuthToken")
      @sandbox.stub(Project, "ensureExists").resolves()
      @sandbox.stub(headless, "getId").returns(1234)
      @sandbox.stub(headless, "openProject").resolves(openProject)
      @sandbox.stub(headless, "waitForSocketConnection").resolves()
      @sandbox.stub(headless, "waitForTestsToFinishRunning").resolves({failures: 10})
      @sandbox.spy(headless,  "waitForBrowserToConnect")
      @sandbox.stub(openProject, "launch").resolves()
      @sandbox.stub(openProject, "getProject").resolves(@projectInstance)
      @sandbox.spy(errors, "warning")
      @sandbox.stub(@projectInstance, "getConfig").resolves({
        proxyUrl: "http://localhost:12345",
        videoRecording: true,
        videosFolder: "videos"
      })

    it "shows no warnings for default browser", ->
      headless.run()
      .then ->
        expect(errors.warning).to.not.be.called

    it "shows no warnings for electron browser", ->
      headless.run({browser: "electron"})
      .then ->
        expect(errors.warning).to.not.be.calledWith("CANNOT_RECORD_VIDEO_FOR_THIS_BROWSER")

    it "disables video recording on headed runs", ->
      headless.run({headed: true})
      .then ->
        expect(errors.warning).to.be.calledWith("CANNOT_RECORD_VIDEO_HEADED")

    it "disables video recording for non-electron browser", ->
      headless.run({browser: "chrome"})
      .then ->
        expect(errors.warning).to.be.calledWith("CANNOT_RECORD_VIDEO_FOR_THIS_BROWSER")

  context ".run", ->
    beforeEach ->
      @sandbox.stub(@projectInstance, "getConfig").resolves({proxyUrl: "http://localhost:12345"})
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()
      @sandbox.stub(user, "ensureAuthToken")
      @sandbox.stub(Project, "ensureExists").resolves()
      @sandbox.stub(headless, "getId").returns(1234)
      @sandbox.stub(headless, "openProject").resolves(openProject)
      @sandbox.stub(headless, "waitForSocketConnection").resolves()
      @sandbox.stub(headless, "waitForTestsToFinishRunning").resolves({failures: 10})
      @sandbox.spy(headless,  "waitForBrowserToConnect")
      @sandbox.stub(openProject, "launch").resolves()
      @sandbox.stub(openProject, "getProject").resolves(@projectInstance)

    it "no longer ensures user session", ->
      headless.run()
      .then ->
        expect(user.ensureAuthToken).not.to.be.called

    it "returns stats", ->
      headless.run()
      .then (stats) ->
        expect(stats).to.deep.eq({failures: 10})

    it "passes id + options to openProject", ->
      headless.run({foo: "bar"})
      .then ->
        expect(headless.openProject).to.be.calledWithMatch(1234, {foo: "bar"})

    it "passes project + id to waitForBrowserToConnect", ->
      headless.run()
      .then =>
        expect(headless.waitForBrowserToConnect).to.be.calledWithMatch({
          project: @projectInstance
          id: 1234
        })

    it "passes project to waitForTestsToFinishRunning", ->
      headless.run()
      .then =>
        expect(headless.waitForTestsToFinishRunning).to.be.calledWithMatch({
          project: @projectInstance
        })

    it "passes headed to openProject.launch", ->
      headless.run({headed: true})
      .then ->
        expect(openProject.launch).to.be.calledWithMatch("electron", undefined, {show: true})
