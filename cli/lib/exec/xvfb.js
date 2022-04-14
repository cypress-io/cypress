const os = require('os')
const Promise = require('bluebird')
const Xvfb = require('@cypress/xvfb')
const { stripIndent } = require('common-tags')
const Debug = require('debug')
const { throwFormErrorText, errors } = require('../errors')
const util = require('../util')

const debug = Debug('cypress:cli')
const debugXvfb = Debug('cypress:xvfb')

debug.Debug = debugXvfb.Debug = Debug

const xvfbOptions = {
  displayNum: process.env.XVFB_DISPLAY_NUM,
  timeout: 30000, // milliseconds
  // need to explicitly define screen otherwise electron will crash
  // https://github.com/cypress-io/cypress/issues/6184
  xvfb_args: ['-screen', '0', '1280x1024x24'],
  onStderrData (data) {
    if (debugXvfb.enabled) {
      debugXvfb(data.toString())
    }
  },
}

const xvfb = Promise.promisifyAll(new Xvfb(xvfbOptions))

module.exports = {
  _debugXvfb: debugXvfb, // expose for testing

  _xvfb: xvfb, // expose for testing

  _xvfbOptions: xvfbOptions, // expose for testing

  start () {
    debug('Starting Xvfb')

    return xvfb.startAsync()
    .return(null)
    .catch({ nonZeroExitCode: true }, throwFormErrorText(errors.nonZeroExitCodeXvfb))
    .catch((err) => {
      if (err.known) {
        throw err
      }

      return throwFormErrorText(errors.missingXvfb)(err)
    })
  },

  stop () {
    debug('Stopping Xvfb')

    return xvfb.stopAsync()
    .return(null)
    .catch(() => {
      // noop
    })
  },

  isNeeded () {
    if (process.env.ELECTRON_RUN_AS_NODE) {
      debug('Environment variable ELECTRON_RUN_AS_NODE detected, xvfb is not needed')

      return false // xvfb required for electron processes only.
    }

    if (os.platform() !== 'linux') {
      return false
    }

    if (process.env.DISPLAY) {
      const issueUrl = util.getGitHubIssueUrl(4034)

      const message = stripIndent`
        DISPLAY environment variable is set to ${process.env.DISPLAY} on Linux
        Assuming this DISPLAY points at working X11 server,
        Cypress will not spawn own Xvfb

        NOTE: if the X11 server is NOT working, Cypress will exit without explanation,
          see ${issueUrl}
        Solution: Unset the DISPLAY variable and try again:
          DISPLAY= npx cypress run ...
      `

      debug(message)

      return false
    }

    debug('undefined DISPLAY environment variable')
    debug('Cypress will spawn its own Xvfb')

    return true
  },

  // async method, resolved with Boolean
  verify () {
    return xvfb.startAsync()
    .return(true)
    .catch((err) => {
      debug('Could not verify xvfb: %s', err.message)

      return false
    })
    .finally(xvfb.stopAsync)
  },
}
