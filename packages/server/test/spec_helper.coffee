require("../lib/environment")

global.root      = "../../"
global.supertest = require("supertest-as-promised")
global.nock      = require("nock")
global.expect    = require("chai").expect
global.mockery   = require("mockery")
global.proxyquire = require("proxyquire")
global.sinon     = require("sinon")
_                = require("lodash")
Promise          = require("bluebird")
path             = require("path")
cache            = require("../lib/cache")
appData          = require("../lib/util/app_data")

require("chai")
.use(require("@cypress/sinon-chai"))
.use(require("chai-uuid"))

if process.env.UPDATE
  throw new Error("You're using UPDATE=1 which is the old way of updating snapshots.\n\nThe correct environment variable is SNAPSHOT_UPDATE=1")

if process.env.UPDATE_SNAPSHOT
  throw new Error("You're using UPDATE_SNAPSHOT=1\n\nThe correct environment variable is SNAPSHOT_UPDATE=1")

if process.env.UPDATE_SNAPSHOTS
  throw new Error("You're using UPDATE_SNAPSHOTS=1\n\nThe correct environment variable is SNAPSHOT_UPDATE=1")

hasOnly = false

## hack for older version of mocha so that
## snap-shot-it can find suite._onlyTests
["it", "describe", "context"].forEach (prop) ->
  backup = global[prop].only

  global[prop].only = ->
    hasOnly = true

    backup.apply(@, arguments)

env = _.clone(process.env)

sinon.usingPromise(Promise)

## backup these originals
restore = sinon.restore
useFakeTimers = sinon.useFakeTimers

sinon.useFakeTimers = ->
  sinon._clock = useFakeTimers.apply(sinon, arguments)

sinon.restore = ->
  if c = sinon._clock
    c.restore()

  restore.apply(sinon, arguments)

mockery.enable({
  warnOnUnregistered: false
})

## stub out the entire electron object for our stub
## we must use an absolute path here because of the way mockery internally loads this
## module - meaning the first time electron is required it'll use this path string
## so because its required from a separate module we must use an absolute reference to it
mockery.registerSubstitute(
  "electron",
  path.join(__dirname, "./support/helpers/electron_stub")
)

## stub out electron's original-fs module which is available when running in electron
mockery.registerMock("original-fs", {})

before ->
  if hasOnly
    @test.parent._onlyTests = [true]

  appData.ensure()

beforeEach ->
  nock.disableNetConnect()
  nock.enableNetConnect(/localhost/)

  ## always clean up the cache
  ## before each test
  cache.remove()

afterEach ->
  sinon.restore()

  nock.cleanAll()
  nock.enableNetConnect()

  ## if we set process.env = env, process.env loses the "special" getters and setters
  ## just assign the enumerable props of env back to process.env instead
  Object.assign(process.env, env)
