// https://github.com/cypress-io/cypress/issues/18914
// Node 17+ ships with OpenSSL 3 by default, so we may need the option
// --openssl-legacy-provider so that webpack@4 can use the legacy MD4 hash
// function. This option doesn't exist on Node <17 or when it is built
// against OpenSSL 1, so we have to detect Node's major version and check
// which version of OpenSSL it was built against before spawning the process.
//
// Can be removed once the webpack version is upgraded to >= 5.61,
// which no longer relies on Node's builtin crypto.hash function.

const semver = require('semver')

let opts = process.env.NODE_OPTIONS || ''

if (process.versions && semver.satisfies(process.versions.node, '>=17.0.0') && process.versions.openssl.startsWith('3.')) {
  opts = `${opts} --openssl-legacy-provider`
}

// eslint-disable-next-line no-console
console.log(opts)
