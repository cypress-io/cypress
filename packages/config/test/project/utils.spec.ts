import { vi, describe, it, beforeAll, beforeEach, expect } from 'vitest'
import _ from 'lodash'
import stripAnsi from 'strip-ansi'
import Debug from 'debug'
import os from 'node:os'

import errors from '@packages/errors'
import Fixtures from '@tooling/system-tests'

import {
  checkIfResolveChangedRootFolder,
  parseEnv,
  getProcessEnvVars,
  resolveModule,
  resolveConfigValues,
  setPluginResolvedOn,
  setAbsolutePaths,
  setNodeBinary,
  relativeToProjectRoot,
  setSupportFileAndFolder,
  mergeDefaults,
} from '../../src/project/utils'
import { resetIssuedWarnings } from '../../src/browser'
import path from 'node:path'
import { Config } from '../../src/project/types'

const debug = Debug('test')

vi.mock('@packages/errors', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      throwErr: vi.fn(),
      warning: vi.fn(),
    },
  }
})

vi.mock('../../src/project/utils', async (importActual) => {
  const actual = await importActual()

  return {
    // @ts-expect-error
    ...actual,
    resolveModule: vi.fn(),
  }
})

describe('config/src/project/utils', () => {
  beforeAll(function () {
    Fixtures.scaffold()
  })

  beforeEach(async function () {
    vi.resetAllMocks()
    vi.unstubAllEnvs()
    vi.stubEnv('CYPRESS_COMMERCIAL_RECOMMENDATIONS', undefined)
    vi.stubEnv('CYPRESS_DEBUG', undefined)
    vi.stubEnv('CYPRESS_LOCAL_CY_PROMPT_PATH', undefined)
    resetIssuedWarnings()

    const { resolveModule: resolveModuleActual } = await vi.importActual<typeof import('../../src/project/utils')>('../../src/project/utils')

    vi.mocked(resolveModule).mockImplementation(resolveModuleActual)

    const errorsActual = (await vi.importActual<typeof import('@packages/errors')>('@packages/errors')).default

    vi.mocked(errors.throwErr).mockImplementation(errorsActual.throwErr)
  })

  describe('checkIfResolveChangedRootFolder', () => {
    it('ignores non-absolute paths', () => {
      expect(checkIfResolveChangedRootFolder('foo/index.js', 'foo')).toBe(false)
    })

    it('handles paths that do not switch', () => {
      expect(checkIfResolveChangedRootFolder('/foo/index.js', '/foo')).toBe(false)
    })

    it('detects path switch', () => {
      expect(checkIfResolveChangedRootFolder('/private/foo/index.js', '/foo')).toBe(true)
    })
  })

  describe('.getProcessEnvVars', () => {
    it('returns process envs prefixed with cypress', () => {
      const envs = {
        CYPRESS_BASE_URL: 'value',
        RANDOM_ENV: 'ignored',
      } as unknown as NodeJS.ProcessEnv

      expect(getProcessEnvVars(envs)).toEqual({
        BASE_URL: 'value',
      })
    })

    it('does not return CYPRESS_RESERVED_ENV_VARS', () => {
      const envs = {
        CYPRESS_INTERNAL_ENV: 'value',
      } as unknown as NodeJS.ProcessEnv

      expect(getProcessEnvVars(envs)).toEqual({})
    });

    ['cypress_', 'CYPRESS_'].forEach((key) => {
      it(`reduces key: ${key}`, () => {
        const obj = {
          cypress_host: 'http://localhost:8888',
          foo: 'bar',
          env: '123',
        } as unknown as NodeJS.ProcessEnv

        obj[`${key}version`] = '0.12.0'

        expect(getProcessEnvVars(obj)).toEqual({
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

      expect(getProcessEnvVars(obj)).toEqual({
        FOO: 'bar',
        PROJECT_ID: 'abc123',
        CRASH_REPORTS: 0,
      })
    })
  })

  describe('environment name check', () => {
    it('throws an error for unknown CYPRESS_INTERNAL_ENV', async () => {
      vi.stubEnv('CYPRESS_INTERNAL_ENV', 'foo-bar')
      // @ts-expect-error - invalid arg types
      vi.mocked(errors.throwErr).mockImplementation((args1: string, arg2: string) => {
        if (args1 === 'INVALID_CYPRESS_INTERNAL_ENV' && arg2 === 'foo-bar') {
          return
        }

        throw new Error('should be unreachable')
      })

      const cfg = {
        projectRoot: '/foo/bar/',
        supportFile: false,
      }
      const options = {}

      const getFilesByGlob = vi.fn().mockReturnValue(['path/to/file'])

      try {
        await mergeDefaults(cfg, options, {}, getFilesByGlob)
      } catch {
        //
      }

      expect(errors.throwErr).toHaveBeenCalledOnce
    })

    it('allows production CYPRESS_INTERNAL_ENV', async () => {
      vi.stubEnv('CYPRESS_INTERNAL_ENV', 'production')

      const cfg = {
        projectRoot: '/foo/bar/',
        supportFile: false,
      }
      const options = {}

      const getFilesByGlob = vi.fn().mockReturnValue(['path/to/file'])

      await mergeDefaults(cfg, options, {}, getFilesByGlob)

      expect(errors.throwErr).not.toHaveBeenCalled
    })
  })

  describe('.parseEnv', () => {
    it('merges together env from config, env from file, env from process, and env from CLI', () => {
      vi.stubEnv('CYPRESS_version', '0.12.1')
      vi.stubEnv('CYPRESS_user', 'bob')

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

      expect(parseEnv(obj, envCLI)).toEqual({
        version: '0.14.0',
        project: 'pie',
        host: 'http://localhost:8888',
        user: 'bob',
        foo: 'bar',
        baz: 'quux',
      })
    })
  })

  describe('.resolveConfigValues', () => {
    it('sets baseUrl to default', function () {
      expect(resolveConfigValues({ baseUrl: null }, { baseUrl: null }, {})).toEqual({
        baseUrl: {
          value: null,
          from: 'default',
        },
      })
    })

    it('sets baseUrl to config', function () {
      expect(resolveConfigValues({ baseUrl: 'localhost' }, { baseUrl: null }, {})).toEqual({
        baseUrl: {
          value: 'localhost',
          from: 'config',
        },
      })
    })

    it('does not change existing resolved values', function () {
      expect(resolveConfigValues({ baseUrl: 'localhost' }, { baseUrl: null }, { baseUrl: 'cli' })).toEqual({
        baseUrl: {
          value: 'localhost',
          from: 'cli',
        },
      })
    })

    it('ignores values not found in configKeys', function () {
      expect(resolveConfigValues({ baseUrl: 'localhost', foo: 'bar' }, { baseUrl: null }, { baseUrl: 'cli' })).toEqual({
        baseUrl: {
          value: 'localhost',
          from: 'cli',
        },
      })
    })
  })

  describe('.setPluginResolvedOn', () => {
    it('resolves an object with single property', () => {
      const cfg = {}
      const obj = {
        foo: 'bar',
      }

      setPluginResolvedOn(cfg, obj)

      expect(cfg).toEqual({
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

      expect(cfg).toEqual({
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

      expect(cfg, 'foo.bar gets value').toEqual({
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

      expect(cfg).toEqual({
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

  describe('_.defaultsDeep', () => {
    it('merges arrays', () => {
      // sanity checks to confirm how Lodash merges arrays in defaultsDeep
      const diffs = {
        list: [1],
      }
      const cfg = {
        list: [1, 2],
      }
      const merged = _.defaultsDeep({}, diffs, cfg)

      expect(merged, 'arrays are combined').toEqual({
        list: [1, 2],
      })
    })
  })

  describe('.setAbsolutePaths', () => {
    it('is noop without projectRoot', () => {
      expect(setAbsolutePaths({})).toEqual({})
    })

    it('does not mutate existing obj', () => {
      const obj = {}

      expect(setAbsolutePaths(obj)).not.toBe(obj)
    })

    it('ignores non special *folder properties', () => {
      const obj = {
        projectRoot: '/_test-output/path/to/project',
        blehFolder: 'some/rando/path',
        foo: 'bar',
        baz: 'quux',
      }

      expect(setAbsolutePaths(obj)).toEqual(obj)
    })

    for (const folder of ['fileServerFolder', 'fixturesFolder']) {
      it(`converts relative ${folder} to absolute path`, () => {
        const obj = {
          projectRoot: '/_test-output/path/to/project',
        }

        obj[folder] = 'foo/bar'

        const expected = {
          projectRoot: '/_test-output/path/to/project',
        }

        expected[folder] = '/_test-output/path/to/project/foo/bar'

        expect(setAbsolutePaths(obj)).toEqual(expected)
      })
    }
  })

  describe('.setNodeBinary', () => {
    let nodeVersion: string

    beforeEach(function () {
      nodeVersion = process.versions.node
    })

    it('sets cli Node ver', function () {
      const obj = setNodeBinary({
      }, '/foo/bar/node', '1.2.3')

      expect(obj).toEqual({
        resolvedNodeVersion: '1.2.3',
        resolvedNodePath: '/foo/bar/node',
      })
    })

    it('sets userNodePath undefined', function () {
      const obj = setNodeBinary({
      }, undefined, '1.2.3')

      expect(obj).toEqual({
        resolvedNodeVersion: nodeVersion,
      })
    })

    it('sets userNodeVersion undefined', function () {
      const obj = setNodeBinary({
      }, '/foo/bar/node')

      expect(obj).toEqual({
        resolvedNodeVersion: nodeVersion,
      })
    })
  })

  describe('relativeToProjectRoot', () => {
    describe('posix', () => {
      it('returns path of file relative to projectRoot', () => {
        const projectRoot = '/root/projects'
        const supportFile = '/root/projects/cypress/support/e2e.js'

        expect(relativeToProjectRoot(projectRoot, supportFile)).toEqual('cypress/support/e2e.js')
      })
    })

    describe('windows', () => {
      it('returns path of file relative to projectRoot', () => {
        const projectRoot = `\\root\\projects`
        const supportFile = `\\root\\projects\\cypress\\support\\e2e.js`

        expect(relativeToProjectRoot(projectRoot, supportFile)).toEqual(`cypress\\support\\e2e.js`)
      })
    })
  })

  describe('.setSupportFileAndFolder', () => {
    it('does nothing if supportFile is falsey', async () => {
      const obj = {
        projectRoot: '/_test-output/path/to/project',
      }

      const getFilesByGlob = vi.fn().mockReturnValue(['path/to/file'])

      const result = await setSupportFileAndFolder(obj, getFilesByGlob)

      expect(result).toEqual(obj)
    })

    it('sets the full path to the supportFile and supportFolder if it exists', async () => {
      const projectRoot = process.cwd()

      const obj = setAbsolutePaths({
        projectRoot,
        supportFile: 'test/project/utils.spec.ts',
      })

      const getFilesByGlob = vi.fn().mockReturnValue([path.join(projectRoot, obj.supportFile)])

      const result = await setSupportFileAndFolder(obj, getFilesByGlob)

      expect(result).toEqual({
        projectRoot,
        supportFile: `${projectRoot}/test/project/utils.spec.ts`,
        supportFolder: `${projectRoot}/test/project`,
      })
    })

    it('sets the supportFile to default e2e.js if it does not exist, support folder does not exist, and supportFile is the default', async () => {
      const projectRoot = Fixtures.projectPath('no-scaffolding')

      const obj = setAbsolutePaths({
        projectRoot,
        supportFile: 'cypress/support/e2e.js',
      })

      const getFilesByGlob = vi.fn().mockReturnValue([path.join(projectRoot, obj.supportFile)])

      const result = await setSupportFileAndFolder(obj, getFilesByGlob)

      expect(result).toEqual({
        projectRoot,
        supportFile: `${projectRoot}/cypress/support/e2e.js`,
        supportFolder: `${projectRoot}/cypress/support`,
      })
    })

    it('finds support file in project path that contains glob syntax', async () => {
      const projectRoot = Fixtures.projectPath('project-with-(glob)-[chars]')

      const obj = setAbsolutePaths({
        projectRoot,
        supportFile: 'cypress/support/e2e.js',
      })

      const getFilesByGlob = vi.fn().mockReturnValue([path.join(projectRoot, obj.supportFile)])

      const result = await setSupportFileAndFolder(obj, getFilesByGlob)

      expect(result).toEqual({
        projectRoot,
        supportFile: `${projectRoot}/cypress/support/e2e.js`,
        supportFolder: `${projectRoot}/cypress/support`,
      })
    })

    it('sets the supportFile to false if it does not exist, support folder exists, and supportFile is the default', async () => {
      const projectRoot = Fixtures.projectPath('empty-folders')

      const obj = setAbsolutePaths({
        projectRoot,
        supportFile: false,
      })

      const getFilesByGlob = vi.fn().mockReturnValue(['path/to/file.ts'])

      const result = await setSupportFileAndFolder(obj, getFilesByGlob)

      expect(result).toEqual({
        projectRoot,
        supportFile: false,
      })
    })

    it('throws error if supportFile is not default and does not exist', async () => {
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

      const getFilesByGlob = vi.fn().mockReturnValue([])

      try {
        await setSupportFileAndFolder(obj, getFilesByGlob)
      } catch (err) {
        expect(stripAnsi(err.message)).toContain('Your project does not contain a default supportFile')

        return
      }

      throw new Error('Expected error to be thrown')
    })

    it('sets the supportFile to index.ts if it exists (without ts require hook)', async () => {
      const projectRoot = Fixtures.projectPath('ts-proj')
      const supportFolder = `${projectRoot}/cypress/support`
      const supportFilename = `${supportFolder}/index.ts`

      const e: Error & { code?: string } = new Error('Cannot resolve TS file by default')

      e.code = 'MODULE_NOT_FOUND'
      // @ts-expect-error - invalid arg types
      vi.mocked(resolveModule).mockImplementation((args) => {
        if (args === supportFilename) {
          throw e
        }
      })

      const obj = setAbsolutePaths({
        projectRoot,
        supportFile: 'cypress/support/index.ts',
      })

      const getFilesByGlob = vi.fn().mockReturnValue([path.join(projectRoot, obj.supportFile)])

      const result = await setSupportFileAndFolder(obj, getFilesByGlob)

      debug('result is', result)

      expect(result).toEqual({
        projectRoot,
        supportFolder,
        supportFile: supportFilename,
      })
    })

    it('uses custom TS supportFile if it exists (without ts require hook)', async () => {
      const projectRoot = Fixtures.projectPath('ts-proj-custom-names')
      const supportFolder = `${projectRoot}/cypress`
      const supportFilename = `${supportFolder}/support.ts`

      const e: Error & { code?: string } = new Error('Cannot resolve TS file by default')

      e.code = 'MODULE_NOT_FOUND'
      // @ts-expect-error - invalid arg types
      vi.mocked(resolveModule).mockImplementation((args) => {
        if (args === supportFilename) {
          throw e
        }
      })

      const obj = setAbsolutePaths({
        projectRoot,
        supportFile: 'cypress/support.ts',
      })

      const getFilesByGlob = vi.fn().mockReturnValue([path.join(projectRoot, obj.supportFile)])

      const result = await setSupportFileAndFolder(obj, getFilesByGlob)

      debug('result is', result)

      expect(result).toEqual({
        projectRoot,
        supportFolder,
        supportFile: supportFilename,
      })
    })
  })

  describe('.mergeDefaults', () => {
    const getFilesByGlob = vi.fn().mockReturnValue(['path/to/file'])
    const defaults = async (prop: string, value?: any, cfg?: any, options?: any): Promise<Config> => {
      cfg = cfg ?? {} as Config
      cfg.projectRoot = '/foo/bar/'

      const mergedConfig = await mergeDefaults({ ...cfg, supportFile: cfg.supportFile ?? false }, options, {}, getFilesByGlob)

      expect(mergedConfig[prop]).toEqual(value)

      return mergedConfig
    }

    beforeEach(function () {
      vi.stubEnv('CYPRESS_INTERNAL_ENV', 'production')
    })

    it('slowTestThreshold=10000 for e2e', async function () {
      await defaults('slowTestThreshold', 10000, {}, { testingType: 'e2e' })
    })

    it('slowTestThreshold=250 for component', async function () {
      await defaults('slowTestThreshold', 250, {}, { testingType: 'component' })
    })

    it('port=null', async function () {
      await defaults('port', null)
    })

    it('projectId=null', async function () {
      await defaults('projectId', null)
    })

    it('autoOpen=false', async function () {
      await defaults('autoOpen', false)
    })

    it('browserUrl=http://localhost:2020/__/', async function () {
      await defaults('browserUrl', 'http://localhost:2020/__/', { port: 2020 })
    })

    it('proxyUrl=http://localhost:2020', async function () {
      await defaults('proxyUrl', 'http://localhost:2020', { port: 2020 })
    })

    it('namespace=__cypress', async function () {
      await defaults('namespace', '__cypress')
    })

    it('baseUrl=http://localhost:8000/app/', async function () {
      await defaults('baseUrl', 'http://localhost:8000/app/', {
        baseUrl: 'http://localhost:8000/app///',
      })
    })

    it('baseUrl=http://localhost:8000/app/', async function () {
      await defaults('baseUrl', 'http://localhost:8000/app/', {
        baseUrl: 'http://localhost:8000/app//',
      })
    })

    it('baseUrl=http://localhost:8000/app', async function () {
      await defaults('baseUrl', 'http://localhost:8000/app', {
        baseUrl: 'http://localhost:8000/app',
      })
    })

    it('baseUrl=http://localhost:8000/', async function () {
      await defaults('baseUrl', 'http://localhost:8000/', {
        baseUrl: 'http://localhost:8000//',
      })
    })

    it('baseUrl=http://localhost:8000/', async function () {
      await defaults('baseUrl', 'http://localhost:8000/', {
        baseUrl: 'http://localhost:8000/',
      })
    })

    it('baseUrl=http://localhost:8000', async function () {
      await defaults('baseUrl', 'http://localhost:8000', {
        baseUrl: 'http://localhost:8000',
      })
    })

    it('viewportWidth=1000', async function () {
      await defaults('viewportWidth', 1000)
    })

    it('viewportHeight=660', async function () {
      await defaults('viewportHeight', 660)
    })

    it('userAgent=null', async function () {
      await defaults('userAgent', null)
    })

    it('baseUrl=null', async function () {
      await defaults('baseUrl', null)
    })

    it('defaultCommandTimeout=4000', async function () {
      await defaults('defaultCommandTimeout', 4000)
    })

    it('pageLoadTimeout=60000', async function () {
      await defaults('pageLoadTimeout', 60000)
    })

    it('requestTimeout=5000', async function () {
      await defaults('requestTimeout', 5000)
    })

    it('responseTimeout=30000', async function () {
      await defaults('responseTimeout', 30000)
    })

    it('execTimeout=60000', async function () {
      await defaults('execTimeout', 60000)
    })

    it('waitForAnimations=true', async function () {
      await defaults('waitForAnimations', true)
    })

    it('scrollBehavior=start', async function () {
      await defaults('scrollBehavior', 'top')
    })

    it('animationDistanceThreshold=5', async function () {
      await defaults('animationDistanceThreshold', 5)
    })

    it('video=false', async function () {
      await defaults('video', false)
    })

    it('videoCompression=false', async function () {
      await defaults('videoCompression', false)
    })

    it('trashAssetsBeforeRuns=32', async function () {
      await defaults('trashAssetsBeforeRuns', true)
    })

    it('morgan=true', async function () {
      await defaults('morgan', true)
    })

    it('isTextTerminal=false', async function () {
      await defaults('isTextTerminal', false)
    })

    it('socketId=null', async function () {
      await defaults('socketId', null)
    })

    it('reporter=spec', async function () {
      await defaults('reporter', 'spec')
    })

    it('watchForFileChanges=true', async function () {
      await defaults('watchForFileChanges', true)
    })

    it('numTestsKeptInMemory=50', async function () {
      await defaults('numTestsKeptInMemory', 50)
    })

    it('modifyObstructiveCode=true', async function () {
      await defaults('modifyObstructiveCode', true)
    })

    it('supportFile=false', async function () {
      await defaults('supportFile', false, { supportFile: false })
    })

    it('blockHosts=null', async function () {
      await defaults('blockHosts', null)
    })

    it('blockHosts=[a,b]', async function () {
      await defaults('blockHosts', ['a', 'b'], {
        blockHosts: ['a', 'b'],
      })
    })

    it('blockHosts=a|b', async function () {
      await defaults('blockHosts', ['a', 'b'], {
        blockHosts: ['a', 'b'],
      })
    })

    it('hosts=null', async function () {
      await defaults('hosts', null)
    })

    it('hosts={}', async function () {
      await defaults('hosts', {
        foo: 'bar',
        baz: 'quux',
      }, {
        hosts: {
          foo: 'bar',
          baz: 'quux',
        },
      })
    })

    it('experimentalCspAllowList=false', async function () {
      await defaults('experimentalCspAllowList', false)
    })

    it('experimentalCspAllowList=true', async function () {
      await defaults('experimentalCspAllowList', true, {
        experimentalCspAllowList: true,
      })
    })

    it('experimentalCspAllowList=[]', async function () {
      await defaults('experimentalCspAllowList', [], {
        experimentalCspAllowList: [],
      })
    })

    it('experimentalCspAllowList=default-src|script-src', async function () {
      await defaults('experimentalCspAllowList', ['default-src', 'script-src'], {
        experimentalCspAllowList: ['default-src', 'script-src'],
      })
    })

    it('experimentalCspAllowList=["default-src","script-src"]', async function () {
      await defaults('experimentalCspAllowList', ['default-src', 'script-src'], {
        experimentalCspAllowList: ['default-src', 'script-src'],
      })
    })

    it('resets numTestsKeptInMemory to 0 when runMode', async function () {
      const cfg = await defaults('numTestsKeptInMemory', 0, { projectRoot: '/foo/bar/', supportFile: false }, { isTextTerminal: true })

      expect(cfg.numTestsKeptInMemory).toEqual(0)
    })

    it('resets watchForFileChanges to false when runMode', async function () {
      const cfg = await defaults('watchForFileChanges', false, { projectRoot: '/foo/bar/', supportFile: false }, { isTextTerminal: true })

      expect(cfg.watchForFileChanges).toBe(false)
    })

    it('can override morgan in options', async function () {
      const cfg = await defaults('morgan', false, { projectRoot: '/foo/bar/', supportFile: false }, { morgan: false })

      expect(cfg.morgan).toBe(false)
    })

    it('can override isTextTerminal in options', async function () {
      const cfg = await defaults('isTextTerminal', true, { projectRoot: '/foo/bar/', supportFile: false }, { isTextTerminal: true })

      expect(cfg.isTextTerminal).toBe(true)
    })

    it('can override socketId in options', async function () {
      const cfg = await defaults('socketId', '1234', { projectRoot: '/foo/bar/', supportFile: false }, { socketId: '1234' })

      expect(cfg.socketId).toEqual('1234')
    })

    it('deletes envFile', async function () {
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

      const cfg = await mergeDefaults(obj, {}, {}, getFilesByGlob)

      expect(cfg.env).toEqual({
        foo: 'bar',
        bar: 'baz',
        version: '1.0.1',
      })

      expect(cfg.cypressEnv).toEqual(process.env['CYPRESS_INTERNAL_ENV'])

      expect(cfg).not.toHaveProperty('envFile')
    })

    it('merges env into @env', async function () {
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

      const cfg = await mergeDefaults(obj, options, {}, getFilesByGlob)

      expect(cfg.env).toEqual({
        host: 'localhost',
        user: 'brian',
        version: '0.13.1',
        foo: 'bar',
      })
    })

    it('warns if experimentalJustInTimeCompile is passed', async function () {
      await defaults('experimentalJustInTimeCompile', true, {
        experimentalJustInTimeCompile: true,
      })

      expect(errors.warning).toBeCalledWith('EXPERIMENTAL_JIT_COMPILE_REMOVED', {
        configFile: 'cypress.config.js',
        name: 'experimentalJustInTimeCompile',
        newName: undefined,
        testingType: undefined,
        value: undefined,
      })
    })

    it('warns if experimentalSessionAndOrigin is passed', async function () {
      await defaults('experimentalSessionAndOrigin', true, {
        experimentalSessionAndOrigin: true,
      })

      expect(errors.warning).toBeCalledWith('EXPERIMENTAL_SESSION_AND_ORIGIN_REMOVED', {
        configFile: 'cypress.config.js',
        name: 'experimentalSessionAndOrigin',
        newName: undefined,
        testingType: undefined,
        value: undefined,
      })
    })

    it('warns if experimentalStudio is passed', async function () {
      await defaults('experimentalStudio', true, {
        experimentalStudio: true,
      })

      expect(errors.warning).toBeCalledWith('EXPERIMENTAL_STUDIO_REMOVED', {
        configFile: 'cypress.config.js',
        name: 'experimentalStudio',
        newName: undefined,
        testingType: undefined,
        value: undefined,
      })
    })

    describe('.resolved', () => {
      it('sets reporter and port to cli', async () => {
        const obj = {
          projectRoot: '/foo/bar',
          supportFile: false,
        }

        const options = {
          reporter: 'json',
          port: 1234,
        }

        const getFilesByGlob = vi.fn().mockReturnValue(['path/to/file'])

        const cfg = await mergeDefaults(obj, options, {}, getFilesByGlob)

        expect(cfg.resolved).toEqual({
          animationDistanceThreshold: { value: 5, from: 'default' },
          arch: { value: os.arch(), from: 'default' },
          baseUrl: { value: null, from: 'default' },
          blockHosts: { value: null, from: 'default' },
          browsers: { value: [], from: 'default' },
          chromeWebSecurity: { value: true, from: 'default' },
          clientCertificates: { value: [], from: 'default' },
          defaultBrowser: { value: null, from: 'default' },
          defaultCommandTimeout: { value: 4000, from: 'default' },
          downloadsFolder: { value: 'cypress/downloads', from: 'default' },
          env: {},
          excludeSpecPattern: { value: '*.hot-update.js', from: 'default' },
          execTimeout: { value: 60000, from: 'default' },
          experimentalModifyObstructiveThirdPartyCode: { value: false, from: 'default' },
          experimentalCspAllowList: { value: false, from: 'default' },
          experimentalInteractiveRunEvents: { value: false, from: 'default' },
          experimentalMemoryManagement: { value: false, from: 'default' },
          experimentalOriginDependencies: { value: false, from: 'default' },
          experimentalPromptCommand: { value: false, from: 'default' },
          experimentalRunAllSpecs: { value: false, from: 'default' },
          experimentalSingleTabRunMode: { value: false, from: 'default' },
          experimentalSourceRewriting: { value: false, from: 'default' },
          experimentalWebKitSupport: { value: false, from: 'default' },
          fileServerFolder: { value: '', from: 'default' },
          fixturesFolder: { value: 'cypress/fixtures', from: 'default' },
          hosts: { value: null, from: 'default' },
          includeShadowDom: { value: false, from: 'default' },
          injectDocumentDomain: { value: false, from: 'default' },
          justInTimeCompile: { value: true, from: 'default' },
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

      it('sets config, envFile and env', async () => {
        vi.stubEnv('CYPRESS_quux', 'quux')
        vi.stubEnv('CYPRESS_RECORD_KEY', 'foobarbazquux')
        vi.stubEnv('CYPRESS_PROJECT_ID', 'projectId123')

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

        const getFilesByGlob = vi.fn().mockReturnValue(['path/to/file.ts'])

        const cfg = await mergeDefaults(obj, options, {}, getFilesByGlob)

        expect(cfg.resolved).toEqual({
          arch: { value: os.arch(), from: 'default' },
          animationDistanceThreshold: { value: 5, from: 'default' },
          baseUrl: { value: 'http://localhost:8080', from: 'config' },
          blockHosts: { value: null, from: 'default' },
          browsers: { value: [], from: 'default' },
          chromeWebSecurity: { value: true, from: 'default' },
          clientCertificates: { value: [], from: 'default' },
          defaultBrowser: { value: null, from: 'default' },
          defaultCommandTimeout: { value: 4000, from: 'default' },
          downloadsFolder: { value: 'cypress/downloads', from: 'default' },
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
          excludeSpecPattern: { value: '*.hot-update.js', from: 'default' },
          execTimeout: { value: 60000, from: 'default' },
          experimentalModifyObstructiveThirdPartyCode: { value: false, from: 'default' },
          experimentalCspAllowList: { value: false, from: 'default' },
          experimentalInteractiveRunEvents: { value: false, from: 'default' },
          experimentalMemoryManagement: { value: false, from: 'default' },
          experimentalOriginDependencies: { value: false, from: 'default' },
          experimentalPromptCommand: { value: false, from: 'default' },
          experimentalRunAllSpecs: { value: false, from: 'default' },
          experimentalSingleTabRunMode: { value: false, from: 'default' },
          experimentalSourceRewriting: { value: false, from: 'default' },
          experimentalWebKitSupport: { value: false, from: 'default' },
          fileServerFolder: { value: '', from: 'default' },
          fixturesFolder: { value: 'cypress/fixtures', from: 'default' },
          hosts: { value: null, from: 'default' },
          includeShadowDom: { value: false, from: 'default' },
          injectDocumentDomain: { value: false, from: 'default' },
          justInTimeCompile: { value: true, from: 'default' },
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

      it('honors user config for testIsolation', async () => {
        const obj = {
          projectRoot: '/foo/bar',
          supportFile: false,
          baseUrl: 'http://localhost:8080',
          testIsolation: false,
        }

        const options = {
          testingType: 'e2e',
        }

        const getFilesByGlob = vi.fn().mockReturnValue(['path/to/file.ts'])

        const cfg = await mergeDefaults(obj, options, {}, getFilesByGlob)

        expect(cfg.resolved).toHaveProperty('testIsolation')
        expect(cfg.resolved.testIsolation).toEqual({ value: false, from: 'config' })
      })
    })
  })
})
