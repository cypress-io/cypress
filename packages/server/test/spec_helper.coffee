require("../lib/environment")

global.root      = "../../"
global.supertest = require("supertest-as-promised")
global.nock      = require("nock")
global.fs        = require("fs-extra")
global.expect    = require("chai").expect
global.mockery   = require("mockery")
global.proxyquire = require("proxyquire")
Promise          = require("bluebird")
path             = require("path")
sinon            = require("sinon")
sinonPromise     = require("sinon-as-promised")(Promise)
cache            = require("../lib/cache")
appData          = require("../lib/util/app_data")

global.fs = fs = Promise.promisifyAll(global.fs)

agent = require("superagent")

require("chai")
.use(require("@cypress/sinon-chai"))

mockery.enable({
  warnOnUnregistered: false
})

## stub out the entire electron object for our stub
## we must use an absolute path here because of the way mockery internally loads this
## module - meaning the first time electron is required it'll use this path string
## so because its required from a separate module we must use an absolute reference to it
mockery.registerSubstitute("electron", path.join(__dirname, "./support/helpers/electron_stub"))

## stub out electron's original-fs module which is available when running in electron
mockery.registerMock("original-fs", {})

before ->
  appData.ensure()

beforeEach ->
  if global.fs isnt fs
    global.fs = fs

  nock.disableNetConnect()
  nock.enableNetConnect(/localhost/)

  @sandbox = sinon.sandbox.create()

afterEach ->
  @sandbox.restore()

  nock.cleanAll()
  nock.enableNetConnect()

  if global.fs isnt fs
    global.fs = fs

  ## always clean up the cache
  ## after each test
  cache.remove()
