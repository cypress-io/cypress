const _ = require('lodash')
const cp = require('child_process')
const os = require('os')
const yauzl = require('yauzl')
const debug = require('debug')('cypress:cli')
const extract = require('extract-zip')
const Promise = require('bluebird')
const readline = require('readline')

const { throwFormErrorText, errors } = require('../errors')
const fs = require('../fs')
const util = require('../util')
const info = require('./info')

// expose this function for simple testing
const unzip = (options = {}) => {
  _.defaults(options, {
    downloadDestination: null,
    onProgress: () => {},
    zipDestination: info.getInstallationDir(),
  })

  const { downloadDestination, zipDestination } = options

  debug('unzipping from %s', downloadDestination)
  debug('into %s', zipDestination)

  if (!downloadDestination) {
    throw new Error('Missing zip filename')
  }

  return new Promise((resolve, reject) => {
    return yauzl.open(downloadDestination, (err, zipFile) => {
      if (err) return reject(err)

      const total = zipFile.entryCount

      debug('zipFile entries count', total)

      const started = new Date()

      let percent = 0
      let count = 0

      const notify = (percent) => {
        const elapsed = new Date() - started

        const eta = util.calculateEta(percent, elapsed)

        options.onProgress(percent, util.secsRemaining(eta))
      }

      const tick = () => {
        count += 1

        percent = ((count / total) * 100).toFixed(0)

        return notify(percent)
      }

      const unzipWithNode = () => {
        const endFn = (err) => {
          if (err) { return reject(err) }

          return resolve()
        }

        const obj = {
          dir: zipDestination,
          onEntry: tick,
        }

        return extract(downloadDestination, obj, endFn)
      }

      //# we attempt to first unzip with the native osx
      //# ditto because its less likely to have problems
      //# with corruption, symlinks, or icons causing failures
      //# and can handle resource forks
      //# http://automatica.com.au/2011/02/unzip-mac-os-x-zip-in-terminal/
      const unzipWithOsx = () => {
        const copyingFileRe = /^copying file/

        const sp = cp.spawn('ditto', ['-xkV', downloadDestination, zipDestination])
        sp.on('error', () =>
          // f-it just unzip with node
          unzipWithNode()
        )

        sp.on('close', (code) => {
          if (code === 0) {
            // make sure we get to 100% on the progress bar
            // because reading in lines is not really accurate
            percent = 100
            notify(percent)

            return resolve()
          }

          return unzipWithNode()
        })

        return readline.createInterface({
          input: sp.stderr,
        })
        .on('line', (line) => {
          if (copyingFileRe.test(line)) {
            return tick()
          }
        })
      }

      switch (os.platform()) {
        case 'darwin':
          return unzipWithOsx()
        case 'linux':
          return unzipWithNode()
        default:
          return
      }
    })
  })
}

const start = (options = {}) => {
  const dir = info.getPathToUserExecutableDir()

  debug('removing existing unzipped directory', dir)

  // blow away the executable if its found
  // and dont worry about errors from remove
  return fs.removeAsync(dir)
  .catchReturn(null)
  .then(() => {
    return unzip(options)
  })
  .catch(throwFormErrorText(errors.failedUnzip))
}

module.exports = {
  start,
}
