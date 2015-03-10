describe "App", ->
  context "#env", ->
    it "sets to ci if window.mochaPhantomJS", ->
      window.mochaPhantomJS = {}
      ui = App.getCurrentUI()

      expect(ui).to.eq "ci"
      delete window.mochaPhantomJS

    it "sets to web if not window.mochaPhantomJS", ->
      ui = App.getCurrentUI()
      expect(ui).to.eq "web"