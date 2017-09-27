/* global document */

'use strict'

const chai = require('chai')
const jsdom = require('jsdom').jsdom
const sinonChai = require('sinon-chai')
const $Cypress = require('@packages/driver')
const io = require('@packages/socket')

const exposedProperties = ['window', 'navigator', 'document']

// http://airbnb.io/enzyme/docs/guides/jsdom.html
global.document = jsdom('')
global.window = document.defaultView
Object.keys(document.defaultView).forEach((property) => {
  if (typeof global[property] === 'undefined') {
    exposedProperties.push(property)
    global[property] = document.defaultView[property]
  }
})
global.navigator = {
  userAgent: 'node.js',
}

// enzyme, and therefore chai-enzyme, needs to be required after
// global.navigator is set up (https://github.com/airbnb/enzyme/issues/395)
const chaiEnzyme = require('chai-enzyme')

chai.use(chaiEnzyme())
chai.use(sinonChai)
global.expect = chai.expect

class Runnable {
  emit () {}
}

class Runner {
  emit () {}
  uncaught () {}
}

global.Mocha = { Runnable, Runner }
$Cypress.create = () => {}
io.connect = () => { return { emit: () => {}, on: () => {} } }
