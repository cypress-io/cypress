fs = require("fs-extra")

module.exports = (NwApp) -> {
  cache:     require("./cache")
  cli:       require("./cli")
  parseArgs: require("./util/parse_args")
  Log:       require("./log")
  Booter:    require("./cypress")
  updater:   require("./updater")(NwApp)
  Chromium:  require("./chromium")
  manifest:  fs.readJsonSync(process.cwd() + "/package.json")
}