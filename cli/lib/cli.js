// @ts-check
const _ = require('lodash')
const R = require('ramda')
const commander = require('commander')
const { stripIndent } = require('common-tags')
const logSymbols = require('log-symbols')
const debug = require('debug')('cypress:cli:cli')
const util = require('./util')
const logger = require('./logger')
const errors = require('./errors')
const cache = require('./tasks/cache')

// patch "commander" method called when a user passed an unknown option
// we want to print help for the current command and exit with an error
function unknownOption (flag, type = 'option') {
  if (this._allowUnknownOption) return

  logger.error()
  logger.error(`  error: unknown ${type}:`, flag)
  logger.error()
  this.outputHelp()
  util.exit(1)
}
commander.Command.prototype.unknownOption = unknownOption

const coerceFalseOrString = (arg) => {
  return arg !== 'false' ? arg : false
}

const coerceFalse = (arg) => {
  return arg !== 'false'
}

const coerceAnyStringToInt = (arg) => {
  return typeof arg === 'string' ? parseInt(arg) : arg
}

const spaceDelimitedArgsMsg = (flag, args) => {
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

const parseVariableOpts = (fnArgs, args) => {
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

    _.forEach(multiArgFlags, (flag) => {
      const argIndex = _.indexOf(args, `--${flag}`) + 2
      const nextOptOffset = _.findIndex(_.slice(args, argIndex), (arg) => {
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

const descriptions = {
  browserOpenMode: 'path to a custom browser to be added to the list of available browsers in Cypress',
  browserRunMode: 'runs Cypress in the browser with the given name. if a filesystem path is supplied, Cypress will attempt to use the browser at that path.',
  cacheClear: 'delete all cached binaries',
  cachePrune: 'deletes all cached binaries except for the version currently in use',
  cacheList: 'list cached binary versions',
  cachePath: 'print the path to the binary cache',
  cacheSize: 'Used with the list command to show the sizes of the cached folders',
  ciBuildId: 'the unique identifier for a run on your CI provider. typically a "BUILD_ID" env var. this value is automatically detected for most CI providers',
  config: 'sets configuration values. separate multiple values with a comma. overrides any value in cypress.json.',
  configFile: 'path to JSON file where configuration values are set. defaults to "cypress.json". pass "false" to disable.',
  detached: 'runs Cypress application in detached mode',
  dev: 'runs cypress in development and bypasses binary check',
  env: 'sets environment variables. separate multiple values with a comma. overrides any value in cypress.json or cypress.env.json',
  exit: 'keep the browser open after tests finish',
  forceInstall: 'force install the Cypress binary',
  global: 'force Cypress into global mode as if its globally installed',
  group: 'a named group for recorded runs in the Cypress Dashboard',
  headed: 'displays the browser instead of running headlessly (defaults to true for Firefox and Chromium-family browsers)',
  headless: 'hide the browser instead of running headed (defaults to true for Electron)',
  key: 'your secret Record Key. you can omit this if you set a CYPRESS_RECORD_KEY environment variable.',
  parallel: 'enables concurrent runs and automatic load balancing of specs across multiple machines or processes',
  port: 'runs Cypress on a specific port. overrides any value in cypress.json.',
  project: 'path to the project',
  quiet: 'run quietly, using only the configured reporter',
  record: 'records the run. sends test results, screenshots and videos to your Cypress Dashboard.',
  reporter: 'runs a specific mocha reporter. pass a path to use a custom reporter. defaults to "spec"',
  reporterOptions: 'options for the mocha reporter. defaults to "null"',
  spec: 'runs specific spec file(s). defaults to "all"',
  tag: 'named tag(s) for recorded runs in the Cypress Dashboard',
  version: 'prints Cypress version',
}

const knownCommands = [
  'cache',
  'help',
  '-h',
  '--help',
  'install',
  'open',
  'open-ct',
  'run',
  'run-ct',
  'verify',
  '-v',
  '--version',
  'version',
  'info',
]

const text = (description) => {
  if (!descriptions[description]) {
    throw new Error(`Could not find description for: ${description}`)
  }

  return descriptions[description]
}

function includesVersion (args) {
  return (
    _.includes(args, 'version') ||
    _.includes(args, '--version') ||
    _.includes(args, '-v')
  )
}

function showVersions (args) {
  debug('printing Cypress version')
  debug('additional arguments %o', args)

  const versionParser = commander.option(
    '--component <package|binary|electron|node>', 'component to report version for',
  )
  .allowUnknownOption(true)
  const parsed = versionParser.parse(args)
  const parsedOptions = {
    component: parsed.component,
  }

  debug('parsed version arguments %o', parsedOptions)

  const reportAllVersions = (versions) => {
    logger.always('Cypress package version:', versions.package)
    logger.always('Cypress binary version:', versions.binary)
    logger.always('Electron version:', versions.electronVersion)
    logger.always('Bundled Node version:', versions.electronNodeVersion)
  }

  const reportComponentVersion = (componentName, versions) => {
    const names = {
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

  return require('./exec/versions')
  .getVersions()
  .then((versions = defaultVersions) => {
    if (parsedOptions.component) {
      reportComponentVersion(parsedOptions.component, versions)
    } else {
      reportAllVersions(versions)
    }

    process.exit(0)
  })
  .catch(util.logErrorExit1)
}

const createProgram = () => {
  const program = new commander.Command()

  // bug in commander not printing name
  // in usage help docs
  program._name = 'cypress'

  program.usage('<command> [options]')

  return program
}

const addCypressRunCommand = (program) => {
  return program
  .command('run')
  .usage('[options]')
  .description('Runs Cypress tests from the CLI without the GUI')
  .option('-b, --browser <browser-name-or-path>', text('browserRunMode'))
  .option('--ci-build-id <id>', text('ciBuildId'))
  .option('-c, --config <config>', text('config'))
  .option('-C, --config-file <config-file>', text('configFile'))
  .option('-e, --env <env>', text('env'))
  .option('--group <name>', text('group'))
  .option('-k, --key <record-key>', text('key'))
  .option('--headed', text('headed'))
  .option('--headless', text('headless'))
  .option('--no-exit', text('exit'))
  .option('--parallel', text('parallel'))
  .option('-p, --port <port>', text('port'))
  .option('-P, --project <project-path>', text('project'))
  .option('-q, --quiet', text('quiet'))
  .option('--record [bool]', text('record'), coerceFalse)
  .option('-r, --reporter <reporter>', text('reporter'))
  .option('-o, --reporter-options <reporter-options>', text('reporterOptions'))
  .option('-s, --spec <spec>', text('spec'))
  .option('-t, --tag <tag>', text('tag'))
  .option('--dev', text('dev'), coerceFalse)
}

/**
 * Casts known command line options for "cypress run" to their intended type.
 * For example if the user passes "--port 5005" the ".port" property should be
 * a number 5005 and not a string "5005".
 *
 * Returns a clone of the original object.
 */
const castCypressRunOptions = (opts) => {
  // only properties that have type "string | false" in our TS definition
  // require special handling, because CLI parsing takes care of purely
  // boolean arguments
  const result = R.evolve({
    port: coerceAnyStringToInt,
    configFile: coerceFalseOrString,
  })(opts)

  return result
}

module.exports = {
  /**
   * Parses `cypress run` command line option array into an object
   * with options that you can feed into a `cypress.run()` module API call.
   * @example
   *  const options = parseRunCommand(['cypress', 'run', '--browser', 'chrome'])
   *  // options is {browser: 'chrome'}
   */
  parseRunCommand (args) {
    return new Promise((resolve, reject) => {
      if (!Array.isArray(args)) {
        return reject(new Error('Expected array of arguments'))
      }

      // make a copy of the input arguments array
      // and add placeholders where "node ..." would usually be
      // also remove "cypress" keyword at the start if present
      const cliArgs = args[0] === 'cypress' ? [...args.slice(1)] : [...args]

      cliArgs.unshift(null, null)

      debug('creating program parser')
      const program = createProgram()

      addCypressRunCommand(program)
      .action((...fnArgs) => {
        debug('parsed Cypress run %o', fnArgs)
        const options = parseVariableOpts(fnArgs, cliArgs)

        debug('parsed options %o', options)

        const casted = castCypressRunOptions(options)

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
  init (args) {
    if (!args) {
      args = process.argv
    }

    const { CYPRESS_INTERNAL_ENV } = process.env

    if (!util.isValidCypressInternalEnvValue(CYPRESS_INTERNAL_ENV)) {
      debug('invalid CYPRESS_INTERNAL_ENV value', CYPRESS_INTERNAL_ENV)

      return errors.exitWithError(errors.errors.invalidCypressEnv)(
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

    program
    .option('-v, --version', text('version'))
    .command('version')
    .description(text('version'))
    .action(() => {
      showVersions(args)
    })

    addCypressRunCommand(program)
    .action((...fnArgs) => {
      debug('running Cypress with args %o', fnArgs)
      require('./exec/run')
      .start(parseVariableOpts(fnArgs, args))
      .then(util.exit)
      .catch(util.logErrorExit1)
    })

    program
    // TODO make this command public once CT will be merged completely
    .command('open-ct', { hidden: true })
    .usage('[options]')
    .description('Opens Cypress component testing interactive mode.')
    .option('-b, --browser <browser-path>', text('browserOpenMode'))
    .option('-c, --config <config>', text('config'))
    .option('-C, --config-file <config-file>', text('configFile'))
    .option('-d, --detached [bool]', text('detached'), coerceFalse)
    .option('-e, --env <env>', text('env'))
    .option('--global', text('global'))
    .option('-p, --port <port>', text('port'))
    .option('-P, --project <project-path>', text('project'))
    .option('--dev', text('dev'), coerceFalse)
    .action((opts) => {
      debug('opening Cypress')
      require('./exec/open')
      .start(util.parseOpts(opts), { isComponentTesting: true })
      .catch(util.logErrorExit1)
    })

    program
    // TODO make this command public once CT will be merged completely
    .command('run-ct', { hidden: true })
    .usage('[options]')
    .description('Runs all Cypress Component Testing suites')
    .option('-b, --browser <browser-path>', text('browserOpenMode'))
    .option('-c, --config <config>', text('config'))
    .option('-C, --config-file <config-file>', text('configFile'))
    .option('-d, --detached [bool]', text('detached'), coerceFalse)
    .option('-e, --env <env>', text('env'))
    .option('--global', text('global'))
    .option('-p, --port <port>', text('port'))
    .option('-P, --project <project-path>', text('project'))
    .option('--dev', text('dev'), coerceFalse)
    .action((opts) => {
      debug('running Cypress run-ct')
      require('./exec/run')
      .start(util.parseOpts(opts), { isComponentTesting: true })
    })

    program
    .command('open')
    .usage('[options]')
    .description('Opens Cypress in the interactive GUI.')
    .option('-b, --browser <browser-path>', text('browserOpenMode'))
    .option('-c, --config <config>', text('config'))
    .option('-C, --config-file <config-file>', text('configFile'))
    .option('-d, --detached [bool]', text('detached'), coerceFalse)
    .option('-e, --env <env>', text('env'))
    .option('--global', text('global'))
    .option('-p, --port <port>', text('port'))
    .option('-P, --project <project-path>', text('project'))
    .option('--dev', text('dev'), coerceFalse)
    .option('-ct, --component-testing', 'Cypress Component Testing mode (alpha)')
    .action((opts) => {
      debug('opening Cypress')
      require('./exec/open')
      .start(util.parseOpts(opts))
      .catch(util.logErrorExit1)
    })

    program
    .command('install')
    .usage('[options]')
    .description(
      'Installs the Cypress executable matching this package\'s version',
    )
    .option('-f, --force', text('forceInstall'))
    .action((opts) => {
      require('./tasks/install')
      .start(util.parseOpts(opts))
      .catch(util.logErrorExit1)
    })

    program
    .command('verify')
    .usage('[options]')
    .description(
      'Verifies that Cypress is installed correctly and executable',
    )
    .option('--dev', text('dev'), coerceFalse)
    .action((opts) => {
      const defaultOpts = { force: true, welcomeMessage: false }
      const parsedOpts = util.parseOpts(opts)
      const options = _.extend(parsedOpts, defaultOpts)

      require('./tasks/verify')
      .start(options)
      .catch(util.logErrorExit1)
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
    .action(function (opts, args) {
      if (!args || !args.length) {
        this.outputHelp()
        util.exit(1)
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

        return cache.list(opts.size)
        .catch({ code: 'ENOENT' }, () => {
          logger.always('No cached binary versions were found.')
          process.exit(0)
        })
        .catch((e) => {
          debug('cache list command failed with "%s"', e.message)

          util.logErrorExit1(e)
        })
      }

      cache[command]()
    })

    program
    .command('info')
    .usage('[command]')
    .description('Prints Cypress and system information')
    .option('--dev', text('dev'), coerceFalse)
    .action((opts) => {
      require('./exec/info')
      .start(opts)
      .then(util.exit)
      .catch(util.logErrorExit1)
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

      return util.exit(1)
    }

    if (includesVersion(args)) {
      // commander 2.11.0 changes behavior
      // and now does not understand top level options
      // .option('-v, --version').command('version')
      // so we have to manually catch '-v, --version'
      return showVersions(args)
    }

    debug('program parsing arguments')

    return program.parse(args)
  },
}

// @ts-ignore
if (!module.parent) {
  logger.error('This CLI module should be required from another Node module')
  logger.error('and not executed directly')
  process.exit(-1)
}
