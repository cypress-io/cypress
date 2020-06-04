const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

chai.use(sinonChai)

global.sinon = sinon
global.expect = chai.expect

afterEach(() => {
  return sinon.restore()
})
