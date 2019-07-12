const chai = require('chai')
const JSDOM = require('jsdom').JSDOM
const sinonChai = require('sinon-chai')
const $Cypress = require('@packages/driver')
const { client } = require('@packages/socket')

// http://airbnb.io/enzyme/docs/guides/jsdom.html
const jsdom = new JSDOM('<!doctype html><html><body></body></html>')
const { window } = jsdom

global.window = window
global.document = window.document
global.navigator = {
  userAgent: 'node.js',
}

global.requestAnimationFrame = function (callback) {
  return setTimeout(callback, 0)
}

global.cancelAnimationFrame = function (id) {
  clearTimeout(id)
}

Object.keys(window.document.defaultView).forEach((property) => {
  if (
    property === 'localStorage' ||
    property === 'sessionStorage' ||
    typeof global[property] !== 'undefined'
  ) return

  global[property] = window.document.defaultView[property]
})

// enzyme, and therefore chai-enzyme, needs to be required after
// global.navigator is set up (https://github.com/airbnb/enzyme/issues/395)
const enzyme = require('enzyme')
const EnzymeAdapter = require('enzyme-adapter-react-16')
const chaiEnzyme = require('chai-enzyme')

enzyme.configure({ adapter: new EnzymeAdapter() })

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
client.connect = () => {
  return { emit: () => {}, on: () => {} }
}
