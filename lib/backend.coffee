fs        = require("fs-extra")
Booter    = require("./cypress")
Log       = require("./log")
Updater   = require("./updater")
Chromium  = require("./chromium")
cache     = require("./cache")
cli       = require("./cli")
parseArgs = require("./util/parse_args")

module.exports = (NwApp) -> {
  cache:     cache
  cli:       cli
  parseArgs: parseArgs
  Log:       Log
  Booter:    Booter
  updater:   Updater(NwApp)
  Chromium:  Chromium
  manifest:  fs.readJsonSync(process.cwd() + "/package.json")
}