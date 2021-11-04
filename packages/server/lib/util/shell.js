const _ = require('lodash')
const Promise = require('bluebird')
const execa = require('execa')
const os = require('os')
const commandExistsModule = require('command-exists')
const log = require('../log')

const isWindows = () => {
  return os.platform() === 'win32'
}

const profiles = {
  '~/.profile': /\/k?sh$/,
  '~/.bash_profile': /\/bash$/,
  '~/.cshrc': /\/csh$/,
  '~/.zshrc': /\/zsh$/,
  '~/.config/fish/config.fish': /\/fish$/,
}

let sourcedProfiles = []

// returns true if Cypress application has been started from
// the terminal shell.
// returns false if Cypress application has been started
// from the Finder / Windows Explorer list
// by double clicking its icon
const startedNormally = () => {
  return Boolean(process.env._)
}

const getProfilePath = function (shellPath) {
  for (let profilePath in profiles) {
    const regex = profiles[profilePath]

    if (regex.test(shellPath)) {
      return profilePath
    }
  }
}

const sourceShellCommand = function (cmd, shell) {
  if (!shell) {
    return cmd
  }

  const profilePath = getProfilePath(shell)

  log('shell %s profile %s', shell, profilePath)
  if (sourcedProfiles.includes(profilePath)) {
    log('profile has already been sourced')

    return cmd
  }

  const haveShell = startedNormally()

  if (haveShell) {
    // we only need to source once
    // IF THE APP HAS NOT BEEN STARTED BY
    // DOUBLE CLICKING IT FROM FINDER / WINDOWS EXPLORER
    // OTHERWISE NEED TO SOURCE EVERY COMMAND
    sourcedProfiles.push(profilePath)
  }

  // sourcing the profile can output un-needed garbage,
  // so suppress it by sending it to /dev/null and ignore
  // any failures with this
  return `source ${profilePath} > /dev/null 2>&1; ${cmd}`
}

const findBash = () => {
  return execa.shell('which bash')
  .then((val) => val.stdout)
}

const getShell = function (shell) {
  if (shell) {
    return Promise.resolve(shell)
  }

  // if we didn't get a shell such
  // as when we're in docker
  let s = process.env.SHELL

  if (s) {
    return Promise.resolve(s)
  }

  if (isWindows()) {
    log('use default shell on Windows')

    return Promise.resolve()
  }

  return findBash()
}

const commandExists = (command) => {
  return Promise.resolve(commandExistsModule(command))
  .return(true)
  // commandExists rejects with no error if command does not exist
  // otherwise, it's a legitimate error
  .catchReturn(_.isNil, false)
}

// for testing
const reset = () => {
  return sourcedProfiles = []
}

module.exports = {
  reset,
  findBash,
  getShell,
  getProfilePath,
  sourceShellCommand,
  startedNormally,
  commandExists,
}
