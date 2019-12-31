const _ = require('lodash')
const la = require('lazy-ass')
const is = require('check-more-types')
const cp = require('child_process')
const os = require('os')
const yauzl = require('yauzl')
const debug = require('debug')('cypress:cli:unzip')
const extract = require('extract-zip')
const Promise = require('bluebird')
const readline = require('readline')

const { throwFormErrorText, errors } = require('../errors')
const fs = require('../fs')
const util = require('../util')

const unzipTools = {
  extract,
}

// expose this function for simple testing
const unzip = ({ zipFilePath, installDir, progress }) => {
  debug('unzipping from %s', zipFilePath)
  debug('into', installDir)

  if (!zipFilePath) {
    throw new Error('Missing zip filename')
  }

  const startTime = Date.now()
  let yauzlDoneTime = 0

  return fs.ensureDirAsync(installDir)
  .then(() => {
    return new Promise((resolve, reject) => {
      return yauzl.open(zipFilePath, (err, zipFile) => {
        yauzlDoneTime = Date.now()

        if (err) {
          debug('error using yauzl %s', err.message)

          return reject(err)
        }

        const total = zipFile.entryCount

        debug('zipFile entries count', total)

        const started = new Date()

        let percent = 0
        let count = 0

        const notify = (percent) => {
          const elapsed = +new Date() - +started

          const eta = util.calculateEta(percent, elapsed)

          progress.onProgress(percent, util.secsRemaining(eta))
        }

        const tick = () => {
          count += 1

          percent = ((count / total) * 100)
          const displayPercent = percent.toFixed(0)

          return notify(displayPercent)
        }

        const unzipWithNode = () => {
          debug('unzipping with node.js (slow)')

          const endFn = (err) => {
            if (err) {
              debug('error %s', err.message)

              return reject(err)
            }

            debug('node unzip finished')

            return resolve()
          }

          const opts = {
            dir: installDir,
            onEntry: tick,
          }

          debug('calling Node extract tool %s %o', zipFilePath, opts)

          return unzipTools.extract(zipFilePath, opts, endFn)
        }

        const unzipFallback = _.once(unzipWithNode)

        const unzipWithUnzipTool = () => {
          debug('unzipping via `unzip`')

          const inflatingRe = /inflating:/

          const sp = cp.spawn('unzip', ['-o', zipFilePath, '-d', installDir])

          sp.on('error', (err) => {
            debug('unzip tool error: %s', err.message)
            unzipFallback()
          })

          sp.on('close', (code) => {
            debug('unzip tool close with code %d', code)
            if (code === 0) {
              percent = 100
              notify(percent)

              return resolve()
            }

            debug('`unzip` failed %o', { code })

            return unzipFallback()
          })

          sp.stdout.on('data', (data) => {
            if (inflatingRe.test(data)) {
              return tick()
            }
          })

          sp.stderr.on('data', (data) => {
            debug('`unzip` stderr %s', data)
          })
        }

        // we attempt to first unzip with the native osx
        // ditto because its less likely to have problems
        // with corruption, symlinks, or icons causing failures
        // and can handle resource forks
        // http://automatica.com.au/2011/02/unzip-mac-os-x-zip-in-terminal/
        const unzipWithOsx = () => {
          debug('unzipping via `ditto`')

          const copyingFileRe = /^copying file/

          const sp = cp.spawn('ditto', ['-xkV', zipFilePath, installDir])

          // f-it just unzip with node
          sp.on('error', (err) => {
            debug(err.message)
            unzipFallback()
          })

          sp.on('close', (code) => {
            if (code === 0) {
            // make sure we get to 100% on the progress bar
            // because reading in lines is not really accurate
              percent = 100
              notify(percent)

              return resolve()
            }

            debug('`ditto` failed %o', { code })

            return unzipFallback()
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
            return unzipWithUnzipTool()
          case 'win32':
            return unzipWithNode()
          default:
            return
        }
      })
    })
    .tap(() => {
      debug('unzip completed %o', {
        yauzlMs: yauzlDoneTime - startTime,
        unzipMs: Date.now() - yauzlDoneTime,
      })
    })
  })
}

const start = ({ zipFilePath, installDir, progress }) => {
  la(is.unemptyString(installDir), 'missing installDir')
  if (!progress) {
    progress = { onProgress: () => {
      return {}
    } }
  }

  return fs.pathExists(installDir)
  .then((exists) => {
    if (exists) {
      debug('removing existing unzipped binary', installDir)

      return fs.removeAsync(installDir)
    }
  })
  .then(() => {
    return unzip({ zipFilePath, installDir, progress })
  })
  .catch(throwFormErrorText(errors.failedUnzip))
}

module.exports = {
  start,
  utils: {
    unzip,
    unzipTools,
  },
}
