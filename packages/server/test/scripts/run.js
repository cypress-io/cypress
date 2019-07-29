/* eslint-disable no-console */

const _ = require('lodash')
const chalk = require('chalk')
const minimist = require('minimist')
const execa = require('execa')
const os = require('os')

const options = minimist(process.argv.slice(2))

let run = options._[0]

if (run && run.includes('--inspect-brk')) {
  run = options._[1]
}

function exitErr (msg) {
  console.error(chalk.red(msg))

  return process.exit(1)
}

const isWindows = () => {
  return os.platform() === 'win32'
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

const commandAndArguments = {
  command: '',
  args: [],
}

if (isWindows()) {
  commandAndArguments.command = 'mocha'
  commandAndArguments.args = [run]
} else {
  commandAndArguments.command = 'xvfb-maybe'
  commandAndArguments.args = [
    '--xvfb-run-args ' +
    '"-as \\"-screen 0 1280x1024x8\\""',
    'node',
  ]
}

if (options['inspect-brk']) {
  commandAndArguments.args.push(
    '--inspect',
    `--inspect-brk${options['inspect-brk'] === true ? '' : `=${options['inspect-brk']}`}`
  )
}

commandAndArguments.args.push(
  // max HTTP header size 8kb -> 1mb
  // https://github.com/cypress-io/cypress/pull/4720#issuecomment-514316695
  `--max-http-header-size=${1024 * 1024}`,
  'node_modules/.bin/_mocha',
  run
)

if (options.fgrep) {
  commandAndArguments.args.push(
    '--fgrep',
    options.fgrep
  )
}

commandAndArguments.args.push(
  '--timeout',
  options['inspect-brk'] ? '40000000' : '10000',
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
      '-nock.interceptor',
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

const cmd = `${commandAndArguments.command} ${
  commandAndArguments.args.join(' ')}`

console.log('test command:')
console.log(cmd)

const child = execa.shell(cmd, { env, stdio: 'inherit' })

child.on('exit', process.exit)
