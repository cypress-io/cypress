global.root      = '../../../'
global.supertest = require("supertest")
global.nock      = require("nock")
global.fs        = require("fs-extra")
global.Promise   = require("bluebird")
global.expect    = require("chai").expect
global.mockery   = require("mockery")
global.proxyquire = require("proxyquire")
path             = require("path")
sinon            = require("sinon")
sinonPromise     = require("sinon-as-promised")

global.fs = fs = Promise.promisifyAll(global.fs)

require('chai')
.use(require('sinon-chai'))

mockery.enable({
  warnOnUnregistered: false
})

## stub out the entire electron object for our stub
## we must use an absolute path here because of the way mockery internally loads this
## module - meaning the first time electron is required it'll use this path string
## so because its required from a separate module we must use an absolute reference to it
mockery.registerSubstitute("electron", path.join(__dirname, "./helpers/electron_stub"))

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
