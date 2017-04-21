cp      = require("child_process")
Promise = require("bluebird")

execAsync = Promise.promisify(cp.exec)

notInstalledErr = (name) ->
  err = new Error("Browser not installed: #{name}")
  err.notInstalled = true
  throw err

module.exports = {
  get: (binary, re) ->
    execAsync("#{binary} --version")
    .call("trim")
    .then (stdout) ->
      m = re.exec(stdout)

      if m
        return {
          path: binary
          version: m[1]
        }
      else
        notInstalledErr(binary)
    .catch ->
      notInstalledErr(binary)
}