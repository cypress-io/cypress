/* eslint-disable
    no-cond-assign,
    no-dupe-keys,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Promise = require('bluebird')
const execa = require('execa')
const R = require('ramda')
const os = require('os')
const log = require('../log')

const isWindows = () => {
  return os.platform() === 'win32'
}

const profiles = {
  '~/.profile': /\/sh$/,
  '~/.bash_profile': /\/bash$/,
  '~/.cshrc': /\/csh$/,
  '~/.profile': /\/ksh$/,
  '~/.zshrc': /\/zsh$/,
  '~/.config/fish/config.fish': /\/fish$/,
}

let sourcedProfiles = []

//# returns true if Cypress application has been started from
//# the terminal shell.
//# returns false if Cypress application has been started
//# from the Finder / Windows Explorer list
//# by double clicking its icon
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
    //# we only need to source once
    //# IF THE APP HAS NOT BEEN STARTED BY
    //# DOUBLE CLICKING IT FROM FINDER / WINDOWS EXPLORER
    //# OTHERWISE NEED TO SOURCE EVERY COMMAND
    sourcedProfiles.push(profilePath)
  }

  //# sourcing the profile can output un-needed garbage,
  //# so suppress it by sending it to /dev/null and ignore
  //# any failures with this
  return `source ${profilePath} > /dev/null 2>&1; ${cmd}`

}

const findBash = () => {
  return execa.shell('which bash')
  .then(R.prop('stdout'))
}


const getShell = function (shell) {
  let s

  if (shell) {
    return Promise.resolve(shell)
  }

  //# if we didn't get a shell such
  //# as when we're in docker
  if (s = process.env.SHELL) {
    return Promise.resolve(s)
  }

  if (isWindows()) {
    log('use default shell on Windows')

    return Promise.resolve()
  }

  return findBash()
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
}
