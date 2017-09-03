const cp = require('child_process')
const extract = require('extract-zip')
const os = require('os')
const Promise = require('bluebird')
const readline = require('readline')
const yauzl = require('yauzl')
const { formErrorText, errors } = require('../errors')
const info = require('./info')
const logger = require('../logger')
const debug = require('debug')('cypress:cli')

const fs = Promise.promisifyAll(require('fs-extra'))

// expose this function for simple testing
const _unzip = ({ zipDestination, destination, width }) => () => {
  debug('unzipping %s', zipDestination)
  debug('into %s', destination)

  if (!zipDestination) {
    throw new Error('Missing zip filename')
  }

  return new Promise((resolve, reject) => {
    return yauzl.open(zipDestination, (err, zipFile) => {
      if (err) return reject(err)

      let count = 0
      const total = Math.floor(zipFile.entryCount / 500)

      const barOptions = {
        total,
        width,
      }
      const bar = info.getProgressBar('Unzipping Cypress', barOptions)

      const tick = () => {
        count += 1
        if ((count % 500) === 0) {
          return bar.tick(1)
        }
      }

      const unzipWithNode = () => {
        const endFn = (err) => {
          if (err) { return reject(err) }

          return resolve()
        }

        const obj = {
          dir: destination,
          onEntry: tick,
        }

        return extract(zipDestination, obj, endFn)
      }

      //# we attempt to first unzip with the native osx
      //# ditto because its less likely to have problems
      //# with corruption, symlinks, or icons causing failures
      //# and can handle resource forks
      //# http://automatica.com.au/2011/02/unzip-mac-os-x-zip-in-terminal/
      const unzipWithOsx = () => {
        const copyingFileRe = /^copying file/

        const sp = cp.spawn('ditto', ['-xkV', zipDestination, destination])
        sp.on('error', () =>
          // f-it just unzip with node
          unzipWithNode()
        )

        sp.on('exit', (code) => {
          if (code === 0) {
            //# make sure we get to 100% on the progress bar
            //# because reading in lines is not really accurate
            bar.tick(100)

            return resolve()
          } else {
            return unzipWithNode()
          }
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
  //# blow away the executable if its found
  return fs.statAsync(options.executable)
  .then(() => fs.removeAsync(options.executable)).then(_unzip(options))
  .catch(_unzip(options))
}

const cleanup = (options) => {
  debug('removing zip file %s', options.zipDestination)
  return fs.removeAsync(options.zipDestination)
}

const logErr = (err) => {
  return formErrorText(errors.failedToUnZip, err)
    .then(logger.log)
}

module.exports = {
  cleanup,
  logErr,
  start,
  _unzip,
}
