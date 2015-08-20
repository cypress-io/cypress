util         = require("util")
Routes       = require("./util/routes")
SecretSauce  = require "./util/secret_sauce_loader"

class Chromium
  util:   util
  Routes: Routes

  constructor: (win) ->
    if not (@ instanceof Chromium)
      return new Chromium(win)

    if not win
      throw new Error("Instantiating lib/chromium requires a window!")

    @win    = win
    @window = win.window

SecretSauce.mixin("Chromium", Chromium)

module.exports = Chromium
