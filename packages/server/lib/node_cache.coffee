_ = require("lodash")
clearModule = require("clear-module")
log = require("debug")("cypress:server:node_cache")

packages = {}

module.exports = {
  has: (depName) ->
    !!packages[depName]

  ## require a module, keeping track of which dependencies are added
  ## when it is required
  require: (depName) ->
    if packages[depName]
      log("packages '#{depName}' already required")
      return packages[depName].exports

    log("require '#{depName}'")
    previousPackages = Object.keys(require.cache)
    exports = require(depName)
    currentPackages = Object.keys(require.cache)
    newPackages = _.difference(currentPackages, previousPackages)
    log("new packages: %s", newPackages.join())

    packages[depName] = {
      exports: exports
      uniqueDeps: newPackages
    }
    return exports

  ## clear the module and any dependencies that are unique to it
  clear: (depName) ->
    if not packages[depName]
      throw new Error("#{depName} cannot be cleared because it has not been required via lib/node_cache")

    log("clear %s", depName)
    clearModule(depName)

    for packageName in packages[depName].uniqueDeps
      log("clear %s", packageName)
      clearModule(packageName)

    delete packages[depName]
}
