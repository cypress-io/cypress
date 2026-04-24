// @ts-check
import _ from 'lodash'
import commander from 'commander'
import { stripIndent } from 'common-tags'
import logSymbols from 'log-symbols'
import Debug from 'debug'
import util from './util'
import logger from './logger'
import { exitWithError, errors } from './errors'
import cache from './tasks/cache'
import inspect from './tasks/inspect'

import openModule from './exec/open'
import runModule from './exec/run'
import { start } from './tasks/verify'
import installModule from './tasks/install'
import versionModule from './exec/versions'
import infoModule from './exec/info'

const debug = Debug('cypress:cli:cli')

// patch "commander" method called when a user passed an unknown option
// we want to print help for the current command and exit with an error
function unknownOption (this: any, flag: string, type: string = 'option'): void {
  if (this._allowUnknownOption) return

  logger.error()
  logger.error(`  error: unknown ${type}:`, flag)
  logger.error()
  this.outputHelp()
  process.exit(1)
}
commander.Command.prototype.unknownOption = unknownOption

const coerceFalse = (arg: string): boolean => {
  return arg !== 'false'
}

const coerceAnyStringToInt = (arg: any): number => {
  return typeof arg === 'string' ? parseInt(arg) : arg
}

const spaceDelimitedArgsMsg = (flag: string, args: string[]): void => {
  let msg = `
    ${logSymbols.warning} Warning: It looks like you're passing --${flag} a space-separated list of arguments:

    "${args.join(' ')}"

    This will work, but it's not recommended.

    If you are trying to pass multiple arguments, separate them with commas instead:
      cypress run --${flag} arg1,arg2,arg3
  `

  if (flag === 'spec') {
    msg += `
    The most common cause of this warning is using an unescaped glob pattern. If you are
    trying to pass a glob pattern, escape it using quotes:
      cypress run --spec "**/*.spec.js"
    `
  }

  logger.log()
  logger.warn(stripIndent(msg))
  logger.log()
}

const parseVariableOpts = (fnArgs: any[], args: string[]): any => {
  const [opts, unknownArgs] = fnArgs

  if ((unknownArgs && unknownArgs.length) && (opts.spec || opts.tag)) {
    // this will capture space-delimited args after
    // flags that could have possible multiple args
    // but before the next option
    // --spec spec1 spec2 or --tag foo bar

    const multiArgFlags = _.compact([
      opts.spec ? 'spec' : opts.spec,
      opts.tag ? 'tag' : opts.tag,
    ])

    _.forEach(multiArgFlags, (flag: string) => {
      const argIndex = _.indexOf(args, `--${flag}`) + 2
      const nextOptOffset = _.findIndex(_.slice(args, argIndex), (arg: string) => {
        return _.startsWith(arg, '--')
      })
      const endIndex = nextOptOffset !== -1 ? argIndex + nextOptOffset : args.length

      const maybeArgs = _.slice(args, argIndex, endIndex)
      const extraArgs = _.intersection(maybeArgs, unknownArgs)

      if (extraArgs.length) {
        opts[flag] = [opts[flag]].concat(extraArgs)
        spaceDelimitedArgsMsg(flag, opts[flag])
        opts[flag] = opts[flag].join(',')
      }
    })
  }

  debug('variable-length opts parsed %o', { args, opts })

  return util.parseOpts(opts)
}

const descriptions: any = {
  autoCancelAfterFailures: 'overrides the project-level Cloud configuration to set the failed test threshold for auto cancellation or to disable auto cancellation when recording to the Cloud',
  browser: 'runs Cypress in the browser with the given name. if a filesystem path is supplied, Cypress will attempt to use the browser at that path.',
  cacheClear: 'delete all cached binaries',
  cachePrune: 'deletes all cached binaries except for the version currently in use',
  cacheList: 'list cached binary versions',
  cachePath: 'print the path to the binary cache',
  cacheSize: 'Used with the list command to show the sizes of the cached folders',
  ciBuildId: 'the unique identifier for a run on your CI provider. typically a "BUILD_ID" env var. this value is automatically detected for most CI providers',
  component: 'runs component tests',
  config: 'sets configuration values. separate multiple values with a comma. overrides any value in cypress.config.{js,ts,mjs,cjs}.',
  configFile: 'path to script file where configuration values are set. defaults to "cypress.config.{js,ts,mjs,cjs}".',
  detached: 'runs Cypress application in detached mode',
  dev: 'runs cypress in development and bypasses binary check',
  e2e: 'runs end to end tests',
  env: 'sets environment variables. separate multiple values with a comma. overrides any value in cypress.config.{js,ts,mjs,cjs} or cypress.env.json',
  expose: 'sets exposed public configuration variables. separate multiple values with a comma. overrides any value in cypress.config.{js,ts,mjs,cjs}',
  exit: 'keep the browser open after tests finish',
  forceInstall: 'force install the Cypress binary',
  global: 'force Cypress into global mode as if it were globally installed',
  group: 'a named group for recorded runs in Cypress Cloud',
  headed: 'displays the browser instead of running headlessly',
  headless: 'hide the browser instead of running headed (default for cypress run)',
  key: 'your secret Record Key. you can omit this if you set a CYPRESS_RECORD_KEY environment variable.',
  parallel: 'enables concurrent runs and automatic load balancing of specs across multiple machines or processes',
  passWithNoTests: 'pass when no tests are found',
  port: 'runs Cypress on a specific port. overrides any value in cypress.config.{js,ts,mjs,cjs}.',
  project: 'path to the project',
  posixExitCodes: 'use POSIX exit codes for error handling',
  quiet: 'run quietly, using only the configured reporter',
  record: 'records the run. sends test results, screenshots and videos to Cypress Cloud.',
  reporter: 'runs a specific mocha reporter. pass a path to use a custom reporter. defaults to "spec"',
  reporterOptions: 'options for the mocha reporter. defaults to "null"',
  runnerUi: 'displays the Cypress Runner UI',
  noRunnerUi: 'hides the Cypress Runner UI',
  spec: 'runs specific spec file(s). defaults to "all"',
  tag: 'named tag(s) for recorded runs in Cypress Cloud',
  version: 'prints Cypress version',
}

const knownCommands = [
  'cache',
  'help',
  '-h',
  '--help',
  'inspect',
  'install',
  'open',
  'run',
  'verify',
  '-v',
  '--version',
  'version',
  'info',
]

const text = (description: string): string => {
  if (!descriptions[description]) {
    throw new Error(`Could not find description for: ${description}`)
  }

  return descriptions[description]
}

function includesVersion (args: string[]): boolean {
  return (
    _.includes(args, '--version') ||
    _.includes(args, '-v')
  )
}

async function showVersions (opts: any): Promise<any> {
  debug('printing Cypress version')
  debug('additional arguments %o', opts)

  debug('parsed version arguments %o', opts)

  const reportAllVersions = (versions: any): void => {
    logger.always('Cypress package version:', versions.package)
    logger.always('Cypress binary version:', versions.binary)
    logger.always('Electron version:', versions.electronVersion)
    logger.always('Bundled Node version:', versions.electronNodeVersion)
  }

  const reportComponentVersion = (componentName: string, versions: any): void => {
    const names: any = {
      package: 'package',
      binary: 'binary',
      electron: 'electronVersion',
      node: 'electronNodeVersion',
    }

    if (!names[componentName]) {
      throw new Error(`Unknown component name "${componentName}"`)
    }

    const name = names[componentName]

    if (!versions[name]) {
      throw new Error(`Cannot find version for component "${componentName}" under property "${name}"`)
    }

    const version = versions[name]

    logger.always(version)
  }

  const defaultVersions = {
    package: undefined,
    binary: undefined,
    electronVersion: undefined,
    electronNodeVersion: undefined,
  }

  try {
    const versions = (await versionModule.getVersions()) || defaultVersions

    if (opts?.component) {
      reportComponentVersion(opts.component, versions)
    } else {
      reportAllVersions(versions)
    }

    process.exit(0)
  } catch (e: any) {
    util.logErrorExit1(e)
  }
}

const createProgram = (): any => {
  const program = new commander.Command()

  // bug in commander not printing name
  // in usage help docs
  program._name = 'cypress'

  program.usage('<command> [options]')

  return program
}

const addCypressRunCommand = (program: any): any => {
  return program
  .command('run')
  .usage('[options]')
  .description('Runs Cypress tests from the CLI without the GUI')
  .option('--auto-cancel-after-failures <test-failure-count || false>', text('autoCancelAfterFailures'))
  .option('-b, --browser <browser-name-or-path>', text('browser'))
  .option('--ci-build-id <id>', text('ciBuildId'))
  .option('--component', text('component'))
  .option('-c, --config <config>', text('config'))
  .option('-C, --config-file <config-file>', text('configFile'))
  .option('--e2e', text('e2e'))
  .option('-e, --env <env>', text('env'))
  .option('-x, --expose <expose>', text('expose'))
  .option('--group <name>', text('group'))
  .option('-k, --key <record-key>', text('key'))
  .option('--headed', text('headed'))
  .option('--headless', text('headless'))
  .option('--no-exit', text('exit'))
  .option('--parallel', text('parallel'))
  .option('--pass-with-no-tests', text('passWithNoTests'))
  .option('-p, --port <port>', text('port'))
  .option('-P, --project <project-path>', text('project'))
  .option('--posix-exit-codes', text('posixExitCodes'))
  .option('-q, --quiet', text('quiet'))
  .option('--record [bool]', text('record'), coerceFalse)
  .option('-r, --reporter <reporter>', text('reporter'))
  .option('--runner-ui', text('runnerUi'))
  .option('--no-runner-ui', text('noRunnerUi'))
  .option('-o, --reporter-options <reporter-options>', text('reporterOptions'))
  .option('-s, --spec <spec>', text('spec'))
  .option('-t, --tag <tag>', text('tag'))
  .option('--dev', text('dev'), coerceFalse)
}

const addCypressOpenCommand = (program: any): any => {
  return program
  .command('open')
  .usage('[options]')
  .description('Opens Cypress in the interactive GUI.')
  .option('-b, --browser <browser-path>', text('browser'))
  .option('--component', text('component'))
  .option('-c, --config <config>', text('config'))
  .option('-C, --config-file <config-file>', text('configFile'))
  .option('-d, --detached [bool]', text('detached'), coerceFalse)
  .option('--e2e', text('e2e'))
  .option('-e, --env <env>', text('env'))
  .option('-x, --expose <expose>', text('expose'))
  .option('--global', text('global'))
  .option('-p, --port <port>', text('port'))
  .option('-P, --project <project-path>', text('project'))
  .option('--dev', text('dev'), coerceFalse)
}

const maybeAddInspectFlags = (program: any): any => {
  if (process.argv.includes('--dev')) {
    return program
    .option('--inspect', 'Node option')
    .option('--inspect-brk', 'Node option')
  }

  return program
}

/**
 * Casts known command line options for "cypress run" to their intended type.
 * For example if the user passes "--port 5005" the ".port" property should be
 * a number 5005 and not a string "5005".
 *
 * Returns a clone of the original object.
 */
const castCypressOptions = (opts: any): any => {
  // only properties that have type "string | false" in our TS definition
  // require special handling, because CLI parsing takes care of purely
  // boolean arguments
  const castOpts = { ...opts }

  if (_.has(opts, 'port')) {
    castOpts.port = coerceAnyStringToInt(opts.port)
  }

  return castOpts
}

const cliModule = {
  /**
   * Parses `cypress run` command line option array into an object
   * with options that you can feed into a `cypress.run()` module API call.
   * @example
   *  const options = parseRunCommand(['cypress', 'run', '--browser', 'chrome'])
   *  // options is {browser: 'chrome'}
   */
  parseRunCommand (args: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!Array.isArray(args)) {
        return reject(new Error('Expected array of arguments'))
      }

      // make a copy of the input arguments array
      // and add placeholders where "node ..." would usually be
      // also remove "cypress" keyword at the start if present
      const cliArgs = args[0] === 'cypress' ? [...args.slice(1)] : [...args]

      cliArgs.unshift(null as any, null as any)

      debug('creating program parser')
      const program = createProgram()

      maybeAddInspectFlags(addCypressRunCommand(program))
      .action((...fnArgs: any[]) => {
        debug('parsed Cypress run %o', fnArgs)
        const options = parseVariableOpts(fnArgs, cliArgs)

        debug('parsed options %o', options)

        const casted = castCypressOptions(options)

        debug('casted options %o', casted)
        resolve(casted)
      })

      debug('parsing args: %o', cliArgs)
      program.parse(cliArgs)
    })
  },

  /**
   * Parses `cypress open` command line option array into an object
   * with options that you can feed into cy.openModeSystemTest test calls
   * @example
   *  const options = parseOpenCommand(['cypress', 'open', '--browser', 'chrome'])
   *  // options is {browser: 'chrome'}
   */
  parseOpenCommand (args: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!Array.isArray(args)) {
        return reject(new Error('Expected array of arguments'))
      }

      // make a copy of the input arguments array
      // and add placeholders where "node ..." would usually be
      // also remove "cypress" keyword at the start if present
      const cliArgs = args[0] === 'cypress' ? [...args.slice(1)] : [...args]

      cliArgs.unshift(null as any, null as any)

      debug('creating program parser')
      const program = createProgram()

      maybeAddInspectFlags(addCypressOpenCommand(program))
      .action((...fnArgs: any[]) => {
        debug('parsed Cypress open %o', fnArgs)
        const options = parseVariableOpts(fnArgs, cliArgs)

        debug('parsed options %o', options)

        const casted = castCypressOptions(options)

        debug('casted options %o', casted)
        resolve(casted)
      })

      debug('parsing args: %o', cliArgs)
      program.parse(cliArgs)
    })
  },

  /**
   * Parses the command line and kicks off Cypress process.
   */
  async init (args?: string[]): Promise<any> {
    if (!args) {
      args = process.argv
    }

    const { CYPRESS_INTERNAL_ENV, CYPRESS_DOWNLOAD_USE_CA } = process.env

    // `cypress inspect` subcommands are designed to be scripted (often with
    // `--json` piped into `jq`). Silence logger-driven banners/warnings so
    // stdout stays clean. Errors (logger.error) still print.
    if (args[2] === 'inspect') {
      process.env.npm_config_loglevel = 'silent'
    }

    if (process.env.CYPRESS_DOWNLOAD_USE_CA) {
      let msg = `
        ${logSymbols.warning} Warning: It looks like you're setting CYPRESS_DOWNLOAD_USE_CA=${CYPRESS_DOWNLOAD_USE_CA}

        The environment variable "CYPRESS_DOWNLOAD_USE_CA" is no longer required to be set.
        
        You can safely unset this environment variable.
      `

      logger.log()
      logger.warn(stripIndent(msg))
      logger.log()
    }

    if (!util.isValidCypressInternalEnvValue(CYPRESS_INTERNAL_ENV)) {
      debug('invalid CYPRESS_INTERNAL_ENV value', CYPRESS_INTERNAL_ENV)

      return exitWithError(errors.invalidCypressEnv)(
        `CYPRESS_INTERNAL_ENV=${CYPRESS_INTERNAL_ENV}`,
      )
    }

    if (util.isNonProductionCypressInternalEnvValue(CYPRESS_INTERNAL_ENV)) {
      debug('non-production CYPRESS_INTERNAL_ENV value', CYPRESS_INTERNAL_ENV)

      let msg = `
        ${logSymbols.warning} Warning: It looks like you're passing CYPRESS_INTERNAL_ENV=${CYPRESS_INTERNAL_ENV}

        The environment variable "CYPRESS_INTERNAL_ENV" is reserved and should only be used internally.

        Unset the "CYPRESS_INTERNAL_ENV" environment variable and run Cypress again.
      `

      logger.log()
      logger.warn(stripIndent(msg))
      logger.log()
    }

    const program = createProgram()

    program
    .command('help')
    .description('Shows CLI help and exits')
    .action(() => {
      program.help()
    })

    const handleVersion = (cmd: any): any => {
      return cmd
      .option('--component <package|binary|electron|node>', 'component to report version for')
      .action((opts: any, ...other: any[]) => {
        showVersions(util.parseOpts(opts))
      })
    }

    handleVersion(program
    .storeOptionsAsProperties()
    .option('-v, --version', text('version'))
    .command('version')
    .description(text('version')))

    maybeAddInspectFlags(addCypressOpenCommand(program))
    .action(async (opts: any) => {
      debug('opening Cypress')

      try {
        const code = await openModule.start(util.parseOpts(opts))

        process.exit(code)
      } catch (e: any) {
        util.logErrorExit1(e)
      }
    })

    maybeAddInspectFlags(addCypressRunCommand(program))
    .action(async (...fnArgs: any[]) => {
      debug('running Cypress with args %o', fnArgs)
      try {
        const code = await runModule.start(parseVariableOpts(fnArgs, args as string[]))

        process.exit(code)
      } catch (e: any) {
        util.logErrorExit1(e)
      }
    })

    program
    .command('install')
    .usage('[options]')
    .description(
      'Installs the Cypress executable matching this package\'s version',
    )
    .option('-f, --force', text('forceInstall'))
    .action(async (opts: any) => {
      try {
        await installModule.start(util.parseOpts(opts))
      } catch (e: any) {
        util.logErrorExit1(e)
      }
    })

    program
    .command('verify')
    .usage('[options]')
    .description(
      'Verifies that Cypress is installed correctly and executable',
    )
    .option('--dev', text('dev'), coerceFalse)
    .action(async (opts: any) => {
      const defaultOpts = { force: true, welcomeMessage: false }
      const parsedOpts = util.parseOpts(opts)
      const options = _.extend(parsedOpts, defaultOpts)

      try {
        await start(options)
      } catch (e: any) {
        util.logErrorExit1(e)
      }
    })

    program
    .command('cache')
    .usage('[command]')
    .description('Manages the Cypress binary cache')
    .option('list', text('cacheList'))
    .option('path', text('cachePath'))
    .option('clear', text('cacheClear'))
    .option('prune', text('cachePrune'))
    .option('--size', text('cacheSize'))
    .action(async function (this: any, opts: any, args: string[]) {
      if (!args || !args.length) {
        this.outputHelp()
        process.exit(1)
      }

      const [command] = args

      if (!_.includes(['list', 'path', 'clear', 'prune'], command)) {
        unknownOption.call(this, `cache ${command}`, 'command')
      }

      if (command === 'list') {
        debug('cache command %o', {
          command,
          size: opts.size,
        })

        try {
          const result = await cache.list(opts.size)

          return result
        } catch (e: any) {
          if (e.code === 'ENOENT') {
            logger.always('No cached binary versions were found.')
            process.exit(0)
          }

          util.logErrorExit1(e)
        }
      }

      cache[command]()
    })

    program
    .command('inspect')
    .usage('[command]')
    .description('Inspect and control a running cypress open instance')
    .option('--json', 'Output JSON instead of human-readable text')
    .option('--instance <selector>', 'Select an instance by pid or projectRoot substring (when multiple are running)')
    .option('--no-relaunch', 'For `switch`: update testing type without relaunching the browser')
    .option('--wait', 'For `spec open`: block until the spec finishes (exits 0 on pass, 1 on fail, 124 on timeout)')
    .option('--timeout <ms>', 'For `switch` / `spec open --wait` / `browser open|close` / `project open|clear`: milliseconds to wait before giving up (default 30000, 120000 for spec open)', coerceAnyStringToInt)
    .action(async function (this: any, opts: any, args: string[]) {
      const [command = 'list', positional, subPositional] = args || []

      const topLevel = ['list', 'status', 'spec', 'test', 'command', 'aut', 'switch', 'browser', 'project']

      if (!_.includes(topLevel, command)) {
        unknownOption.call(this, `inspect ${command}`, 'command')
      }

      // `browser`, `project`, and `spec` are grouping commands with their own
      // nested actions. Validate the sub-action up-front so unknown values
      // fail fast with a consistent error shape.
      if (command === 'browser') {
        const browserActions = ['list', 'open', 'close']
        const action = positional || 'list'

        if (!_.includes(browserActions, action)) {
          unknownOption.call(this, `inspect browser ${action}`, 'command')
        }
      }

      if (command === 'project') {
        const projectActions = ['list', 'open', 'add', 'clear']
        const action = positional || 'list'

        if (!_.includes(projectActions, action)) {
          unknownOption.call(this, `inspect project ${action}`, 'command')
        }
      }

      if (command === 'spec') {
        // `inspect spec` with no positional reports the current spec.
        // `inspect spec list` and `inspect spec open <name>` are the subactions.
        const specActions = ['list', 'open']

        if (positional && !_.includes(specActions, positional)) {
          unknownOption.call(this, `inspect spec ${positional}`, 'command')
        }
      }

      if (command === 'test') {
        // `inspect test list` — enumerate tests in the current spec.
        // `inspect test open <selector>` — Studio-activate a specific test.
        // `inspect test close` — deactivate Studio.
        // Bare `inspect test` defaults to `list` (same pattern as browser/project).
        const testActions = ['list', 'open', 'close']

        if (positional && !_.includes(testActions, positional)) {
          unknownOption.call(this, `inspect test ${positional}`, 'command')
        }
      }

      if (command === 'command') {
        // `inspect command list` — commands for the Studio-active test.
        // `inspect command info <selector...>` — read-only detail (one or many), no pin side effect.
        // `inspect command pin <selector>` — pin a specific command in the reporter.
        // `inspect command unpin` — clear any pin.
        // Bare `inspect command` prints details for the currently pinned command.
        const commandActions = ['list', 'info', 'pin', 'unpin']

        if (positional && !_.includes(commandActions, positional)) {
          unknownOption.call(this, `inspect command ${positional}`, 'command')
        }
      }

      if (command === 'aut') {
        // `inspect aut` — url/title/viewport of the AUT iframe.
        // `inspect aut dom <selector>` — CSS-selector query against the AUT DOM.
        // `inspect aut snapshot` — compact accessibility tree with unique selectors.
        // All require Studio to be active (`inspect test open <selector>` first).
        const autActions = ['dom', 'snapshot']

        if (positional && !_.includes(autActions, positional)) {
          unknownOption.call(this, `inspect aut ${positional}`, 'command')
        }
      }

      const isBrowserOpenOrClose = command === 'browser' && (positional === 'open' || positional === 'close')
      const isProjectTimed = command === 'project' && (positional === 'open' || positional === 'clear')
      const isSpecOpen = command === 'spec' && positional === 'open'
      const needsTimeout = command === 'switch' || isSpecOpen || isBrowserOpenOrClose || isProjectTimed

      if (needsTimeout) {
        if (opts.timeout !== undefined && (Number.isNaN(opts.timeout) || opts.timeout <= 0)) {
          logger.error()
          logger.error('  error: --timeout must be a positive integer (milliseconds)')
          logger.error()
          this.outputHelp()
          process.exit(1)
        }
      }

      try {
        if (command === 'spec') {
          const action = positional

          if (action === 'list') {
            await inspect.specList(opts)
          } else if (action === 'open') {
            await inspect.specOpen({ ...opts, name: subPositional })
          } else {
            await inspect.specCurrent(opts)
          }
        } else if (command === 'test') {
          const action = positional

          if (action === 'open') {
            await inspect.testOpen({ ...opts, selector: subPositional })
          } else if (action === 'close') {
            await inspect.testClose(opts)
          } else if (action === 'list') {
            await inspect.testList(opts)
          } else {
            // Bare `inspect test` — Studio-scoped view of the current test
            // and its command log. Errors if Studio isn't active.
            await inspect.testCurrent(opts)
          }
        } else if (command === 'command') {
          const action = positional

          if (action === 'pin') {
            await inspect.commandPin({ ...opts, selector: subPositional })
          } else if (action === 'unpin') {
            await inspect.commandUnpin(opts)
          } else if (action === 'list') {
            await inspect.commandList(opts)
          } else if (action === 'info') {
            // `info` accepts 1..N selectors as trailing positionals.
            // Shape of `args` is [command, action, ...selectors].
            await inspect.commandInfo({ ...opts, selectors: (args || []).slice(2) })
          } else {
            // Bare `inspect command` — detail view of the currently pinned
            // command, with consoleProps. Errors if nothing is pinned.
            await inspect.commandCurrent(opts)
          }
        } else if (command === 'aut') {
          const action = positional

          if (action === 'dom') {
            await inspect.autDom({ ...opts, selector: subPositional })
          } else if (action === 'snapshot') {
            await inspect.autSnapshot(opts)
          } else {
            await inspect.aut(opts)
          }
        } else if (command === 'switch') {
          // Commander maps `--no-relaunch` to `opts.relaunch === false`;
          // normalize to `noRelaunch: true` for the handler's API.
          const noRelaunch = opts.relaunch === false

          await inspect.switch({ ...opts, mode: positional, noRelaunch })
        } else if (command === 'browser') {
          const action = positional || 'list'

          if (action === 'open') {
            await inspect.browserOpen({ ...opts, name: subPositional })
          } else if (action === 'close') {
            await inspect.browserClose(opts)
          } else {
            await inspect.browserList(opts)
          }
        } else if (command === 'project') {
          const action = positional || 'list'

          if (action === 'open') {
            await inspect.projectOpen({ ...opts, path: subPositional })
          } else if (action === 'add') {
            await inspect.projectAdd({ ...opts, path: subPositional })
          } else if (action === 'clear') {
            await inspect.projectClear(opts)
          } else {
            await inspect.projectList(opts)
          }
        } else {
          await inspect[command as 'list' | 'status'](opts)
        }
      } catch (e: any) {
        util.logErrorExit1(e)
      }
    })

    program
    .command('info')
    .usage('[command]')
    .description('Prints Cypress and system information')
    .option('--dev', text('dev'), coerceFalse)
    .action(async (opts: any) => {
      try {
        const code = await infoModule.start(opts)

        process.exit(code)
      } catch (e: any) {
        util.logErrorExit1(e)
      }
    })

    debug('cli starts with arguments %j', args)
    util.printNodeOptions()

    // if there are no arguments
    if (args.length <= 2) {
      debug('printing help')
      program.help()
      // exits
    }

    const firstCommand = args[2]

    if (!_.includes(knownCommands, firstCommand)) {
      debug('unknown command %s', firstCommand)
      logger.error('Unknown command', `"${firstCommand}"`)
      program.outputHelp()

      return process.exit(1)
    }

    if (includesVersion(args)) {
      // commander 2.11.0 changes behavior
      // and now does not understand top level options
      // .option('-v, --version').command('version')
      // so we have to manually catch '-v, --version'
      handleVersion(program)
    }

    debug('program parsing arguments')

    return program.parse(args)
  },
}

export default cliModule
