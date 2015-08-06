global.mockery    = require("mockery")
global.program    = require("../lib/cli")
global.nock       = require("nock")
global.expect     = require("chai").expect
global.Promise    = require("bluebird")
sinon             = require("sinon")
sinonPromise      = require("sinon-as-promised")(Promise)

require("chai")
.use(require("sinon-chai"))

beforeEach ->
  @sandbox = sinon.sandbox.create()
  mockery.enable()

afterEach ->
  @sandbox.restore()
  mockery.disable()
