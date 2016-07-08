var chai = require('chai')
var chaiEnzyme = require('chai-enzyme')

chai.use(chaiEnzyme())
global.expect = chai.expect
