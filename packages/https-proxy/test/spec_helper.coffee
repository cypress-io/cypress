chai          = require("chai")
sinon         = require("sinon")
Promise       = require("bluebird")
sinonChai     = require("sinon-chai")
sinonPromise  = require("sinon-as-promised")(Promise)

global.request   = require("request-promise")
global.supertest = require("supertest-as-promised")(Promise)

chai.use(sinonChai)

global.expect = chai.expect

beforeEach ->
  @sandbox = sinon.createSandbox(()

afterEach ->
  @sandbox.restore()