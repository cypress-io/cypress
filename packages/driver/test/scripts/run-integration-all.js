/* eslint-disable no-console */

require('@packages/coffee/register')

const cp = require('child_process')
const path = require('path')
const minimist = require('minimist')
const Promise = require('bluebird')

const humanTime = require('../../../server/lib/util/human_time.coffee')

const glob = Promise.promisify(require('glob'))

const options = minimist(process.argv.slice(2))

const started = new Date()

let numFailed = 0

function spawn (cmd, args, opts) {
  return new Promise((resolve, reject) => {
    cp.spawn(cmd, args, opts)
    .on('exit', resolve)
    .on('error', reject)
  })
}

glob('test/cypress/integration/**/*.coffee')
.filter((spec) => {
  if (options.actions) {
    return spec.includes('actions')
  }

  if (options.actions === false) {
    return !spec.includes('actions')
  }

  if (options.spec) {
    return spec.includes(options.spec)
  }

  return spec
})
.tap(console.log)
.each((spec = []) => {
  console.log('Running spec', spec)

  const args = [
    'test/scripts/run-integration',
    '--project',
    path.resolve('test'),
    '--browser=chrome',
    '--driver',
    '--spec',
    spec.replace('test/', ''),
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

  console.log('Total duration:', humanTime(duration))
  console.log('Exiting with final code:', numFailed)

  process.exit(numFailed)
})
