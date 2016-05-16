require("../../spec_helper")

icons    = require("@cypress/core-icons")
electron = require("electron")
os       = require("os")
Tray     = require("#{root}../lib/electron/handlers/tray")

describe "electron/tray", ->
  beforeEach ->
    @sandbox.stub(os, "platform").returns("darwin")

    @spyOnTray = (method)=>
      electronTray = @tray.getTray()
      @sandbox.stub(electronTray, method)
      return electronTray

    @tray = new Tray()

  context ".setState", ->
    it "is noop without being displayed", ->
      @electronTray = @spyOnTray("setImage")
      @tray.setState("running")
      expect(@electronTray.setImage).not.to.be.called

    it "throws when not a valid state", ->
      @tray.display()
      fn = =>
        @tray.setState("nope")

      expect(fn).to.throw("Did not receive a valid tray icon state. Got: 'nope'")

    it "calls tray.setImage with blue when running", ->
      @electronTray = @spyOnTray("setImage")
      @tray.display()
      @tray.setState("running")

      expect(@electronTray.setImage).to.be.calledWith(@tray.getColors().blue)

    it "calls tray.setPressedImage with red when error", ->
      @electronTray = @spyOnTray("setImage")
      @tray.display()
      @tray.setState("error")

      expect(@electronTray.setImage).to.be.calledWith(@tray.getColors().red)

  context ".display", ->
    beforeEach ->
      @sn = @sandbox.stub(electron.systemPreferences, "subscribeNotification")
      .withArgs("AppleInterfaceThemeChangedNotification")

    describe "when in either mode", ->
      beforeEach ->
        @electronTray = @spyOnTray("setPressedImage")
        @spyOnTray("setToolTip")
        @tray.display()

      it "sets white pressed image", ->
        expect(@electronTray.setPressedImage).to.be.calledWith(@tray.getColors().white)

      it "sets the tooltip", ->
        expect(@electronTray.setToolTip).to.be.calledWith("Cypress")

    describe "when in light mode", ->
      beforeEach ->
        @electronTray = @spyOnTray("setImage")
        @tray.display()

      it "sets black as default image", ->
        expect(@electronTray.setImage).to.be.calledWith(@tray.getColors().black)

      describe "and changes to dark mode", ->
        beforeEach ->
          @sandbox.stub(electron.systemPreferences, "isDarkMode").returns(true)
          @sn.getCall(0).args[1]()

        it "switches default image to white", ->
          expect(@electronTray.setImage).to.be.calledWithExactly(@tray.getColors().white)

    describe "when in dark mode", ->
      beforeEach ->
        @electronTray = @spyOnTray("setImage")
        @sandbox.stub(electron.systemPreferences, "isDarkMode").returns(true)
        @tray.display()

      it "sets white as default image", ->
        expect(@electronTray.setImage).to.be.calledWithExactly(@tray.getColors().white)

    describe "when on OSX", ->
      beforeEach ->
        @tray.display()

      it "subscribes to system preferences notifications", ->
        expect(@sn).to.be.called

    describe "when not on OSX", ->
      beforeEach ->
        os.platform.returns("linux")
        @sandbox.spy(@tray, "setState")

      it "returns undefined", ->
        expect(@tray.display()).to.be.undefined
        expect(@tray.setState).not.to.be.called
