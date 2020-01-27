require("../../spec_helper")

Promise = require("bluebird")
Windows = require("#{root}../lib/gui/windows")
browsers = require("#{root}../lib/browsers")
utils = require("#{root}../lib/browsers/utils")

describe "lib/browsers/index", ->
  context ".isBrowserFamily", ->
    it "allows only known browsers", ->
      expect(browsers.isBrowserFamily("chromium")).to.be.true
      expect(browsers.isBrowserFamily("chrome")).to.be.false
      expect(browsers.isBrowserFamily("electron")).to.be.false
      expect(browsers.isBrowserFamily("my-favorite-browser")).to.be.false

  context ".ensureAndGetByNameOrPath", ->
    it "returns browser by name", ->
      sinon.stub(utils, "getBrowsers").resolves([
        { name: "foo" }
        { name: "bar" }
      ])

      browsers.ensureAndGetByNameOrPath("foo")
      .then (browser) ->
        expect(browser).to.deep.eq({ name: "foo" })

    it "throws when no browser can be found", ->
      browsers.ensureAndGetByNameOrPath("browserNotGonnaBeFound")
      .then ->
        throw new Error("should have failed")
      .catch (err) ->
        expect(err.type).to.eq("BROWSER_NOT_FOUND_BY_NAME")
        expect(err.message).to.contain("'browserNotGonnaBeFound' was not found on your system")

  context ".open", ->
    it "throws an error if browser family doesn't exist", ->
      browsers.open({
        name: 'foo-bad-bang'
        family: 'foo-bad'
      }, {
        browsers: []
      })
      .then (e) ->
        console.error(e)
        throw new Error("should've failed")
      , (err) ->
        # by being explicit with assertions, if something is unexpected
        # we will get good error message that includes the "err" object
        expect(err).to.have.property("type").to.eq("BROWSER_NOT_FOUND_BY_NAME")
        expect(err).to.have.property("message").to.contain("'foo-bad-bang' was not found on your system")

    # Ooo, browser clean up tests are disabled?!!

    # it "calls onBrowserClose callback on close", ->
    #   onBrowserClose = sinon.stub()
    #   browsers.launch("electron", @url, {onBrowserClose}).then ->
    #     Windows.create.lastCall.args[0].onClose()
    #     expect(onBrowserClose).to.be.called
    #
    # it "calls onBrowserOpen callback", ->
    #    onBrowserOpen = sinon.stub()
    #    browsers.launch("electron", @url, {onBrowserOpen}).then =>
    #      expect(onBrowserOpen).to.be.called
    #
    # it "waits a second to give browser time to open", ->
    #   browsers.launch("electron").then ->
    #     expect(Promise.delay).to.be.calledWith(1000)
    #
    # it "returns 'instance'", ->
    #   browsers.launch("electron").then (instance) ->
    #     expect(instance.kill).to.be.a("function")
    #     expect(instance.removeAllListeners).to.be.a("function")
    #
    # it "closes window on kill if it's not destroyed", ->
    #   @win.isDestroyed.returns(false)
    #   browsers.launch("electron").then (instance) =>
    #     instance.kill()
    #     expect(@win.close).to.be.called
    #
    # it "does not close window on kill if it's destroyed", ->
    #   @win.isDestroyed.returns(true)
    #   browsers.launch("electron").then (instance) =>
    #     instance.kill()
    #     expect(@win.close).not.to.be.called
