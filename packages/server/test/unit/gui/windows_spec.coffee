require("../../spec_helper")

_             = require("lodash")
path          = require("path")
Promise       = require("bluebird")
EE            = require("events").EventEmitter
BrowserWindow = require("electron").BrowserWindow
cyDesktop     = require("@packages/desktop-gui")
user          = require("#{root}../lib/user")
Windows       = require("#{root}../lib/gui/windows")
savedState    = require("#{root}../lib/saved_state")

DEFAULT_USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/0.0.0 Chrome/59.0.3071.115 Electron/1.8.2 Safari/537.36"

describe "lib/gui/windows", ->
  beforeEach ->
    Windows.reset()

    @win = new EE()
    @win.loadURL = sinon.stub()
    @win.destroy = sinon.stub()
    @win.getSize = sinon.stub().returns([1, 2])
    @win.getPosition = sinon.stub().returns([3, 4])
    @win.webContents = new EE()
    @win.webContents.openDevTools = sinon.stub()
    @win.webContents.setUserAgent = sinon.stub()
    @win.webContents.getUserAgent = sinon.stub().returns(DEFAULT_USER_AGENT)
    @win.isDestroyed = sinon.stub().returns(false)

    sinon.stub(Windows, "_newBrowserWindow").returns(@win)

  afterEach ->
    Windows.reset()

  context ".getByWebContents", ->
    beforeEach ->
      sinon.stub(BrowserWindow, "fromWebContents")

    it "calls BrowserWindow.fromWebContents", ->
      BrowserWindow.fromWebContents.withArgs("foo").returns("bar")
      expect(Windows.getByWebContents("foo")).to.eq("bar")

  context ".open", ->
    beforeEach ->
      sinon.stub(Windows, "create").returns(@win)

    it "sets default options", ->
      options = {
        type: "INDEX"
      }

      Windows.open("/path/to/project", options)
      .then (win) ->
        expect(options).to.deep.eq({
          height: 500
          width: 600
          type: "INDEX"
          show: true
          url: cyDesktop.getPathToIndex()
          webPreferences: {
            preload: path.resolve("lib", "ipc", "ipc.js")
          }
        })

        expect(win.loadURL).to.be.calledWith(cyDesktop.getPathToIndex())

  context ".create", ->
    it "opens dev tools if saved state is open", ->
      Windows.create("/foo/", {devTools: true})
      expect(@win.webContents.openDevTools).to.be.called

      Windows.create("/foo/", {})
      expect(@win.webContents.openDevTools).not.to.be.calledTwice

    ## TODO: test everything else going on in this method!

  context ".trackState", ->
    beforeEach ->
      savedState()
      .then (@state) =>
        sinon.stub(@state, "set")

        @projectRoot = undefined
        @keys = {
          width: "theWidth"
          height: "someHeight"
          x: "anX"
          y: "aY"
          devTools: "whatsUpWithDevTools"
        }

    it "saves size and position when window resizes, debounced", ->
      ## tried using useFakeTimers here, but it didn't work for some
      ## reason, so this is the next best thing
      sinon.stub(_, "debounce").returnsArg(0)

      Windows.trackState(@projectRoot, false, @win, @keys)
      @win.emit("resize")

      expect(_.debounce).to.be.called

      Promise
      .delay(100)
      .then () =>
        expect(@state.set).to.be.calledWith({
          theWidth: 1
          someHeight: 2
          anX: 3
          aY: 4
        })

    it "returns if window isDestroyed on resize", ->
      @win.isDestroyed.returns(true)

      Windows.trackState(@projectRoot, false, @win, @keys)
      @win.emit("resize")

      Promise
      .delay(100)
      .then () =>
        expect(@state.set).not.to.be.called

    it "saves position when window moves, debounced", ->
      ## tried using useFakeTimers here, but it didn't work for some
      ## reason, so this is the next best thing
      sinon.stub(_, "debounce").returnsArg(0)
      Windows.trackState(@projectRoot, false, @win, @keys)
      @win.emit("moved")

      Promise
      .delay(100)
      .then () =>
        expect(@state.set).to.be.calledWith({
          anX: 3
          aY: 4
        })

    it "returns if window isDestroyed on moved", ->
      @win.isDestroyed.returns(true)

      Windows.trackState(@projectRoot, false, @win, @keys)
      @win.emit("moved")

      Promise
      .delay(100)
      .then () =>
        expect(@state.set).not.to.be.called

    it "saves dev tools state when opened", ->
      Windows.trackState(@projectRoot, false, @win, @keys)
      @win.webContents.emit("devtools-opened")

      Promise
      .delay(100)
      .then () =>
        expect(@state.set).to.be.calledWith({whatsUpWithDevTools: true})

    it "saves dev tools state when closed", ->
      Windows.trackState(@projectRoot, false, @win, @keys)
      @win.webContents.emit("devtools-closed")

      Promise
      .delay(100)
      .then () =>
        expect(@state.set).to.be.calledWith({whatsUpWithDevTools: false})
