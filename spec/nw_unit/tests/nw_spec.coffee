root = "../../../"

cache = require("#{root}lib/cache")

module.exports = (parentWindow, loadApp) ->

  # {App, $} = remoteWindow
  # afterEach (done) ->
  #   setTimeout ->
  #     # parentWindow.$("iframe").remove()
  #     done()
  #   , 1000

  describe "Login", ->
    beforeEach ->
      cache.setUser({name: "brian", session_token: "abc123"}).bind(@).then ->
        loadApp(@)

    it "displays login", ->

    it "foo bars", ->

    it "baz", ->