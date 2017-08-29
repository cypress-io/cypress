/* eslint-disable no-console */

const _ = require('lodash')
const cp = require('child_process')
const chalk = require('chalk')
const minimist = require('minimist')

const options = minimist(process.argv.slice(2))

const run = options._[0]

function exitErr (msg) {
  console.error(chalk.red(msg))

  return process.exit(1)
}

if (!run) {
  return exitErr(`
    Error: A path to a spec file must be specified!

    It should look something like this:

      $ npm test ./test/unit/api_spec.coffee

    If you want to run all a specific group of tests:

      $ npm run test-unit
      $ npm run test-integration
      $ npm run test-e2e
  `)
}

const args = [
  '--xvfb-run-args',
  '-s \"-screen 0 1280x1024x8\"',
  'mocha',
  run,
]

if (options.fgrep) {
  args.push(
    '--fgrep',
    options.fgrep
  )
}

args.push(
  '--timeout',
  '10000',
  '--recursive',
  '--compilers',
  'ts:@packages/ts/register,coffee:@packages/coffee/register',
  '--reporter',
  'mocha-multi-reporters',
  '--reporter-options',
  'configFile=../../mocha-reporter-config.json'
)

const env = _.clone(process.env)

env.NODE_ENV = 'test'
env.CYPRESS_ENV = 'test'

if (env.VERBOSE === '1') {
  _.extend(env, {
    CYPRESS_DEBUG: true,
    NODE_DEBUG: 'request',
    BLUEBIRD_DEBUG: 1,
    DEBUG: _.chain([
      env.DEBUG,
      'nock.*',
      '-nock.common',
      '-nock.scope',
      'socket.io:*',
      'xvfb-maybe',
    ])
    .compact()
    .join(','),
  })
}

if (options.browser) {
  env.BROWSER = options.browser
}

cp.spawn('xvfb-maybe', args, {
  env,
  stdio: 'inherit',
})
.on('exit', process.exit)
