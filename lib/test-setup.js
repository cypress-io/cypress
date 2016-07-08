var chai = require('chai')
var chaiEnzyme = require('chai-enzyme')
var sinonChai = require('sinon-chai')

chai.use(chaiEnzyme())
chai.use(sinonChai)
global.expect = chai.expect
