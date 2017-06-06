let chai = require('chai')
let chaiEnzyme = require('chai-enzyme')
let jsdom = require('jsdom').jsdom
let sinonChai = require('sinon-chai')

let exposedProperties = ['window', 'navigator', 'document']

/* global document */
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
  appVersion: 'node',
  userAgent: 'node.js',
}

chai.use(chaiEnzyme())
chai.use(sinonChai)
global.expect = chai.expect
