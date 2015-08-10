fs = require("fs-extra")

module.exports = (NwApp) -> {
  cache:     require("./cache")
  cli:       require("./cli")
  parseArgs: require("./util/parse_args")
  Log:       require("./log")
  Cypress:   require("./cypress")
  Server:    require("./server")
  Chromium:  require("./chromium")
  updater:   require("./updater")(NwApp)
  manifest:  fs.readJsonSync(process.cwd() + "/package.json")
}