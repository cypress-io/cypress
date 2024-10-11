import '@packages/server/test/spec_helper'

import _ from 'lodash'
import { expect } from 'chai'
import sinon from 'sinon'
import stripAnsi from 'strip-ansi'
import Debug from 'debug'
import os from 'node:os'

import errors from '@packages/errors'
import Fixtures from '@tooling/system-tests'

import {
  checkIfResolveChangedRootFolder,
  parseEnv,
  utils,
  resolveConfigValues,
  setPluginResolvedOn,
  setAbsolutePaths,
  setNodeBinary,
  relativeToProjectRoot,
  setSupportFileAndFolder,
  mergeDefaults,
} from '../../src/project/utils'
import path from 'node:path'

const debug = Debug('test')

describe('config/src/project/utils', () => {
  beforeEach(function () {
    delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS
  })

  before(function () {
    this.env = process.env;

    (process as any).env = _.omit(process.env, 'CYPRESS_DEBUG')

    Fixtures.scaffold()
  })

  after(function () {
    process.env = this.env
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('checkIfResolveChangedRootFolder', () => {
    it('ignores non-absolute paths', () => {
      expect(checkIfResolveChangedRootFolder('foo/index.js', 'foo')).to.be.false
    })

    it('handles paths that do not switch', () => {
      expect(checkIfResolveChangedRootFolder('/foo/index.js', '/foo')).to.be.false
    })

    it('detects path switch', () => {
      expect(checkIfResolveChangedRootFolder('/private/foo/index.js', '/foo')).to.be.true
    })
  })

  context('.getProcessEnvVars', () => {
    it('returns process envs prefixed with cypress', () => {
      const envs = {
        CYPRESS_BASE_URL: 'value',
        RANDOM_ENV: 'ignored',
      } as unknown as NodeJS.ProcessEnv

      expect(utils.getProcessEnvVars(envs)).to.deep.eq({
        BASE_URL: 'value',
      })
    })

    it('does not return CYPRESS_RESERVED_ENV_VARS', () => {
      const envs = {
        CYPRESS_INTERNAL_ENV: 'value',
      } as unknown as NodeJS.ProcessEnv

      expect(utils.getProcessEnvVars(envs)).to.deep.eq({})
    });

    ['cypress_', 'CYPRESS_'].forEach((key) => {
      it(`reduces key: ${key}`, () => {
        const obj = {
          cypress_host: 'http://localhost:8888',
          foo: 'bar',
          env: '123',
        } as unknown as NodeJS.ProcessEnv

        obj[`${key}version`] = '0.12.0'

        expect(utils.getProcessEnvVars(obj)).to.deep.eq({
          host: 'http://localhost:8888',
          version: '0.12.0',
        })
      })
    })

    it('does not merge reserved environment variables', () => {
      const obj = {
        CYPRESS_INTERNAL_ENV: 'production',
        CYPRESS_FOO: 'bar',
        CYPRESS_CRASH_REPORTS: '0',
        CYPRESS_PROJECT_ID: 'abc123',
      } as NodeJS.ProcessEnv

      expect(utils.getProcessEnvVars(obj)).to.deep.eq({
        FOO: 'bar',
        PROJECT_ID: 'abc123',
        CRASH_REPORTS: 0,
      })
    })
  })

  context('environment name check', () => {
    it('throws an error for unknown CYPRESS_INTERNAL_ENV', async () => {
      sinon.stub(errors, 'throwErr').withArgs('INVALID_CYPRESS_INTERNAL_ENV', 'foo-bar');
      (process as any).env.CYPRESS_INTERNAL_ENV = 'foo-bar'
      const cfg = {
        projectRoot: '/foo/bar/',
        supportFile: false,
      }
      const options = {}

      const getFilesByGlob = sinon.stub().returns(['path/to/file'])

      try {
        await mergeDefaults(cfg, options, {}, getFilesByGlob)
      } catch {
        //
      }

      expect(errors.throwErr).have.been.calledOnce
    })

    it('allows production CYPRESS_INTERNAL_ENV', async () => {
      sinon.stub(errors, 'throwErr')
      process.env.CYPRESS_INTERNAL_ENV = 'production'
      const cfg = {
        projectRoot: '/foo/bar/',
        supportFile: false,
      }
      const options = {}

      const getFilesByGlob = sinon.stub().returns(['path/to/file'])

      await mergeDefaults(cfg, options, {}, getFilesByGlob)

      expect(errors.throwErr).not.to.be.called
    })
  })

  context('.parseEnv', () => {
    it('merges together env from config, env from file, env from process, and env from CLI', () => {
      sinon.stub(utils, 'getProcessEnvVars').returns({
        version: '0.12.1',
        user: 'bob',
      })

      const obj = {
        env: {
          version: '0.10.9',
          project: 'todos',
          host: 'localhost',
          baz: 'quux',
        },

        envFile: {
          host: 'http://localhost:8888',
          user: 'brian',
          foo: 'bar',
        },
      }

      const envCLI = {
        version: '0.14.0',
        project: 'pie',
      }

      expect(parseEnv(obj, envCLI)).to.deep.eq({
        version: '0.14.0',
        project: 'pie',
        host: 'http://localhost:8888',
        user: 'bob',
        foo: 'bar',
        baz: 'quux',
      })
    })
  })

  context('.resolveConfigValues', () => {
    beforeEach(function () {
      this.expected = function (obj) {
        const merged = resolveConfigValues(obj.config, obj.defaults, obj.resolved)

        expect(merged).to.deep.eq(obj.final)
      }
    })

    it('sets baseUrl to default', function () {
      return this.expected({
        config: { baseUrl: null },
        defaults: { baseUrl: null },
        resolved: {},
        final: {
          baseUrl: {
            value: null,
            from: 'default',
          },
        },
      })
    })

    it('sets baseUrl to config', function () {
      return this.expected({
        config: { baseUrl: 'localhost' },
        defaults: { baseUrl: null },
        resolved: {},
        final: {
          baseUrl: {
            value: 'localhost',
            from: 'config',
          },
        },
      })
    })

    it('does not change existing resolved values', function () {
      return this.expected({
        config: { baseUrl: 'localhost' },
        defaults: { baseUrl: null },
        resolved: { baseUrl: 'cli' },
        final: {
          baseUrl: {
            value: 'localhost',
            from: 'cli',
          },
        },
      })
    })

    it('ignores values not found in configKeys', function () {
      return this.expected({
        config: { baseUrl: 'localhost', foo: 'bar' },
        defaults: { baseUrl: null },
        resolved: { baseUrl: 'cli' },
        final: {
          baseUrl: {
            value: 'localhost',
            from: 'cli',
          },
        },
      })
    })
  })

  context('.setPluginResolvedOn', () => {
    it('resolves an object with single property', () => {
      const cfg = {}
      const obj = {
        foo: 'bar',
      }

      setPluginResolvedOn(cfg, obj)

      expect(cfg).to.deep.eq({
        foo: {
          value: 'bar',
          from: 'plugin',
        },
      })
    })

    it('resolves an object with multiple properties', () => {
      const cfg = {}
      const obj = {
        foo: 'bar',
        baz: [1, 2, 3],
      }

      setPluginResolvedOn(cfg, obj)

      expect(cfg).to.deep.eq({
        foo: {
          value: 'bar',
          from: 'plugin',
        },
        baz: {
          value: [1, 2, 3],
          from: 'plugin',
        },
      })
    })

    it('resolves a nested object', () => {
      // we need at least the structure
      const cfg = {
        foo: {
          bar: 1,
        },
      }
      const obj = {
        foo: {
          bar: 42,
        },
      }

      setPluginResolvedOn(cfg, obj)

      expect(cfg, 'foo.bar gets value').to.deep.eq({
        foo: {
          bar: {
            value: 42,
            from: 'plugin',
          },
        },
      })
    })

    // https://github.com/cypress-io/cypress/issues/7959
    it('resolves a single object', () => {
      const cfg = {
      }
      const obj = {
        foo: {
          bar: {
            baz: 42,
          },
        },
      }

      setPluginResolvedOn(cfg, obj)

      expect(cfg).to.deep.eq({
        foo: {
          from: 'plugin',
          value: {
            bar: {
              baz: 42,
            },
          },
        },
      })
    })
  })

  context('_.defaultsDeep', () => {
    it('merges arrays', () => {
      // sanity checks to confirm how Lodash merges arrays in defaultsDeep
      const diffs = {
        list: [1],
      }
      const cfg = {
        list: [1, 2],
      }
      const merged = _.defaultsDeep({}, diffs, cfg)

      expect(merged, 'arrays are combined').to.deep.eq({
        list: [1, 2],
      })
    })
  })

  context('.setAbsolutePaths', () => {
    it('is noop without projectRoot', () => {
      expect(setAbsolutePaths({})).to.deep.eq({})
    })

    it('does not mutate existing obj', () => {
      const obj = {}

      expect(setAbsolutePaths(obj)).not.to.eq(obj)
    })

    it('ignores non special *folder properties', () => {
      const obj = {
        projectRoot: '/_test-output/path/to/project',
        blehFolder: 'some/rando/path',
        foo: 'bar',
        baz: 'quux',
      }

      expect(setAbsolutePaths(obj)).to.deep.eq(obj)
    })

    return ['fileServerFolder', 'fixturesFolder'].forEach((folder) => {
      it(`converts relative ${folder} to absolute path`, () => {
        const obj = {
          projectRoot: '/_test-output/path/to/project',
        }

        obj[folder] = 'foo/bar'

        const expected = {
          projectRoot: '/_test-output/path/to/project',
        }

        expected[folder] = '/_test-output/path/to/project/foo/bar'

        expect(setAbsolutePaths(obj)).to.deep.eq(expected)
      })
    })
  })

  context('.setNodeBinary', () => {
    beforeEach(function () {
      this.nodeVersion = process.versions.node
    })

    it('sets cli Node ver', function () {
      const obj = setNodeBinary({
      }, '/foo/bar/node', '1.2.3')

      expect(obj).to.deep.eq({
        resolvedNodeVersion: '1.2.3',
        resolvedNodePath: '/foo/bar/node',
      })
    })

    it('sets userNodePath undefined', function () {
      const obj = setNodeBinary({
      }, undefined, '1.2.3')

      expect(obj).to.deep.eq({
        resolvedNodeVersion: this.nodeVersion,
      })
    })

    it('sets userNodeVersion undefined', function () {
      const obj = setNodeBinary({
      }, '/foo/bar/node')

      expect(obj).to.deep.eq({
        resolvedNodeVersion: this.nodeVersion,
      })
    })
  })

  describe('relativeToProjectRoot', () => {
    context('posix', () => {
      it('returns path of file relative to projectRoot', () => {
        const projectRoot = '/root/projects'
        const supportFile = '/root/projects/cypress/support/e2e.js'

        expect(relativeToProjectRoot(projectRoot, supportFile)).to.eq('cypress/support/e2e.js')
      })
    })

    context('windows', () => {
      it('returns path of file relative to projectRoot', () => {
        const projectRoot = `\\root\\projects`
        const supportFile = `\\root\\projects\\cypress\\support\\e2e.js`

        expect(relativeToProjectRoot(projectRoot, supportFile)).to.eq(`cypress\\support\\e2e.js`)
      })
    })
  })

  context('.setSupportFileAndFolder', () => {
    it('does nothing if supportFile is falsey', () => {
      const obj = {
        projectRoot: '/_test-output/path/to/project',
      }

      const getFilesByGlob = sinon.stub().returns(['path/to/file.ts'])

      return setSupportFileAndFolder(obj, getFilesByGlob)
      .then((result) => {
        expect(result).to.eql(obj)
      })
    })

    it('sets the full path to the supportFile and supportFolder if it exists', () => {
      const projectRoot = process.cwd()

      const obj = setAbsolutePaths({
        projectRoot,
        supportFile: 'test/project/utils.spec.ts',
      })

      const getFilesByGlob = sinon.stub().returns([path.join(projectRoot, obj.supportFile)])

      return setSupportFileAndFolder(obj, getFilesByGlob)
      .then((result) => {
        expect(result).to.eql({
          projectRoot,
          supportFile: `${projectRoot}/test/project/utils.spec.ts`,
          supportFolder: `${projectRoot}/test/project`,
        })
      })
    })

    it('sets the supportFile to default e2e.js if it does not exist, support folder does not exist, and supportFile is the default', () => {
      const projectRoot = Fixtures.projectPath('no-scaffolding')

      const obj = setAbsolutePaths({
        projectRoot,
        supportFile: 'cypress/support/e2e.js',
      })

      const getFilesByGlob = sinon.stub().returns([path.join(projectRoot, obj.supportFile)])

      return setSupportFileAndFolder(obj, getFilesByGlob)
      .then((result) => {
        expect(result).to.eql({
          projectRoot,
          supportFile: `${projectRoot}/cypress/support/e2e.js`,
          supportFolder: `${projectRoot}/cypress/support`,
        })
      })
    })

    it('finds support file in project path that contains glob syntax', () => {
      const projectRoot = Fixtures.projectPath('project-with-(glob)-[chars]')

      const obj = setAbsolutePaths({
        projectRoot,
        supportFile: 'cypress/support/e2e.js',
      })

      const getFilesByGlob = sinon.stub().returns([path.join(projectRoot, obj.supportFile)])

      return setSupportFileAndFolder(obj, getFilesByGlob)
      .then((result) => {
        expect(result).to.eql({
          projectRoot,
          supportFile: `${projectRoot}/cypress/support/e2e.js`,
          supportFolder: `${projectRoot}/cypress/support`,
        })
      })
    })

    it('sets the supportFile to false if it does not exist, support folder exists, and supportFile is the default', () => {
      const projectRoot = Fixtures.projectPath('empty-folders')

      const obj = setAbsolutePaths({
        projectRoot,
        supportFile: false,
      })

      const getFilesByGlob = sinon.stub().returns(['path/to/file.ts'])

      return setSupportFileAndFolder(obj, getFilesByGlob)
      .then((result) => {
        expect(result).to.eql({
          projectRoot,
          supportFile: false,
        })
      })
    })

    it('throws error if supportFile is not default and does not exist', () => {
      const projectRoot = process.cwd()

      const obj = setAbsolutePaths({
        projectRoot,
        supportFile: 'does/not/exist',
        resolved: {
          supportFile: {
            value: 'does/not/exist',
            from: 'default',
          },
        },
      })

      const getFilesByGlob = sinon.stub().returns([])

      return setSupportFileAndFolder(obj, getFilesByGlob)
      .catch((err) => {
        expect(stripAnsi(err.message)).to.include('Your project does not contain a default supportFile')
      })
    })

    it('sets the supportFile to index.ts if it exists (without ts require hook)', () => {
      const projectRoot = Fixtures.projectPath('ts-proj')
      const supportFolder = `${projectRoot}/cypress/support`
      const supportFilename = `${supportFolder}/index.ts`

      const e: Error & { code?: string } = new Error('Cannot resolve TS file by default')

      e.code = 'MODULE_NOT_FOUND'
      sinon.stub(utils, 'resolveModule').withArgs(supportFilename).throws(e)

      const obj = setAbsolutePaths({
        projectRoot,
        supportFile: 'cypress/support/index.ts',
      })

      const getFilesByGlob = sinon.stub().returns([path.join(projectRoot, obj.supportFile)])

      return setSupportFileAndFolder(obj, getFilesByGlob)
      .then((result) => {
        debug('result is', result)

        expect(result).to.eql({
          projectRoot,
          supportFolder,
          supportFile: supportFilename,
        })
      })
    })

    it('uses custom TS supportFile if it exists (without ts require hook)', () => {
      const projectRoot = Fixtures.projectPath('ts-proj-custom-names')
      const supportFolder = `${projectRoot}/cypress`
      const supportFilename = `${supportFolder}/support.ts`

      const e: Error & { code?: string } = new Error('Cannot resolve TS file by default')

      e.code = 'MODULE_NOT_FOUND'
      sinon.stub(utils, 'resolveModule').withArgs(supportFilename).throws(e)

      const obj = setAbsolutePaths({
        projectRoot,
        supportFile: 'cypress/support.ts',
      })

      const getFilesByGlob = sinon.stub().returns([path.join(projectRoot, obj.supportFile)])

      return setSupportFileAndFolder(obj, getFilesByGlob)
      .then((result) => {
        debug('result is', result)

        expect(result).to.eql({
          projectRoot,
          supportFolder,
          supportFile: supportFilename,
        })
      })
    })
  })

  context('.mergeDefaults', () => {
    beforeEach(function () {
      this.getFilesByGlob = sinon.stub().returns(['path/to/file'])

      this.defaults = (prop, value, cfg: any = {}, options = {}) => {
        cfg.projectRoot = '/foo/bar/'

        return mergeDefaults({ ...cfg, supportFile: cfg.supportFile ?? false }, options, {}, this.getFilesByGlob)
        .then((mergedConfig) => {
          expect(mergedConfig[prop]).to.deep.eq(value)
        })
      }
    })

    it('slowTestThreshold=10000 for e2e', function () {
      return this.defaults('slowTestThreshold', 10000, {}, { testingType: 'e2e' })
    })

    it('slowTestThreshold=250 for component', function () {
      return this.defaults('slowTestThreshold', 250, {}, { testingType: 'component' })
    })

    it('port=null', function () {
      return this.defaults('port', null)
    })

    it('projectId=null', function () {
      return this.defaults('projectId', null)
    })

    it('autoOpen=false', function () {
      return this.defaults('autoOpen', false)
    })

    it('browserUrl=http://localhost:2020/__/', function () {
      return this.defaults('browserUrl', 'http://localhost:2020/__/', { port: 2020 })
    })

    it('proxyUrl=http://localhost:2020', function () {
      return this.defaults('proxyUrl', 'http://localhost:2020', { port: 2020 })
    })

    it('namespace=__cypress', function () {
      return this.defaults('namespace', '__cypress')
    })

    it('baseUrl=http://localhost:8000/app/', function () {
      return this.defaults('baseUrl', 'http://localhost:8000/app/', {
        baseUrl: 'http://localhost:8000/app///',
      })
    })

    it('baseUrl=http://localhost:8000/app/', function () {
      return this.defaults('baseUrl', 'http://localhost:8000/app/', {
        baseUrl: 'http://localhost:8000/app//',
      })
    })

    it('baseUrl=http://localhost:8000/app', function () {
      return this.defaults('baseUrl', 'http://localhost:8000/app', {
        baseUrl: 'http://localhost:8000/app',
      })
    })

    it('baseUrl=http://localhost:8000/', function () {
      return this.defaults('baseUrl', 'http://localhost:8000/', {
        baseUrl: 'http://localhost:8000//',
      })
    })

    it('baseUrl=http://localhost:8000/', function () {
      return this.defaults('baseUrl', 'http://localhost:8000/', {
        baseUrl: 'http://localhost:8000/',
      })
    })

    it('baseUrl=http://localhost:8000', function () {
      return this.defaults('baseUrl', 'http://localhost:8000', {
        baseUrl: 'http://localhost:8000',
      })
    })

    it('viewportWidth=1000', function () {
      return this.defaults('viewportWidth', 1000)
    })

    it('viewportHeight=660', function () {
      return this.defaults('viewportHeight', 660)
    })

    it('userAgent=null', function () {
      return this.defaults('userAgent', null)
    })

    it('baseUrl=null', function () {
      return this.defaults('baseUrl', null)
    })

    it('defaultCommandTimeout=4000', function () {
      return this.defaults('defaultCommandTimeout', 4000)
    })

    it('pageLoadTimeout=60000', function () {
      return this.defaults('pageLoadTimeout', 60000)
    })

    it('requestTimeout=5000', function () {
      return this.defaults('requestTimeout', 5000)
    })

    it('responseTimeout=30000', function () {
      return this.defaults('responseTimeout', 30000)
    })

    it('execTimeout=60000', function () {
      return this.defaults('execTimeout', 60000)
    })

    it('waitForAnimations=true', function () {
      return this.defaults('waitForAnimations', true)
    })

    it('scrollBehavior=start', function () {
      return this.defaults('scrollBehavior', 'top')
    })

    it('animationDistanceThreshold=5', function () {
      return this.defaults('animationDistanceThreshold', 5)
    })

    it('video=false', function () {
      return this.defaults('video', false)
    })

    it('videoCompression=false', function () {
      return this.defaults('videoCompression', false)
    })

    it('trashAssetsBeforeRuns=32', function () {
      return this.defaults('trashAssetsBeforeRuns', true)
    })

    it('morgan=true', function () {
      return this.defaults('morgan', true)
    })

    it('isTextTerminal=false', function () {
      return this.defaults('isTextTerminal', false)
    })

    it('socketId=null', function () {
      return this.defaults('socketId', null)
    })

    it('reporter=spec', function () {
      return this.defaults('reporter', 'spec')
    })

    it('watchForFileChanges=true', function () {
      return this.defaults('watchForFileChanges', true)
    })

    it('numTestsKeptInMemory=50', function () {
      return this.defaults('numTestsKeptInMemory', 50)
    })

    it('modifyObstructiveCode=true', function () {
      return this.defaults('modifyObstructiveCode', true)
    })

    it('supportFile=false', function () {
      return this.defaults('supportFile', false, { supportFile: false })
    })

    it('blockHosts=null', function () {
      return this.defaults('blockHosts', null)
    })

    it('blockHosts=[a,b]', function () {
      return this.defaults('blockHosts', ['a', 'b'], {
        blockHosts: ['a', 'b'],
      })
    })

    it('blockHosts=a|b', function () {
      return this.defaults('blockHosts', ['a', 'b'], {
        blockHosts: ['a', 'b'],
      })
    })

    it('hosts=null', function () {
      return this.defaults('hosts', null)
    })

    it('hosts={}', function () {
      return this.defaults('hosts', {
        foo: 'bar',
        baz: 'quux',
      }, {
        hosts: {
          foo: 'bar',
          baz: 'quux',
        },
      })
    })

    it('experimentalCspAllowList=false', function () {
      return this.defaults('experimentalCspAllowList', false)
    })

    it('experimentalCspAllowList=true', function () {
      return this.defaults('experimentalCspAllowList', true, {
        experimentalCspAllowList: true,
      })
    })

    it('experimentalCspAllowList=[]', function () {
      return this.defaults('experimentalCspAllowList', [], {
        experimentalCspAllowList: [],
      })
    })

    it('experimentalCspAllowList=default-src|script-src', function () {
      return this.defaults('experimentalCspAllowList', ['default-src', 'script-src'], {
        experimentalCspAllowList: ['default-src', 'script-src'],
      })
    })

    it('experimentalCspAllowList=["default-src","script-src"]', function () {
      return this.defaults('experimentalCspAllowList', ['default-src', 'script-src'], {
        experimentalCspAllowList: ['default-src', 'script-src'],
      })
    })

    it('resets numTestsKeptInMemory to 0 when runMode', function () {
      return mergeDefaults({ projectRoot: '/foo/bar/', supportFile: false }, { isTextTerminal: true }, {}, this.getFilesByGlob)
      .then((cfg) => {
        expect(cfg.numTestsKeptInMemory).to.eq(0)
      })
    })

    it('resets watchForFileChanges to false when runMode', function () {
      return mergeDefaults({ projectRoot: '/foo/bar/', supportFile: false }, { isTextTerminal: true }, {}, this.getFilesByGlob)
      .then((cfg) => {
        expect(cfg.watchForFileChanges).to.be.false
      })
    })

    it('can override morgan in options', function () {
      return mergeDefaults({ projectRoot: '/foo/bar/', supportFile: false }, { morgan: false }, {}, this.getFilesByGlob)
      .then((cfg) => {
        expect(cfg.morgan).to.be.false
      })
    })

    it('can override isTextTerminal in options', function () {
      return mergeDefaults({ projectRoot: '/foo/bar/', supportFile: false }, { isTextTerminal: true }, {}, this.getFilesByGlob)
      .then((cfg) => {
        expect(cfg.isTextTerminal).to.be.true
      })
    })

    it('can override socketId in options', function () {
      return mergeDefaults({ projectRoot: '/foo/bar/', supportFile: false }, { socketId: '1234' }, {}, this.getFilesByGlob)
      .then((cfg) => {
        expect(cfg.socketId).to.eq('1234')
      })
    })

    it('deletes envFile', function () {
      const obj = {
        projectRoot: '/foo/bar/',
        supportFile: false,
        env: {
          foo: 'bar',
          version: '0.5.2',
        },
        envFile: {
          bar: 'baz',
          version: '1.0.1',
        },
      }

      return mergeDefaults(obj, {}, {}, this.getFilesByGlob)
      .then((cfg) => {
        expect(cfg.env).to.deep.eq({
          foo: 'bar',
          bar: 'baz',
          version: '1.0.1',
        })

        expect(cfg.cypressEnv).to.eq(process.env['CYPRESS_INTERNAL_ENV'])

        expect(cfg).not.to.have.property('envFile')
      })
    })

    it('merges env into @env', function () {
      const obj = {
        projectRoot: '/foo/bar/',
        supportFile: false,
        env: {
          host: 'localhost',
          user: 'brian',
          version: '0.12.2',
        },
      }

      const options = {
        env: {
          version: '0.13.1',
          foo: 'bar',
        },
      }

      return mergeDefaults(obj, options, {}, this.getFilesByGlob)
      .then((cfg) => {
        expect(cfg.env).to.deep.eq({
          host: 'localhost',
          user: 'brian',
          version: '0.13.1',
          foo: 'bar',
        })
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/6892
    it('warns if experimentalGetCookiesSameSite is passed', async function () {
      const warning = sinon.spy(errors, 'warning')

      await this.defaults('experimentalGetCookiesSameSite', true, {
        experimentalGetCookiesSameSite: true,
      })

      expect(warning).to.be.calledWith('EXPERIMENTAL_SAMESITE_REMOVED')
    })

    it('warns if experimentalSessionSupport is passed', async function () {
      const warning = sinon.spy(errors, 'warning')

      await this.defaults('experimentalSessionSupport', true, {
        experimentalSessionSupport: true,
      })

      expect(warning).to.be.calledWith('EXPERIMENTAL_SESSION_SUPPORT_REMOVED')
    })

    it('warns if experimentalSessionAndOrigin is passed', async function () {
      const warning = sinon.spy(errors, 'warning')

      await this.defaults('experimentalSessionAndOrigin', true, {
        experimentalSessionAndOrigin: true,
      })

      expect(warning).to.be.calledWith('EXPERIMENTAL_SESSION_AND_ORIGIN_REMOVED')
    })

    it('warns if experimentalShadowDomSupport is passed', async function () {
      const warning = sinon.spy(errors, 'warning')

      await this.defaults('experimentalShadowDomSupport', true, {
        experimentalShadowDomSupport: true,
      })

      expect(warning).to.be.calledWith('EXPERIMENTAL_SHADOW_DOM_REMOVED')
    })

    it('warns if experimentalRunEvents is passed', async function () {
      const warning = sinon.spy(errors, 'warning')

      await this.defaults('experimentalRunEvents', true, {
        experimentalRunEvents: true,
      })

      expect(warning).to.be.calledWith('EXPERIMENTAL_RUN_EVENTS_REMOVED')
    })

    // @see https://github.com/cypress-io/cypress/pull/9185
    it('warns if experimentalNetworkStubbing is passed', async function () {
      const warning = sinon.spy(errors, 'warning')

      await this.defaults('experimentalNetworkStubbing', true, {
        experimentalNetworkStubbing: true,
      })

      expect(warning).to.be.calledWith('EXPERIMENTAL_NETWORK_STUBBING_REMOVED')
    })

    it('warns if firefoxGcInterval is passed', async function () {
      const warning = sinon.spy(errors, 'warning')

      await this.defaults('firefoxGcInterval', true, {
        firefoxGcInterval: true,
      })

      expect(warning).to.be.calledWith('FIREFOX_GC_INTERVAL_REMOVED')
    })

    describe('.resolved', () => {
      it('sets reporter and port to cli', () => {
        const obj = {
          projectRoot: '/foo/bar',
          supportFile: false,
        }

        const options = {
          reporter: 'json',
          port: 1234,
        }

        const getFilesByGlob = sinon.stub().returns(['path/to/file.ts'])

        return mergeDefaults(obj, options, {}, getFilesByGlob)
        .then((cfg) => {
          expect(cfg.resolved).to.deep.eq({
            animationDistanceThreshold: { value: 5, from: 'default' },
            arch: { value: os.arch(), from: 'default' },
            baseUrl: { value: null, from: 'default' },
            blockHosts: { value: null, from: 'default' },
            browsers: { value: [], from: 'default' },
            chromeWebSecurity: { value: true, from: 'default' },
            clientCertificates: { value: [], from: 'default' },
            defaultCommandTimeout: { value: 4000, from: 'default' },
            downloadsFolder: { value: 'cypress/downloads', from: 'default' },
            excludeSpecPattern: { value: '*.hot-update.js', from: 'default' },
            env: {},
            execTimeout: { value: 60000, from: 'default' },
            experimentalModifyObstructiveThirdPartyCode: { value: false, from: 'default' },
            experimentalSkipDomainInjection: { value: null, from: 'default' },
            experimentalCspAllowList: { value: false, from: 'default' },
            experimentalFetchPolyfill: { value: false, from: 'default' },
            experimentalInteractiveRunEvents: { value: false, from: 'default' },
            experimentalMemoryManagement: { value: false, from: 'default' },
            experimentalOriginDependencies: { value: false, from: 'default' },
            experimentalRunAllSpecs: { value: false, from: 'default' },
            experimentalSingleTabRunMode: { value: false, from: 'default' },
            experimentalStudio: { value: false, from: 'default' },
            experimentalSourceRewriting: { value: false, from: 'default' },
            experimentalWebKitSupport: { value: false, from: 'default' },
            fileServerFolder: { value: '', from: 'default' },
            fixturesFolder: { value: 'cypress/fixtures', from: 'default' },
            hosts: { value: null, from: 'default' },
            justInTimeCompile: { value: true, from: 'default' },
            includeShadowDom: { value: false, from: 'default' },
            isInteractive: { value: true, from: 'default' },
            keystrokeDelay: { value: 0, from: 'default' },
            modifyObstructiveCode: { value: true, from: 'default' },
            numTestsKeptInMemory: { value: 50, from: 'default' },
            pageLoadTimeout: { value: 60000, from: 'default' },
            platform: { value: os.platform(), from: 'default' },
            port: { value: 1234, from: 'cli' },
            projectId: { value: null, from: 'default' },
            redirectionLimit: { value: 20, from: 'default' },
            reporter: { value: 'json', from: 'cli' },
            resolvedNodePath: { value: null, from: 'default' },
            resolvedNodeVersion: { value: null, from: 'default' },
            reporterOptions: { value: null, from: 'default' },
            requestTimeout: { value: 5000, from: 'default' },
            responseTimeout: { value: 30000, from: 'default' },
            retries: { value: { runMode: 0, openMode: 0, experimentalStrategy: undefined, experimentalOptions: undefined }, from: 'default' },
            screenshotOnRunFailure: { value: true, from: 'default' },
            screenshotsFolder: { value: 'cypress/screenshots', from: 'default' },
            specPattern: { value: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}', from: 'default' },
            slowTestThreshold: { value: 10000, from: 'default' },
            supportFile: { value: false, from: 'config' },
            supportFolder: { value: false, from: 'default' },
            taskTimeout: { value: 60000, from: 'default' },
            testIsolation: { value: true, from: 'default' },
            trashAssetsBeforeRuns: { value: true, from: 'default' },
            userAgent: { value: null, from: 'default' },
            video: { value: false, from: 'default' },
            videoCompression: { value: false, from: 'default' },
            videosFolder: { value: 'cypress/videos', from: 'default' },
            viewportHeight: { value: 660, from: 'default' },
            viewportWidth: { value: 1000, from: 'default' },
            waitForAnimations: { value: true, from: 'default' },
            scrollBehavior: { value: 'top', from: 'default' },
            watchForFileChanges: { value: true, from: 'default' },
          })
        })
      })

      it('sets config, envFile and env', () => {
        sinon.stub(utils, 'getProcessEnvVars').returns({
          quux: 'quux',
          RECORD_KEY: 'foobarbazquux',
          PROJECT_ID: 'projectId123',
        })

        const obj = {
          projectRoot: '/foo/bar',
          supportFile: false,
          baseUrl: 'http://localhost:8080',
          port: 2020,
          env: {
            foo: 'foo',
          },
          envFile: {
            bar: 'bar',
          },
        }

        const options = {
          env: {
            baz: 'baz',
          },
        }

        const getFilesByGlob = sinon.stub().returns(['path/to/file.ts'])

        return mergeDefaults(obj, options, {}, getFilesByGlob)
        .then((cfg) => {
          expect(cfg.resolved).to.deep.eq({
            arch: { value: os.arch(), from: 'default' },
            animationDistanceThreshold: { value: 5, from: 'default' },
            baseUrl: { value: 'http://localhost:8080', from: 'config' },
            blockHosts: { value: null, from: 'default' },
            browsers: { value: [], from: 'default' },
            chromeWebSecurity: { value: true, from: 'default' },
            clientCertificates: { value: [], from: 'default' },
            defaultCommandTimeout: { value: 4000, from: 'default' },
            downloadsFolder: { value: 'cypress/downloads', from: 'default' },
            excludeSpecPattern: { value: '*.hot-update.js', from: 'default' },
            execTimeout: { value: 60000, from: 'default' },
            experimentalModifyObstructiveThirdPartyCode: { value: false, from: 'default' },
            experimentalSkipDomainInjection: { value: null, from: 'default' },
            experimentalCspAllowList: { value: false, from: 'default' },
            experimentalFetchPolyfill: { value: false, from: 'default' },
            experimentalInteractiveRunEvents: { value: false, from: 'default' },
            experimentalMemoryManagement: { value: false, from: 'default' },
            experimentalOriginDependencies: { value: false, from: 'default' },
            experimentalRunAllSpecs: { value: false, from: 'default' },
            experimentalSingleTabRunMode: { value: false, from: 'default' },
            experimentalStudio: { value: false, from: 'default' },
            experimentalSourceRewriting: { value: false, from: 'default' },
            experimentalWebKitSupport: { value: false, from: 'default' },
            env: {
              foo: {
                value: 'foo',
                from: 'config',
              },
              bar: {
                value: 'bar',
                from: 'envFile',
              },
              baz: {
                value: 'baz',
                from: 'cli',
              },
              quux: {
                value: 'quux',
                from: 'env',
              },
              RECORD_KEY: {
                value: 'fooba...zquux',
                from: 'env',
              },
            },
            fileServerFolder: { value: '', from: 'default' },
            fixturesFolder: { value: 'cypress/fixtures', from: 'default' },
            hosts: { value: null, from: 'default' },
            justInTimeCompile: { value: true, from: 'default' },
            includeShadowDom: { value: false, from: 'default' },
            isInteractive: { value: true, from: 'default' },
            keystrokeDelay: { value: 0, from: 'default' },
            modifyObstructiveCode: { value: true, from: 'default' },
            numTestsKeptInMemory: { value: 50, from: 'default' },
            pageLoadTimeout: { value: 60000, from: 'default' },
            platform: { value: os.platform(), from: 'default' },
            port: { value: 2020, from: 'config' },
            projectId: { value: 'projectId123', from: 'env' },
            redirectionLimit: { value: 20, from: 'default' },
            reporter: { value: 'spec', from: 'default' },
            resolvedNodePath: { value: null, from: 'default' },
            resolvedNodeVersion: { value: null, from: 'default' },
            reporterOptions: { value: null, from: 'default' },
            requestTimeout: { value: 5000, from: 'default' },
            responseTimeout: { value: 30000, from: 'default' },
            retries: { value: { runMode: 0, openMode: 0, experimentalStrategy: undefined, experimentalOptions: undefined }, from: 'default' },
            screenshotOnRunFailure: { value: true, from: 'default' },
            screenshotsFolder: { value: 'cypress/screenshots', from: 'default' },
            slowTestThreshold: { value: 10000, from: 'default' },
            specPattern: { value: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}', from: 'default' },
            supportFile: { value: false, from: 'config' },
            supportFolder: { value: false, from: 'default' },
            taskTimeout: { value: 60000, from: 'default' },
            testIsolation: { value: true, from: 'default' },
            trashAssetsBeforeRuns: { value: true, from: 'default' },
            userAgent: { value: null, from: 'default' },
            video: { value: false, from: 'default' },
            videoCompression: { value: false, from: 'default' },
            videosFolder: { value: 'cypress/videos', from: 'default' },
            viewportHeight: { value: 660, from: 'default' },
            viewportWidth: { value: 1000, from: 'default' },
            waitForAnimations: { value: true, from: 'default' },
            scrollBehavior: { value: 'top', from: 'default' },
            watchForFileChanges: { value: true, from: 'default' },
          })
        })
      })

      it('honors user config for testIsolation', () => {
        sinon.stub(utils, 'getProcessEnvVars').returns({})

        const obj = {
          projectRoot: '/foo/bar',
          supportFile: false,
          baseUrl: 'http://localhost:8080',
          testIsolation: false,
        }

        const options = {
          testingType: 'e2e',
        }

        const getFilesByGlob = sinon.stub().returns(['path/to/file.ts'])

        return mergeDefaults(obj, options, {}, getFilesByGlob)
        .then((cfg) => {
          expect(cfg.resolved).to.have.property('testIsolation')
          expect(cfg.resolved.testIsolation).to.deep.eq({ value: false, from: 'config' })
        })
      })
    })
  })
})
