const os = require('os')
const assert = require('assert')

// TODO make this check a 3rd party little tool

const isWindows = () => {
  return os.platform() === 'win32'
}

// if we're windows + in appveyor...
if (isWindows() && process.env.APPVEYOR) {
  // check to ensure that the cpuArch + nodeArch are in sync
  const cpuArch = process.env.Platform
  const nodeArch = os.arch()

  const getErrMsg = (expectedArch) => {
    return `Appveyor CPU arch is set to: '${cpuArch}' but the node version that is being used is running: '${nodeArch}'. Expected it to equal: '${expectedArch}'`
  }

  // if we're in the x86 CPU architecture check
  // to ensure that os.arch() is ia32

  // eslint-disable-next-line default-case
  switch (cpuArch) {
    case 'x86':
      assert.equal(
        os.arch(),
        'ia32',
        getErrMsg('ia32'),
      )

      break
    case 'x64':
      assert.equal(
        os.arch(),
        'x64',
        getErrMsg('x64'),
      )

      break
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
