/* eslint-disable no-console */

const cp = require('child_process')
const path = require('path')
const Promise = require('bluebird')

const glob = Promise.promisify(require('glob'))

const actions = process.argv.includes('--actions')
const noActions = process.argv.includes('--no-actions')

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
  if (actions) {
    return spec.includes('actions')
  }

  if (noActions) {
    return !spec.includes('actions')
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
  process.exit(numFailed)
})
