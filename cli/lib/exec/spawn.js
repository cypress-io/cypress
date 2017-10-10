const _ = require('lodash')
const os = require('os')
const cp = require('child_process')
const Promise = require('bluebird')
const devNull = require('dev-null')
const debug = require('debug')('cypress:cli')

const info = require('../tasks/info')
const xvfb = require('./xvfb')
const { throwFormErrorText, errors } = require('../errors')

function getStdio () {
  if (os.platform() === 'win32') {
    return ['inherit', 'pipe', 'pipe']
  }

  return ['inherit', 'inherit', 'ignore']
}

module.exports = {
  start (args, options = {}) {
    args = [].concat(args)

    _.defaults(options, {
      detached: false,
      stdio: getStdio(),
    })

    const spawn = () => {
      return new Promise((resolve, reject) => {
        const cypressPath = info.getPathToExecutable()
        debug('spawning Cypress %s', cypressPath)
        debug('spawn args %j', args)

        const child = cp.spawn(cypressPath, args, options)
        child.on('close', resolve)
        child.on('error', reject)

        child.stdout && child.stdout.pipe(process.stdout)
        child.stderr && child.stderr.pipe(devNull())

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
