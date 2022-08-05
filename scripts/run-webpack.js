const cp = require('child_process')
const path = require('path')
const semver = require('semver')

const webpackCli = path.join(__dirname, '..', 'node_modules', 'webpack-cli', 'bin', 'cli.js')

// https://github.com/cypress-io/cypress/issues/18914
// Node 17+ ships with OpenSSL 3 by default, so we may need the option
// --openssl-legacy-provider so that webpack@4 can use the legacy MD4 hash
// function. This option doesn't exist on Node <17 or when it is built
// against OpenSSL 1, so we have to detect Node's major version and check
// which version of OpenSSL it was built against before spawning the process.
//
// Can be removed once the webpack version is upgraded to >= 5.61,
// which no longer relies on Node's builtin crypto.hash function.

let NODE_OPTIONS = process.env.NODE_OPTIONS || ''

if (process.versions && semver.satisfies(process.versions.node, '>=17.0.0') && semver.satisfies(process.versions.openssl, '>=3', { includePrerelease: true })) {
  NODE_OPTIONS = `${NODE_OPTIONS} --openssl-legacy-provider`
}

function buildCommand () {
  const file = process.argv.slice(2)
  let program = `node "${webpackCli}"`

  return file.length ? `${program } "${file.join('" "')}"` : program
}

const program = buildCommand()

cp.execSync(program, { stdio: 'inherit', env: { ...process.env, NODE_OPTIONS } })
