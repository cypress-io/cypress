_     = require("lodash")
chalk = require("chalk")
utils = require("../utils")
pkg   = require("../../package.json")

module.exports = ->
  versions = "Cypress CLI:": chalk.blue(pkg.version)

  utils.exec("--version", {catch: false})
  .then (version) ->
    versions["Cypress App:"] = chalk.blue(version)
  .catch {versionNotObtained: true}, ->
    versions["Cypress App:"] = chalk.red("version could not be determined")
  .catch {code: "ENOENT"}, ->
    versions["Cypress App:"] = chalk.red("not found")
  .finally ->
    _.each versions, (val, key) ->
      console.log(key + " " + val)