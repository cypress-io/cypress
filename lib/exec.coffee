_       = require("underscore")
str     = require("underscore.string")
cp      = require("child_process")
Promise = require("bluebird")

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
  return shell if shell

  path = str.trim(cp.execSync("echo $SHELL"))
  shell = {
    shellPath: path
    profilePath: getProfilePath(path)
  }
  return shell

module.exports = {
  run: (projectRoot, options) ->
    child = null

    run = ->
      new Promise (resolve, reject) ->
        { profilePath, shellPath } = getShell()

        cmd = if profilePath
          ## sourcing the profile can output un-needed garbage,
          ## so suppress it by sending it to /dev/null
          "source #{profilePath} > /dev/null 2>&1 && #{options.cmd}"
        else
          options.cmd

        child = cp.spawn(cmd, {
          cwd: projectRoot
          env: _.extend({}, process.env, options.env)
          shell: shellPath ? true
        })

        output = {
          stdout: ""
          stderr: ""
        }

        child.stdout.on 'data', (data) ->
          output.stdout += data.toString()

        child.stderr.on 'data', (data) ->
          output.stderr += data.toString()

        child.on 'error', (err) ->
          reject(err)

        child.on 'close', (code) ->
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
