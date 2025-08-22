import _ from 'lodash'
import os from 'os'
import sinon from 'sinon'
import mockfs from 'mock-fs'
import Bluebird from 'bluebird'
import util from '../lib/util'
import nock from 'nock'
import { MockChildProcess } from 'spawn-mock'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import chaiString from 'chai-string'
import sinonChai from '@cypress/sinon-chai'

const _kill = MockChildProcess.prototype.kill

const patchMockSpawn = (): void => {
  MockChildProcess.prototype.kill = function (...args: any[]): any {
    this.emit('exit')

    return _kill.apply(this, args)
  }
}

patchMockSpawn()

// Set up global variables for test environment
declare global {
  const sinon: typeof import('sinon')
  const expect: typeof import('chai').expect
  const lib: string
}

(global as any).sinon = sinon

;(global as any).expect = chai.expect

chai
.use(sinonChai)
.use(chaiString)
.use(chaiAsPromised)

sinon.usingPromise(Bluebird as any)

delete process.env.CYPRESS_RUN_BINARY
delete process.env.CYPRESS_INSTALL_BINARY
delete process.env.CYPRESS_CACHE_FOLDER
delete process.env.CYPRESS_DOWNLOAD_MIRROR
delete process.env.DISPLAY

// enable running specs with --silent w/out affecting logging in tests
process.env.npm_config_loglevel = 'notice'

const env = _.clone(process.env)

function throwIfFnNotStubbed (stub: any, method: string): void {
  const sig = `.${method}(...)`

  stub.callsFake(function (...args: any[]): void {
    const err = new Error(`${sig} was called without being stubbed.

      ${sig} was called with arguments:

      ${args.map(JSON.stringify).join(', ')}
    `)

    err.stack = _
    .chain(err.stack)
    .split('\n')
    .reject((str: string) => {
      return _.includes(str, 'sinon')
    })
    .join('\n')
    .value()

    throw err
  })
}

const $stub = sinon.stub

sinon.stub = function (obj?: any, method?: string): any {
  /* eslint-disable prefer-rest-params */
  const stub = $stub.apply(this, arguments as any)

  let fns = [method]

  if (arguments.length === 1) {
    fns = _.functions(obj)
  }

  if (arguments.length === 0) {
    throwIfFnNotStubbed(stub, '[anonymous function]')

    return stub
  }

  fns.forEach((name: string) => {
    const fn = obj[name]

    if (_.isFunction(fn)) {
      throwIfFnNotStubbed(fn, name)
    }
  })

  return stub
}

beforeEach(function (): void {
  sinon.stub(os, 'platform')
  sinon.stub(os, 'arch')
  sinon.stub(os, 'release')
  sinon.stub(util, 'getOsVersionAsync').resolves('Foo-OsVersion')

  ;(os.arch as any).returns('x64')
})

afterEach(function (): void {
  mockfs.restore()
  process.env = _.clone(env)
  sinon.restore()
  nock.cleanAll()

  ;(util as any)._cachedArch = undefined
})
