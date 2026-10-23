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

chai
.use(chaiSubset)
.use(sinonChai)
.use(chaiUuid)
.use(chaiAsPromised)

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

// The `lib` modules below are required rather than imported so they load in this
// order: after Bluebird is configured, which it refuses once promises are in use,
// after the globals above are set, and, for makeDataContext, after mockery has
// substituted the electron stub.
const { cache }: typeof import('../lib/cache') = require('../lib/cache')
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

let hasOnly = false

// hack for older version of mocha so that
// snap-shot-it can find suite._onlyTests
for (const fn of [it, describe, context]) {
  const backup = fn.only

  Object.assign(fn, {
    only (...args) {
      hasOnly = true

      return Reflect.apply(backup, this, args)
    },
  })
}

const originalEnv = process.env
const env = _.clone(process.env)

sinon.usingPromise(Promise)

// backup these originals
const {
  restore,
  useFakeTimers,
} = sinon

let clock: sinon.SinonFakeTimers | undefined

sinon.useFakeTimers = function (...args) {
  clock = useFakeTimers.apply(sinon, args)

  return clock
}

sinon.restore = function (...args) {
  if (clock) {
    clock.restore()
    clock = undefined
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

const { setCtx, getCtx, clearCtx, makeDataContext }: typeof import('../lib/makeDataContext') = require('../lib/makeDataContext')

// Safe because these hooks only need some context to exist between tests; a spec
// that depends on `mode` or `modeOptions` makes its own context with them.
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
  await cache.remove()
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
