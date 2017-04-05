const _ = require('lodash')
const cp = require('child_process')
const chalk = require('chalk')

const download = require('../download')
const xvfb = require('./xvfb')

module.exports = {
  spawn (args, options = {}) {
    args = [].concat(args)

    const needsXvfb = xvfb.isNeeded()

    _.defaults(options, {
      verify: false,
      detached: false,
      stdio: [process.stdin, process.stdout, 'ignore'],
    })

    const spawn = () => {
      return download.verify()
      .then(() => download.getPathToExecutable())
      .then((pathToCypress) => {
        const sp = cp.spawn(pathToCypress, args, options)
        if (needsXvfb) {
          //# make sure we close down xvfb
          //# when our spawned process exits
          sp.on('close', xvfb.stop)
        }

        //# when our spawned process exits
        //# make sure we kill our own process
        //# with its exit code (to bubble up errors)
        sp.on('exit', process.exit)

        if (options.detached) {
          sp.unref()
        }

        return sp
      })
    }

    if (needsXvfb) {
      return xvfb.start()
      .then(spawn)
      .catch(() => {
        /* eslint-disable no-console */
        console.log('')
        console.log(chalk.bgRed.white(' -Error- '))
        console.log(chalk.red.underline('Could not start Cypress headlessly. Your CI provider must support XVFB.'))
        console.log('')
        return process.exit(1)
        /* eslint-enable no-console */
      })
    } else {
      return spawn()
    }
  },
}
