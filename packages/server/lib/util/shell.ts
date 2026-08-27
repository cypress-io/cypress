import _ from 'lodash'
import execa from 'execa'
import os from 'os'
import commandExistsModule from 'command-exists'
import debugModule from 'debug'
const log = debugModule('cypress:server:util:shell')

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

let sourcedProfiles: string[] = []

// returns true if Cypress application has been started from
// the terminal shell.
// returns false if Cypress application has been started
// from the Finder / Windows Explorer list
// by double clicking its icon
export const startedNormally = () => {
  return Boolean(process.env._)
}

export const getProfilePath = function (shellPath: string) {
  for (let profilePath in profiles) {
    const regex = profiles[profilePath]

    if (regex.test(shellPath)) {
      return profilePath
    }
  }

  return undefined
}

export const sourceShellCommand = function (cmd, shell) {
  if (!shell) {
    return cmd
  }

  const profilePath = getProfilePath(shell)

  log('shell %s profile %s', shell, profilePath)
  if (sourcedProfiles.includes(profilePath as string)) {
    log('profile has already been sourced')

    return cmd
  }

  const haveShell = startedNormally()

  if (haveShell) {
    // we only need to source once
    // IF THE APP HAS NOT BEEN STARTED BY
    // DOUBLE CLICKING IT FROM FINDER / WINDOWS EXPLORER
    // OTHERWISE NEED TO SOURCE EVERY COMMAND
    sourcedProfiles.push(profilePath as string)
  }

  // sourcing the profile can output un-needed garbage,
  // so suppress it by sending it to /dev/null and ignore
  // any failures with this
  return `source ${profilePath} > /dev/null 2>&1; ${cmd}`
}

export const findBash = () => {
  return execa('which bash', { shell: true })
  .then((val) => val.stdout)
}

export const getShell = function (shell) {
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

export const commandExists = (command) => {
  return Promise.resolve(commandExistsModule(command))
  .then(() => true)
  // commandExists rejects with no error if command does not exist
  // otherwise, it's a legitimate error
  .catch((err) => {
    if (_.isNil(err)) {
      return false
    }

    throw err
  })
}

// for testing
export const reset = () => {
  return sourcedProfiles = []
}
