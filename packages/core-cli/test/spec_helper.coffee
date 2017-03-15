global.mockery    = require("mockery")
global.proxyquire = require("proxyquire")
global.nock       = require("nock")
global.expect     = require("chai").expect
global.Promise    = require("bluebird")
sinon             = require("sinon")
sinonPromise      = require("sinon-as-promised")(Promise)
cli               = require("../lib/cli")

require("chai")
.use(require("sinon-chai"))

beforeEach ->
  global.program = cli()
  @sandbox = sinon.sandbox.create()
  mockery.enable()

afterEach ->
  @sandbox.restore()
  mockery.disable()
