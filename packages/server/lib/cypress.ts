// we are not requiring everything up front
// to optimize how quickly electron boots while
// in dev or linux production. the reasoning is
// that we likely may need to spawn a new child process
// and its a huge waste of time (about 1.5secs) of
// synchronous requires the first go around just to
// essentially do it all again when we boot the correct
// mode.

import Debug from 'debug'
import { getPublicConfigKeys } from '@packages/config'
import argsUtils from './util/args'
import { telemetry } from '@packages/telemetry'
import { getCtx, hasCtx } from '@packages/data-context'
import { warning as errorsWarning } from './errors'
import { getCwd } from './cwd'
import type { CypressError } from '@packages/errors'
import { toNumber } from 'lodash'
const debug = Debug('cypress:server:cypress')
import type { CypressRunResult } from './modes/results'

type Modes = {
  exit: never
  info: void
  interactive: Awaited<ReturnType<typeof import('./modes/interactive')['run']>>
  pkg: Awaited<ReturnType<typeof import('./modes/pkg')>>
  record: any
  results: any
  run: CypressRunResult | { totalFailed: number }
  smokeTest: number
  version: void
  returnPkg: void
  exitWithCode: never
}

const exit = async (code = 0) => {
  // TODO: we shouldn't have to do this
  // but cannot figure out how null is
  // being passed into exit
  debug('about to exit with code', code)

  if (hasCtx()) {
    await getCtx().lifecycleManager.mainProcessWillDisconnect().catch((err: any) => {
      debug('mainProcessWillDisconnect errored with: ', err)
    })
  }

  const span = telemetry.getSpan('cypress')

  span?.setAttribute('exitCode', code)
  span?.end()

  await telemetry.shutdown().catch((err: any) => {
    debug('telemetry shutdown errored with: ', err)
  })

  debug('process.exit', code)

  return process.exit(code)
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
      return exit(112)
    }
  }

  return exit(1)
}

export = {
  async runElectron<T extends keyof Modes> (mode: T, options: any): Promise<Modes[T] | void> {
    // if we have the electron property on versions
    // that means we're already running in electron
    // like in production and we shouldn't spawn a new
    // process
    if (require('./util/electron-app').isRunning()) {
      // if we weren't invoked from the CLI
      // then display a warning to the user
      if (!options.invokedFromCli) {
        errorsWarning('INVOKED_BINARY_OUTSIDE_NPM_MODULE')
      }

      debug('running Electron currently')
      if (mode === 'run') {
        return require('./modes/run').run(options)
      } else if (mode === 'interactive') {
        return require('./modes/interactive').run(options)
      } else if (mode === 'smokeTest') {
        return require('./modes/smoke_test').run(options)
      } else if (mode === 'version') {
        return require('./modes/pkg').version(options)
      } else if (mode === 'info') {
        return require('./modes/info').info(options)
      }
    }

    return new Promise((resolve) => {
      debug('starting Electron')
      const cypressElectron = require('@packages/electron')

      const args = require('./util/args').toArray(options)

      debug('electron open arguments %o', args)

      // const mainEntryFile = require.main.filename
      const serverMain = getCwd()

      return cypressElectron.open(serverMain, args)
    })
  },

  async start (argv: any = []) {
    debug('starting cypress with argv %o', argv)

    // if the CLI passed "--" somewhere, we need to remove it
    // for https://github.com/cypress-io/cypress/issues/5466
    argv = argv.filter((val) => val !== '--')

    let options

    try {
      options = argsUtils.toObject(argv)

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
      require('./util/electron-app').scale()
    }

    // make sure we have the appData folder
    await Promise.all([
      require('./util/app_data').ensure(),
      require('./util/electron-app').setRemoteDebuggingPort(),
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

  async startInMode<T extends keyof Modes>(mode: T, options: any): Promise<Modes[T] | void> {
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
          const pong = await this.runElectron<T>(mode, options) as Modes['smokeTest']

          if (!require('./util/electron-app').isRunning()) {
            return exit(pong)
          } else if (pong !== options.ping) {
            return exit(1)
          }

          break
        }
        case 'returnPkg': {
          const pkg = await (require('./modes/pkg')(options) as Modes['pkg'])

          // eslint-disable-next-line no-console
          console.log(JSON.stringify(pkg))
          break
        }
        case 'exitWithCode': {
          return exit(toNumber(options.exitWithCode))
          break
        }
        case 'run': {
          const results = await this.runElectron<'run'>(mode, options)

          if (results && 'runs' in results && results.runs) {
            const isCanceled = results.runs.filter((run) => run.skippedSpec).length

            if (isCanceled) {
              // eslint-disable-next-line no-console
              console.log(require('chalk').magenta('\n  Exiting with non-zero exit code because the run was canceled.'))

              return exit(1)
            }
          }

          const totalFailed = results && 'totalFailed' in results ? results.totalFailed : undefined

          debug('results.totalFailed, posix?', totalFailed, options.posixExitCodes)

          if (options.posixExitCodes) {
            return exit(totalFailed ? 1 : 0)
          }

          return exit(totalFailed ?? 0)
        }
        default: {
          throw new Error(`Cannot start. Invalid mode: '${mode}'`)
        }
      }
    } catch (err) {
      return exitErr(err, options.posixExitCodes)
    }
    debug('end of startInMode, exit 0')

    return exit(0)
  },
}
