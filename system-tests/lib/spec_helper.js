const chai = require('chai')

chai.use(require('chai-subset'))

global.IS_TEST = true
global.supertest = require('supertest')
global.nock = require('nock')
global.expect = chai.expect
global.mockery = require('mockery')
global.proxyquire = require('proxyquire')
global.sinon = require('sinon')
const _ = require('lodash')
const Promise = require('bluebird')
const path = require('path')
const cache = require(`@packages/server/lib/cache`)

require('chai')
.use(require('@cypress/sinon-chai'))
.use(require('chai-uuid'))
.use(require('chai-as-promised'))

if (process.env.UPDATE) {
  throw new Error('You\'re using UPDATE=1 which is the old way of updating snapshots.\n\nThe correct environment variable is SNAPSHOT_UPDATE=1')
}

if (process.env.UPDATE_SNAPSHOT) {
  throw new Error('You\'re using UPDATE_SNAPSHOT=1\n\nThe correct environment variable is SNAPSHOT_UPDATE=1')
}

if (process.env.UPDATE_SNAPSHOTS) {
  throw new Error('You\'re using UPDATE_SNAPSHOTS=1\n\nThe correct environment variable is SNAPSHOT_UPDATE=1')
}

let hasOnly = false;

// hack for older version of mocha so that
// snap-shot-it can find suite._onlyTests
['it', 'describe', 'context'].forEach((prop) => {
  const backup = global[prop].only

  global[prop].only = function (...args) {
    hasOnly = true

    return backup.apply(this, args)
  }
})

const originalEnv = process.env
const env = _.clone(process.env)

sinon.usingPromise(Promise)

// backup these originals
const {
  restore,
  useFakeTimers,
} = sinon

sinon.useFakeTimers = function (...args) {
  sinon._clock = useFakeTimers.apply(sinon, args)
}

sinon.restore = function (...args) {
  let c

  c = sinon._clock

  if (c) {
    c.restore()
  }

  return restore.apply(sinon, args)
}

mockery.enable({
  warnOnUnregistered: false,
})

// stub out the entire electron object for our stub
// we must use an absolute path here because of the way mockery internally loads this
// module - meaning the first time electron is required it'll use this path string
// so because its required from a separate module we must use an absolute reference to it
mockery.registerSubstitute(
  'electron',
  path.join(__dirname, './support/helpers/electron_stub'),
)

// stub out electron's original-fs module which is available when running in electron
mockery.registerMock('original-fs', {})

before(function () {
  if (hasOnly) {
    this.test.parent._onlyTests = [true]
  }
})

// appData.ensure()

beforeEach(function () {
  this.originalEnv = originalEnv

  nock.disableNetConnect()
  nock.enableNetConnect(/localhost/)

  // always clean up the cache
  // before each test
  return cache.remove()
})

afterEach(() => {
  sinon.restore()

  nock.cleanAll()
  nock.enableNetConnect()

  process.env = _.clone(env)
})

module.exports = {
  expect: global.expect,
  nock: global.nock,
  proxyquire: global.proxyquire,
  sinon: global.sinon,
  root: global.root,
}
