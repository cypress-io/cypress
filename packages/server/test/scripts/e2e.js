/* eslint-disable no-console */

require('@packages/coffee/register')

const _ = require('lodash')
const cp = require('child_process')
const minimist = require('minimist')
const Promise = require('bluebird')
const terminalBanner = require('terminal-banner').terminalBanner
const glob = require('../../lib/util/glob')
const humanTime = require('../../lib/util/human_time')

const options = minimist(process.argv.slice(2))

if (options.browser) {
  process.env.BROWSER = options.browser
}

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

glob('test/e2e/**/*')
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
  terminalBanner(`Running spec ${spec}`, '*')

  const args = [
    './test/scripts/run.js',
    spec,
  ]

  return spawn('node', args, { stdio: 'inherit' })
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

  console.log('Total duration:', humanTime.long(duration))
  console.log('Exiting with final code:', numFailed)

  process.exit(numFailed)
})
