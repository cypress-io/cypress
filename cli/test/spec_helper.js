const path = require('path')
const sinon = require('sinon')

global.expect = require('chai').expect
global.lib = path.join(__dirname, '..', 'lib')

require('chai')
  .use(require('@cypress/sinon-chai'))

beforeEach(function () {
  this.sandbox = sinon.sandbox.create()
})

afterEach(function () {
  this.sandbox.restore()
})
