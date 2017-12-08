const path = require('path')
const sinon = require('sinon')
const Promise = require('bluebird')

global.expect = require('chai').expect
global.lib = path.join(__dirname, '..', 'lib')

require('chai')
.use(require('@cypress/sinon-chai'))
.use(require('chai-string'))

beforeEach(function () {
  this.sandbox = sinon.sandbox.create().usingPromise(Promise)
})

afterEach(function () {
  this.sandbox.restore()
})
