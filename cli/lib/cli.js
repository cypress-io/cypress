const _ = require('lodash')
const path = require('path')
const commander = require('commander')
const { oneLine } = require('common-tags')
const debug = require('debug')('cypress:cli')
const util = require('./util')
const logger = require('./logger')

const coerceFalse = (arg) => {
  return arg !== 'false'
}

const parseOpts = (opts) => {
  opts = _.pick(
    opts,
    'project',
    'spec',
    'reporter',
    'reporterOptions',
    'path',
    'destination',
    'port',
    'env',
    'cypressVersion',
    'config',
    'record',
    'key',
    'browser',
    'detached',
    'headed',
    'group',
    'groupId',
    'global',
    'parallel',
    'parallelId'
  )

  if (opts.project) {
    opts.project = path.resolve(opts.project)
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
  group: 'flag to group individual runs by using common --group-id',
  groupId: 'optional common id to group runs by, extracted from CI environment variables by default',
}

const knownCommands = [
  'version',
  'run',
  'open',
  'install',
  'verify',
  '-v',
  '--version',
  'help',
  '-h',
  '--help',
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

function showVersions () {
  debug('printing Cypress version')
  return require('./exec/versions').getVersions().then((versions = {}) => {
    logger.log('Cypress package version:', versions.package)
    logger.log('Cypress binary version:', versions.binary)
    process.exit(0)
  })
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
      .option(
        '-o, --reporter-options <reporter-options>',
        text('reporterOptions')
      )
      .option('-p, --port <port>', text('port'))
      .option('-e, --env <env>', text('env'))
      .option('-c, --config <config>', text('config'))
      .option('-b, --browser <browser-name>', text('browser'))
      .option('-P, --project <project-path>', text('project'))
      .option('--group', text('group'), coerceFalse)
      .option('--group-id <group-id>', text('groupId'))
      .option('--parallel', text('parallel'), coerceFalse)
      .option('--parallel-id <parallel-id>', text('parallelId'))
      .action((opts) => {
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
      .action((opts) => {
        debug('opening Cypress')
        require('./exec/open').start(parseOpts(opts)).catch(util.logErrorExit1)
      })

    program
      .command('install')
      .description(
        'Installs the Cypress executable matching this package\'s version'
      )
      .action(() => {
        require('./tasks/install')
          .start({ force: true })
          .catch(util.logErrorExit1)
      })

    program
      .command('verify')
      .description(
        'Verifies that Cypress is installed correctly and executable'
      )
      .action(() => {
        require('./tasks/verify')
          .start({ force: true, welcomeMessage: false })
          .catch(util.logErrorExit1)
      })

    debug('cli starts with arguments %j', args)

    // if there are no arguments
    if (args.length <= 2) {
      debug('printing help')
      program.help()
      // exits
    }

    const firstCommand = args[2]
    if (!_.includes(knownCommands, firstCommand)) {
      debug('unknwon command %s', firstCommand)
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
