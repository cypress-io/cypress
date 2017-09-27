_       = require("lodash")
Promise = require("bluebird")
cp      = require("./util/child_process")

profiles = {
  "~/.profile": /\/sh$/
  "~/.bash_profile": /\/bash$/
  "~/.cshrc": /\/csh$/
  "~/.profile": /\/ksh$/
  "~/.zshrc": /\/zsh$/
  "~/.config/fish/config.fish": /\/fish$/
}

sourced = false
shell   = null

getProfilePath = (shellPath) ->
  for profilePath, regex of profiles
    return profilePath if regex.test(shellPath)

getShellObj = (pathToShell) ->
  pathToShell = _.trim(pathToShell)

  shell = {
    shellPath: pathToShell
    profilePath: getProfilePath(pathToShell)
  }

  Promise.resolve(shell)

getShell = ->
  return Promise.resolve(shell) if shell

  ## if we didn't get a shell such
  ## as when we're in docker
  if not s = process.env.SHELL
    cp.execAsync("which bash")
    .then(getShellObj)
    .catch ->
      getShellObj("")
  else
    getShellObj(s)

module.exports = {
  reset: ->
    ## for testing purposes
    shell = null

  run: (projectRoot, options) ->
    child = null

    run = ->
      getShell()
      .then (shell) ->
        new Promise (resolve, reject) ->
          cmd = if shell.profilePath and not sourced
            ## we only need to source once
            sourced = true

            ## sourcing the profile can output un-needed garbage,
            ## so suppress it by sending it to /dev/null and ignore
            ## any failures with this
            "source #{shell.profilePath} > /dev/null 2>&1; #{options.cmd}"
          else
            options.cmd

          child = cp.spawn(cmd, {
            cwd: projectRoot
            env: _.extend({}, process.env, options.env)
            shell: shell.shellPath ? true
          })

          output = {
            shell: shell
            stdout: ""
            stderr: ""
          }

          child.stdout.on "data", (data) ->
            output.stdout += data.toString()

          child.stderr.on "data", (data) ->
            output.stderr += data.toString()

          child.on "error", (err) ->
            reject(err)

          child.on "close", (code) ->
            output.code = code
            resolve(output)

    Promise
    .try(run)
    .timeout(options.timeout)
    .catch Promise.TimeoutError, ->
      child.kill() if child

      err = new Error("Process timed out")
      err.timedout = true
      throw err
}
