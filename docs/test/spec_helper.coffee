nock = require("nock")
chai = require("chai")
sinon = require("sinon")
sinonChai = require("sinon-chai")

chai.use(sinonChai)

global.nock = nock
global.expect = chai.expect

beforeEach ->
  nock.disableNetConnect()

  @sandbox = sinon.sandbox.create()

afterEach ->
  @sandbox.restore()
