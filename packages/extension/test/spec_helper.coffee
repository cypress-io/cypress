chai      = require("chai")
sinon     = require("sinon")
sinonChai = require("sinon-chai")

chai.use(sinonChai)

global.sinon = sinon
global.expect = chai.expect

afterEach ->
  sinon.restore()
