require("../../spec_helper")

_          = require("lodash")
os         = require("os")
icons      = require("@cypress/core-icons")
electron   = require("electron")
user       = require("#{root}../lib/user")
logger     = require("#{root}../lib/logger")
Updater    = require("#{root}../lib/updater")
savedState = require("#{root}../lib/saved_state")
headed     = require("#{root}../lib/modes/headed")
menu       = require("#{root}../lib/electron/handlers/menu")
Events     = require("#{root}../lib/electron/handlers/events")
Renderer   = require("#{root}../lib/electron/handlers/renderer")

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

  context ".ready", ->
    beforeEach ->
      @win = {
        on: @sandbox.stub()
        webContents: {
          on: @sandbox.stub()
          openDevTools: @sandbox.stub()
        }
        getSize: @sandbox.stub().returns([1, 2])
        getPosition: @sandbox.stub().returns([3, 4])
      }

      @sandbox.stub(menu, "set")
      @sandbox.stub(Events, "start")
      @sandbox.stub(Updater, "install")
      @sandbox.stub(Renderer, "create").resolves(@win)

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

    it "resolves with win", ->
      headed.ready({}).then (win) =>
        expect(win).to.eq(@win)

    describe "app state", ->
      context "saving", ->
        it "saves app size and position when window resizes, debounced", ->
          ## tried using useFakeTimers here, but it didn't work for some
          ## reason, so this is the next best thing
          @sandbox.stub(_, "debounce").returnsArg(0)
          @sandbox.stub(savedState, "set")
          headed.ready({}).then (win) ->
            win.on.withArgs("resize").yield()
            expect(savedState.set).to.be.calledWith({
              appWidth: 1
              appHeight: 2
              appX: 3
              appY: 4
            })

        it "saves app position when window moves, debounced", ->
          ## tried using useFakeTimers here, but it didn't work for some
          ## reason, so this is the next best thing
          @sandbox.stub(_, "debounce").returnsArg(0)
          @sandbox.stub(savedState, "set")
          headed.ready({}).then (win) ->
            win.on.withArgs("moved").yield()
            expect(savedState.set).to.be.calledWith({
              appX: 3
              appY: 4
            })

        it "saves dev tools state when opened", ->
          @sandbox.stub(savedState, "set")
          headed.ready({}).then (win) ->
            win.webContents.on.withArgs("devtools-opened").yield()
            expect(savedState.set).to.be.calledWith({
              isAppDevToolsOpen: true
            })

        it "saves dev tools state when closed", ->
          @sandbox.stub(savedState, "set")
          headed.ready({}).then (win) ->
            win.webContents.on.withArgs("devtools-closed").yield()
            expect(savedState.set).to.be.calledWith({
              isAppDevToolsOpen: false
            })

      context "utilizing", ->
        it "renders with saved width if it exists", ->
          expect(headed.getRendererArgs({appWidth: 1}).width).to.equal(1)

        it "renders with default width if no width saved", ->
          expect(headed.getRendererArgs({}).width).to.equal(800)

        it "renders with saved height if it exists", ->
          expect(headed.getRendererArgs({appHeight: 2}).height).to.equal(2)

        it "renders with default height if no height saved", ->
          expect(headed.getRendererArgs({}).height).to.equal(550)

        it "renders with saved x if it exists", ->
          expect(headed.getRendererArgs({appX: 3}).x).to.equal(3)

        it "renders with no x if no x saved", ->
          expect(headed.getRendererArgs({}).x).to.be.undefined

        it "renders with saved y if it exists", ->
          expect(headed.getRendererArgs({appY: 4}).y).to.equal(4)

        it "renders with no y if no y saved", ->
          expect(headed.getRendererArgs({}).y).to.be.undefined

        it "opens dev tools if saved state is open", ->
          @sandbox.stub(savedState, "get").resolves({ isAppDevToolsOpen: true })
          headed.ready({}).then (win) ->
            expect(win.webContents.openDevTools).to.be.called

        it "does not open dev tools if saved state is not open", ->
          @sandbox.stub(savedState, "get").resolves({})
          headed.ready({}).then (win) ->
            expect(win.webContents.openDevTools).not.to.be.called

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
