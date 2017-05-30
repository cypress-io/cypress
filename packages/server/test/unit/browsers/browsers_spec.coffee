require("../../spec_helper")

Promise = require("bluebird")
Windows = require("#{root}../lib/gui/windows")
browsers = require("#{root}../lib/browsers")

describe "lib/browsers/index", ->
  context ".open", ->
    # it "calls onBrowserClose callback on close", ->
    #   onBrowserClose = @sandbox.stub()
    #   browsers.launch("electron", @url, {onBrowserClose}).then ->
    #     Windows.create.lastCall.args[0].onClose()
    #     expect(onBrowserClose).to.be.called
    #
    # it "calls onBrowserOpen callback", ->
    #    onBrowserOpen = @sandbox.stub()
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
