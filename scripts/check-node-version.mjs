// Builds must use the same major Node version as the one in `.node-version`.
// Plain `.mjs` with a URL path keeps this runnable on any Node, including the outdated ones it exists to reject.
import { readFileSync } from 'node:fs'

const nodeVersionNeededString = readFileSync(new URL('../.node-version', import.meta.url), 'utf8').trim()
const [majorNeeded] = nodeVersionNeededString.split('.')
const [currentMajor] = process.versions.node.split('.')

// Minor and patch differences between machines are expected, so only the major version is enforced
if (majorNeeded !== currentMajor) {
  console.error('🛑 .node-version specified %s', nodeVersionNeededString)
  console.error('but current Node is %s', process.versions.node)
  process.exit(1)
}

console.log('✅ current Node version of %s matches the version specified in the .node-version file', process.versions.node)
