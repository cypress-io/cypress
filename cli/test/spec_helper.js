const path = require('path')
const sinon = require('sinon')
const Promise = require('bluebird')
const os = require('os')
const chalk = require('chalk')
const { stripIndent } = require('common-tags')

global.expect = require('chai').expect
global.lib = path.join(__dirname, '..', 'lib')

require('chai')
.use(require('@cypress/sinon-chai'))
.use(require('chai-string'))

before(function () {
  delete process.env.CYPRESS_RUN_BINARY
  delete process.env.CYPRESS_INSTALL_BINARY
  delete process.env.CYPRESS_CACHE_FOLDER
  delete process.env.CYPRESS_BINARY_VERSION
  delete process.env.CYPRESS_SKIP_BINARY_INSTALL
})

beforeEach(function () {
  this.sandbox = sinon.sandbox.create().usingPromise(Promise)

  this.onlyCall = function (module, method) {
    const stub = this.sandbox.stub(module, method)
    stub.callsFake((args) => {
      throw new Error(stripIndent`
      ${chalk.magenta(`.${method}`)} called without matching '.withArgs(...)'
        with args: ${chalk.magenta(args)}
      `)
    })
    return stub
  }

  this.onlyCall(os, 'platform')
  this.onlyCall(os, 'release')
})

afterEach(function () {
  this.sandbox.restore()
})
