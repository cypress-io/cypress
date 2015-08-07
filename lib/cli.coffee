Log         = require("./log")
Chromium    = require("./chromium")
Routes      = require("./util/routes")
SecretSauce = require("./util/secret_sauce_loader")

module.exports = (App, options) ->
  SecretSauce.Cli(App, options, Routes, Chromium, Log)
