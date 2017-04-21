fs      = require("fs")
cp      = require("child_process")
path    = require("path")
plist   = require("plist")
Promise = require("bluebird")

fs        = Promise.promisifyAll(fs)
execAsync = Promise.promisify(cp.exec)

module.exports = {
  parse: (p, prop) ->
    pl = path.join(p, "Contents", "Info.plist")

    fs.readFileAsync(pl, "utf8")
    .then (str) ->
      plist.parse(str)
    .get(prop)
    .catch ->
      err = new Error("Info.plist not found: #{pl}")
      err.notInstalled = true
      throw err

  find: (id, executable) ->
    execAsync("mdfind 'kMDItemCFBundleIdentifier=='#{id}'' | head -1")
    .call("trim")
    .then (str) ->
      if str is ""
        err = new Error("Browser not installed: #{id}")
        err.notInstalled = true
        throw err

      return str
}