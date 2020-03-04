/* eslint-disable no-console */

const _ = require('lodash')
const chalk = require('chalk')
const minimist = require('minimist')
const execa = require('execa')
const path = require('path')
const os = require('os')

const options = minimist(process.argv.slice(2))

let run = options._

if (options['spec']) {
  console.error('NOTE: It is no longer necessary to pass `--spec` to server test commands. Try passing the path directly instead.')
  run = [options.spec]
}

if (run[0] && run[0].includes('--inspect-brk')) {
  run = run.slice(1)
}

if (options['glob-in-dir']) {
  if (run[0]) {
    run = [path.join(options['glob-in-dir'], '**', `*${run[0]}*`)]
  } else {
    run = [options['glob-in-dir']]
  }
}

function exitErr (msg) {
  console.error(chalk.red(msg))

  return process.exit(1)
}

const isWindows = () => {
  return os.platform() === 'win32'
}

const isGteNode12 = () => {
  return Number(process.versions.node.split('.')[0]) >= 12
}

if (!run || !run.length) {
  return exitErr(`
    Error: A path to a spec file must be specified!

    It should look something like this:

      $ yarn test ./test/unit/api_spec.coffee

    If you want to run all a specific group of tests:

      $ yarn test-unit
      $ yarn test-integration
      $ yarn test-e2e
  `)
}

const commandAndArguments = {
  command: '',
  args: [],
}

if (isWindows()) {
  commandAndArguments.command = 'mocha'
  commandAndArguments.args = run.slice()
} else {
  commandAndArguments.command = 'xvfb-maybe'
  // this should always match cli/lib/exec/xvfb.js
  commandAndArguments.args = [
    '--xvfb-run-args ' +
    '"-as \\"-screen 0 1280x1024x24\\""',
    'node',
  ]
}

if (options['inspect-brk']) {
  commandAndArguments.args.push(
    '--inspect',
    `--inspect-brk${options['inspect-brk'] === true ? '' : `=${options['inspect-brk']}`}`,
  )
}

if (isGteNode12()) {
  // max HTTP header size 8kb -> 1mb
  // https://github.com/cypress-io/cypress/issues/76
  commandAndArguments.args.push(
    `--max-http-header-size=${1024 * 1024}`,
  )
}

if (!isWindows()) {
  commandAndArguments.args.push(
    'node_modules/.bin/_mocha',
  )

  commandAndArguments.args = commandAndArguments.args.concat(run)
}

if (options.fgrep) {
  commandAndArguments.args.push(
    '--fgrep',
    options.fgrep,
  )
}

commandAndArguments.args.push(
  '--timeout',
  options['inspect-brk'] ? '40000000' : '10000',
  '--recursive',
  '--compilers ts:@packages/ts/register,coffee:@packages/coffee/register',
  '--reporter',
  'mocha-multi-reporters',
  '--reporter-options',
  'configFile=../../mocha-reporter-config.json',
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

if (options.exit != null) {
  env.EXIT = options.exit
}

const cmd = `${commandAndArguments.command} ${
  commandAndArguments.args.join(' ')}`

console.log('specfiles:', run)
console.log('test command:')
console.log(cmd)

const child = execa.shell(cmd, { env, stdio: 'inherit' })

child.on('exit', process.exit)
