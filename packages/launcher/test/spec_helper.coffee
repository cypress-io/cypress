chai      = require("chai")
sinon     = require("sinon")
sinonChai = require("sinon-chai")

chai.use(sinonChai)

global.expect = chai.expect

beforeEach ->
  @sandbox = sinon.createSandbox()

afterEach ->
  @sandbox.restore()
