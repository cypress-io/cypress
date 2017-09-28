Promise = require("bluebird")
execa = require("execa")
R = require("ramda")
log = require("../log")

profiles = {
  "~/.profile": /\/sh$/
  "~/.bash_profile": /\/bash$/
  "~/.cshrc": /\/csh$/
  "~/.profile": /\/ksh$/
  "~/.zshrc": /\/zsh$/
  "~/.config/fish/config.fish": /\/fish$/
}

sourcedProfiles = []

getProfilePath = (shellPath) ->
  for profilePath, regex of profiles
    return profilePath if regex.test(shellPath)

sourceShellCommand = (cmd, shell) ->
  profilePath = getProfilePath(shell)
  log("shell %s profile %s", shell, profilePath)
  if sourcedProfiles.includes(profilePath)
    log "profile has already been sourced"
    cmd
  else
    sourcedProfiles.push(profilePath)
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

  findBash()

# for testing
reset = ->
  sourcedProfiles = []

module.exports = {
  reset,
  findBash,
  getShell,
  getProfilePath,
  sourceShellCommand
}
