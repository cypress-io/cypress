require("../../spec_helper")

icons    = require("@cypress/core-icons")
electron = require("electron")
Tray     = require("#{root}../lib/electron/handlers/tray")

describe "electron/tray", ->
  context ".setImage", ->
    beforeEach ->
      Tray.display()

      @tray = Tray.getTray()

      @sandbox.stub(@tray, "on")
      @sandbox.stub(@tray, "setImage")
      @sandbox.stub(@tray, "setPressedImage")
      @sandbox.stub(@tray, "setToolTip")

    it "is noop without a tray", ->
      Tray.resetTray()

      expect(Tray.setImage("asdf")).to.be.undefined

    it "throws when not a valid color", ->
      fn = ->
        Tray.setImage("green")

      expect(fn).to.throw("Did not receive a valid tray icon color. Got: 'green'")

    it "calls tray.setImage with blue", ->
      Tray.setImage("blue")

      expect(@tray.setImage).to.be.calledWith(Tray.getColors().blue)

    it "calls tray.setPressedImage with white", ->
      Tray.setImage("white", {pressed: true})

      expect(@tray.setPressedImage).to.be.calledWith(Tray.getColors().white)

  context ".display", ->
    beforeEach ->
      @sandbox.stub(Tray, "setImage")
      Tray.display()
      @tray = Tray.getTray()

    it "sets black image", ->
      expect(Tray.setImage).to.be.calledWith("black")

    it "sets white pressed image", ->
      expect(Tray.setImage).to.be.calledWith("white", {pressed: true})
