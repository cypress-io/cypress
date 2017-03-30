require("../spec_helper")

_ = require("lodash")
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
        @win = _.extend(new EE(), {
          close: @sandbox.stub()
          isDestroyed: @sandbox.stub()
          webContents: new EE()
        })
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

      it "sets menu with dev tools when dev env on close", ->
        env = process.env["CYPRESS_ENV"]
        process.env["CYPRESS_ENV"] = "development"
        launcher.launch("electron", @url, {onBrowserClose: ->}).then ->
          Renderer.create.lastCall.args[0].onClose()
          expect(menu.set).to.be.calledWith({withDevTools: true})
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

      describe "new windows", ->
        beforeEach ->
          @childWin = _.extend(new EE(), {
            close: @sandbox.stub()
            isDestroyed: @sandbox.stub().returns(false)
            webContents: new EE()
          })

          Renderer.create.onCall(1).resolves(@childWin)

          @event = {preventDefault: @sandbox.stub()}
          @win.getPosition = -> [4, 2]

          @openNewWindow = (options) =>
            launcher.launch("electron", @url, options).then =>
              @win.webContents.emit("new-window", @event, "some://other.url")

        it "prevents default", ->
          @openNewWindow().then =>
            expect(@event.preventDefault).to.be.called

        it "creates child window", ->
          @openNewWindow().then =>
            args = Renderer.create.lastCall.args[0]
            expect(Renderer.create).to.be.calledTwice
            expect(args.url).to.equal("some://other.url")
            expect(args.minWidth).to.equal(100)
            expect(args.minHeight).to.equal(100)

        it "offsets it from parent by 100px", ->
          @openNewWindow().then =>
            args = Renderer.create.lastCall.args[0]
            expect(args.x).to.equal(104)
            expect(args.y).to.equal(102)

        it "passes along web security", ->
          @openNewWindow({chromeWebSecurity: false}).then =>
            args = Renderer.create.lastCall.args[0]
            expect(args.chromeWebSecurity).to.be.false

        it "sets unique PROJECT type on each new window", ->
          @openNewWindow().then =>
            firstArgs = Renderer.create.lastCall.args[0]
            expect(firstArgs.type).to.match(/^PROJECT-CHILD-\d/)
            @win.webContents.emit("new-window", @event, "yet://another.url")
            secondArgs = Renderer.create.lastCall.args[0]
            expect(secondArgs.type).to.match(/^PROJECT-CHILD-\d/)
            expect(firstArgs.type).not.to.equal(secondArgs.type)

        it "set newGuest on child window", ->
          @openNewWindow()
          .then ->
            Promise.delay(1)
          .then =>
            expect(@event.newGuest).to.equal(@childWin)

        it "sets menu with dev tools on creation", ->
          @openNewWindow().then =>
            ## once for main window, once for child
            expect(menu.set).to.be.calledTwice
            expect(menu.set).to.be.calledWith({withDevTools: true})

        it "sets menu with dev tools on focus", ->
          @openNewWindow().then =>
            Renderer.create.lastCall.args[0].onFocus()
            ## once for main window, once for child, once for focus
            expect(menu.set).to.be.calledThrice
            expect(menu.set).to.be.calledWith({withDevTools: true})

        it "it closes the child window when the parent window is closed", ->
          @openNewWindow()
          .then ->
            Promise.delay(1)
          .then =>
            @win.emit("close")
            expect(@childWin.close).to.be.called

        it "does not close the child window when it is already destroyed", ->
          @openNewWindow()
          .then ->
            Promise.delay(1)
          .then =>
            @childWin.isDestroyed.returns(true)
            @win.emit("close")
            expect(@childWin.close).not.to.be.called

        it "does the same things for children of the child window", ->
          @grandchildWin = _.extend(new EE(), {
            close: @sandbox.stub()
            isDestroyed: @sandbox.stub().returns(false)
            webContents: new EE()
          })
          Renderer.create.onCall(2).resolves(@grandchildWin)
          @childWin.getPosition = -> [104, 102]

          @openNewWindow().then =>
            @childWin.webContents.emit("new-window", @event, "yet://another.url")
            args = Renderer.create.lastCall.args[0]
            expect(Renderer.create).to.be.calledThrice
            expect(args.url).to.equal("yet://another.url")
            expect(args.type).to.match(/^PROJECT-CHILD-\d/)
            expect(args.x).to.equal(204)
            expect(args.y).to.equal(202)

      context "#onAutomationRequest", ->
        it "performs the automation", ->
          @sandbox.stub(automation, "perform")
          launcher.launch("electron").then ->
            launcher.onAutomationRequest("some request")
            expect(automation.perform).to.be.calledWith("some request")
