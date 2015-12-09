Log         = require("./log")
Chromium    = require("./chromium")
Reporter    = require("./reporter")
Routes      = require("./util/routes")
SecretSauce = require("./util/secret_sauce_loader")

module.exports = (App, options) ->
  SecretSauce.Cli(App, options, Routes, Chromium, Reporter, Log)
