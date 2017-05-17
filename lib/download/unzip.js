const chalk = require('chalk')
const cp = require('child_process')
const extract = require('extract-zip')
const os = require('os')
const ProgressBar = require('progress')
const Promise = require('bluebird')
const readline = require('readline')
const yauzl = require('yauzl')

const fs = Promise.promisifyAll(require('fs-extra'))

const ascii = [
  chalk.white('  -'),
  chalk.blue('Unzipping Cypress  '),
  chalk.yellow('[:bar]'),
  chalk.white(':percent'),
  chalk.gray(':etas'),
]

const start = (options) => {
  const unzip = () => {
    return new Promise((resolve, reject) => {
      return yauzl.open(options.zipDestination, (err, zipFile) => {
        if (err) return reject(err)

        let count = 0
        const total = Math.floor(zipFile.entryCount / 500)

        const bar = new ProgressBar(ascii.join(' '), {
          total,
          width: options.width,
        })

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
            dir: options.destination,
            onEntry: tick,
          }

          return extract(options.zipDestination, obj, endFn)
        }

        //# we attempt to first unzip with the native osx
        //# ditto because its less likely to have problems
        //# with corruption, symlinks, or icons causing failures
        //# and can handle resource forks
        //# http://automatica.com.au/2011/02/unzip-mac-os-x-zip-in-terminal/
        const unzipWithOsx = () => {
          const copyingFileRe = /^copying file/

          const sp = cp.spawn('ditto', ['-xkV', options.zipDestination, options.destination])
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

  //# blow away the executable if its found
  return fs.statAsync(options.executable)
  .then(() => fs.removeAsync(options.executable)).then(unzip)
  .catch(unzip)
}

const cleanup = (options) => {
  return fs.removeAsync(options.zipDestination)
}

const logErr = (err) => {
  /* eslint-disable no-console */
  console.log('')
  console.log(chalk.bgRed.white(' -Error- '))
  console.log(chalk.red.underline('The Cypress App could not be unzipped.'))
  console.log('')
  console.log(chalk.red(err.stack))
  console.log('')
  /* eslint-enable no-console */
}

module.exports = {
  cleanup,
  logErr,
  start,
}
