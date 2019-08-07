chai          = require("chai")
sinon         = require("sinon")
Promise       = require("bluebird")
sinonChai     = require("sinon-chai")
sinonPromise  = require("sinon-as-promised")(Promise)

global.request   = require("request-promise")
global.sinon     = sinon
global.supertest = require("supertest")

chai.use(sinonChai)

global.expect = chai.expect

beforeEach ->
  @sandbox = sinon.sandbox.create()

afterEach ->
  @sandbox.restore()
