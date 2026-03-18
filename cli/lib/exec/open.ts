import Debug from 'debug'
import util from '../util'
import { start as spawnStart } from './spawn'
import { start as verifyStart } from '../tasks/verify'
import { processTestingType, checkConfigFile } from './shared'
import { exitWithError } from '../errors'

const debug = Debug('cypress:cli')

/**
 * Maps options collected by the CLI
 * and forms list of CLI arguments to the server.
 *
 * Note: there is lightweight validation, with errors
 * thrown synchronously.
 *
 * @returns {string[]} list of CLI arguments
 */
const processOpenOptions = (options: any = {}): string[] => {
  // In addition to setting the project directory, setting the project option
  // here ultimately decides whether cypress is run in global mode or not.
  // It's first based off whether it's installed globally by npm/yarn (-g).
  // A global install can be overridden by the --project flag, putting Cypress
  // in project mode. A non-global install can be overridden by the --global
  // flag, putting it in global mode.
  if (!util.isInstalledGlobally() && !options.global && !options.project) {
    options.project = process.cwd()
  }

  const args: string[] = []

  if (options.config) {
    args.push('--config', options.config)
  }

  if (options.configFile !== undefined) {
    checkConfigFile(options)
    args.push('--config-file', options.configFile)
  }

  if (options.browser) {
    args.push('--browser', options.browser)
  }

  if (options.env) {
    args.push('--env', options.env)
  }

  if (options.expose) {
    args.push('--expose', options.expose)
  }

  if (options.port) {
    args.push('--port', options.port)
  }

  if (options.project) {
    args.push('--project', options.project)
  }

  if (options.global) {
    args.push('--global', options.global)
  }

  if (options.inspect) {
    args.push('--inspect')
  }

  if (options.inspectBrk) {
    args.push('--inspectBrk')
  }

  args.push(...processTestingType(options))

  debug('opening from options %j', options)
  debug('command line arguments %j', args)

  return args
}

const start = async (options: any = {}): Promise<any> => {
  function open (): any {
    try {
      const args = processOpenOptions(options)

      return spawnStart(args, {
        dev: options.dev,
        detached: Boolean(options.detached),
      })
    } catch (err: any) {
      if (err.details) {
        return exitWithError(err.details)()
      }

      throw err
    }
  }

  if (options.dev) {
    return open()
  }

  await verifyStart()

  return open()
}

export default {
  start,
  processOpenOptions,
}
