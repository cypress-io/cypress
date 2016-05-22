require("../../spec_helper")

os       = require("os")
icons    = require("@cypress/core-icons")
notifier = require("node-notifier")
electron = require("electron")
user     = require("#{root}../lib/user")
logger   = require("#{root}../lib/logger")
Updater  = require("#{root}../lib/updater")
headed   = require("#{root}../lib/modes/headed")
menu     = require("#{root}../lib/electron/handlers/menu")
Tray     = require("#{root}../lib/electron/handlers/tray")
Events   = require("#{root}../lib/electron/handlers/events")
Renderer = require("#{root}../lib/electron/handlers/renderer")

describe "electron/headed", ->
  context.skip ".onClick", ->
  context.skip ".onWindowAllClosed", ->
  context.skip ".getRendererArgs", ->
  context.skip ".platformArgs", ->

  context ".isMac", ->
    it "returns true if os.platform is darwin", ->
      @sandbox.stub(os, "platform").returns("darwin")

      expect(headed.isMac()).to.be.true

    it "returns false if os.platform isnt darwin", ->
      @sandbox.stub(os, "platform").returns("linux64")

      expect(headed.isMac()).to.be.false

  context ".notify", ->
    it "returns if not isMac", ->
      @sandbox.stub(headed, "isMac").returns(false)

      expect(headed.notify()).to.be.undefined

    it "does not call notifier if user is logged in", ->
      @sandbox.stub(headed, "isMac").returns(true)
      @sandbox.stub(user, "ensureSession").resolves()
      @sandbox.stub(notifier, "notify")

      headed.notify().then ->
        expect(notifier.notify).not.to.be.called

    it "calls notifier if user isnt logged in", ->
      @sandbox.stub(headed, "isMac").returns(true)
      @sandbox.stub(user, "ensureSession").rejects(new Error)
      @sandbox.stub(notifier, "notify")

      headed.notify().then ->
        expect(notifier.notify).to.be.calledWith({
          title: "Cypress is now running..."
          message: "Click the 'cy' icon in your tray to login."
          icon: icons.getPathToIcon("icon_32x32@2x.png")
        })

  context ".ready", ->
    beforeEach ->
      @win = {}

      @sandbox.stub(menu, "set")
      @sandbox.stub(Tray.prototype, "display")
      @sandbox.stub(Events, "start")
      @sandbox.stub(Updater, "install")
      @sandbox.stub(headed, "notify").resolves()
      @sandbox.stub(Renderer, "create").resolves(@win)

    it "sets options.onQuit", ->
      opts = {}

      headed.ready(opts).then ->
        expect(opts.onQuit).to.be.a("function")

    it "sets options.onOpenProject"
    it "sets options.onCloseProject"
    it "sets options.onError"

    it "calls Events.start with options", ->
      opts = {}

      headed.ready(opts).then ->
        expect(Events.start).to.be.calledWith(opts)

    it "calls Updater.install if options.updating", ->
      headed.ready({updating: true}).then ->
        expect(Updater.install).to.be.calledOnce

    it "does not call Updater.install", ->
      headed.ready({}).then ->
        expect(Updater.install).not.to.be.called

    it "calls menu.set", ->
      headed.ready({}).then ->
        expect(menu.set).to.be.calledOnce

    it "calls tray.display", ->
      headed.ready({}).then ->
        expect(Tray.prototype.display).to.be.calledOnce

    it "headed.notify", ->
      headed.ready({}).then ->
        expect(headed.notify).to.be.calledOnce

    it "resolves with win", ->
      headed.ready({}).then (win) =>
        expect(win).to.eq(@win)

    context "option callbacks", ->
      it "exits the app", ->
        @sandbox.stub(electron.app, "exit")

        opts = {}
        headed.ready(opts).then ->
          opts.onQuit()
          expect(electron.app.exit).to.be.calledWith(0)

      it "calls logs.off", ->
        @sandbox.stub(logger, "off")

        opts = {}
        headed.ready(opts).then ->
          opts.onQuit()
          expect(logger.off).to.be.calledOnce

      it "sets tray state to running", ->
        @sandbox.stub(Tray.prototype, "setState")

        opts = {}
        headed.ready(opts).then ->
          opts.onOpenProject()
          expect(Tray.prototype.setState).to.be.calledWith("running")

      it "sets tray state to default", ->
        @sandbox.stub(Tray.prototype, "setState")

        opts = {}
        headed.ready(opts).then ->
          opts.onCloseProject()
          expect(Tray.prototype.setState).to.be.calledWith("default")

      it "sets tray state to error", ->
        @sandbox.stub(Tray.prototype, "setState")

        opts = {}
        headed.ready(opts).then ->
          opts.onError()
          expect(Tray.prototype.setState).to.be.calledWith("error")

  context ".run", ->
    beforeEach ->
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()

    it "calls ready with options", ->
      @sandbox.stub(headed, "ready")

      opts = {}
      headed.run(opts).then ->
        expect(headed.ready).to.be.calledWith(opts)

    it "listens to 'window-all-closed' and calls onWindowAllClosed with app", ->
      electron.app.on.withArgs("window-all-closed").yields()
      @sandbox.stub(headed, "ready")
      @sandbox.stub(headed, "onWindowAllClosed")

      headed.run().then ->
        expect(headed.onWindowAllClosed).to.be.calledWith(electron.app)
