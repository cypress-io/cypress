const _ = require('lodash')
const cp = require('child_process')
// const chalk = require('chalk')
const Promise = require('bluebird')
const debug = require('debug')('cypress:cli')

const downloadUtils = require('../download/utils')
const xvfb = require('./xvfb')
const { formErrorText, errors } = require('../download/errors')

const logAndFail = (info) => (err) => {
  const text = formErrorText(info, err)
  console.log(text) // eslint-disable-line no-console
  process.exit(1)
}

module.exports = {
  start (args, options = {}) {
    args = [].concat(args)

    const needsXvfb = xvfb.isNeeded()

    _.defaults(options, {
      verify: false,
      detached: false,
      stdio: [process.stdin, process.stdout, 'ignore'],
    })

    const spawn = () => {
      return new Promise((resolve) => {
        const cypressPath = downloadUtils.getPathToExecutable()
        debug('spawning Cypress %s', cypressPath)
        debug('args %j', args)
        debug('some of the options %j', _.pick(options, ['verify', 'detached']))

        const child = cp.spawn(cypressPath, args, options)
        if (needsXvfb) {
          //// make sure we close down xvfb
          //// when our spawned process exits
          child.on('close', xvfb.stop)
        }

        //// when our spawned process exits
        //// make sure we kill our own process
        //// with its exit code (to bubble up errors)
        child.on('exit', process.exit)

        if (options.detached) {
          child.unref()
        }

        resolve(child)
      })
    }

    if (needsXvfb) {
      return xvfb.start()
      .then(spawn)
      .catch(logAndFail(errors.missingXvfb))
    } else {
      return spawn()
    }
  },
}
