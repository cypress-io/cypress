require("../../spec_helper")

_          = require("lodash")
os         = require("os")
electron   = require("electron")
user       = require("#{root}../lib/user")
logger     = require("#{root}../lib/logger")
Updater    = require("#{root}../lib/updater")
savedState = require("#{root}../lib/saved_state")
headed     = require("#{root}../lib/modes/headed")
menu       = require("#{root}../lib/gui/menu")
Events     = require("#{root}../lib/gui/events")
Windows   = require("#{root}../lib/gui/windows")

describe "gui/headed", ->
  context.skip ".onClick", ->
  context.skip ".onWindowAllClosed", ->
  context.skip ".platformArgs", ->

  context ".isMac", ->
    it "returns true if os.platform is darwin", ->
      @sandbox.stub(os, "platform").returns("darwin")

      expect(headed.isMac()).to.be.true

    it "returns false if os.platform isnt darwin", ->
      @sandbox.stub(os, "platform").returns("linux64")

      expect(headed.isMac()).to.be.false

  context ".getWindowsArgs", ->
    it "exits process when onClose is called", ->
      @sandbox.stub(process, "exit")
      headed.getWindowsArgs({}).onClose()
      expect(process.exit).to.be.called

  context ".ready", ->
    beforeEach ->
      @win = {}
      @state = {}

      @sandbox.stub(menu, "set")
      @sandbox.stub(Events, "start")
      @sandbox.stub(Updater, "install")
      @sandbox.stub(Windows, "create").resolves(@win)
      @sandbox.stub(Windows, "trackState")
      @sandbox.stub(savedState, "get").resolves(@state)

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

    it "calls menu.set withDevTools: true when in dev env", ->
      env = process.env["CYPRESS_ENV"]
      process.env["CYPRESS_ENV"] = "development"
      headed.ready({}).then ->
        expect(menu.set.lastCall.args[0].withDevTools).to.be.true
        process.env["CYPRESS_ENV"] = env

    it "calls menu.set withDevTools: false when not in dev env", ->
      env = process.env["CYPRESS_ENV"]
      process.env["CYPRESS_ENV"] = "production"
      headed.ready({}).then ->
        expect(menu.set.lastCall.args[0].withDevTools).to.be.false
        process.env["CYPRESS_ENV"] = env

    it "resolves with win", ->
      headed.ready({}).then (win) =>
        expect(win).to.eq(@win)

    it "tracks state", ->
      headed.ready({}).then =>
        expect(Windows.trackState).to.be.calledWith(@win, @state, {
          width: "appWidth"
          height: "appHeight"
          x: "appX"
          y: "appY"
          devTools: "isAppDevToolsOpen"
        })

    it "renders with saved width if it exists", ->
      expect(headed.getWindowsArgs({appWidth: 1}).width).to.equal(1)

    it "renders with default width if no width saved", ->
      expect(headed.getWindowsArgs({}).width).to.equal(800)

    it "renders with saved height if it exists", ->
      expect(headed.getWindowsArgs({appHeight: 2}).height).to.equal(2)

    it "renders with default height if no height saved", ->
      expect(headed.getWindowsArgs({}).height).to.equal(550)

    it "renders with saved x if it exists", ->
      expect(headed.getWindowsArgs({appX: 3}).x).to.equal(3)

    it "renders with no x if no x saved", ->
      expect(headed.getWindowsArgs({}).x).to.be.undefined

    it "renders with saved y if it exists", ->
      expect(headed.getWindowsArgs({appY: 4}).y).to.equal(4)

    it "renders with no y if no y saved", ->
      expect(headed.getWindowsArgs({}).y).to.be.undefined

    describe "on window focus", ->
      it "calls menu.set withDevTools: true when in dev env", ->
        env = process.env["CYPRESS_ENV"]
        process.env["CYPRESS_ENV"] = "development"
        headed.getWindowsArgs({}).onFocus()
        expect(menu.set.lastCall.args[0].withDevTools).to.be.true
        process.env["CYPRESS_ENV"] = env

      it "calls menu.set withDevTools: false when not in dev env", ->
        env = process.env["CYPRESS_ENV"]
        process.env["CYPRESS_ENV"] = "production"
        headed.getWindowsArgs({}).onFocus()
        expect(menu.set.lastCall.args[0].withDevTools).to.be.false
        process.env["CYPRESS_ENV"] = env

  context ".run", ->
    beforeEach ->
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()

    it "calls ready with options", ->
      @sandbox.stub(headed, "ready")

      opts = {}
      headed.run(opts).then ->
        expect(headed.ready).to.be.calledWith(opts)
