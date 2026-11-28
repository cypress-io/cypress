/* eslint-disable no-console */
const _ = require('lodash')
const chalk = require('chalk')
const minimist = require('minimist')
const execa = require('execa')
const fs = require('fs')
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
    run = [path.join(options['glob-in-dir'], '**')]
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

      $ yarn test ./test/unit/api_spec.js

    If you want to run all a specific group of tests:

      $ yarn test-unit
      $ yarn test-integration
      $ yarn test-performance
  `)
}

// The directories whose *.spec.ts files run on vitest, and the script for each
const VITEST_DIRS = {
  'test/unit': 'test-unit',
  'test/integration': 'test-integration-vitest',
}

// The vitest specs, plus the vitest integration config's global setup, which
// test/integration/** would otherwise load as a mocha spec
const MOCHA_IGNORES = [
  ...Object.keys(VITEST_DIRS).map((dir) => `${dir}/**/*.spec.ts`),
  'test/integration/support/**',
]

const vitestScriptFor = (file) => {
  const relative = path.relative(process.cwd(), path.resolve(file)).split(path.sep).join('/')

  if (!relative.endsWith('.spec.ts')) {
    return undefined
  }

  const dir = Object.keys(VITEST_DIRS).find((d) => relative.startsWith(`${d}/`))

  return dir && VITEST_DIRS[dir]
}

// mocha ignores these specs below, so a request that only names them would
// otherwise end in a bare "No test files found"
const matched = run.flatMap((pattern) => fs.globSync(pattern))

if (matched.length && matched.every(vitestScriptFor)) {
  const commands = _.map(_.groupBy(matched, vitestScriptFor), (files, script) => {
    return `$ yarn workspace @packages/server ${script} -- ${files.join(' ')}`
  })

  return exitErr(`
    Error: ${matched.join(', ')} run${matched.length === 1 ? 's' : ''} on vitest, not mocha.

    Run ${matched.length === 1 ? 'it' : 'them'} with:

      ${commands.join('\n      ')}
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
    `-as`,
    `"-screen 0 1280x1024x24"`,
    `--`,
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
    // Shell-joined below. On POSIX, quote so multi-word filters stay one mocha
    // arg. On Windows (cmd.exe + shell:true), quotes pass through literally.
    isWindows()
      ? options.fgrep
      : `'${String(options.fgrep).replace(/'/g, `'\\''`)}'`,
  )
}

commandAndArguments.args.push(
  '--timeout',
  options['inspect-brk'] ? '40000000' : '10000',
  '--recursive',
  '-r @packages/ts/register',
  '--reporter',
  'mocha-multi-reporters',
  '--reporter-options',
  'configFile=../../mocha-reporter-config.json',
  '--extension=js,ts',
  // Quoted so the shell leaves the glob to mocha; cmd.exe would pass quotes through literally
  ...MOCHA_IGNORES.map((glob) => (isWindows() ? `--ignore=${glob}` : `--ignore='${glob}'`)),
  // restore mocha 2.x behavior to force end process after spec run
  '--exit',
)

const env = _.clone(process.env)

env.NODE_ENV = 'test'
env.CYPRESS_INTERNAL_ENV = 'test'

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

if (options.headed) {
  env.HEADED = true
}

if (options.exit === false) {
  env.NO_EXIT = '1'
}

if (options['cypress-inspect-brk']) {
  env.CYPRESS_INSPECT_BRK = '1'
}

const cmd = `${commandAndArguments.command} ${
  commandAndArguments.args.join(' ')}`

console.log('specfiles:', run)
console.log('test command:')
console.log(cmd)

const child = execa(cmd, { env, stdio: 'inherit', shell: true })

child.on('exit', (exitCode, signal) => {
  if (signal) {
    console.error(`tests exited with signal ${signal}`)
  }

  process.exit(exitCode === null ? 1 : exitCode)
})
