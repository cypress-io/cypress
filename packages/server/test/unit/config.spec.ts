import _ from 'lodash'
import { stripVTControlCharacters as stripAnsi } from 'util'
import { stripIndent } from 'common-tags'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import Fixtures from '@tooling/system-tests'
import type { DataContext } from '@packages/data-context'
import { clearCtx, getCtx, makeDataContext, setCtx } from '../../lib/makeDataContext'

// Building the real schemas in this worker loads a second `graphql` realm, which
// `graphql` rejects. Config resolution never queries either schema.
vi.mock('@packages/data-context/graphql/schema', () => {
  return { graphqlSchema: {} }
})

vi.mock('@packages/data-context/graphql', () => {
  return { remoteSchemaWrapped: {} }
})

type MutableProcessVersions = typeof process.versions & {
  chrome?: string
}

const processVersions = process.versions as MutableProcessVersions
const originalChromeVersion = processVersions.chrome

describe('lib/config', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeAll(() => {
    originalEnv = process.env

    process.env = _.omit(process.env, 'CYPRESS_DEBUG')
    processVersions.chrome = '0'

    Fixtures.scaffold()
  })

  afterAll(() => {
    process.env = originalEnv
    processVersions.chrome = originalChromeVersion
  })

  beforeEach(async () => {
    await clearCtx()
    setCtx(makeDataContext({} as Parameters<typeof makeDataContext>[0]))
  })

  afterEach(async () => {
    await getCtx()._reset()
    await clearCtx()
    vi.restoreAllMocks()
  })

  describe('.get', () => {
    let ctx: DataContext
    let projectRoot: string

    const setup = (cypressJson: any = {}, cypressEnvJson = {}) => {
      vi.spyOn(ctx.lifecycleManager._configManager!, 'getConfigFileContents').mockResolvedValue({ ...cypressJson, e2e: cypressJson.e2e ?? { supportFile: false } })
      vi.spyOn(ctx.lifecycleManager._configManager!, 'reloadCypressEnvFile').mockResolvedValue(cypressEnvJson)
    }

    beforeEach(async () => {
      delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS

      ctx = getCtx()

      projectRoot = '/_test-output/path/to/project'

      vi.spyOn(process, 'chdir').mockImplementation(() => {})
      vi.spyOn(ctx.lifecycleManager, 'verifyProjectRoot').mockReturnValue(undefined)

      await ctx.lifecycleManager.setCurrentProject(projectRoot)
      ctx.lifecycleManager.setCurrentTestingType('e2e')
    })

    it('sets projectRoot', () => {
      setup({}, { foo: 'bar' })

      return ctx.lifecycleManager.getFullInitialConfig()
      .then((obj) => {
        expect(obj.projectRoot).toBe(projectRoot)

        expect(obj.env).toEqual({ foo: 'bar' })
      })
    })

    it('sets projectName', () => {
      setup({}, { foo: 'bar' })

      return ctx.lifecycleManager.getFullInitialConfig()
      .then((obj) => {
        expect(obj.projectName).toBe('project')
      })
    })

    it('clones settings and env settings, so they are not mutated', () => {
      const settings = { foo: 'bar' }
      const envSettings = { baz: 'qux' }

      setup(settings, envSettings)

      return ctx.lifecycleManager.getFullInitialConfig()
      .then(() => {
        expect(settings).toEqual({ foo: 'bar' })
        expect(envSettings).toEqual({ baz: 'qux' })
      })
    })

    describe('port', () => {
      beforeEach(() => {
        return setup({}, { foo: 'bar' })
      })

      it('can override default port', () => {
        return ctx.lifecycleManager.getFullInitialConfig({ port: 8080 })
        .then((obj) => {
          expect(obj.port).toBe(8080)
        })
      })

      it('updates browserUrl', () => {
        return ctx.lifecycleManager.getFullInitialConfig({ port: 8080 })
        .then((obj) => {
          expect(obj.browserUrl).toBe('http://localhost:8080/__/')
        })
      })

      it('updates proxyUrl', () => {
        return ctx.lifecycleManager.getFullInitialConfig({ port: 8080 })
        .then((obj) => {
          expect(obj.proxyUrl).toBe('http://localhost:8080')
        })
      })
    })

    describe('validation', () => {
      const expectValidationPasses = () => {
        return ctx.lifecycleManager.getFullInitialConfig() // shouldn't throw
      }

      const expectValidationFails = (errorMessage = 'validation error') => {
        return ctx.lifecycleManager.getFullInitialConfig()
        .then(() => {
          throw new Error('should throw validation error')
        }).catch((err) => {
          expect(stripAnsi(err.message)).toContain(stripIndent`${errorMessage}`)
        })
      }

      it('values are optional', () => {
        setup()

        return expectValidationPasses()
      })

      it('validates cypress.config.js', () => {
        setup({ reporter: 5 })

        return expectValidationFails('Expected reporter to be a string')
      })

      it('only validates known values', () => {
        setup({ foo: 'bar' })

        return expectValidationPasses()
      })

      describe('animationDistanceThreshold', () => {
        it('passes if a number', () => {
          setup({ animationDistanceThreshold: 10 })

          return expectValidationPasses()
        })

        it('fails if not a number', () => {
          setup({ animationDistanceThreshold: { foo: 'bar' } })

          return expectValidationFails('be a number')
          .then(() => {
            return expectValidationFails(`
            the value was: \


            {
              "foo": "bar"
            }`)
          })
        })
      })

      describe('baseUrl', () => {
        it('passes if begins with http://', () => {
          setup({ e2e: { baseUrl: 'http://example.com', supportFile: false } })

          return expectValidationPasses()
        })

        it('passes if begins with https://', () => {
          setup({ e2e: { baseUrl: 'https://example.com', supportFile: false } })

          return expectValidationPasses()
        })

        it('fails if not a string', () => {
          setup({ e2e: { baseUrl: false } })

          return expectValidationFails('be a fully qualified URL')
        })

        it('fails if not a fully qualified url', () => {
          setup({ e2e: { baseUrl: 'localhost' } })

          return expectValidationFails('be a fully qualified URL')
        })

        it('fails if it is set on root level', () => {
          setup({ baseUrl: 'localhost' })

          return expectValidationFails('Set it within a testing type property: e2e.baseUrl')
        })
      })

      describe('chromeWebSecurity', () => {
        it('passes if a boolean', () => {
          setup({ chromeWebSecurity: false })

          return expectValidationPasses()
        })

        it('fails if not a boolean', () => {
          setup({ chromeWebSecurity: 42 })

          return expectValidationFails('be a boolean')
          .then(() => {
            return expectValidationFails('the value was: 42')
          })
        })
      })

      describe('modifyObstructiveCode', () => {
        it('passes if a boolean', () => {
          setup({ modifyObstructiveCode: false })

          return expectValidationPasses()
        })

        it('fails if not a boolean', () => {
          setup({ modifyObstructiveCode: 42 })

          return expectValidationFails('be a boolean')
          .then(() => {
            return expectValidationFails('the value was: 42')
          })
        })
      })

      describe('component', () => {
        it('passes if an object with valid properties', () => {
          setup({
            component: {
              taskTimeout: 10000,
            },
          })

          return expectValidationPasses()
        })

        it('fails if not a plain object', () => {
          setup({ component: false })

          return expectValidationFails('to be a plain object')
          .then(() => {
            return expectValidationFails('the value was: false')
          })
        })

        it('fails if nested property is incorrect', () => {
          setup({ component: { baseUrl: false } })

          return expectValidationFails('Expected component.baseUrl to be a fully qualified URL (starting with `http://` or `https://`).')
          .then(() => {
            return expectValidationFails('the value was: false')
          })
        })
      })

      describe('e2e', () => {
        it('passes if an object with valid properties', () => {
          setup({
            e2e: {
              baseUrl: 'https://cypress.com',
              taskTimeout: 10000,
            },
          })
        })

        it('fails if not a plain object', () => {
          setup({ e2e: false })

          return expectValidationFails('to be a plain object')
          .then(() => {
            return expectValidationFails('the value was: false')
          })
        })

        it('fails if nested property is incorrect', () => {
          setup({ e2e: { animationDistanceThreshold: 'this is definitely not a number' } })

          return expectValidationFails('Expected e2e.animationDistanceThreshold to be a number')
          .then(() => {
            return expectValidationFails('the value was: "this is definitely not a number"')
          })
        })

        it('fails if nested property is incorrect', () => {
          setup({ component: { baseUrl: false } })

          return expectValidationFails('Expected component.baseUrl to be a fully qualified URL (starting with `http://` or `https://`).')
          .then(() => {
            return expectValidationFails('the value was: false')
          })
        })
      })

      describe('defaultCommandTimeout', () => {
        it('passes if a number', () => {
          setup({ defaultCommandTimeout: 10 })

          return expectValidationPasses()
        })

        it('fails if not a number', () => {
          setup({ defaultCommandTimeout: 'foo' })

          return expectValidationFails('be a number')
          .then(() => {
            return expectValidationFails('the value was: "foo"')
          })
        })
      })

      describe('env', () => {
        it('passes if an object', () => {
          setup({ env: {} })

          return expectValidationPasses()
        })

        it('fails if not an object', () => {
          setup({ env: 'not an object that\'s for sure' })

          return expectValidationFails('a plain object')
        })
      })

      describe('taskTimeout', () => {
        it('passes if a number', () => {
          setup({ taskTimeout: 10 })

          return expectValidationPasses()
        })

        it('fails if not a number', () => {
          setup({ taskTimeout: 'foo' })

          return expectValidationFails('be a number')
        })
      })

      describe('fileServerFolder', () => {
        it('passes if a string', () => {
          setup({ fileServerFolder: '_files' })

          return expectValidationPasses()
        })

        it('fails if not a string', () => {
          setup({ fileServerFolder: true })

          return expectValidationFails('be a string')
          .then(() => {
            return expectValidationFails('the value was: true')
          })
        })

        it('passes if a string contains encoded special characters', () => {
          setup({ fileServerFolder: encodeURI('/specialCharacters/无法解析的特殊字符') })

          return expectValidationPasses()
        })
      })

      describe('fixturesFolder', () => {
        it('passes if a string', () => {
          setup({ fixturesFolder: '_fixtures' })

          return expectValidationPasses()
        })

        it('passes if false', () => {
          setup({ fixturesFolder: false })

          return expectValidationPasses()
        })

        it('fails if not a string or false', () => {
          setup({ fixturesFolder: true })

          return expectValidationFails('be a string or false')
        })
      })

      describe('excludeSpecPattern', () => {
        it('passes if a string', () => {
          setup({ e2e: { excludeSpecPattern: '*.jsx', supportFile: false } })

          return expectValidationPasses()
        })

        it('passes if an array of strings', () => {
          setup({ e2e: { excludeSpecPattern: ['*.jsx'], supportFile: false } })

          return expectValidationPasses()
        })

        it('fails if not a string or array', () => {
          setup({ e2e: { excludeSpecPattern: 5 } })

          return expectValidationFails('be a string or an array of strings')
        })

        it('fails if not an array of strings', () => {
          setup({ e2e: { excludeSpecPattern: [5] } })

          return expectValidationFails('be a string or an array of strings')
          .then(() => {
            return expectValidationFails(`
            the value was: \


            [
              5
            ]`)
          })
        })
      })

      describe('downloadsFolder', () => {
        it('passes if a string', () => {
          setup({ downloadsFolder: '_downloads' })

          return expectValidationPasses()
        })

        it('fails if not a string', () => {
          setup({ downloadsFolder: true })

          return expectValidationFails('be a string')
        })
      })

      describe('userAgent', () => {
        it('passes if a string', () => {
          setup({ userAgent: '_tests' })

          return expectValidationPasses()
        })

        it('fails if not a string', () => {
          setup({ userAgent: true })

          return expectValidationFails('be a string')
        })
      })

      describe('numTestsKeptInMemory', () => {
        it('passes if a number', () => {
          setup({ numTestsKeptInMemory: 10 })

          return expectValidationPasses()
        })

        it('fails if not a number', () => {
          setup({ numTestsKeptInMemory: 'foo' })

          return expectValidationFails('be a number')
        })
      })

      describe('pageLoadTimeout', () => {
        it('passes if a number', () => {
          setup({ pageLoadTimeout: 10 })

          return expectValidationPasses()
        })

        it('fails if not a number', () => {
          setup({ pageLoadTimeout: 'foo' })

          return expectValidationFails('be a number')
        })
      })

      describe('port', () => {
        it('passes if a number', () => {
          setup({ port: 10 })

          return expectValidationPasses()
        })

        it('fails if not a number', () => {
          setup({ port: 'foo' })

          return expectValidationFails('be a number')
        })
      })

      describe('reporter', () => {
        it('passes if a string', () => {
          setup({ reporter: '_custom' })

          return expectValidationPasses()
        })

        it('fails if not a string', () => {
          setup({ reporter: true })

          return expectValidationFails('be a string')
        })
      })

      describe('requestTimeout', () => {
        it('passes if a number', () => {
          setup({ requestTimeout: 10 })

          return expectValidationPasses()
        })

        it('fails if not a number', () => {
          setup({ requestTimeout: 'foo' })

          return expectValidationFails('be a number')
        })
      })

      describe('responseTimeout', () => {
        it('passes if a number', () => {
          setup({ responseTimeout: 10 })

          return expectValidationPasses()
        })

        it('fails if not a number', () => {
          setup({ responseTimeout: 'foo' })

          return expectValidationFails('be a number')
        })
      })

      describe('specPattern', () => {
        it('passes if a string', () => {
          setup({ e2e: { supportFile: false, specPattern: '**/*.spec.js' } })

          return expectValidationPasses()
        })

        it('passes if an array of strings', () => {
          setup({ e2e: { supportFile: false, specPattern: ['**/*.spec.js'] } })

          return expectValidationPasses()
        })

        it('fails if not a string or array', () => {
          setup({ e2e: { supportFile: false, specPattern: 42 } })

          return expectValidationFails('be a string or an array of strings')
        })

        it('fails if not an array of strings', () => {
          setup({ e2e: { supportFile: false, specPattern: [5] } })

          return expectValidationFails('be a string or an array of strings')
          .then(() => {
            return expectValidationFails(`
            the value was: \


            [
              5
            ]`)
          })
        })
      })

      describe('experimentalCspAllowList', () => {
        const experimentalCspAllowedDirectives = JSON.stringify(['script-src-elem', 'script-src', 'default-src', 'form-action', 'child-src', 'frame-src']).split(',').join(', ')

        it('passes if false', () => {
          setup({ experimentalCspAllowList: false })

          return expectValidationPasses()
        })

        it('passes if true', () => {
          setup({ experimentalCspAllowList: true })

          return expectValidationPasses()
        })

        it('fails if string', () => {
          setup({ experimentalCspAllowList: 'fake-directive' })

          return expectValidationFails(`be an array including any of these values: ${experimentalCspAllowedDirectives}`)
        })

        it('passes if an empty array', () => {
          setup({ experimentalCspAllowList: [] })

          return expectValidationPasses()
        })

        it('passes if subset of Cypress.experimentalCspAllowedDirectives[]', () => {
          setup({ experimentalCspAllowList: ['default-src', 'form-action'] })

          return expectValidationPasses()
        })

        it('passes if null', () => {
          setup({ experimentalCspAllowList: null })

          return expectValidationPasses()
        })

        it('fails if string[]', () => {
          setup({ experimentalCspAllowList: ['script-src', 'fake-directive-2'] })

          return expectValidationFails(`be an array including any of these values: ${experimentalCspAllowedDirectives}`)
        })

        it('fails if any[]', () => {
          setup({ experimentalCspAllowList: [true, 'default-src'] })

          return expectValidationFails(`be an array including any of these values: ${experimentalCspAllowedDirectives}`)
        })

        it('fails if not falsy, or subset of Cypress.experimentalCspAllowedDirectives[]', () => {
          setup({ experimentalCspAllowList: 1 })

          return expectValidationFails(`be an array including any of these values: ${experimentalCspAllowedDirectives}`)
        })
      })

      describe('supportFile', () => {
        it('passes if false', () => {
          setup({ e2e: { supportFile: false } })

          return expectValidationPasses()
        })

        it('fails if not a string or false', () => {
          setup({ e2e: { supportFile: true } })

          return expectValidationFails('be a string or false')
        })

        it('fails if is set at root level', () => {
          setup({ supportFile: false })

          return expectValidationFails('The supportFile configuration option is invalid when set from the root of the config object')
          .then(() => {
            return expectValidationFails('Set it within a testing type property: e2e.supportFile and component.supportFile')
          })
        })
      })

      describe('trashAssetsBeforeRuns', () => {
        it('passes if a boolean', () => {
          setup({ trashAssetsBeforeRuns: false })

          return expectValidationPasses()
        })

        it('fails if not a boolean', () => {
          setup({ trashAssetsBeforeRuns: 42 })

          return expectValidationFails('be a boolean')
        })
      })

      describe('videoCompression', () => {
        it('passes if a number', () => {
          setup({ videoCompression: 10 })

          return expectValidationPasses()
        })

        it('passes if false', () => {
          setup({ videoCompression: false })

          return expectValidationPasses()
        })

        it('passes if true', () => {
          setup({ videoCompression: true })

          return expectValidationPasses()
        })

        it('fails if not a valid CRF value', () => {
          setup({ videoCompression: 70 })

          return expectValidationFails('to be a valid CRF number between 1 & 51, 0 or false to disable compression, or true to use the default compression of 32')
        })

        it('fails if not a number', () => {
          setup({ videoCompression: 'foo' })

          return expectValidationFails('to be a valid CRF number between 1 & 51, 0 or false to disable compression, or true to use the default compression of 32')
        })
      })

      describe('video', () => {
        it('passes if a boolean', () => {
          setup({ video: false })

          return expectValidationPasses()
        })

        it('fails if not a boolean', () => {
          setup({ video: 42 })

          return expectValidationFails('be a boolean')
        })
      })

      describe('videosFolder', () => {
        it('passes if a string', () => {
          setup({ videosFolder: '_videos' })

          return expectValidationPasses()
        })

        it('fails if not a string', () => {
          setup({ videosFolder: true })

          return expectValidationFails('be a string')
        })
      })

      describe('screenshotOnRunFailure', () => {
        it('passes if a boolean', () => {
          setup({ screenshotOnRunFailure: false })

          return expectValidationPasses()
        })

        it('fails if not a boolean', () => {
          setup({ screenshotOnRunFailure: 42 })

          return expectValidationFails('be a boolean')
        })
      })

      describe('viewportHeight', () => {
        it('passes if a number', () => {
          setup({ viewportHeight: 10 })

          return expectValidationPasses()
        })

        it('fails if not a number', () => {
          setup({ viewportHeight: 'foo' })

          return expectValidationFails('be a number')
        })
      })

      describe('viewportWidth', () => {
        it('passes if a number', () => {
          setup({ viewportWidth: 10 })

          return expectValidationPasses()
        })

        it('fails if not a number', () => {
          setup({ viewportWidth: 'foo' })

          return expectValidationFails('be a number')
        })
      })

      describe('waitForAnimations', () => {
        it('passes if a boolean', () => {
          setup({ waitForAnimations: false })

          return expectValidationPasses()
        })

        it('fails if not a boolean', () => {
          setup({ waitForAnimations: 42 })

          return expectValidationFails('be a boolean')
        })
      })

      describe('scrollBehavior', () => {
        it('passes if false', () => {
          setup({ scrollBehavior: false })

          return expectValidationPasses()
        })

        it('passes if an enum (center)', () => {
          setup({ scrollBehavior: 'center' })

          return expectValidationPasses()
        })

        it('passes if an enum (top)', () => {
          setup({ scrollBehavior: 'top' })

          return expectValidationPasses()
        })

        it('passes if an enum (bottom)', () => {
          setup({ scrollBehavior: 'bottom' })

          return expectValidationPasses()
        })

        it('passes if an enum (nearest)', () => {
          setup({ scrollBehavior: 'nearest' })

          return expectValidationPasses()
        })

        it('passes if an enum (start)', () => {
          setup({ scrollBehavior: 'start' })

          return expectValidationPasses()
        })

        it('passes if an enum (end)', () => {
          setup({ scrollBehavior: 'end' })

          return expectValidationPasses()
        })

        it('fails if not valid (number)', () => {
          setup({ scrollBehavior: 42 })

          return expectValidationFails('be one of these values')
        })

        it('fails if not a valid (null)', () => {
          setup({ scrollBehavior: null })

          return expectValidationFails('be one of these values')
        })

        it('fails if not a valid (true)', () => {
          setup({ scrollBehavior: true })

          return expectValidationFails('be one of these values')
        })

        it('passes if both axes are provided', () => {
          setup({ scrollBehavior: { block: 'start', inline: 'nearest' } })

          return expectValidationPasses()
        })

        it('passes if only the inline axis is provided', () => {
          setup({ scrollBehavior: { inline: 'nearest' } })

          return expectValidationPasses()
        })

        it('passes if only the block axis is provided', () => {
          setup({ scrollBehavior: { block: 'end' } })

          return expectValidationPasses()
        })

        it('fails if an axis is not a valid enum', () => {
          setup({ scrollBehavior: { block: 'start', inline: 'left' } })

          return expectValidationFails('be one of these values')
        })

        it('suggests the per-axis position when an axis uses a block alignment', () => {
          setup({ scrollBehavior: { block: 'top' } })

          return expectValidationFails('use "start" instead of "top"')
        })

        it('suggests the per-axis position when an axis uses bottom', () => {
          setup({ scrollBehavior: { inline: 'bottom' } })

          return expectValidationFails('use "end" instead of "bottom"')
        })

        it('fails if an axis is false', () => {
          setup({ scrollBehavior: { block: false } })

          return expectValidationFails('be one of these values')
        })

        it('fails if an unknown axis is provided', () => {
          setup({ scrollBehavior: { block: 'top', axis: 'nearest' } })

          return expectValidationFails('be one of these values')
        })

        it('fails if empty object', () => {
          setup({ scrollBehavior: {} })

          return expectValidationFails('be one of these values')
        })
      })

      describe('watchForFileChanges', () => {
        it('passes if a boolean', () => {
          setup({ watchForFileChanges: false })

          return expectValidationPasses()
        })

        it('fails if not a boolean', () => {
          setup({ watchForFileChanges: 42 })

          return expectValidationFails('be a boolean')
        })
      })

      describe('blockHosts', () => {
        it('passes if a string', () => {
          setup({ blockHosts: 'google.com' })

          return expectValidationPasses()
        })

        it('passes if an array of strings', () => {
          setup({ blockHosts: ['google.com'] })

          return expectValidationPasses()
        })

        it('fails if not a string or array', () => {
          setup({ blockHosts: 5 })

          return expectValidationFails('be a string or an array of strings')
        })

        it('fails if not an array of strings', () => {
          setup({ blockHosts: [5] })

          return expectValidationFails('be a string or an array of strings')
          .then(() => {
            return expectValidationFails(`
            the value was: \


            [
              5
            ]`)
          })
        })
      })

      describe('retries', () => {
        // need to keep the const here or it'll get stripped by the build

        const cases = [
          [{ retries: null }, 'with null', null],
          [{ retries: 3 }, 'when a number', null],
          [{ retries: 3.2 }, 'when a float', 'Expected retries to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers, booleans, or nulls, or experimental configuration with key "experimentalStrategy" with value "detect-flake-but-always-fail" or "detect-flake-and-pass-on-threshold" and key "experimentalOptions" to provide a valid configuration for your selected strategy.'],
          [{ retries: -1 }, 'with a negative number', 'Expected retries to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers, booleans, or nulls, or experimental configuration with key "experimentalStrategy" with value "detect-flake-but-always-fail" or "detect-flake-and-pass-on-threshold" and key "experimentalOptions" to provide a valid configuration for your selected strategy.'],
          [{ retries: true }, 'when true', 'Expected retries to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers, booleans, or nulls, or experimental configuration with key "experimentalStrategy" with value "detect-flake-but-always-fail" or "detect-flake-and-pass-on-threshold" and key "experimentalOptions" to provide a valid configuration for your selected strategy.'],
          [{ retries: false }, 'when false', 'Expected retries to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers, booleans, or nulls, or experimental configuration with key "experimentalStrategy" with value "detect-flake-but-always-fail" or "detect-flake-and-pass-on-threshold" and key "experimentalOptions" to provide a valid configuration for your selected strategy.'],
          [{ retries: {} }, 'with an empty object', null],
          [{ retries: { runMode: 3 } }, 'when runMode is a positive number', null],
          [{ retries: { runMode: -1 } }, 'when runMode is a negative number', 'Expected retries.runMode to be a positive whole number greater than or equals 0 or null.'],
          [{ retries: { openMode: 3 } }, 'when openMode is a positive number', null],
          [{ retries: { openMode: -1 } }, 'when openMode is a negative number', 'Expected retries.openMode to be a positive whole number greater than or equals 0 or null'],
          [{ retries: { openMode: 3, TypoRunMode: 3 } }, 'when there is an additional unknown key', 'Expected retries to be an object with keys "openMode" and "runMode" with values of numbers, booleans, or nulls.'],
          [{ retries: { openMode: 3, runMode: 3 } }, 'when both runMode and openMode are positive numbers', null],
        ].forEach(([config, expectation, expectedError]) => {
          it(`${expectedError ? 'fails' : 'passes'} ${expectation}`, () => {
            setup(config)

            return expectedError ? expectValidationFails(expectedError) : expectValidationPasses()
          })
        })
      })

      function pemCertificate () {
        return {
          clientCertificates: [
            {
              url: 'https://somewhere.com/*',
              ca: ['certs/ca.crt'],
              certs: [
                {
                  cert: 'certs/cert.crt',
                  key: 'certs/cert.key',
                  passphrase: 'certs/cert.key.pass',
                },
              ],
            },
          ],
        }
      }

      function pfxCertificate () {
        return {
          clientCertificates: [
            {
              url: 'https://somewhere.com/*',
              ca: ['certs/ca.crt'],
              certs: [
                {
                  pfx: 'certs/cert.pfx',
                  passphrase: 'certs/cerpfx.pass',
                },
              ],
            },
          ],
        }
      }

      describe('clientCertificates', () => {
        it('accepts valid PEM config', () => {
          setup(pemCertificate())

          return expectValidationPasses()
        })

        it('accepts valid PFX config', () => {
          setup(pfxCertificate())

          return expectValidationPasses()
        })

        it('detects invalid config with no url', () => {
          let cfg = pemCertificate()

          cfg.clientCertificates[0].url = null
          setup(cfg)

          return expectValidationFails('clientCertificates[0].url to be a URL matcher.\n\nInstead the value was: null')
        })

        it('detects invalid config with no certs', () => {
          let cfg = pemCertificate()

          cfg.clientCertificates[0].certs = null
          setup(cfg)

          return expectValidationFails('clientCertificates[0].certs to be an array of certs.\n\nInstead the value was: null')
        })

        it('detects invalid config with no cert', () => {
          let cfg = pemCertificate()

          cfg.clientCertificates[0].certs[0].cert = null
          setup(cfg)

          return expectValidationFails('`clientCertificates[0].certs[0]` must have either PEM or PFX defined')
        })

        it('detects invalid config with PEM and PFX certs', () => {
          let cfg = pemCertificate()

          cfg.clientCertificates[0].certs[0].pfx = 'a_file'
          setup(cfg)

          return expectValidationFails('`clientCertificates[0].certs[0]` has both PEM and PFX defined')
        })

        it('detects invalid PEM config with no key', () => {
          let cfg = pemCertificate()

          cfg.clientCertificates[0].certs[0].key = null
          setup(cfg)

          return expectValidationFails('clientCertificates[0].certs[0].key to be a key filepath.\n\nInstead the value was: null')
        })

        it('detects PEM cert absolute path', () => {
          let cfg = pemCertificate()

          cfg.clientCertificates[0].certs[0].cert = '/home/files/a_file'
          setup(cfg)

          return expectValidationFails('clientCertificates[0].certs[0].cert to be a relative filepath.\n\nInstead the value was: "/home/files/a_file"')
        })

        it('detects PEM key absolute path', () => {
          let cfg = pemCertificate()

          cfg.clientCertificates[0].certs[0].key = '/home/files/a_file'
          setup(cfg)

          return expectValidationFails('clientCertificates[0].certs[0].key to be a relative filepath.\n\nInstead the value was: "/home/files/a_file"')
        })

        it('detects PFX absolute path', () => {
          let cfg = pemCertificate()

          cfg.clientCertificates[0].certs[0].cert = undefined
          cfg.clientCertificates[0].certs[0].pfx = '/home/files/a_file'
          setup(cfg)

          return expectValidationFails('clientCertificates[0].certs[0].pfx to be a relative filepath.\n\nInstead the value was: "/home/files/a_file"')
        })

        it('detects CA absolute path', () => {
          let cfg = pemCertificate()

          cfg.clientCertificates[0].ca[0] = '/home/files/a_file'
          setup(cfg)

          return expectValidationFails('clientCertificates[0].ca[0] to be a relative filepath.\n\nInstead the value was: "/home/files/a_file"')
        })
      })
    })
  })
})
