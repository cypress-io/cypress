const _ = require('lodash')
const cp = require('child_process')
const Promise = require('bluebird')
const debug = require('debug')('cypress:cli')

const downloadUtils = require('../download/utils')
const xvfb = require('./xvfb')
const { throwFormErrorText, errors } = require('../errors')

module.exports = {
  start (args, options = {}) {
    args = [].concat(args)

    _.defaults(options, {
      detached: false,
      stdio: [process.stdin, process.stdout, 'ignore'],
    })

    const spawn = () => {
      return new Promise((resolve, reject) => {
        const cypressPath = downloadUtils.getPathToExecutable()
        debug('spawning Cypress %s', cypressPath)
        debug('spawn args %j', args)

        const child = cp.spawn(cypressPath, args, options)
        child.on('close', resolve)
        child.on('error', reject)

        if (options.detached) {
          child.unref()
        }
      })
    }

    const userFriendlySpawn = () =>
      spawn().catch(throwFormErrorText(errors.unexpected))

    const needsXvfb = xvfb.isNeeded()
    debug('needs XVFB?', needsXvfb)

    if (needsXvfb) {
      return xvfb.start()
      .then(userFriendlySpawn)
      .finally(xvfb.stop)
    } else {
      return userFriendlySpawn()
    }
  },
}
