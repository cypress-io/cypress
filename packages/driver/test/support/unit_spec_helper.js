path = require("path")
chai = require("chai")
jsdom = require("jsdom").JSDOM
sinon = require("sinon")
Promise = require("bluebird")
sinonChai = require("@cypress/sinon-chai")

chai
.use(sinonChai)

## src = /Users/foo/cypress/packages/driver/src
global.src = path.resolve("src")
global.expect = chai.expect

## create jsdom and setup browser globals
global.jsdom = j = new jsdom('')
global.window = j.window
global.document = window.document

beforeEach ->
  @sandbox = sinon.createSandbox()

afterEach ->
  @sandbox.restore()
