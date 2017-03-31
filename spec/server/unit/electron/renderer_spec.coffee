require("../../spec_helper")

_ = require("lodash")
EE = require("events").EventEmitter
savedState = require("#{root}../lib/saved_state")
Renderer = require("#{root}../lib/gui/handlers/renderer")

describe "lib/gui/handlers/renderer", ->

  context "#trackState", ->
    beforeEach ->
      @win = new EE()
      @win.getSize = @sandbox.stub().returns([1, 2])
      @win.getPosition = @sandbox.stub().returns([3, 4])
      @win.webContents = new EE()
      @win.webContents.openDevTools = @sandbox.stub()

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
      @sandbox.stub(_, "debounce").returnsArg(0)
      @sandbox.stub(savedState, "set")

      Renderer.trackState(@win, {}, @keys)
      @win.emit("resize")

      expect(_.debounce).to.be.called
      expect(savedState.set).to.be.calledWith({
        theWidth: 1
        someHeight: 2
        anX: 3
        aY: 4
      })

    it "saves position when window moves, debounced", ->
      ## tried using useFakeTimers here, but it didn't work for some
      ## reason, so this is the next best thing
      @sandbox.stub(_, "debounce").returnsArg(0)
      @sandbox.stub(savedState, "set")

      Renderer.trackState(@win, {}, @keys)
      @win.emit("moved")

      expect(savedState.set).to.be.calledWith({
        anX: 3
        aY: 4
      })

    it "saves dev tools state when opened", ->
      @sandbox.stub(savedState, "set")

      Renderer.trackState(@win, {}, @keys)
      @win.webContents.emit("devtools-opened")

      expect(savedState.set).to.be.calledWith({whatsUpWithDevTools: true})

    it "saves dev tools state when closed", ->
      @sandbox.stub(savedState, "set")

      Renderer.trackState(@win, {}, @keys)
      @win.webContents.emit("devtools-closed")

      expect(savedState.set).to.be.calledWith({whatsUpWithDevTools: false})

    it "opens dev tools if saved state is open", ->
      Renderer.trackState(@win, {whatsUpWithDevTools: true}, @keys)

      expect(@win.webContents.openDevTools).to.be.called

    it "does not open dev tools if saved state is not open", ->
      Renderer.trackState(@win, {}, @keys)

      expect(@win.webContents.openDevTools).not.to.be.called
