/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../../spec_helper");

const Promise = require("bluebird");
const Windows = require(`${root}../lib/gui/windows`);
const browsers = require(`${root}../lib/browsers`);
const utils = require(`${root}../lib/browsers/utils`);
const snapshot = require('snap-shot-it');

const normalizeBrowsers = message => message.replace(/(found are: ).*/, "$1chrome, firefox, electron");

describe("lib/browsers/index", function() {
  context(".getBrowserInstance", function() {
    it("returns instance", function() {
      const instance = { pid: 1234 };
      browsers._setInstance(instance);
      return expect(browsers.getBrowserInstance()).to.eq(instance);
    });

    return it("returns undefined if no instance", function() {
      browsers._setInstance();
      return expect(browsers.getBrowserInstance()).to.be.undefined;
    });
  });

  context(".isBrowserFamily", () => it("allows only known browsers", function() {
    expect(browsers.isBrowserFamily("chromium")).to.be.true;
    expect(browsers.isBrowserFamily("firefox")).to.be.true;
    expect(browsers.isBrowserFamily("chrome")).to.be.false;
    expect(browsers.isBrowserFamily("electron")).to.be.false;
    return expect(browsers.isBrowserFamily("my-favorite-browser")).to.be.false;
  }));

  context(".ensureAndGetByNameOrPath", function() {
    it("returns browser by name", function() {
      sinon.stub(utils, "getBrowsers").resolves([
        { name: "foo", channel: "stable" },
        { name: "bar", channel: "stable" }
      ]);

      return browsers.ensureAndGetByNameOrPath("foo")
      .then(browser => expect(browser).to.deep.eq({ name: "foo", channel: "stable" }));
    });

    it("throws when no browser can be found", () => expect(browsers.ensureAndGetByNameOrPath("browserNotGonnaBeFound"))
    .to.be.rejectedWith({ type: 'BROWSER_NOT_FOUND_BY_NAME' })
    .then(err => snapshot(normalizeBrowsers(err.message))));

    return it("throws a special error when canary is passed", function() {
      sinon.stub(utils, "getBrowsers").resolves([
        { name: "chrome", channel: "stable" },
        { name: "chrome", channel: "canary" },
        { name: "firefox", channel: "stable" }
      ]);

      return expect(browsers.ensureAndGetByNameOrPath("canary"))
      .to.be.rejectedWith({ type: 'BROWSER_NOT_FOUND_BY_NAME' })
      .then(err => snapshot(err.message));
    });
  });

  context(".open", () => it("throws an error if browser family doesn't exist", () => browsers.open({
    name: 'foo-bad-bang',
    family: 'foo-bad'
  }, {
    browsers: []
  })
  .then(function(e) {
    throw new Error("should've failed");}).catch(function(err) {
    // by being explicit with assertions, if something is unexpected
    // we will get good error message that includes the "err" object
    expect(err).to.have.property("type").to.eq("BROWSER_NOT_FOUND_BY_NAME");
    return expect(err).to.have.property("message").to.contain("'foo-bad-bang' was not found on your system");
  })));

  return context(".extendLaunchOptionsFromPlugins", function() {
    it("throws an error if unexpected property passed", function() {
      const fn = () => utils.extendLaunchOptionsFromPlugins({}, { foo: 'bar' });

      //# this error is snapshotted in an e2e test, no need to do it here
      return expect(fn).to.throw({ type: "UNEXPECTED_BEFORE_BROWSER_LAUNCH_PROPERTIES" });
    });

    return it("warns if array passed and changes it to args", function() {
      const onWarning = sinon.stub();

      const result = utils.extendLaunchOptionsFromPlugins({ args: [] }, ['foo'], { onWarning });

      expect(result).to.deep.eq({
        args: ['foo']
      });

      //# this error is snapshotted in e2e tests, no need to do it here
      expect(onWarning).to.be.calledOnce;
      return expect(onWarning).to.be.calledWithMatch({ type: "DEPRECATED_BEFORE_BROWSER_LAUNCH_ARGS" });
    });
  });
});

    // Ooo, browser clean up tests are disabled?!!

    // it "calls onBrowserClose callback on close", ->
    //   onBrowserClose = sinon.stub()
    //   browsers.launch("electron", @url, {onBrowserClose}).then ->
    //     Windows.create.lastCall.args[0].onClose()
    //     expect(onBrowserClose).to.be.called
    //
    // it "calls onBrowserOpen callback", ->
    //    onBrowserOpen = sinon.stub()
    //    browsers.launch("electron", @url, {onBrowserOpen}).then =>
    //      expect(onBrowserOpen).to.be.called
    //
    // it "waits a second to give browser time to open", ->
    //   browsers.launch("electron").then ->
    //     expect(Promise.delay).to.be.calledWith(1000)
    //
    // it "returns 'instance'", ->
    //   browsers.launch("electron").then (instance) ->
    //     expect(instance.kill).to.be.a("function")
    //     expect(instance.removeAllListeners).to.be.a("function")
    //
    // it "closes window on kill if it's not destroyed", ->
    //   @win.isDestroyed.returns(false)
    //   browsers.launch("electron").then (instance) =>
    //     instance.kill()
    //     expect(@win.close).to.be.called
    //
    // it "does not close window on kill if it's destroyed", ->
    //   @win.isDestroyed.returns(true)
    //   browsers.launch("electron").then (instance) =>
    //     instance.kill()
    //     expect(@win.close).not.to.be.called
