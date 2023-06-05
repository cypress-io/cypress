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
  console.error('🛑 .node-version specified %s', nodeVersionNeededString)
  console.error('but current Node is %s', process.versions.node)
  process.exit(1)
}

console.log('✅ current Node version of %s matches the version specified in the .node-version file', process.versions.node)
