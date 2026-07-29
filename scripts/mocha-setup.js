// Setup for the Mocha-run specs. Vitest runs the rest of scripts/unit via
// vitest.setup.ts; move-binaries-spec stays on Mocha because move-binaries.ts's
// gulp/aws CommonJS dependency graph deadlocks under vite-node's ESM interop.
const sinon = require('sinon')
const chai = require('chai')

chai.use(require('sinon-chai'))

global.sinon = sinon

exports.mochaHooks = {
  afterEach () {
    sinon.restore()
  },
}
