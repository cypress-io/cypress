require("../spec_helper")

Promise = require("bluebird")
EE = require("events").EventEmitter
electron = require("electron")
electronUtils = require("#{root}lib/electron/utils")
menu = require("#{root}lib/electron/handlers/menu")
Renderer = require("#{root}lib/electron/handlers/renderer")
automation = require("#{root}lib/electron/handlers/automation")
savedState = require("#{root}lib/saved_state")
launcher = require("#{root}lib/launcher")

describe "lib/launcher", ->
  beforeEach ->
    ## speed things up
    @sandbox.stub(Promise, "delay").resolves()

  context "#launch", ->
    describe "when electron", ->
      beforeEach ->
        @win = {
          close: @sandbox.stub()
          isDestroyed: @sandbox.stub()
          webContents: new EE()
        }
        @url = "the://url"

        @sandbox.stub(electronUtils, "setProxy").resolves()
        @sandbox.stub(Renderer, "create").resolves(@win)
        @sandbox.stub(menu, "set")
        @sandbox.stub(Renderer, "trackState")
        @sandbox.stub(savedState, "get").resolves({})

      it "sets proxy", ->
        launcher.launch("electron", @url, {proxyServer: "proxy"})
        expect(electronUtils.setProxy).to.be.calledWith("proxy")

      it "creates renderer", ->
        launcher.launch("electron").then ->
          expect(Renderer.create).to.be.called

      it "passes along url", ->
        launcher.launch("electron", @url).then =>
          expect(Renderer.create.lastCall.args[0].url).to.equal(@url)

      it "passes along web security", ->
        launcher.launch("electron", @url, {chromeWebSecurity: false}).then ->
          expect(Renderer.create.lastCall.args[0].chromeWebSecurity).to.be.false

      it "sets menu with dev tools on focus", ->
        launcher.launch("electron").then ->
          Renderer.create.lastCall.args[0].onFocus()
          expect(menu.set).to.be.calledWith({withDevTools: true})

      it "sets menu with dev tools when dev env on blur", ->
        env = process.env["CYPRESS_ENV"]
        process.env["CYPRESS_ENV"] = "development"
        launcher.launch("electron").then ->
          Renderer.create.lastCall.args[0].onBlur()
          expect(menu.set).to.be.calledWith({withDevTools: true})
          process.env["CYPRESS_ENV"] = env

      it "sets menu without dev tools when not dev env on blur", ->
        env = process.env["CYPRESS_ENV"]
        process.env["CYPRESS_ENV"] = "production"
        launcher.launch("electron").then ->
          Renderer.create.lastCall.args[0].onBlur()
          expect(menu.set).to.be.calledWith({withDevTools: false})
          process.env["CYPRESS_ENV"] = env

      it "sets menu with dev tools when dev env on close", ->
        env = process.env["CYPRESS_ENV"]
        process.env["CYPRESS_ENV"] = "development"
        launcher.launch("electron", @url, {onBrowserClose: ->}).then ->
          Renderer.create.lastCall.args[0].onClose()
          expect(menu.set).to.be.calledWith({withDevTools: true})
          process.env["CYPRESS_ENV"] = env

      it "sets menu without dev tools when not dev env on close", ->
        env = process.env["CYPRESS_ENV"]
        process.env["CYPRESS_ENV"] = "production"
        launcher.launch("electron", @url, {onBrowserClose: ->}).then ->
          Renderer.create.lastCall.args[0].onClose()
          expect(menu.set).to.be.calledWith({withDevTools: false})
          process.env["CYPRESS_ENV"] = env

      it "calls onBrowserClose callback on close", ->
        onBrowserClose = @sandbox.stub()
        launcher.launch("electron", @url, {onBrowserClose}).then ->
          Renderer.create.lastCall.args[0].onClose()
          expect(onBrowserClose).to.be.called

      it "uses default width if there isn't one saved", ->
        launcher.launch("electron").then ->
          expect(Renderer.create.lastCall.args[0].width).to.equal(1280)

      it "uses saved width if there is one", ->
        savedState.get.resolves({browserWidth: 1024})
        launcher.launch("electron").then ->
          expect(Renderer.create.lastCall.args[0].width).to.equal(1024)

      it "uses default height if there isn't one saved", ->
        launcher.launch("electron").then ->
          expect(Renderer.create.lastCall.args[0].height).to.equal(720)

      it "uses saved height if there is one", ->
        savedState.get.resolves({browserHeight: 768})
        launcher.launch("electron").then ->
          expect(Renderer.create.lastCall.args[0].height).to.equal(768)

      it "uses saved x if there is one", ->
        savedState.get.resolves({browserX: 200})
        launcher.launch("electron").then ->
          expect(Renderer.create.lastCall.args[0].x).to.equal(200)

      it "uses saved y if there is one", ->
        savedState.get.resolves({browserY: 300})
        launcher.launch("electron").then ->
          expect(Renderer.create.lastCall.args[0].y).to.equal(300)

      it "tracks browser state", ->
        launcher.launch("electron").then =>
          expect(Renderer.trackState).to.be.calledWith(@win, {}, {
            width: "browserWidth"
            height: "browserHeight"
            x: "browserX"
            y: "browserY"
            devTools: "isBrowserDevToolsOpen"
          })

      it "prevents new windows from being created", ->
        electron.shell = {openExternal: @sandbox.stub()}
        event = {preventDefault: @sandbox.stub()}
        launcher.launch("electron").then =>
          @win.webContents.emit("new-window", event, "some://url")
          expect(event.preventDefault).to.be.called
          expect(electron.shell.openExternal).to.be.calledWith("some://url")

      it "calls onBrowserOpen callback", ->
         onBrowserOpen = @sandbox.stub()
         launcher.launch("electron", @url, {onBrowserOpen}).then =>
           expect(onBrowserOpen).to.be.called

      it "waits a second to give browser time to open", ->
        launcher.launch("electron").then ->
          expect(Promise.delay).to.be.calledWith(1000)

      it "returns 'instance'", ->
        launcher.launch("electron").then (instance) ->
          expect(instance.kill).to.be.a("function")
          expect(instance.removeAllListeners).to.be.a("function")

      it "closes window on kill if it's not destroyed", ->
        @win.isDestroyed.returns(false)
        launcher.launch("electron").then (instance) =>
          instance.kill()
          expect(@win.close).to.be.called

      it "does not close window on kill if it's destroyed", ->
        @win.isDestroyed.returns(true)
        launcher.launch("electron").then (instance) =>
          instance.kill()
          expect(@win.close).not.to.be.called

      context "#onAutomationRequest", ->
        it "performs the automation", ->
          @sandbox.stub(automation, "perform")
          launcher.launch("electron").then ->
            launcher.onAutomationRequest("some request")
            expect(automation.perform).to.be.calledWith("some request")
