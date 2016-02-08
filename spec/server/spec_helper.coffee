global.root      = '../../../'
global.supertest = require("supertest")
global.nock      = require("nock")
global.fs        = require("fs-extra")
global.Promise   = require("bluebird")
global.expect    = require("chai").expect
global.mockery   = require("mockery")
global.proxyquire = require("proxyquire")
sinon            = require("sinon")
sinonPromise     = require("sinon-as-promised")

global.fs = fs = Promise.promisifyAll(global.fs)

require('chai')
.use(require('sinon-chai'))

beforeEach ->
  if global.fs isnt fs
    global.fs = fs

  nock.disableNetConnect()

  @sandbox = sinon.sandbox.create()

afterEach ->
  @sandbox.restore()

  nock.cleanAll()
  nock.enableNetConnect()

  if global.fs isnt fs
    global.fs = fs
