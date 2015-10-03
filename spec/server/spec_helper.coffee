global.root      = '../../../'
global.supertest = require("supertest")
global.nock      = require("nock")
global.fs        = require("fs-extra")
global.Promise   = require("bluebird")
global.expect    = require("chai").expect
sinon            = require("sinon")
sinonPromise     = require("sinon-as-promised")

global.fs = fs = Promise.promisifyAll(global.fs)

require('chai')
.use(require('sinon-chai'))

beforeEach ->
  @sandbox = sinon.sandbox.create()

afterEach ->
  @sandbox.restore()

  if global.fs isnt fs
    global.fs = fs
