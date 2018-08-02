Promise  = require("bluebird")
execa    = require("execa")
R        = require("ramda")
shellEnv = require("shell-env")
log      = require("./log")
utils    = require("./util/shell")

pickMainProps = R.pick(["stdout", "stderr", "code"])

trimStdio = R.evolve({
  stdout: R.trim,
  stderr: R.trim
})

loadShellVars = R.memoize(shellEnv)

module.exports = {
  run: (projectRoot, options) ->
    cmd = options.cmd

    shellCommand = (cmd, cwd, env, shell) ->
      log("cy.exec found shell", shell)
      log("and is running command:", options.cmd)
      log("in folder:", projectRoot)

      execa.shell(cmd, {cwd, env, shell})
        # do we want to return all fields returned by execa?
        .then (result) ->
          result.shell = shell
          result.cmd = cmd
          result
        .then pickMainProps
        .catch pickMainProps # transform rejection into an object
        .then trimStdio

    run = ->
      loadShellVars()
      .then (shellVariables) ->
        env = R.mergeAll([{}, shellVariables, process.env, options.env])
        utils.getShell(env.SHELL)
        .then (shell) ->
          cmd = utils.sourceShellCommand(options.cmd, shell)
          shellCommand(cmd, projectRoot, env, shell)

    Promise
    .try(run)
    .timeout(options.timeout)
    .catch Promise.TimeoutError, ->
      msg = "Process timed out\ncommand: #{options.cmd}"
      err = new Error(msg)
      err.timedOut = true
      throw err
}
