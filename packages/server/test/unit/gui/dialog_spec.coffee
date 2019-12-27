require("../../spec_helper")

electron = require("electron")
dialog   = require("#{root}../lib/gui/dialog")
Windows = require("#{root}../lib/gui/windows")

describe "gui/dialog", ->
  context ".show", ->
    beforeEach ->
      @showOpenDialog = electron.dialog.showOpenDialog = sinon.stub().resolves({
        filePaths: []
      })

    it "calls dialog.showOpenDialog with args", ->
      dialog.show()
      expect(@showOpenDialog).to.be.calledWith({
        properties: ["openDirectory"]
      })

    it "resolves with first path", ->
      @showOpenDialog.resolves({
        filePaths: ["foo", "bar"]
      })

      dialog.show().then (ret) ->
        expect(ret).to.eq("foo")

    it "handles null paths", ->
      @showOpenDialog.resolves({
        filePaths: null
      })

      dialog.show().then (ret) ->
        expect(ret).to.eq(undefined)

    it "handles null obj", ->
      @showOpenDialog.resolves(null)

      dialog.show().then (ret) ->
        expect(ret).to.eq(undefined)
