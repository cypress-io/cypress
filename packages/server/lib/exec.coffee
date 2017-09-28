_       = require("lodash")
Promise = require("bluebird")
execa   = require("execa")
R       = require("ramda")
log     = require("./log")

pickMainProps = R.pick(["stdout", "stderr", "code"])

trimStdio = R.evolve({
  stdout: R.trim,
  stderr: R.trim
})

module.exports = {
  run: (projectRoot, options) ->
    child = null

    run = ->
      return execa.shell(options.cmd, {
        cwd: projectRoot,
        env: _.extend({}, process.env, options.env)
      })
      .then pickMainProps
      .catch pickMainProps # transform rejection into an object
      .then trimStdio

    Promise
    .try(run)
    .timeout(options.timeout)
    .catch Promise.TimeoutError, ->
      child.kill() if child

      msg = "Process timed out\ncommand: #{options.cmd}"
      err = new Error(msg)
      err.timedout = true
      throw err
}
