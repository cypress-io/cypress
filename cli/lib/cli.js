const _ = require('lodash')
const commander = require('commander')
const { oneLine } = require('common-tags')
const debug = require('debug')('cypress:cli')
const util = require('./util')
const logger = require('./logger')
const cache = require('./tasks/cache')

// patch "commander" method called when a user passed an unknown option
// we want to print help for the current command and exit with an error
function unknownOption (flag, type = 'option') {
  if (this._allowUnknownOption) return
  logger.error()
  logger.error(`  error: unknown ${type}:`, flag)
  logger.error()
  this.outputHelp()
  logger.error()
  process.exit(1)
}
commander.Command.prototype.unknownOption = unknownOption

const coerceFalse = (arg) => {
  return arg !== 'false'
}

const parseOpts = (opts) => {
  opts = _.pick(opts,
    'project', 'spec', 'reporter', 'reporterOptions', 'path', 'destination',
    'port', 'env', 'cypressVersion', 'config', 'record', 'key',
    'browser', 'detached', 'headed', 'global', 'dev', 'force', 'exit',
    'cachePath', 'cacheList', 'cacheClear'
  )

  if (opts.exit) {
    opts = _.omit(opts, 'exit')
  }

  debug('parsed cli options', opts)

  return opts
}

const descriptions = {
  record: 'records the run. sends test results, screenshots and videos to your Cypress Dashboard.',
  key: 'your secret Record Key. you can omit this if you set a CYPRESS_RECORD_KEY environment variable.',
  spec: 'runs a specific spec file. defaults to "all"',
  reporter: 'runs a specific mocha reporter. pass a path to use a custom reporter. defaults to "spec"',
  reporterOptions: 'options for the mocha reporter. defaults to "null"',
  port: 'runs Cypress on a specific port. overrides any value in cypress.json.',
  env: 'sets environment variables. separate multiple values with a comma. overrides any value in cypress.json or cypress.env.json',
  config: 'sets configuration values. separate multiple values with a comma. overrides any value in cypress.json.',
  browser: oneLine`
    runs Cypress in the browser with the given name.
    note: using an external browser will not record a video.
  `,
  detached: 'runs Cypress application in detached mode',
  project: 'path to the project',
  global: 'force Cypress into global mode as if its globally installed',
  version: 'Prints Cypress version',
  headed: 'displays the Electron browser instead of running headlessly',
  dev: 'runs cypress in development and bypasses binary check',
  forceInstall: 'force install the Cypress binary',
  exit: 'keep the browser open after tests finish',
  cachePath: 'print the cypress binary cache path',
  cacheList: 'list the currently cached versions',
  cacheClear: 'delete the Cypress binary cache',
}

const knownCommands = ['version', 'run', 'open', 'install', 'verify', '-v', '--version', 'help', '-h', '--help', 'cache']

const text = (description) => {
  if (!descriptions[description]) {
    throw new Error(`Could not find description for: ${description}`)
  }

  return descriptions[description]
}

function includesVersion (args) {
  return _.includes(args, 'version') ||
    _.includes(args, '--version') ||
    _.includes(args, '-v')
}

function showVersions () {
  debug('printing Cypress version')
  return require('./exec/versions')
  .getVersions()
  .then((versions = {}) => {
    logger.log('Cypress package version:', versions.package)
    logger.log('Cypress binary version:', versions.binary)
    process.exit(0)
  })
  .catch(util.logErrorExit1)
}

module.exports = {
  init (args) {
    if (!args) {
      args = process.argv
    }

    const program = new commander.Command()

    // bug in commaner not printing name
    // in usage help docs
    program._name = 'cypress'

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
    .action(showVersions)

    program
    .command('run')
    .usage('[options]')
    .description('Runs Cypress tests from the CLI without the GUI')
    .option('--record [bool]', text('record'), coerceFalse)
    .option('--headed', text('headed'))
    .option('-k, --key <record-key>', text('key'))
    .option('-s, --spec <spec>', text('spec'))
    .option('-r, --reporter <reporter>', text('reporter'))
    .option('-o, --reporter-options <reporter-options>', text('reporterOptions'))
    .option('-p, --port <port>', text('port'))
    .option('-e, --env <env>', text('env'))
    .option('-c, --config <config>', text('config'))
    .option('-b, --browser <browser-name>', text('browser'))
    .option('-P, --project <project-path>', text('project'))
    .option('--no-exit', text('exit'))
    .option('--dev', text('dev'), coerceFalse)
    .action((opts) => {
      // console.log(opts)
      debug('running Cypress')
      require('./exec/run')
      .start(parseOpts(opts))
      .then(util.exit)
      .catch(util.logErrorExit1)
    })

    program
    .command('open')
    .usage('[options]')
    .description('Opens Cypress in the interactive GUI.')
    .option('-p, --port <port>', text('port'))
    .option('-e, --env <env>', text('env'))
    .option('-c, --config <config>', text('config'))
    .option('-d, --detached [bool]', text('detached'), coerceFalse)
    .option('-P, --project <project path>', text('project'))
    .option('--global', text('global'))
    .option('--dev', text('dev'), coerceFalse)
    .action((opts) => {
      debug('opening Cypress')
      require('./exec/open')
      .start(parseOpts(opts))
      .catch(util.logErrorExit1)
    })

    program
    .command('install')
    .usage('[options]')
    .description('Installs the Cypress executable matching this package\'s version')
    .option('-f, --force', text('forceInstall'))
    .action((opts) => {
      require('./tasks/install')
      .start(parseOpts(opts))
      .catch(util.logErrorExit1)
    })

    program
    .command('verify')
    .usage('[options]')
    .description('Verifies that Cypress is installed correctly and executable')
    .action((opts) => {
      const defaultOpts = { force: true, welcomeMessage: false }
      const parsedOpts = parseOpts(opts)
      const options = _.extend(parsedOpts, defaultOpts)
      require('./tasks/verify')
      .start(options)
      .catch(util.logErrorExit1)
    })

    program
    .command('cache')
    .usage('[command]')
    .description('Manage the Cypress binary cache')
    .option('list', text('cacheList'))
    .option('path', text('cachePath'))
    .option('clear', text('cacheClear'))
    .action(function (opts) {
      if (opts.command || !_.includes(['list', 'path', 'clear'], opts)) {
        unknownOption.call(this, `cache ${opts}`, 'sub-command')
      }
      cache[opts]()
      // this.outputHelp()
    })

    debug('cli starts with arguments %j', args)
    util.printNodeOptions()

    // if there are no arguments
    if (args.length <= 2) {
      debug('printing help')
      program.help()
      // exits
    }

    // Deprecated Catches

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
      return showVersions()
    }
    debug('program parsing arguments')
    return program.parse(args)
  },
}

if (!module.parent) {
  logger.error('This CLI module should be required from another Node module')
  logger.error('and not executed directly')
  process.exit(-1)
}
