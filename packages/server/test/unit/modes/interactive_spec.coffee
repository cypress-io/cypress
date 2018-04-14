require("../../spec_helper")

_          = require("lodash")
os         = require("os")
electron   = require("electron")
user       = require("#{root}../lib/user")
logger     = require("#{root}../lib/logger")
Updater    = require("#{root}../lib/updater")
savedState = require("#{root}../lib/saved_state")
interactiveMode    = require("#{root}../lib/modes/interactive")
menu       = require("#{root}../lib/gui/menu")
Events     = require("#{root}../lib/gui/events")
Windows   = require("#{root}../lib/gui/windows")

describe "gui/interactive", ->
  context ".isMac", ->
    it "returns true if os.platform is darwin", ->
      @sandbox.stub(os, "platform").returns("darwin")

      expect(interactiveMode.isMac()).to.be.true

    it "returns false if os.platform isnt darwin", ->
      @sandbox.stub(os, "platform").returns("linux64")

      expect(interactiveMode.isMac()).to.be.false

  context ".getWindowArgs", ->
    it "exits process when onClose is called", ->
      @sandbox.stub(process, "exit")
      interactiveMode.getWindowArgs({}).onClose()
      expect(process.exit).to.be.called

    it "tracks state properties", ->
      trackState = interactiveMode.getWindowArgs({}).trackState

      args = _.pick(trackState, "width", "height", "x", "y", "devTools")

      expect(args).to.deep.eq({
        width: "appWidth"
        height: "appHeight"
        x: "appX"
        y: "appY"
        devTools: "isAppDevToolsOpen"
      })

    it "renders with saved width if it exists", ->
      expect(interactiveMode.getWindowArgs({appWidth: 1}).width).to.equal(1)

    it "renders with default width if no width saved", ->
      expect(interactiveMode.getWindowArgs({}).width).to.equal(800)

    it "renders with saved height if it exists", ->
      expect(interactiveMode.getWindowArgs({appHeight: 2}).height).to.equal(2)

    it "renders with default height if no height saved", ->
      expect(interactiveMode.getWindowArgs({}).height).to.equal(550)

    it "renders with saved x if it exists", ->
      expect(interactiveMode.getWindowArgs({appX: 3}).x).to.equal(3)

    it "renders with no x if no x saved", ->
      expect(interactiveMode.getWindowArgs({}).x).to.be.undefined

    it "renders with saved y if it exists", ->
      expect(interactiveMode.getWindowArgs({appY: 4}).y).to.equal(4)

    it "renders with no y if no y saved", ->
      expect(interactiveMode.getWindowArgs({}).y).to.be.undefined

    describe "on window focus", ->
      beforeEach ->
        @sandbox.stub(menu, "set")

      it "calls menu.set withDevTools: true when in dev env", ->
        env = process.env["CYPRESS_ENV"]
        process.env["CYPRESS_ENV"] = "development"
        interactiveMode.getWindowArgs({}).onFocus()
        expect(menu.set.lastCall.args[0].withDevTools).to.be.true
        process.env["CYPRESS_ENV"] = env

      it "calls menu.set withDevTools: false when not in dev env", ->
        env = process.env["CYPRESS_ENV"]
        process.env["CYPRESS_ENV"] = "production"
        interactiveMode.getWindowArgs({}).onFocus()
        expect(menu.set.lastCall.args[0].withDevTools).to.be.false
        process.env["CYPRESS_ENV"] = env

  context ".ready", ->
    beforeEach ->
      @win = {}
      @state = {}

      @sandbox.stub(menu, "set")
      @sandbox.stub(Events, "start")
      @sandbox.stub(Windows, "open").resolves(@win)
      @sandbox.stub(Windows, "trackState")

      state = savedState()
      @sandbox.stub(state, "get").resolves(@state)

    it "calls Events.start with options, adding env, onFocusTests, and os", ->
      @sandbox.stub(os, "platform").returns("someOs")
      opts = {}

      interactiveMode.ready(opts).then ->
        expect(Events.start).to.be.called
        expect(Events.start.lastCall.args[0].onFocusTests).to.be.a("function")
        expect(Events.start.lastCall.args[0].os).to.equal("someOs")

    it "calls menu.set", ->
      interactiveMode.ready({}).then ->
        expect(menu.set).to.be.calledOnce

    it "calls menu.set withDevTools: true when in dev env", ->
      env = process.env["CYPRESS_ENV"]
      process.env["CYPRESS_ENV"] = "development"
      interactiveMode.ready({}).then ->
        expect(menu.set.lastCall.args[0].withDevTools).to.be.true
        process.env["CYPRESS_ENV"] = env

    it "calls menu.set withDevTools: false when not in dev env", ->
      env = process.env["CYPRESS_ENV"]
      process.env["CYPRESS_ENV"] = "production"
      interactiveMode.ready({}).then ->
        expect(menu.set.lastCall.args[0].withDevTools).to.be.false
        process.env["CYPRESS_ENV"] = env

    it "resolves with win", ->
      interactiveMode.ready({}).then (win) =>
        expect(win).to.eq(@win)

  context ".run", ->
    beforeEach ->
      @sandbox.stub(electron.app, "on").withArgs("ready").yieldsAsync()

    it "calls ready with options", ->
      @sandbox.stub(interactiveMode, "ready")

      opts = {}
      interactiveMode.run(opts).then ->
        expect(interactiveMode.ready).to.be.calledWith(opts)
