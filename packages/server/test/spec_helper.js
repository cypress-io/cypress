/* eslint-disable no-console */
require('../lib/environment')

const { enable, mockElectron } = require('./mockery_helper')

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
const cache = require('../lib/cache')

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
  const clock = useFakeTimers.apply(sinon, args)

  sinon._clock = clock

  return clock
}

sinon.restore = function (...args) {
  let c

  c = sinon._clock

  if (c) {
    c.restore()
  }

  return restore.apply(sinon, args)
}

enable(mockery)

mockElectron(mockery)

before(function () {
  if (hasOnly) {
    this.test.parent._onlyTests = [true]
  }
})

// appData.ensure()

const { setCtx, getCtx, clearCtx, makeDataContext } = require('../lib/makeDataContext')

before(async () => {
  await clearCtx()
  setCtx(makeDataContext({}))
})

beforeEach(async function () {
  await clearCtx()
  setCtx(makeDataContext({}))
  this.originalEnv = originalEnv

  nock.disableNetConnect()
  nock.enableNetConnect(/localhost/)

  // always clean up the cache
  // before each test
  return cache.remove()
})

afterEach(async () => {
  try {
    await getCtx()._reset()
  } catch (e) {
    console.error('CAUGHT ERROR calling ctx._reset:')
    console.error(e)
  }
  await clearCtx()
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
