import _ from 'lodash'
import la from 'lazy-ass'
import cp from 'child_process'
import os from 'os'
import yauzl from 'yauzl'
import Debug from 'debug'
import extract from 'extract-zip'
import readline from 'readline'
import fs from 'fs-extra'
import { throwFormErrorText, errors } from '../errors'
import util from '../util'

// TODO: this package needs to be replaced as we can't import it in vitest
const is = require('check-more-types')

const debug = Debug('cypress:cli:unzip')

const unzipTools = {
  extract,
}

// expose this function for simple testing
const unzip = async ({ zipFilePath, installDir, progress }: any): Promise<void> => {
  debug('unzipping from %s', zipFilePath)
  debug('into', installDir)

  if (!zipFilePath) {
    throw new Error('Missing zip filename')
  }

  const startTime = Date.now()
  let yauzlDoneTime = 0

  await fs.ensureDir(installDir)

  await new Promise<void>((resolve, reject) => {
    return yauzl.open(zipFilePath, (err: any, zipFile: any) => {
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

      const notify = (percent: number): void => {
        const elapsed = +new Date() - +started

        const eta = util.calculateEta(percent, elapsed)

        progress.onProgress(percent, util.secsRemaining(eta))
      }

      const tick = (): any => {
        count += 1

        percent = ((count / total) * 100)
        const displayPercent = percent.toFixed(0)

        return notify(Number(displayPercent))
      }

      const unzipWithNode = async (): Promise<any> => {
        debug('unzipping with node.js (slow)')

        const opts = {
          dir: installDir,
          onEntry: tick,
        }

        debug('calling Node extract tool %s %o', zipFilePath, opts)

        try {
          await unzipTools.extract(zipFilePath, opts)
          debug('node unzip finished')

          return resolve()
        } catch (err: any) {
          const error = err || new Error('Unknown error with Node extract tool')

          debug('error %s', error.message)

          return reject(error)
        }
      }

      const unzipFallback = _.once(unzipWithNode)

      const unzipWithUnzipTool = (): any => {
        debug('unzipping via `unzip`')

        const inflatingRe = /inflating:/

        const sp = cp.spawn('unzip', ['-o', zipFilePath, '-d', installDir])

        sp.on('error', (err: any) => {
          debug('unzip tool error: %s', err.message)
          unzipFallback()
        })

        sp.on('close', (code: number) => {
          debug('unzip tool close with code %d', code)
          if (code === 0) {
            percent = 100
            notify(percent)

            return resolve()
          }

          debug('`unzip` failed %o', { code })

          return unzipFallback()
        })

        sp.stdout.on('data', (data: any) => {
          if (inflatingRe.test(data)) {
            return tick()
          }
        })

        sp.stderr.on('data', (data: any) => {
          debug('`unzip` stderr %s', data)
        })
      }

      // we attempt to first unzip with the native osx
      // ditto because its less likely to have problems
      // with corruption, symlinks, or icons causing failures
      // and can handle resource forks
      // http://automatica.com.au/2011/02/unzip-mac-os-x-zip-in-terminal/
      const unzipWithOsx = (): any => {
        debug('unzipping via `ditto`')

        const copyingFileRe = /^copying file/

        const sp = cp.spawn('ditto', ['-xkV', zipFilePath, installDir])

        // f-it just unzip with node
        sp.on('error', (err: any) => {
          debug(err.message)
          unzipFallback()
        })

        sp.on('close', (code: number) => {
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
        .on('line', (line: string) => {
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

  debug('unzip completed %o', {
    yauzlMs: yauzlDoneTime - startTime,
    unzipMs: Date.now() - yauzlDoneTime,
  })
}

function isMaybeWindowsMaxPathLengthError (err: any): boolean {
  return os.platform() === 'win32' && err.code === 'ENOENT' && err.syscall === 'realpath'
}

const start = async ({ zipFilePath, installDir, progress }: any): Promise<void> => {
  la(is.unemptyString(installDir), 'missing installDir')
  if (!progress) {
    progress = { onProgress: () => {
      return {}
    } }
  }

  try {
    const installDirExists = await fs.pathExists(installDir)

    if (installDirExists) {
      debug('removing existing unzipped binary', installDir)

      await fs.remove(installDir)
    }

    await unzip({ zipFilePath, installDir, progress })
  } catch (err) {
    const errorTemplate = isMaybeWindowsMaxPathLengthError(err) ?
      errors.failedUnzipWindowsMaxPathLength
      : errors.failedUnzip

    await throwFormErrorText(errorTemplate)(err as string)
  }
}

const unzipModule = {
  start,
  utils: {
    unzip,
    unzipTools,
  },
}

export default unzipModule
