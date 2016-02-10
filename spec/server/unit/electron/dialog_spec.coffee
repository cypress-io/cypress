require("../../spec_helper")

mockery.enable({
  warnOnUnregistered: false
})

mockery.registerMock("electron", electron = {
  dialog: {}
})

dialog   = require("#{root}../lib/electron/handlers/dialog")
Renderer = require("#{root}../lib/electron/handlers/renderer")

describe.only "electron/dialog", ->
  after ->
    mockery.disable()

  context ".show", ->
    beforeEach ->
      @sandbox.stub(Renderer, "get").withArgs("INDEX").returns("path/to/index")
      @showOpenDialog = electron.dialog.showOpenDialog = @sandbox.stub()

    it "calls dialog.showOpenDialog with args", ->
      dialog.show()
      expect(@showOpenDialog).to.be.calledWith("path/to/index", {
        properties: ["openDirectory"]
      })

    it "resolves with first path", ->
      @showOpenDialog.yields(["foo", "bar"])

      dialog.show().then (ret) ->
        expect(ret).to.eq("foo")

    it "handles null paths", ->
      @showOpenDialog.yields(null)

      dialog.show().then (ret) ->
        expect(ret).to.eq(undefined)