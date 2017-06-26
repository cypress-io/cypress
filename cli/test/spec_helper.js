global.expect = require('chai').expect
global.Promise = require('bluebird')
const sinon = require('sinon')

require('chai')
  .use(require('@cypress/sinon-chai'))

beforeEach(function () {
  this.sandbox = sinon.sandbox.create()
})

afterEach(function () {
  this.sandbox.restore()
})
