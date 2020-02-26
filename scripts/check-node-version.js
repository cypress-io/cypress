const os = require('os')
const assert = require('assert')

// TODO make this check a 3rd party little tool

// on CircleCI Mac machine, we need to use on of the laer executors
// that already has Node 10 / 11
const isMac = () => {
  return os.platform() === 'darwin'
}

const isWindows = () => {
  return os.platform() === 'win32'
}

if (isMac() && process.env.CIRCLECI) {
  // eslint-disable-next-line no-console
  console.log('Skipping Node version check on CircleCI Mac')

  return
}

// if we're windows + in CI...
if (isWindows() && process.env.CIRCLECI) {
  // check to ensure that the cpuArch + nodeArch are in sync

  const { CIRCLE_JOB } = process.env

  const nodeArch = os.arch()
  const realArch = CIRCLE_JOB.split('-')[1]

  const getErrMsg = () => {
    return `Installed node CPU arch is set to: '${realArch}' but the correct version for this job is: '${realArch}'`
  }

  if (realArch === 'ia32') {
    assert.equal(nodeArch, 'ia32', getErrMsg())
  } else if (realArch === 'x64') {
    assert.equal(nodeArch, 'x64', getErrMsg())
  } else {
    throw new Error('cannot determine expected architecture, failing')
  }
}

// we want to ensure we are building using the same major version
// as the one specified in ../.node-version file
const read = require('fs').readFileSync
const join = require('path').join

const nodeVersionNeededString = read(
  join(__dirname, '..', '.node-version'),
  'utf8',
)
const nodeVersionNeeded = nodeVersionNeededString.split('.')

const nodeVersion = process.versions.node.split('.')

// check just major version for now
if (nodeVersionNeeded[0] !== nodeVersion[0]) {
  /* eslint-disable no-console */
  console.error('🛑 .node-version specified %s', nodeVersionNeededString)
  console.error('but current Node is %s', process.versions.node)
  /* eslint-enable no-console */
  process.exit(1)
}
