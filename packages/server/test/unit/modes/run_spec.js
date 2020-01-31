require('../../spec_helper')

const Promise = require('bluebird')
const electron = require('electron')
const user = require(`${root}../lib/user`)
const errors = require(`${root}../lib/errors`)
const config = require(`${root}../lib/config`)
const Project = require(`${root}../lib/project`)
const browsers = require(`${root}../lib/browsers`)
const Reporter = require(`${root}../lib/reporter`)
const runMode = require(`${root}../lib/modes/run`)
const openProject = require(`${root}../lib/open_project`)
const videoCapture = require(`${root}../lib/video_capture`)
const env = require(`${root}../lib/util/env`)
const random = require(`${root}../lib/util/random`)
const system = require(`${root}../lib/util/system`)
const specsUtil = require(`${root}../lib/util/specs`)

describe('lib/modes/run', () => {
  beforeEach(function () {
    this.projectInstance = new Project('/_test-output/path/to/project')
  })

  context('.getProjectId', () => {
    it('resolves if id', () => {
      return runMode.getProjectId('project', 'id123')
      .then((ret) => {
        expect(ret).to.eq('id123')
      })
    })

    it('resolves if CYPRESS_PROJECT_ID set', () => {
      sinon.stub(env, 'get').withArgs('CYPRESS_PROJECT_ID').returns('envId123')

      return runMode.getProjectId('project')
      .then((ret) => {
        expect(ret).to.eq('envId123')
      })
    })

    it('is null when no projectId', () => {
      const project = {
        getProjectId: sinon.stub().rejects(new Error),
      }

      return runMode.getProjectId(project)
      .then((ret) => {
        expect(ret).to.be.null
      })
    })
  })

  context('.openProjectCreate', () => {
    beforeEach(() => {
      sinon.stub(openProject, 'create').resolves()

      const options = {
        port: 8080,
        env: { foo: 'bar' },
        isTextTerminal: true,
        projectRoot: '/_test-output/path/to/project/foo',
      }

      return runMode.openProjectCreate(options.projectRoot, 1234, options)
    })

    it('calls openProject.create with projectRoot + options', () => {
      expect(openProject.create).to.be.calledWithMatch('/_test-output/path/to/project/foo', {
        port: 8080,
        projectRoot: '/_test-output/path/to/project/foo',
        env: { foo: 'bar' },
      }, {
        morgan: false,
        socketId: 1234,
        report: true,
        isTextTerminal: true,
      })
    })

    it('emits \'exitEarlyWithErr\' with error message onError', () => {
      sinon.stub(openProject, 'emit')
      expect(openProject.create.lastCall.args[2].onError).to.be.a('function')
      openProject.create.lastCall.args[2].onError({ message: 'the message' })

      expect(openProject.emit).to.be.calledWith('exitEarlyWithErr', 'the message')
    })
  })

  context('.getElectronProps', () => {
    it('sets width and height', () => {
      const props = runMode.getElectronProps()

      expect(props.width).to.eq(1280)

      expect(props.height).to.eq(720)
    })

    it('sets show to boolean', () => {
      let props = runMode.getElectronProps(false)

      expect(props.show).to.be.false

      props = runMode.getElectronProps(true)

      expect(props.show).to.be.true
    })

    it('sets recordFrameRate and onPaint when write is true', () => {
      const write = sinon.stub()

      const image = {
        toJPEG: sinon.stub().returns('imgdata'),
      }

      const props = runMode.getElectronProps(true, {}, write)

      expect(props.recordFrameRate).to.eq(20)

      props.onPaint({}, false, image)

      expect(write).to.be.calledWith('imgdata')
    })

    it('does not set recordFrameRate or onPaint when write is falsy', () => {
      const props = runMode.getElectronProps(true, {}, false)

      expect(props).not.to.have.property('recordFrameRate')

      expect(props).not.to.have.property('onPaint')
    })

    it('sets options.show = false onNewWindow callback', () => {
      const options = { show: true }

      const props = runMode.getElectronProps()

      props.onNewWindow(null, null, null, null, options)

      expect(options.show).to.eq(false)
    })

    it('emits exitEarlyWithErr when webContents crashed', function () {
      sinon.spy(errors, 'get')
      sinon.spy(errors, 'log')

      const emit = sinon.stub(this.projectInstance, 'emit')

      const props = runMode.getElectronProps(true, this.projectInstance)

      props.onCrashed()

      expect(errors.get).to.be.calledWith('RENDERER_CRASHED')
      expect(errors.log).to.be.calledOnce

      expect(emit).to.be.calledWithMatch('exitEarlyWithErr', 'We detected that the Chromium Renderer process just crashed.')
    })
  })

  context('.launchBrowser', () => {
    beforeEach(function () {
      this.launch = sinon.stub(openProject, 'launch')
      sinon.stub(runMode, 'screenshotMetadata').returns({ a: 'a' })
    })

    it('can launch electron', function () {
      const screenshots = []

      const spec = {
        absolute: '/path/to/spec',
      }

      const browser = {
        name: 'electron',
        family: 'chromium',
        isHeaded: false,
      }

      runMode.launchBrowser({
        spec,
        browser,
        project: this.projectInstance,
        writeVideoFrame: 'write',
        screenshots,
      })

      expect(this.launch).to.be.calledWithMatch(browser, spec)

      const browserOpts = this.launch.firstCall.args[2]

      const { onAfterResponse } = browserOpts.automationMiddleware

      expect(onAfterResponse).to.be.a('function')

      onAfterResponse('take:screenshot', {}, {})
      onAfterResponse('get:cookies')

      expect(screenshots).to.deep.eq([{ a: 'a' }])
    })

    it('can launch chrome', function () {
      const spec = {
        absolute: '/path/to/spec',
      }

      const browser = {
        name: 'chrome',
        family: 'chromium',
        isHeaded: true,
      }

      runMode.launchBrowser({
        spec,
        browser,
      })

      expect(this.launch).to.be.calledWithMatch(browser, spec, {})
    })
  })

  context('.postProcessRecording', () => {
    beforeEach(() => {
      sinon.stub(videoCapture, 'process').resolves()
    })

    it('calls video process with name, cname and videoCompression', () => {
      const endVideoCapture = () => {
        return Promise.resolve()
      }

      return runMode.postProcessRecording(endVideoCapture, 'foo', 'foo-compress', 32, true)
      .then(() => {
        expect(videoCapture.process).to.be.calledWith('foo', 'foo-compress', 32)
      })
    })

    it('does not call video process when videoCompression is false', () => {
      const endVideoCapture = () => {
        return Promise.resolve()
      }

      return runMode.postProcessRecording(endVideoCapture, 'foo', 'foo-compress', false, true)
      .then(() => {
        expect(videoCapture.process).not.to.be.called
      })
    })

    it('calls video process if we have been told to upload videos', () => {
      const endVideoCapture = () => {
        return Promise.resolve()
      }

      return runMode.postProcessRecording(endVideoCapture, 'foo', 'foo-compress', 32, true)
      .then(() => {
        expect(videoCapture.process).to.be.calledWith('foo', 'foo-compress', 32)
      })
    })

    it('does not call video process if there are no failing tests and we have set not to upload video on passing', () => {
      const endVideoCapture = () => {
        return Promise.resolve()
      }

      return runMode.postProcessRecording(endVideoCapture, 'foo', 'foo-compress', 32, false)
      .then(() => {
        expect(videoCapture.process).not.to.be.called
      })
    })

    it('logs a warning on failure and resolves', () => {
      sinon.stub(errors, 'warning')
      const end = sinon.stub().rejects()

      return runMode.postProcessRecording(end)
      .then(() => {
        expect(end).to.be.calledOnce

        expect(errors.warning).to.be.calledWith('VIDEO_POST_PROCESSING_FAILED')
      })
    })
  })

  context('.waitForBrowserToConnect', () => {
    it('throws TESTS_DID_NOT_START_FAILED after 3 connection attempts', function () {
      sinon.spy(errors, 'warning')
      sinon.spy(errors, 'get')
      sinon.spy(openProject, 'closeBrowser')
      sinon.stub(runMode, 'launchBrowser').resolves()
      sinon.stub(runMode, 'waitForSocketConnection').callsFake(() => {
        return Promise.delay(1000)
      })

      const emit = sinon.stub(this.projectInstance, 'emit')

      return runMode.waitForBrowserToConnect({ project: this.projectInstance, timeout: 10 })
      .then(() => {
        expect(openProject.closeBrowser).to.be.calledThrice
        expect(runMode.launchBrowser).to.be.calledThrice
        expect(errors.warning).to.be.calledWith('TESTS_DID_NOT_START_RETRYING', 'Retrying...')
        expect(errors.warning).to.be.calledWith('TESTS_DID_NOT_START_RETRYING', 'Retrying again...')
        expect(errors.get).to.be.calledWith('TESTS_DID_NOT_START_FAILED')

        expect(emit).to.be.calledWith('exitEarlyWithErr', 'The browser never connected. Something is wrong. The tests cannot run. Aborting...')
      })
    })
  })

  context('.waitForSocketConnection', () => {
    beforeEach(function () {
      this.projectStub = sinon.stub({
        on () {},
        removeListener () {},
      })
    })

    it('attaches fn to \'socket:connected\' event', function () {
      runMode.waitForSocketConnection(this.projectStub, 1234)

      expect(this.projectStub.on).to.be.calledWith('socket:connected')
    })

    it('calls removeListener if socketId matches id', function () {
      this.projectStub.on.yields(1234)

      return runMode.waitForSocketConnection(this.projectStub, 1234)
      .then(() => {
        expect(this.projectStub.removeListener).to.be.calledWith('socket:connected')
      })
    })

    describe('integration', () => {
      it('resolves undefined when socket:connected fires', function () {
        process.nextTick(() => {
          return this.projectInstance.emit('socket:connected', 1234)
        })

        return runMode.waitForSocketConnection(this.projectInstance, 1234)
        .then((ret) => {
          expect(ret).to.be.undefined
        })
      })

      it('does not resolve if socketId does not match id', function () {
        process.nextTick(() => {
          return this.projectInstance.emit('socket:connected', 12345)
        })

        return runMode
        .waitForSocketConnection(this.projectInstance, 1234)
        .timeout(50)
        .then(() => {
          throw new Error('should time out and not resolve')
        }).catch(Promise.TimeoutError, (err) => {})
      })

      it('actually removes the listener', function () {
        process.nextTick(() => {
          this.projectInstance.emit('socket:connected', 12345)
          expect(this.projectInstance.listeners('socket:connected')).to.have.length(1)
          this.projectInstance.emit('socket:connected', '1234')
          expect(this.projectInstance.listeners('socket:connected')).to.have.length(1)
          this.projectInstance.emit('socket:connected', 1234)

          expect(this.projectInstance.listeners('socket:connected')).to.have.length(0)
        })

        return runMode.waitForSocketConnection(this.projectInstance, 1234)
      })
    })
  })

  context('.waitForTestsToFinishRunning', () => {
    beforeEach(function () {
      sinon.stub(this.projectInstance, 'getConfig').resolves({})
      sinon.spy(runMode, 'getVideoRecordingDelay')
    })

    it('end event resolves with obj, displays stats, displays screenshots, sets video timestamps', function () {
      const startedVideoCapture = new Date
      const screenshots = [{}, {}, {}]
      const endVideoCapture = () => {}
      const results = {
        tests: [4, 5, 6],
        stats: {
          tests: 1,
          passes: 2,
          failures: 3,
          pending: 4,
          duration: 5,
        },
      }

      sinon.stub(Reporter, 'setVideoTimestamp')
      .withArgs(startedVideoCapture, results.tests)
      .returns([1, 2, 3])

      sinon.stub(runMode, 'postProcessRecording').resolves()
      sinon.spy(runMode, 'displayResults')
      sinon.spy(runMode, 'displayScreenshots')
      sinon.spy(Promise.prototype, 'delay')

      process.nextTick(() => {
        return this.projectInstance.emit('end', results)
      })

      return runMode.waitForTestsToFinishRunning({
        project: this.projectInstance,
        videoName: 'foo.mp4',
        compressedVideoName: 'foo-compressed.mp4',
        videoCompression: 32,
        videoUploadOnPasses: true,
        gui: false,
        screenshots,
        startedVideoCapture,
        endVideoCapture,
        spec: {
          path: 'cypress/integration/spec.js',
        },
      })
      .then((obj) => {
        // since video was recording, there was a delay to let video finish
        expect(runMode.getVideoRecordingDelay).to.have.returned(1000)
        expect(Promise.prototype.delay).to.be.calledWith(1000)
        expect(runMode.postProcessRecording).to.be.calledWith(endVideoCapture, 'foo.mp4', 'foo-compressed.mp4', 32, true)

        expect(runMode.displayResults).to.be.calledWith(results)
        expect(runMode.displayScreenshots).to.be.calledWith(screenshots)

        expect(obj).to.deep.eq({
          screenshots,
          video: 'foo.mp4',
          error: null,
          hooks: null,
          reporterStats: null,
          shouldUploadVideo: true,
          tests: [1, 2, 3],
          spec: {
            path: 'cypress/integration/spec.js',
          },
          stats: {
            tests: 1,
            passes: 2,
            failures: 3,
            pending: 4,
            duration: 5,
          },
        })
      })
    })

    it('exitEarlyWithErr event resolves with no tests, and error', function () {
      sinon.useFakeTimers({ shouldAdvanceTime: true })

      const err = new Error('foo')
      const startedVideoCapture = new Date
      const wallClock = new Date()
      const screenshots = [{}, {}, {}]
      const endVideoCapture = () => {}

      sinon.stub(runMode, 'postProcessRecording').resolves()
      sinon.spy(runMode, 'displayResults')
      sinon.spy(runMode, 'displayScreenshots')
      sinon.spy(Promise.prototype, 'delay')

      process.nextTick(() => {
        expect(this.projectInstance.listeners('exitEarlyWithErr')).to.have.length(1)
        this.projectInstance.emit('exitEarlyWithErr', err.message)

        expect(this.projectInstance.listeners('exitEarlyWithErr')).to.have.length(0)
      })

      return runMode.waitForTestsToFinishRunning({
        project: this.projectInstance,
        videoName: 'foo.mp4',
        compressedVideoName: 'foo-compressed.mp4',
        videoCompression: 32,
        videoUploadOnPasses: true,
        gui: false,
        screenshots,
        startedVideoCapture,
        endVideoCapture,
        spec: {
          path: 'cypress/integration/spec.js',
        },
      })
      .then((obj) => {
        // since video was recording, there was a delay to let video finish
        expect(runMode.getVideoRecordingDelay).to.have.returned(1000)
        expect(Promise.prototype.delay).to.be.calledWith(1000)
        expect(runMode.postProcessRecording).to.be.calledWith(endVideoCapture, 'foo.mp4', 'foo-compressed.mp4', 32, true)

        expect(runMode.displayResults).to.be.calledWith(obj)
        expect(runMode.displayScreenshots).to.be.calledWith(screenshots)

        expect(obj).to.deep.eq({
          screenshots,
          error: err.message,
          video: 'foo.mp4',
          hooks: null,
          tests: null,
          reporterStats: null,
          shouldUploadVideo: true,
          spec: {
            path: 'cypress/integration/spec.js',
          },
          stats: {
            failures: 1,
            tests: 0,
            passes: 0,
            pending: 0,
            suites: 0,
            skipped: 0,
            wallClockDuration: 0,
            wallClockStartedAt: wallClock.toJSON(),
            wallClockEndedAt: wallClock.toJSON(),
          },
        })
      })
    })

    it('should not upload video when videoUploadOnPasses is false and no failures', function () {
      process.nextTick(() => {
        return this.projectInstance.emit('end', {
          stats: {
            failures: 0,
          },
        })
      })

      sinon.spy(runMode, 'postProcessRecording')
      sinon.spy(videoCapture, 'process')
      const endVideoCapture = sinon.stub().resolves()

      return runMode.waitForTestsToFinishRunning({
        project: this.projectInstance,
        videoName: 'foo.mp4',
        compressedVideoName: 'foo-compressed.mp4',
        videoCompression: 32,
        videoUploadOnPasses: false,
        gui: false,
        endVideoCapture,
      })
      .then((obj) => {
        expect(runMode.postProcessRecording).to.be.calledWith(endVideoCapture, 'foo.mp4', 'foo-compressed.mp4', 32, false)

        expect(videoCapture.process).not.to.be.called
      })
    })

    it('does not delay when not capturing a video', () => {
      sinon.stub(runMode, 'listenForProjectEnd').resolves({})

      return runMode.waitForTestsToFinishRunning({
        startedVideoCapture: null,
      })
      .then(() => {
        expect(runMode.getVideoRecordingDelay).to.have.returned(0)
      })
    })
  })

  context('.listenForProjectEnd', () => {
    it('resolves with end event + argument', function () {
      process.nextTick(() => {
        return this.projectInstance.emit('end', { foo: 'bar' })
      })

      return runMode.listenForProjectEnd(this.projectInstance)
      .then((obj) => {
        expect(obj).to.deep.eq({
          foo: 'bar',
        })
      })
    })

    it('stops listening to end event', function () {
      process.nextTick(() => {
        expect(this.projectInstance.listeners('end')).to.have.length(1)
        this.projectInstance.emit('end', { foo: 'bar' })

        expect(this.projectInstance.listeners('end')).to.have.length(0)
      })

      return runMode.listenForProjectEnd(this.projectInstance)
    })
  })

  context('.run browser vs video recording', () => {
    beforeEach(function () {
      sinon.stub(electron.app, 'on').withArgs('ready').yieldsAsync()
      sinon.stub(user, 'ensureAuthToken')
      sinon.stub(Project, 'ensureExists').resolves()
      sinon.stub(random, 'id').returns(1234)
      sinon.stub(openProject, 'create').resolves(openProject)
      sinon.stub(runMode, 'waitForSocketConnection').resolves()
      sinon.stub(runMode, 'waitForTestsToFinishRunning').resolves({
        stats: { failures: 10 },
        spec: {},
      })

      sinon.spy(runMode, 'waitForBrowserToConnect')
      sinon.stub(videoCapture, 'start').resolves()
      sinon.stub(openProject, 'launch').resolves()
      sinon.stub(openProject, 'getProject').resolves(this.projectInstance)
      sinon.spy(errors, 'warning')
      sinon.stub(config, 'get').resolves({
        proxyUrl: 'http://localhost:12345',
        video: true,
        videosFolder: 'videos',
        integrationFolder: '/path/to/integrationFolder',
      })

      sinon.stub(specsUtil, 'find').resolves([
        {
          name: 'foo_spec.js',
          path: 'cypress/integration/foo_spec.js',
          absolute: '/path/to/spec.js',
        },
      ])
    })

    it('shows no warnings for default browser', () => {
      return runMode.run()
      .then(() => {
        expect(errors.warning).to.not.be.called
      })
    })

    it('shows no warnings for electron browser', () => {
      return runMode.run({ browser: 'electron' })
      .then(() => {
        expect(errors.warning).to.not.be.calledWith('CANNOT_RECORD_VIDEO_FOR_THIS_BROWSER')
      })
    })

    it('disables video recording on headed runs', () => {
      return runMode.run({ headed: true })
      .then(() => {
        expect(errors.warning).to.be.calledWith('CANNOT_RECORD_VIDEO_HEADED')
      })
    })

    it('throws an error if invalid browser family supplied', () => {
      const browser = { name: 'opera', family: 'opera - btw when is Opera support coming?' }

      sinon.stub(browsers, 'ensureAndGetByNameOrPath').resolves(browser)

      return expect(runMode.run({ browser: 'opera' }))
      .to.be.rejectedWith(/invalid browser family in/)
    })

    it('shows no warnings for chrome browser', () => {
      return runMode.run({ browser: 'chrome' })
      .then(() => {
        expect(errors.warning).to.not.be.called
      })
    })

    it('names video file with spec name', () => {
      return runMode.run()
      .then(() => {
        expect(videoCapture.start).to.be.calledWith('videos/foo_spec.js.mp4')

        expect(runMode.waitForTestsToFinishRunning).to.be.calledWithMatch({
          compressedVideoName: 'videos/foo_spec.js-compressed.mp4',
        })
      })
    })
  })

  context('.run', () => {
    beforeEach(function () {
      sinon.stub(this.projectInstance, 'getConfig').resolves({
        proxyUrl: 'http://localhost:12345',
      })

      sinon.stub(electron.app, 'on').withArgs('ready').yieldsAsync()
      sinon.stub(user, 'ensureAuthToken')
      sinon.stub(Project, 'ensureExists').resolves()
      sinon.stub(random, 'id').returns(1234)
      sinon.stub(openProject, 'create').resolves(openProject)
      sinon.stub(system, 'info').resolves({ osName: 'osFoo', osVersion: 'fooVersion' })
      sinon.stub(browsers, 'ensureAndGetByNameOrPath').resolves({
        name: 'fooBrowser',
        path: 'path/to/browser',
        version: '777',
        family: 'chromium',
      })

      sinon.stub(runMode, 'waitForSocketConnection').resolves()
      sinon.stub(runMode, 'waitForTestsToFinishRunning').resolves({
        stats: { failures: 10 },
        spec: {},
      })

      sinon.spy(runMode, 'waitForBrowserToConnect')
      sinon.spy(runMode, 'runSpecs')
      sinon.stub(openProject, 'launch').resolves()
      sinon.stub(openProject, 'getProject').resolves(this.projectInstance)
      sinon.stub(specsUtil, 'find').resolves([
        {
          name: 'foo_spec.js',
          path: 'cypress/integration/foo_spec.js',
          absolute: '/path/to/spec.js',
        },
      ])
    })

    it('no longer ensures user session', () => {
      return runMode.run()
      .then(() => {
        expect(user.ensureAuthToken).not.to.be.called
      })
    })

    it('resolves with object and totalFailed', () => {
      return runMode.run()
      .then((results) => {
        expect(results).to.have.property('totalFailed', 10)
      })
    })

    it('passes projectRoot + options to openProject', () => {
      const opts = { projectRoot: '/path/to/project', foo: 'bar' }

      return runMode.run(opts)
      .then(() => {
        expect(openProject.create).to.be.calledWithMatch(opts.projectRoot, opts)
      })
    })

    it('passes project + id to waitForBrowserToConnect', function () {
      return runMode.run()
      .then(() => {
        expect(runMode.waitForBrowserToConnect).to.be.calledWithMatch({
          project: this.projectInstance,
          socketId: 1234,
        })
      })
    })

    it('passes project to waitForTestsToFinishRunning', function () {
      return runMode.run()
      .then(() => {
        expect(runMode.waitForTestsToFinishRunning).to.be.calledWithMatch({
          project: this.projectInstance,
        })
      })
    })

    it('passes headed to openProject.launch', () => {
      const browser = { name: 'electron', family: 'chromium' }

      browsers.ensureAndGetByNameOrPath.resolves(browser)

      return runMode.run({ headed: true })
      .then(() => {
        expect(openProject.launch).to.be.calledWithMatch(
          browser,
          {
            name: 'foo_spec.js',
            path: 'cypress/integration/foo_spec.js',
            absolute: '/path/to/spec.js',
          },
          {
            show: true,
          }
        )
      })
    })

    it('passes sys to runSpecs', () => {
      return runMode.run()
      .then(() => {
        expect(runMode.runSpecs).to.be.calledWithMatch({
          sys: {
            osName: 'osFoo',
            osVersion: 'fooVersion',
          },
        })
      })
    })

    it('passes browser to runSpecs', () => {
      return runMode.run()
      .then(() => {
        expect(runMode.runSpecs).to.be.calledWithMatch({
          browser: {
            name: 'fooBrowser',
            path: 'path/to/browser',
            version: '777',
          },
        })
      })
    })
  })
})
