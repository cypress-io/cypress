const _ = require('lodash')
const commander = require('commander')
const { oneLine } = require('common-tags')
const debug = require('debug')('cypress:cli')
const logger = require('./logger')
const util = require('./util')

const coerceFalse = (arg) => {
  return arg !== 'false'
}

const parseOpts = (opts) => _.pick(opts, 'spec', 'reporter', 'reporterOptions', 'path', 'destination', 'port', 'env', 'cypressVersion', 'config', 'record', 'key', 'browser', 'detached')

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
}

const text = (description) => {
  if (!descriptions[description]) {
    throw new Error(`Could not find description for: ${description}`)
  }

  return descriptions[description]
}

module.exports = {
  init () {
    const program = new commander.Command()

    program
      .command('run')
      .usage('[options]')
      .description('Runs Cypress Headlessly')
      .option('--record [bool]',                           text('record'), coerceFalse)
      .option('-k, --key <record-key>',                    text('key'))
      .option('-s, --spec <spec>',                         text('spec'))
      .option('-r, --reporter <reporter>',                 text('reporter'))
      .option('-o, --reporter-options <reporter-options>', text('reporterOptions'))
      .option('-p, --port <port>',                         text('port'))
      .option('-e, --env <env>',                           text('env'))
      .option('-c, --config <config>',                     text('config'))
      .option('-b, --browser <browser-name>',              text('browser'))
      .option('-P, --project <project-path>',              text('project'))
      .action((opts) => {
        require('./exec/run')
        .start(parseOpts(opts))
        .then(util.exit)
        .catch(util.exit1)
      })

    program
      .command('open')
      .usage('[options]')
      .description('Opens Cypress normally, as a desktop application.')
      .option('-p, --port <port>',         text('port'))
      .option('-e, --env <env>',           text('env'))
      .option('-c, --config <config>',     text('config'))
      .option('-d, --detached [bool]',     text('detached'), coerceFalse)
      .option('-P, --project <project path>', text('project'))
      .action((opts) => {
        require('./exec/open')
        .start(parseOpts(opts))
        .catch(util.exit1)
      })

    program
      .command('install')
      .description('Installs the Cypress executable matching this package\'s version')
      .action(() => {
        require('./tasks')
        .install({ force: true })
        .catch(util.exit1)
      })

    program
      .command('verify')
      .description('Verifies that Cypress is installed correctly and executable')
      .action(() => {
        require('./tasks')
        .verify({ force: true })
        .catch(util.exit1)
      })

    debug('cli starts with arguments %j', process.argv)
    program.parse(process.argv)

    //# if the process.argv.length
    //# is less than or equal to 2
    if (process.argv.length <= 2) {
      //# then display the help
      program.help()
    }

    return program
  },
}

if (!module.parent) {
  logger.error('This CLI module should be required from another Node module')
  logger.error('and not executed directly')
  process.exit(-1)
}
