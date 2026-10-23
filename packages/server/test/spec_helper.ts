/* eslint-disable no-console */
import chai from 'chai'
import chaiSubset from 'chai-subset'
import sinonChai from '@cypress/sinon-chai'
import chaiUuid from 'chai-uuid'
import chaiAsPromised from 'chai-as-promised'
import supertest from 'supertest'
import nock from 'nock'
import mockery from 'mockery'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import _ from 'lodash'
import { enable, mockElectron } from './mockery_helper'

import { configureLongStackTraces } from '../lib/environment'

configureLongStackTraces(undefined)

chai.use(chaiSubset)

const expect = chai.expect

Object.assign(global, {
  IS_TEST: true,
  supertest,
  nock,
  expect,
  mockery,
  proxyquire,
  sinon,
})

// `lib` modules are required, not imported, so they load after Bluebird is configured
// (it refuses once promises exist) and, for makeDataContext, after electron is stubbed
const { cache }: typeof import('../lib/cache') = require('../lib/cache')

chai
.use(sinonChai)
.use(chaiUuid)
.use(chaiAsPromised)

const { GracefulExit }: typeof import('../lib/util/graceful-exit') = require('../lib/util/graceful-exit')

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

let fakeClock: sinon.SinonFakeTimers | undefined

sinon.useFakeTimers = function (...args) {
  const clock = useFakeTimers.apply(sinon, args)

  fakeClock = clock

  return clock
}

sinon.restore = function (...args) {
  let c

  c = fakeClock

  if (c) {
    c.restore()
  }

  return restore.apply(sinon, args)
}

enable(mockery)

mockElectron(mockery)

before(function () {
  if (hasOnly && this.test?.parent) {
    this.test.parent['_onlyTests'] = [true]
  }
})

// appData.ensure()

const { setCtx, getCtx, clearCtx, makeDataContext }: typeof import('../lib/makeDataContext') = require('../lib/makeDataContext')

// Safe because specs that depend on `mode` or `modeOptions` make their own context
const defaultCtxOptions = {} as Parameters<typeof makeDataContext>[0]

before(async () => {
  await clearCtx()
  setCtx(makeDataContext(defaultCtxOptions))
})

beforeEach(async function () {
  GracefulExit.resetForTesting()
  await clearCtx()
  setCtx(makeDataContext(defaultCtxOptions))
  this.originalEnv = originalEnv

  if (!nock.isActive()) {
    nock.activate()
  }

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

export {
  expect,
  nock,
  proxyquire,
  sinon,
}
