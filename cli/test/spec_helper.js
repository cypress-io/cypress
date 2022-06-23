const _ = require('lodash')
const os = require('os')
const path = require('path')
const sinon = require('sinon')
const mockfs = require('mock-fs')
const Promise = require('bluebird')
const util = require('../lib/util')
const nock = require('nock')
const { MockChildProcess } = require('spawn-mock')

const _kill = MockChildProcess.prototype.kill

const patchMockSpawn = () => {
  MockChildProcess.prototype.kill = function (...args) {
    this.emit('exit')

    return _kill.apply(this, args)
  }
}

patchMockSpawn()

global.sinon = sinon
global.expect = require('chai').expect
global.lib = path.join(__dirname, '..', 'lib')

require('chai')
.use(require('@cypress/sinon-chai'))
.use(require('chai-string'))
.use(require('chai-as-promised'))

sinon.usingPromise(Promise)

delete process.env.CYPRESS_RUN_BINARY
delete process.env.CYPRESS_INSTALL_BINARY
delete process.env.CYPRESS_CACHE_FOLDER
delete process.env.CYPRESS_DOWNLOAD_MIRROR
delete process.env.DISPLAY

// enable running specs with --silent w/out affecting logging in tests
process.env.npm_config_loglevel = 'notice'

const env = _.clone(process.env)

function throwIfFnNotStubbed (stub, method) {
  const sig = `.${method}(...)`

  stub.callsFake(function (...args) {
    const err = new Error(`${sig} was called without being stubbed.

      ${sig} was called with arguments:

      ${args.map(JSON.stringify).join(', ')}
    `)

    err.stack = _
    .chain(err.stack)
    .split('\n')
    .reject((str) => {
      return _.includes(str, 'sinon')
    })
    .join('\n')
    .value()

    throw err
  })
}

const $stub = sinon.stub

sinon.stub = function (obj, method) {
  /* eslint-disable prefer-rest-params */
  const stub = $stub.apply(this, arguments)

  let fns = [method]

  if (arguments.length === 1) {
    fns = _.functions(obj)
  }

  if (arguments.length === 0) {
    throwIfFnNotStubbed(stub, '[anonymous function]')

    return stub
  }

  fns.forEach((name) => {
    const fn = obj[name]

    if (_.isFunction(fn)) {
      throwIfFnNotStubbed(fn, name)
    }
  })

  return stub
}

beforeEach(function () {
  sinon.stub(os, 'platform')
  sinon.stub(os, 'release')
  sinon.stub(util, 'getOsVersionAsync').resolves('Foo-OsVersion')
})

afterEach(function () {
  mockfs.restore()
  process.env = _.clone(env)
  sinon.restore()
  nock.cleanAll()
  util._cachedArch = undefined
})
