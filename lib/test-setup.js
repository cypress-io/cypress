var chai = require('chai')
var chaiEnzyme = require('chai-enzyme')
var sinonChai = require('sinon-chai')

chai.use(chaiEnzyme())
chai.use(sinonChai)
// popper.js will fall over if window isn't a global
global.window = undefined
global.expect = chai.expect
