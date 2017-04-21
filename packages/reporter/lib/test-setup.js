var chai = require('chai')
var chaiEnzyme = require('chai-enzyme')
var jsdom = require('jsdom').jsdom
var sinonChai = require('sinon-chai')

var exposedProperties = ['window', 'navigator', 'document']

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
  userAgent: 'node.js'
}

chai.use(chaiEnzyme())
chai.use(sinonChai)
global.expect = chai.expect
