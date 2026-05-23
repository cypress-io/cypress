// we are not requiring everything up front
// to optimize how quickly electron boots while
// in dev or linux production. the reasoning is
// that we likely may need to spawn a new child process
// and its a huge waste of time (about 1.5secs) of
// synchronous requires the first go around just to
// essentially do it all again when we boot the correct
// mode.
import os from 'os'
import type { ChildProcess } from 'child_process'
import Debug from 'debug'
import { getPublicConfigKeys } from '@packages/config'
import { toObject, toArray } from './util/args'
import { telemetry } from '@packages/telemetry'
import { warning as errorsWarning } from './errors'
import { getCwd } from './cwd'
import type { CypressError } from '@packages/errors'
import { toNumber } from 'lodash'
import { GracefulExit } from './util/graceful-exit'
import type { BrowserWindow } from 'electron'
import type { CypressRunResult } from './modes/results'
import { isRunning, scale, setRemoteDebuggingPort } from './util/electron-app'
import * as appData from './util/app_data'
const debug = Debug('cypress:server:cypress')

type Mode = 'exit' | 'info' | 'interactive' | 'pkg' | 'record' | 'results' | 'run' | 'smokeTest' | 'version' | 'returnPkg' | 'exitWithCode'

interface MinimalRunResult {
  totalFailed: number
}

/** Resolved value from {@link runElectron} (in-process Electron vs spawned child). */
type RunElectronResult =
  | number
  | CypressRunResult
  | MinimalRunResult
  | BrowserWindow

function isCypressRunResult (result: any): result is CypressRunResult {
  return result && typeof result === 'object' && 'runs' in result && Array.isArray(result.runs)
}
function isMinimalRunResult (result: any): result is MinimalRunResult {
  return result && typeof result === 'object' && 'totalFailed' in result
}

const showWarningForInvalidConfig = (options: any) => {
  const publicConfigKeys = getPublicConfigKeys()
  const invalidConfigOptions = require('lodash').keys(options.config).reduce((invalid, option) => {
    if (!publicConfigKeys.find((configKey) => configKey === option)) {
      invalid.push(option)
    }

    return invalid
  }, [])

  if (invalidConfigOptions.length && options.invokedFromCli) {
    return errorsWarning('INVALID_CONFIG_OPTION', invalidConfigOptions)
  }

  return undefined
}

function isCypressError (err: unknown): err is CypressError {
  return (err as CypressError).isCypressErr
}

async function exitErr (err: unknown, posixExitCodes?: boolean) {
  // log errors to the console
  // and potentially raygun
  // and exit with 1
  debug('exiting with err', err)

  await require('./errors').logException(err)

  if (isCypressError(err)) {
    if (
      posixExitCodes && (
      err.type === 'CLOUD_CANNOT_PROCEED_IN_PARALLEL_NETWORK' ||
      err.type === 'CLOUD_CANNOT_PROCEED_IN_SERIAL_NETWORK'
    )) {
      return GracefulExit.exitGracefully(112)
    }
  }

  return GracefulExit.exitGracefully(1)
}

export = {
  isCurrentlyRunningElectron () {
    return isRunning()
  },

  runElectron (mode: Mode, options: any): Promise<RunElectronResult> {
    // wrap all of this in a promise to force the
    // promise interface - even if it doesn't matter
    // in dev mode due to cp.spawn
    return Promise.resolve().then(() => {
      // if we have the electron property on versions
      // that means we're already running in electron
      // like in production and we shouldn't spawn a new
      // process
      if (this.isCurrentlyRunningElectron()) {
        // if we weren't invoked from the CLI
        // then display a warning to the user
        if (!options.invokedFromCli) {
          errorsWarning('INVOKED_BINARY_OUTSIDE_NPM_MODULE')
        }

        debug('running Electron currently')

        return require('./modes')(mode, options)
      }

      return new Promise(async (resolve) => {
        debug('starting Electron')
        const cypressElectron = require('@packages/electron')

        const args = require('./util/args').toArray(options)

        debug('electron open arguments %o', args)

        // const mainEntryFile = require.main.filename
        const serverMain = getCwd()

        const child: ChildProcess = await cypressElectron.open(serverMain, args)

        child.on('close', (exitCode, signal) => {
          debug('electron closed with', { code: exitCode, signal })
          const code = signal ? 1 : (exitCode ?? 0)

          if (mode === 'smokeTest') {
            resolve(code)
          } else {
            resolve({ totalFailed: code })
          }
        })
      })
    })
  },

  async start (argv: any = []) {
    debug('starting cypress with argv %o', argv)

    // if the CLI passed "--" somewhere, we need to remove it
    // for https://github.com/cypress-io/cypress/issues/5466
    argv = argv.filter((val) => val !== '--')

    let options

    try {
      options = toObject(argv)

      showWarningForInvalidConfig(options)
    } catch (argumentsError: any) {
      debug('could not parse CLI arguments: %o', argv)

      // note - this is promise-returned call
      return exitErr(argumentsError, Boolean(options?.posixExitCodes))
    }

    debug('from argv %o got options %o', argv, options)

    // @ts-expect-error TODO: Fix type that says attachRecordKey is not a function
    telemetry.exporter()?.attachRecordKey(options.key)

    if (options.headless) {
      // --headless is same as --headed false
      if (options.headed) {
        throw new Error('Impossible options: both headless and headed are true')
      }

      options.headed = false
    }

    if (options.runProject && !options.headed) {
      debug('scaling electron app in headless mode')
      // scale the electron browser window
      // to force retina screens to not
      // upsample their images when offscreen
      // rendering
      await scale()
    }

    // make sure we have the appData folder
    await Promise.all([
      appData.ensure(),
      setRemoteDebuggingPort(),
    ])

    // else determine the mode by
    // the passed in arguments / options
    // and normalize this mode
    let mode = options.mode || 'interactive'

    if (options.version) {
      mode = 'version'
    } else if (options.smokeTest) {
      mode = 'smokeTest'
    } else if (options.returnPkg) {
      mode = 'returnPkg'
    } else if (!(options.exitWithCode == null)) {
      mode = 'exitWithCode'
    } else if (options.runProject) {
      // go into headless mode when running
      // until completion + exit
      mode = 'run'
    }

    return this.startInMode(mode, options)
  },

  async startInMode (mode: Mode, options: any) {
    debug('starting in mode %s with options %o', mode, options)

    if (mode === 'interactive') {
      return this.runElectron(mode, options)
    }

    try {
      switch (mode) {
        case 'version': {
          const pkg = await require('./modes/pkg')(options)
          const version = pkg.version

          // eslint-disable-next-line no-console
          console.log(version)
          break
        }
        case 'info': {
          await require('./modes/info')(options)
          break
        }
        case 'smokeTest': {
          const pong = await this.runElectron(mode, options)

          const code = typeof pong === 'number'
            ? pong
            : typeof pong === 'object' && 'totalFailed' in pong
              ? pong.totalFailed
              : Number(pong ?? 0)

          if (!this.isCurrentlyRunningElectron()) {
            return GracefulExit.exitGracefully(code)
          } else if (pong !== options.ping) {
            return GracefulExit.exitGracefully(1)
          }

          break
        }
        case 'returnPkg': {
          const pkg = await require('./modes/pkg')(options)

          // eslint-disable-next-line no-console
          console.log(JSON.stringify(pkg))
          break
        }
        case 'exitWithCode': {
          return GracefulExit.exitGracefully(toNumber(options.exitWithCode))
          break
        }
        case 'run': {
          const results = await this.runElectron(mode, options)

          if (
            isCypressRunResult(results) &&
            (results.runs.filter((run) => run.skippedSpec).length)
          ) {
              // eslint-disable-next-line no-console
              console.log(require('chalk').magenta('\n  Exiting with non-zero exit code because the run was canceled.'))

              return GracefulExit.exitGracefully(1)
          }

          if (isCypressRunResult(results) || isMinimalRunResult(results)) {
            // Exit code 112 is reserved for network errors in parallel mode
            // All other exit codes are "number of tests that failed," so collapse
            // them to 0/1.
            if (options.posixExitCodes && results.totalFailed !== 112) {
              return GracefulExit.exitGracefully(results.totalFailed ? 1 : 0)
            } else {
              return GracefulExit.exitGracefully(results.totalFailed ?? 0)
            }
          }

          if (typeof results === 'number') {
            return GracefulExit.exitGracefully(results)
          }

          throw new Error('unexpected runElectron result for run mode')
        }
        default: {
          throw new Error(`Cannot start. Invalid mode: '${mode}'`)
        }
      }
    } catch (err) {
      return exitErr(err, options.posixExitCodes)
    }
    debug('end of startInMode, exit 0')

    return GracefulExit.exitGracefully(0)
  },
}
