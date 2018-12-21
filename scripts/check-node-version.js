// TODO make this check a 3rd party little tool

// we want to ensure we are building using the same major version
// as the one specified in ../.node-version file
const read = require('fs').readFileSync
const join = require('path').join

const nodeVersionNeededString = read(join(__dirname, '..', '.node-version'), 'utf8')
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
