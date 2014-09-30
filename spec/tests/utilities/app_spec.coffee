describe "App", ->
  context "#env", ->
    it "sets to ci if window.mochaPhantomJS", ->
      window.mochaPhantomJS = {}
      App.execute "set:app:env"

      expect(App.env("ci")).to.be.true
      delete window.mochaPhantomJS

    it "sets to web if not window.mochaPhantomJS", ->
      App.execute "set:app:env"
      expect(App.env("web")).to.be.true

    it "can explicitly set to a specific environment", ->
      App.execute "set:app:env", "test"
      expect(App.env("test")).to.be.true