cp      = require("child_process")
Promise = require("bluebird")

execAsync = Promise.promisify(cp.exec)

module.exports = {
  find: (id) ->
    execAsync("mdfind 'kMDItemCFBundleIdentifier=='#{id}'' | head -1")
    .call("trim")
    .then (str) ->
      if str is ""
        err = new Error("Browser not installed: #{id}")
        err.notInstalled = true
        throw err

      return str
}