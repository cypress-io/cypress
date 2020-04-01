/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let j
const path = require('path')
const chai = require('chai')
const jsdom = require('jsdom').JSDOM
const sinon = require('sinon')
const Promise = require('bluebird')
const sinonChai = require('@cypress/sinon-chai')

chai
.use(sinonChai)

// src = /Users/foo/cypress/packages/driver/src
global.src = path.resolve('src')
global.expect = chai.expect

// create jsdom and setup browser globals
global.jsdom = (j = new jsdom(''))
global.window = j.window
global.document = window.document

beforeEach(function () {
  this.sandbox = sinon.createSandbox()
})

afterEach(function () {
  return this.sandbox.restore()
})
