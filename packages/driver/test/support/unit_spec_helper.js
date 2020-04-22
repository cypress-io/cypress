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
global.jsdom = new jsdom('')
global.window = global.jsdom.windows
global.document = window.document

beforeEach(function () {
  this.sandbox = sinon.createSandbox()
})

afterEach(function () {
  this.sandbox.restore()
})
