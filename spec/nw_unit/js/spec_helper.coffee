lookup = (path) ->
  path = root + path

  try
    require(path)
  catch e
    require("../../#{path}")

global.root     = "../../../"
global.os       = require("os")
global.nock     = require("nock")
global.Promise  = require("bluebird")
fs              = require("fs-extra")
chai            = require("chai")
sinon           = require("sinon")
sinonChai       = require("sinon-chai")
sinonPromise    = require("sinon-as-promised")
cache           = lookup("lib/cache")
Log             = lookup("lib/log")
global.Fixtures = require("#{root}/spec/server/helpers/fixtures")

chai.use(sinonChai)

global.fs     = Promise.promisifyAll(fs)
global.expect = chai.expect

beforeEach ->
  @sandbox = sinon.sandbox.create()

  @debug = (fn) =>
    setTimeout fn, 1000

  cache.remove()
  Log.clearLogs()

afterEach ->
  @sandbox.restore()

  Promise.delay(100)

## because we run these tests during the /dist
## process after obfuscation we no longer have
## access to individual modules and must walk
## back up to the root cypress-app dir and grab
## them from there because process.cwd() still
## matches wherever we're invoking this file from
module.exports = lookup