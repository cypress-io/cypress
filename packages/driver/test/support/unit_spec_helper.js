const path = require('path')
const chai = require('chai')
const jsdom = require('jsdom').JSDOM
const sinon = require('sinon')
const sinonChai = require('@cypress/sinon-chai')

chai
.use(sinonChai)

// src = /Users/foo/cypress/packages/driver/src
global.src = path.resolve('src')
global.expect = chai.expect

// create jsdom and setup browser globals
let j

global.jsdom = (j = new jsdom(''))
global.window = j.window
global.document = window.document

beforeEach(function () {
  this.sandbox = sinon.createSandbox()
})

afterEach(function () {
  return this.sandbox.restore()
})
