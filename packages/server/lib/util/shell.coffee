Promise = require("bluebird")
execa = require("execa")
R = require("ramda")
os = require("os")
log = require("../log")

isWindows = ->
  os.platform() == "win32"

profiles = {
  "~/.profile": /\/sh$/
  "~/.bash_profile": /\/bash$/
  "~/.cshrc": /\/csh$/
  "~/.profile": /\/ksh$/
  "~/.zshrc": /\/zsh$/
  "~/.config/fish/config.fish": /\/fish$/
}

sourcedProfiles = []

## returns true if Cypress application has been started from
## the terminal shell.
## returns false if Cypress application has been started
## from the Finder / Windows Explorer list
## by double clicking its icon
startedNormally = ->
  Boolean(process.env._)

getProfilePath = (shellPath) ->
  for profilePath, regex of profiles
    return profilePath if regex.test(shellPath)

sourceShellCommand = (cmd, shell) ->
  if not shell
    return cmd
  profilePath = getProfilePath(shell)
  log("shell %s profile %s", shell, profilePath)
  if sourcedProfiles.includes(profilePath)
    log "profile has already been sourced"
    cmd
  else
    haveShell = startedNormally()
    if haveShell
      ## we only need to source once
      ## IF THE APP HAS NOT BEEN STARTED BY
      ## DOUBLE CLICKING IT FROM FINDER / WINDOWS EXPLORER
      ## OTHERWISE NEED TO SOURCE EVERY COMMAND
      sourcedProfiles.push(profilePath)
    ## sourcing the profile can output un-needed garbage,
    ## so suppress it by sending it to /dev/null and ignore
    ## any failures with this
    "source #{profilePath} > /dev/null 2>&1; #{cmd}"

findBash = ->
  execa.shell("which bash")
  .then(R.prop("stdout"))

getShell = (shell) ->
  return Promise.resolve(shell) if shell

  ## if we didn't get a shell such
  ## as when we're in docker
  if s = process.env.SHELL
    return Promise.resolve(s)

  if isWindows()
    log("use default shell on Windows")
    return Promise.resolve()

  findBash()

# for testing
reset = ->
  sourcedProfiles = []

module.exports = {
  reset,
  findBash,
  getShell,
  getProfilePath,
  sourceShellCommand,
  startedNormally
}
