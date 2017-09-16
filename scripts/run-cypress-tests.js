/* eslint-disable no-console */

// this file is a little cypress test runner helper
// so that we can utilize our own monorepo when testing
// things like the driver, or desktop-gui, or reporter

require('@packages/coffee/register')

const _ = require('lodash')
const cp = require('child_process')
const path = require('path')
const minimist = require('minimist')
const Promise = require('bluebird')

const humanTime = require('../packages/server/lib/util/human_time.coffee')

const glob = Promise.promisify(require('glob'))

const options = minimist(process.argv.slice(2))

const started = new Date()

let numFailed = 0

function isLoadBalanced (options) {
  return _.isNumber(options.index) && _.isNumber(options.parallel)
}

function spawn (cmd, args, opts) {
  return new Promise((resolve, reject) => {
    cp.spawn(cmd, args, opts)
    .on('exit', resolve)
    .on('error', reject)
  })
}

_.defaults(options, {
  dir: '',
  glob: 'cypress/integration/**/*',
})

// let us pass in project or resolve it to process.cwd() and dir
options.project = options.project || path.resolve(process.cwd(), options.dir)

// normalize and set to absolute path based on process.cwd
options.glob = path.resolve(options.project, options.glob)

console.log(options)

glob(options.glob, {
  nodir: true,
  realpath: true,
})
.then((specs = []) => {
  if (options.spec) {
    return _.filter(specs, (spec) => {
      return spec.includes(options.spec)
    })
  }

  if (isLoadBalanced(options)) {
    // take the total number of specs and divide by our
    // total number of parallel nodes, ceiling the number
    const size = Math.ceil(specs.length / options.parallel)

    // chunk the specs by the total nodes
    // and then just grab this index's specs
    return _.chunk(specs, size)[options.index]
  }

  return specs
})
.tap(console.log)
.each((spec = []) => {
  console.log('\nRunning spec', spec)

  // get the path to xvfb-maybe binary
  const cmd = path.join(__dirname, '..', 'node_modules', '.bin', 'xvfb-maybe')

  const configFile = path.join(__dirname, '..', 'mocha-reporter-config.json')

  const args = [
    '-s \"-screen 0 1280x1024x8\"',
    '--',
    'node',
    path.resolve('..', '..', 'scripts', 'start.js'), // launch root monorepo start
    '--run-project',
    options.project,
    '--spec',
    spec,
    '--reporter',
    path.resolve(__dirname, '..', 'node_modules', 'mocha-multi-reporters'),
    '--reporter-options',
    `configFile=${configFile}`,
  ]

  if (options.browser) {
    args.push('--browser', options.browser)
  }

  console.log(cmd, args)

  return spawn(cmd, args, { stdio: 'inherit' })
  .then((code) => {
    console.log(`${spec} exited with code`, code)

    numFailed += code
  })
  .catch((err) => {
    console.log(err)
    throw err
  })
})
.then(() => {
  const duration = new Date() - started

  console.log('')
  console.log('Total duration:', humanTime(duration))
  console.log('Exiting with final code:', numFailed)

  process.exit(numFailed)
})
