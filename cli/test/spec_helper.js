const path = require('path')
const sinon = require('sinon')
const Promise = require('bluebird')
const os = require('os')

global.expect = require('chai').expect
global.lib = path.join(__dirname, '..', 'lib')

require('chai')
.use(require('@cypress/sinon-chai'))
.use(require('chai-string'))

before(function () {
  os.platform = () => {
    throw new Error('you called os.platform() without stubbing it')
  }
})

beforeEach(function () {
  this.sandbox = sinon.sandbox.create().usingPromise(Promise)
})

afterEach(function () {
  this.sandbox.restore()
})
