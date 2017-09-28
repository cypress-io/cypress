_       = require("lodash")
Promise = require("bluebird")
execa   = require("execa")
R       = require("ramda")
log     = require("./log")

pickMainProps = R.pick(["stdout", "stderr", "code"])

module.exports = {
  run: (projectRoot, options) ->
    child = null

    run = ->
      return execa.shell(options.cmd, {
        cwd: projectRoot,
        env: _.extend({}, process.env, options.env)
      }).catch (e)->
        # transform rejection into an object
        pickMainProps(e)

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
