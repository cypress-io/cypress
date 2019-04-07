// TODO make this check a 3rd party little tool

/* eslint-disable no-console */
console.log(process.arch, require('os').arch())
console.log(process.env.TARGET_ARCH, process.env.Platform)

// on CircleCI Mac machine, we need to use on of the laer executors
// that already has Node 10 / 11
const isMac = () => {
  return process.platform === 'darwin'
}

if (isMac()) {
  // eslint-disable-next-line no-console
  console.log('Skipping Node version check on Mac')
} else {
  // we want to ensure we are building using the same major version
  // as the one specified in ../.node-version file
  const read = require('fs').readFileSync
  const join = require('path').join

  const nodeVersionNeededString = read(
    join(__dirname, '..', '.node-version'),
    'utf8'
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
}
