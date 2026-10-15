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
import path from 'path'
import { cache } from '@packages/server/lib/cache'

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
    this.test.parent['_onlyTests'] = [true]
  }
})

beforeEach(async function () {
  this.originalEnv = originalEnv

  nock.disableNetConnect()
  nock.enableNetConnect(/localhost/)

  // always clean up the cache
  // before each test
  await cache.remove()
})

afterEach(() => {
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
