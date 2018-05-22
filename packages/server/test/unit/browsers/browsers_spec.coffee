require("../../spec_helper")

Promise = require("bluebird")
Windows = require("#{root}../lib/gui/windows")
browsers = require("#{root}../lib/browsers")
utils = require("#{root}../lib/browsers/utils")

describe "lib/browsers/index", ->
  context ".ensureAndGetByName", ->
    it "returns browser by name", ->
      sinon.stub(utils, "getBrowsers").resolves([
        { name: "foo" }
        { name: "bar" }
      ])

      browsers.ensureAndGetByName("foo")
      .then (browser) ->
        expect(browser).to.deep.eq({ name: "foo" })

    it "throws when no browser can be found", ->
      browsers.ensureAndGetByName("browserNotGonnaBeFound")
      .then ->
        throw new Error("should have failed")
      .catch (err) ->
        expect(err.type).to.eq("BROWSER_NOT_FOUND")

  context ".open", ->
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
