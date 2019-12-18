/* eslint-env mocha */
const sinon = require('sinon')
const Promise = require('bluebird')

global.sinon = sinon

sinon.usingPromise(Promise)

afterEach(function () {
  sinon.restore()
})
