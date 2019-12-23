/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../../spec_helper");

const Promise  = require("bluebird");
const electron = require("electron");
const user     = require(`${root}../lib/user`);
const errors   = require(`${root}../lib/errors`);
const config   = require(`${root}../lib/config`);
const Project  = require(`${root}../lib/project`);
const browsers   = require(`${root}../lib/browsers`);
const Reporter = require(`${root}../lib/reporter`);
const runMode = require(`${root}../lib/modes/run`);
const openProject = require(`${root}../lib/open_project`);
const videoCapture = require(`${root}../lib/video_capture`);
const env = require(`${root}../lib/util/env`);
const random = require(`${root}../lib/util/random`);
const system = require(`${root}../lib/util/system`);
const specsUtil = require(`${root}../lib/util/specs`);

describe("lib/modes/run", function() {
  beforeEach(function() {
    return this.projectInstance = new Project("/_test-output/path/to/project");
  });

  context(".getProjectId", function() {
    it("resolves if id", () =>
      runMode.getProjectId("project", "id123")
      .then(ret => expect(ret).to.eq("id123"))
    );

    it("resolves if CYPRESS_PROJECT_ID set", function() {
      sinon.stub(env, "get").withArgs("CYPRESS_PROJECT_ID").returns("envId123");

      return runMode.getProjectId("project")
      .then(ret => expect(ret).to.eq("envId123"));
    });

    return it("is null when no projectId", function() {
      const project = {
        getProjectId: sinon.stub().rejects(new Error)
      };

      return runMode.getProjectId(project)
      .then(ret => expect(ret).to.be.null);
    });
  });

  context(".openProjectCreate", function() {
    beforeEach(function() {
      sinon.stub(openProject, "create").resolves();

      const options = {
        port: 8080,
        env: {foo: "bar"},
        isTextTerminal: true,
        projectRoot: "/_test-output/path/to/project/foo"
      };

      return runMode.openProjectCreate(options.projectRoot, 1234, options);
    });

    it("calls openProject.create with projectRoot + options", () =>
      expect(openProject.create).to.be.calledWithMatch("/_test-output/path/to/project/foo", {
        port: 8080,
        projectRoot: "/_test-output/path/to/project/foo",
        env: {foo: "bar"}
      }, {
        morgan: false,
        socketId: 1234,
        report: true,
        isTextTerminal: true
      })
    );

    return it("emits 'exitEarlyWithErr' with error message onError", function() {
      sinon.stub(openProject, "emit");
      expect(openProject.create.lastCall.args[2].onError).to.be.a("function");
      openProject.create.lastCall.args[2].onError({ message: "the message" });
      return expect(openProject.emit).to.be.calledWith("exitEarlyWithErr", "the message");
    });
  });

  context(".getElectronProps", function() {
    it("sets width and height", function() {
      const props = runMode.getElectronProps();

      expect(props.width).to.eq(1280);
      return expect(props.height).to.eq(720);
    });

    it("sets show to boolean", function() {
      let props = runMode.getElectronProps(false);
      expect(props.show).to.be.false;

      props = runMode.getElectronProps(true);
      return expect(props.show).to.be.true;
    });

    it("sets recordFrameRate and onPaint when write is true", function() {
      const write = sinon.stub();

      const image = {
        toJPEG: sinon.stub().returns("imgdata")
      };

      const props = runMode.getElectronProps(true, {}, write);

      expect(props.recordFrameRate).to.eq(20);

      props.onPaint({}, false, image);

      return expect(write).to.be.calledWith("imgdata");
    });

    it("does not set recordFrameRate or onPaint when write is falsy", function() {
      const props = runMode.getElectronProps(true, {}, false);

      expect(props).not.to.have.property("recordFrameRate");
      return expect(props).not.to.have.property("onPaint");
    });

    it("sets options.show = false onNewWindow callback", function() {
      const options = {show: true};

      const props = runMode.getElectronProps();
      props.onNewWindow(null, null, null, null, options);

      return expect(options.show).to.eq(false);
    });

    return it("emits exitEarlyWithErr when webContents crashed", function() {
      sinon.spy(errors, "get");
      sinon.spy(errors, "log");

      const emit = sinon.stub(this.projectInstance, "emit");

      const props = runMode.getElectronProps(true, this.projectInstance);

      props.onCrashed();

      expect(errors.get).to.be.calledWith("RENDERER_CRASHED");
      expect(errors.log).to.be.calledOnce;
      return expect(emit).to.be.calledWithMatch("exitEarlyWithErr", "We detected that the Chromium Renderer process just crashed.");
    });
  });

  context(".launchBrowser", function() {
    beforeEach(function() {
      this.launch = sinon.stub(openProject, "launch");
      return sinon.stub(runMode, "screenshotMetadata").returns({a: "a"});
    });

    it("can launch electron", function() {
      const screenshots = [];

      const spec = {
        absolute: "/path/to/spec"
      };

      const browser = {
        name: "electron",
        family: "electron",
        isHeaded: false
      };

      runMode.launchBrowser({
        spec,
        browser,
        project: this.projectInstance,
        writeVideoFrame: "write",
        screenshots
      });

      expect(this.launch).to.be.calledWithMatch(browser, spec);

      const browserOpts = this.launch.firstCall.args[2];

      const { onAfterResponse } = browserOpts.automationMiddleware;

      expect(onAfterResponse).to.be.a("function");

      onAfterResponse("take:screenshot", {}, {});
      onAfterResponse("get:cookies");

      return expect(screenshots).to.deep.eq([{a: "a"}]);
    });

    return it("can launch chrome", function() {
      const spec = {
        absolute: "/path/to/spec"
      };

      const browser = {
        name: "chrome",
        family: "chrome",
        isHeaded: true
      };

      runMode.launchBrowser({
        spec,
        browser
      });

      return expect(this.launch).to.be.calledWithMatch(browser, spec, {});
    });
  });

  context(".postProcessRecording", function() {
    beforeEach(() => sinon.stub(videoCapture, "process").resolves());

    it("calls video process with name, cname and videoCompression", function() {
      const endVideoCapture = () => Promise.resolve();

      return runMode.postProcessRecording(endVideoCapture, "foo", "foo-compress", 32, true)
      .then(() => expect(videoCapture.process).to.be.calledWith("foo", "foo-compress", 32));
    });

    it("does not call video process when videoCompression is false", function() {
      const endVideoCapture = () => Promise.resolve();

      return runMode.postProcessRecording(endVideoCapture, "foo", "foo-compress", false, true)
      .then(() => expect(videoCapture.process).not.to.be.called);
    });

    it("calls video process if we have been told to upload videos", function() {
      const endVideoCapture = () => Promise.resolve();

      return runMode.postProcessRecording(endVideoCapture, "foo", "foo-compress", 32, true)
      .then(() => expect(videoCapture.process).to.be.calledWith("foo", "foo-compress", 32));
    });

    it("does not call video process if there are no failing tests and we have set not to upload video on passing", function() {
      const endVideoCapture = () => Promise.resolve();

      return runMode.postProcessRecording(endVideoCapture, "foo", "foo-compress", 32, false)
      .then(() => expect(videoCapture.process).not.to.be.called);
    });

    return it("logs a warning on failure and resolves", function() {
      sinon.stub(errors, 'warning');
      const end = sinon.stub().rejects();

      return runMode.postProcessRecording(end)
      .then(function() {
        expect(end).to.be.calledOnce;
        return expect(errors.warning).to.be.calledWith('VIDEO_POST_PROCESSING_FAILED');
      });
    });
  });

  context(".waitForBrowserToConnect", () =>
    it("throws TESTS_DID_NOT_START_FAILED after 3 connection attempts", function() {
      sinon.spy(errors, "warning");
      sinon.spy(errors, "get");
      sinon.spy(openProject, "closeBrowser");
      sinon.stub(runMode, "launchBrowser").resolves();
      sinon.stub(runMode, "waitForSocketConnection").callsFake(() => Promise.delay(1000));

      const emit = sinon.stub(this.projectInstance, "emit");

      return runMode.waitForBrowserToConnect({project: this.projectInstance, timeout: 10})
      .then(function() {
        expect(openProject.closeBrowser).to.be.calledThrice;
        expect(runMode.launchBrowser).to.be.calledThrice;
        expect(errors.warning).to.be.calledWith("TESTS_DID_NOT_START_RETRYING", "Retrying...");
        expect(errors.warning).to.be.calledWith("TESTS_DID_NOT_START_RETRYING", "Retrying again...");
        expect(errors.get).to.be.calledWith("TESTS_DID_NOT_START_FAILED");
        return expect(emit).to.be.calledWith("exitEarlyWithErr", "The browser never connected. Something is wrong. The tests cannot run. Aborting...");
      });
    })
  );

  context(".waitForSocketConnection", function() {
    beforeEach(function() {
      return this.projectStub = sinon.stub({
        on() {},
        removeListener() {}
      });
    });

    it("attaches fn to 'socket:connected' event", function() {
      runMode.waitForSocketConnection(this.projectStub, 1234);
      return expect(this.projectStub.on).to.be.calledWith("socket:connected");
    });

    it("calls removeListener if socketId matches id", function() {
      this.projectStub.on.yields(1234);

      return runMode.waitForSocketConnection(this.projectStub, 1234)
      .then(() => {
        return expect(this.projectStub.removeListener).to.be.calledWith("socket:connected");
      });
    });

    return describe("integration", function() {
      it("resolves undefined when socket:connected fires", function() {
        process.nextTick(() => {
          return this.projectInstance.emit("socket:connected", 1234);
        });

        return runMode.waitForSocketConnection(this.projectInstance, 1234)
        .then(ret => expect(ret).to.be.undefined);
      });

      it("does not resolve if socketId does not match id", function() {
        process.nextTick(() => {
          return this.projectInstance.emit("socket:connected", 12345);
        });

        return runMode
        .waitForSocketConnection(this.projectInstance, 1234)
        .timeout(50)
        .then(function() {
          throw new Error("should time out and not resolve");}).catch(Promise.TimeoutError, function(err) {});
      });

      return it("actually removes the listener", function() {
        process.nextTick(() => {
          this.projectInstance.emit("socket:connected", 12345);
          expect(this.projectInstance.listeners("socket:connected")).to.have.length(1);
          this.projectInstance.emit("socket:connected", "1234");
          expect(this.projectInstance.listeners("socket:connected")).to.have.length(1);
          this.projectInstance.emit("socket:connected", 1234);
          return expect(this.projectInstance.listeners("socket:connected")).to.have.length(0);
        });

        return runMode.waitForSocketConnection(this.projectInstance, 1234);
      });
    });
  });

  context(".waitForTestsToFinishRunning", function() {
    beforeEach(function() {
      sinon.stub(this.projectInstance, "getConfig").resolves({});
      return sinon.spy(runMode, "getVideoRecordingDelay");
    });

    it("end event resolves with obj, displays stats, displays screenshots, sets video timestamps", function() {
      const startedVideoCapture = new Date;
      const screenshots = [{}, {}, {}];
      const cfg = {};
      const endVideoCapture = function() {};
      const results = {
        tests: [4,5,6],
        stats: {
          tests: 1,
          passes: 2,
          failures: 3,
          pending: 4,
          duration: 5
        }
      };

      sinon.stub(Reporter, "setVideoTimestamp")
      .withArgs(startedVideoCapture, results.tests)
      .returns([1,2,3]);

      sinon.stub(runMode, "postProcessRecording").resolves();
      sinon.spy(runMode,  "displayResults");
      sinon.spy(runMode,  "displayScreenshots");
      sinon.spy(Promise.prototype, "delay");

      process.nextTick(() => {
        return this.projectInstance.emit("end", results);
      });

      return runMode.waitForTestsToFinishRunning({
        project: this.projectInstance,
        videoName: "foo.mp4",
        compressedVideoName: "foo-compressed.mp4",
        videoCompression: 32,
        videoUploadOnPasses: true,
        gui: false,
        screenshots,
        startedVideoCapture,
        endVideoCapture,
        spec: {
          path: "cypress/integration/spec.js"
        }
      })
      .then(function(obj) {
        //# since video was recording, there was a delay to let video finish
        expect(runMode.getVideoRecordingDelay).to.have.returned(1000);
        expect(Promise.prototype.delay).to.be.calledWith(1000);
        expect(runMode.postProcessRecording).to.be.calledWith(endVideoCapture, "foo.mp4", "foo-compressed.mp4", 32, true);

        expect(runMode.displayResults).to.be.calledWith(results);
        expect(runMode.displayScreenshots).to.be.calledWith(screenshots);

        return expect(obj).to.deep.eq({
          screenshots,
          video: "foo.mp4",
          error: null,
          hooks: null,
          reporterStats: null,
          shouldUploadVideo: true,
          tests: [1,2,3],
          spec: {
            path: "cypress/integration/spec.js"
          },
          stats: {
            tests:        1,
            passes:       2,
            failures:     3,
            pending:      4,
            duration:     5
          }
        });
      });
    });

    it("exitEarlyWithErr event resolves with no tests, and error", function() {
      sinon.useFakeTimers({ shouldAdvanceTime: true });

      const err = new Error("foo");
      const startedVideoCapture = new Date;
      const wallClock = new Date();
      const screenshots = [{}, {}, {}];
      const endVideoCapture = function() {};

      sinon.stub(runMode, "postProcessRecording").resolves();
      sinon.spy(runMode,  "displayResults");
      sinon.spy(runMode,  "displayScreenshots");
      sinon.spy(Promise.prototype, "delay");

      process.nextTick(() => {
        expect(this.projectInstance.listeners("exitEarlyWithErr")).to.have.length(1);
        this.projectInstance.emit("exitEarlyWithErr", err.message);
        return expect(this.projectInstance.listeners("exitEarlyWithErr")).to.have.length(0);
      });

      return runMode.waitForTestsToFinishRunning({
        project: this.projectInstance,
        videoName: "foo.mp4",
        compressedVideoName: "foo-compressed.mp4",
        videoCompression: 32,
        videoUploadOnPasses: true,
        gui: false,
        screenshots,
        startedVideoCapture,
        endVideoCapture,
        spec: {
          path: "cypress/integration/spec.js"
        }
      })
      .then(function(obj) {
        //# since video was recording, there was a delay to let video finish
        expect(runMode.getVideoRecordingDelay).to.have.returned(1000);
        expect(Promise.prototype.delay).to.be.calledWith(1000);
        expect(runMode.postProcessRecording).to.be.calledWith(endVideoCapture, "foo.mp4", "foo-compressed.mp4", 32, true);

        expect(runMode.displayResults).to.be.calledWith(obj);
        expect(runMode.displayScreenshots).to.be.calledWith(screenshots);

        return expect(obj).to.deep.eq({
          screenshots,
          error: err.message,
          video: "foo.mp4",
          hooks: null,
          tests: null,
          reporterStats: null,
          shouldUploadVideo: true,
          spec: {
            path: "cypress/integration/spec.js"
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
            wallClockEndedAt: wallClock.toJSON()
          }
        });
      });
    });

    it("should not upload video when videoUploadOnPasses is false and no failures", function() {
      process.nextTick(() => {
        return this.projectInstance.emit("end", {
          stats: {
            failures: 0
          }
        });
      });

      sinon.spy(runMode, "postProcessRecording");
      sinon.spy(videoCapture, "process");
      const endVideoCapture = sinon.stub().resolves();

      return runMode.waitForTestsToFinishRunning({
        project: this.projectInstance,
        videoName: "foo.mp4",
        compressedVideoName: "foo-compressed.mp4",
        videoCompression: 32,
        videoUploadOnPasses: false,
        gui: false,
        endVideoCapture
      })
      .then(function(obj) {
        expect(runMode.postProcessRecording).to.be.calledWith(endVideoCapture, "foo.mp4", "foo-compressed.mp4", 32, false);

        return expect(videoCapture.process).not.to.be.called;
      });
    });

    return it("does not delay when not capturing a video", function() {
      sinon.stub(runMode, "listenForProjectEnd").resolves({});

      return runMode.waitForTestsToFinishRunning({
        startedVideoCapture: null
      })
      .then(() => expect(runMode.getVideoRecordingDelay).to.have.returned(0));
    });
  });

  context(".listenForProjectEnd", function() {
    it("resolves with end event + argument", function() {
      process.nextTick(() => {
        return this.projectInstance.emit("end", {foo: "bar"});
      });

      return runMode.listenForProjectEnd(this.projectInstance)
      .then(obj =>
        expect(obj).to.deep.eq({
          foo: "bar"
        })
      );
    });

    return it("stops listening to end event", function() {
      process.nextTick(() => {
        expect(this.projectInstance.listeners("end")).to.have.length(1);
        this.projectInstance.emit("end", {foo: "bar"});
        return expect(this.projectInstance.listeners("end")).to.have.length(0);
      });

      return runMode.listenForProjectEnd(this.projectInstance);
    });
  });

  context(".run browser vs video recording", function() {
    beforeEach(function() {
      sinon.stub(electron.app, "on").withArgs("ready").yieldsAsync();
      sinon.stub(user, "ensureAuthToken");
      sinon.stub(Project, "ensureExists").resolves();
      sinon.stub(random, "id").returns(1234);
      sinon.stub(openProject, "create").resolves(openProject);
      sinon.stub(runMode, "waitForSocketConnection").resolves();
      sinon.stub(runMode, "waitForTestsToFinishRunning").resolves({
        stats: { failures: 10 },
        spec: {}
      });
      sinon.spy(runMode,  "waitForBrowserToConnect");
      sinon.stub(videoCapture, "start").resolves();
      sinon.stub(openProject, "launch").resolves();
      sinon.stub(openProject, "getProject").resolves(this.projectInstance);
      sinon.spy(errors, "warning");
      sinon.stub(config, "get").resolves({
        proxyUrl: "http://localhost:12345",
        video: true,
        videosFolder: "videos",
        integrationFolder: "/path/to/integrationFolder"
      });
      return sinon.stub(specsUtil, "find").resolves([
        {
          name: "foo_spec.js",
          path: "cypress/integration/foo_spec.js",
          absolute: "/path/to/spec.js"
        }
      ]);
    });

    it("shows no warnings for default browser", () =>
      runMode.run()
      .then(() => expect(errors.warning).to.not.be.called)
    );

    it("shows no warnings for electron browser", () =>
      runMode.run({browser: "electron"})
      .then(() => expect(errors.warning).to.not.be.calledWith("CANNOT_RECORD_VIDEO_FOR_THIS_BROWSER"))
    );

    it("disables video recording on interactive mode runs", () =>
      runMode.run({headed: true})
      .then(() => expect(errors.warning).to.be.calledWith("CANNOT_RECORD_VIDEO_HEADED"))
    );

    it("throws an error if invalid browser family supplied", function() {
      const browser = { name: "opera", family: "opera - btw when is Opera support coming?" };

      sinon.stub(browsers, "ensureAndGetByNameOrPath").resolves(browser);

      return expect(runMode.run({browser: "opera"}))
      .to.be.rejectedWith(/invalid browser family in/);
    });

    it("shows no warnings for chrome browser", () =>
      runMode.run({browser: "chrome"})
      .then(() => expect(errors.warning).to.not.be.called)
    );

    return it("names video file with spec name", () =>
      runMode.run()
      .then(() => {
        expect(videoCapture.start).to.be.calledWith("videos/foo_spec.js.mp4");
        return expect(runMode.waitForTestsToFinishRunning).to.be.calledWithMatch({
          compressedVideoName: "videos/foo_spec.js-compressed.mp4"
        });
      })
    );
  });

  return context(".run", function() {
    beforeEach(function() {
      sinon.stub(this.projectInstance, "getConfig").resolves({
        proxyUrl: "http://localhost:12345"
      });
      sinon.stub(electron.app, "on").withArgs("ready").yieldsAsync();
      sinon.stub(user, "ensureAuthToken");
      sinon.stub(Project, "ensureExists").resolves();
      sinon.stub(random, "id").returns(1234);
      sinon.stub(openProject, "create").resolves(openProject);
      sinon.stub(system, "info").resolves({ osName: "osFoo", osVersion: "fooVersion" });
      sinon.stub(browsers, "ensureAndGetByNameOrPath").resolves({
        name: "fooBrowser",
        path: "path/to/browser",
        version: "777",
        family: "electron"
      });
      sinon.stub(runMode, "waitForSocketConnection").resolves();
      sinon.stub(runMode, "waitForTestsToFinishRunning").resolves({
        stats: { failures: 10 },
        spec: {}
      });
      sinon.spy(runMode,  "waitForBrowserToConnect");
      sinon.spy(runMode,  "runSpecs");
      sinon.stub(openProject, "launch").resolves();
      sinon.stub(openProject, "getProject").resolves(this.projectInstance);
      return sinon.stub(specsUtil, "find").resolves([
        {
          name: "foo_spec.js",
          path: "cypress/integration/foo_spec.js",
          absolute: "/path/to/spec.js"
        }
      ]);
    });

    it("no longer ensures user session", () =>
      runMode.run()
      .then(() => expect(user.ensureAuthToken).not.to.be.called)
    );

    it("resolves with object and totalFailed", () =>
      runMode.run()
      .then(results => expect(results).to.have.property("totalFailed", 10))
    );

    it("passes projectRoot + options to openProject", function() {
      const opts = { projectRoot: "/path/to/project", foo: "bar" };

      return runMode.run(opts)
      .then(() => expect(openProject.create).to.be.calledWithMatch(opts.projectRoot, opts));
    });

    it("passes project + id to waitForBrowserToConnect", function() {
      return runMode.run()
      .then(() => {
        return expect(runMode.waitForBrowserToConnect).to.be.calledWithMatch({
          project: this.projectInstance,
          socketId: 1234
        });
      });
    });

    it("passes project to waitForTestsToFinishRunning", function() {
      return runMode.run()
      .then(() => {
        return expect(runMode.waitForTestsToFinishRunning).to.be.calledWithMatch({
          project: this.projectInstance
        });
      });
    });

    it("passes headed to openProject.launch", function() {
      const browser = { name: "electron", family: "electron" };

      browsers.ensureAndGetByNameOrPath.resolves(browser);

      return runMode.run({ headed: true })
      .then(() =>
        expect(openProject.launch).to.be.calledWithMatch(
          browser,
          {
            name: "foo_spec.js",
            path: "cypress/integration/foo_spec.js",
            absolute: "/path/to/spec.js"
          },
          {
            show: true
          }
        )
      );
    });

    it("passes sys to runSpecs", () =>
      runMode.run()
      .then(() =>
        expect(runMode.runSpecs).to.be.calledWithMatch({
          sys: {
            osName: "osFoo",
            osVersion: "fooVersion"
          }
        })
      )
    );

    return it("passes browser to runSpecs", () =>
      runMode.run()
      .then(() =>
        expect(runMode.runSpecs).to.be.calledWithMatch({
          browser: {
            name: "fooBrowser",
            path: "path/to/browser",
            version: "777"
          }
        })
      )
    );
  });
});
