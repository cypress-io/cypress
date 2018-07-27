const la = require('lazy-ass')
const is = require('check-more-types')
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

// expose this function for simple testing
const unzip = ({ zipFilePath, installDir, progress }) => {

  debug('unzipping from %s', zipFilePath)
  debug('into', installDir)

  if (!zipFilePath) {
    throw new Error('Missing zip filename')
  }

  return fs.ensureDirAsync(installDir)
  .then(() => {
    return new Promise((resolve, reject) => {
      return yauzl.open(zipFilePath, (err, zipFile) => {
        if (err) return reject(err)
        // debug('zipfile.paths:', zipFile)
        // zipFile.on('entry', debug)
        // debug(zipFile.readEntry())
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
          const endFn = (err) => {
            if (err) { return reject(err) }

            return resolve()
          }

          const opts = {
            dir: installDir,
            onEntry: tick,
          }

          return extract(zipFilePath, opts, endFn)
        }

        //# we attempt to first unzip with the native osx
        //# ditto because its less likely to have problems
        //# with corruption, symlinks, or icons causing failures
        //# and can handle resource forks
        //# http://automatica.com.au/2011/02/unzip-mac-os-x-zip-in-terminal/
        const unzipWithOsx = () => {
          const copyingFileRe = /^copying file/

          const sp = cp.spawn('ditto', ['-xkV', zipFilePath, installDir])
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
          case 'win32':
            return unzipWithNode()
          default:
            return
        }
      })
    })
  })
}

const start = ({ zipFilePath, installDir, progress }) => {
  la(is.unemptyString(installDir), 'missing installDir')
  if (!progress) progress = { onProgress: () => ({}) }

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
}
