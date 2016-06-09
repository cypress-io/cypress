_       = require("underscore")
str     = require("underscore.string")
cp      = require("child_process")
Promise = require("bluebird")

exec = Promise.promisify(cp.exec)

profiles = {
  "~/.profile": /\/sh$/
  "~/.bash_profile": /\/bash$/
  "~/.cshrc": /\/csh$/
  "~/.profile": /\/ksh$/
  "~/.zshrc": /\/zsh$/
  "~/.config/fish/config.fish": /\/fish$/
}

getProfilePath = (shellPath) ->
  for profilePath, regex of profiles
    return profilePath if regex.test(shellPath)

shell = null

getShell = ->
  return Promise.resolve(shell) if shell

  exec("echo $SHELL").then (shell) ->
    path = str.trim(shell)
    shell = {
      shellPath: path
      profilePath: getProfilePath(path)
    }
    return shell

module.exports = {
  run: (projectRoot, options) ->
    child = null

    run = ->
      getShell().then (shell) ->
        new Promise (resolve, reject) ->

          cmd = if shell.profilePath
            ## sourcing the profile can output un-needed garbage,
            ## so suppress it by sending it to /dev/null
            "source #{shell.profilePath} > /dev/null 2>&1 && #{options.cmd}"
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
