describe "App", ->
  context "#env", ->
    it "sets to ci if window.mochaPhantomJS", ->
      window.mochaPhantomJS = {}
      env = App.getCurrentEnvironment()

      expect(env).to.eq "ci"
      delete window.mochaPhantomJS

    it "sets to web if not window.mochaPhantomJS", ->
      env = App.getCurrentEnvironment()
      expect(env).to.eq "ui"