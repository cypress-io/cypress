import '../spec_helper'
import _ from 'lodash'
import stripAnsi from 'strip-ansi'
import { stripIndent } from 'common-tags'
import Fixtures from '@tooling/system-tests'
import { getCtx } from '@packages/data-context'
import { sinon } from '../spec_helper'

type MutableProcessVersions = typeof process.versions & {
  chrome?: string
}

const processVersions = process.versions as MutableProcessVersions
const originalChromeVersion = processVersions.chrome

describe('lib/config', () => {
  before(function () {
    this.env = process.env

    process.env = _.omit(process.env, 'CYPRESS_DEBUG')
    processVersions.chrome = '0'

    Fixtures.scaffold()
  })

  after(function () {
    process.env = this.env
    processVersions.chrome = originalChromeVersion
  })

  describe('.get', () => {
    beforeEach(async function () {
      delete process.env.CYPRESS_COMMERCIAL_RECOMMENDATIONS

      this.ctx = getCtx()

      this.projectRoot = '/_test-output/path/to/project'

      sinon.stub(process, 'chdir').returns()
      sinon.stub(this.ctx.lifecycleManager, 'verifyProjectRoot').returns(undefined)

      await this.ctx.lifecycleManager.setCurrentProject(this.projectRoot)
      this.ctx.lifecycleManager.setCurrentTestingType('e2e')

      this.setup = (cypressJson = {}, cypressEnvJson = {}) => {
        sinon.stub(this.ctx.lifecycleManager._configManager, 'getConfigFileContents').resolves({ ...cypressJson, e2e: cypressJson.e2e ?? { supportFile: false } })
        sinon.stub(this.ctx.lifecycleManager._configManager, 'reloadCypressEnvFile').resolves(cypressEnvJson)
      }
    })

    it('sets projectRoot', function () {
      this.setup({}, { foo: 'bar' })

      return this.ctx.lifecycleManager.getFullInitialConfig()
      .then((obj) => {
        expect(obj.projectRoot).to.eq(this.projectRoot)

        expect(obj.env).to.deep.eq({ foo: 'bar' })
      })
    })

    it('sets projectName', function () {
      this.setup({}, { foo: 'bar' })

      return this.ctx.lifecycleManager.getFullInitialConfig()
      .then((obj) => {
        expect(obj.projectName).to.eq('project')
      })
    })

    it('clones settings and env settings, so they are not mutated', function () {
      const settings = { foo: 'bar' }
      const envSettings = { baz: 'qux' }

      this.setup(settings, envSettings)

      return this.ctx.lifecycleManager.getFullInitialConfig()
      .then(() => {
        expect(settings).to.deep.equal({ foo: 'bar' })
        expect(envSettings).to.deep.equal({ baz: 'qux' })
      })
    })

    describe('port', () => {
      beforeEach(function () {
        return this.setup({}, { foo: 'bar' })
      })

      it('can override default port', function () {
        return this.ctx.lifecycleManager.getFullInitialConfig({ port: 8080 })
        .then((obj) => {
          expect(obj.port).to.eq(8080)
        })
      })

      it('updates browserUrl', function () {
        return this.ctx.lifecycleManager.getFullInitialConfig({ port: 8080 })
        .then((obj) => {
          expect(obj.browserUrl).to.eq('http://localhost:8080/__/')
        })
      })

      it('updates proxyUrl', function () {
        return this.ctx.lifecycleManager.getFullInitialConfig({ port: 8080 })
        .then((obj) => {
          expect(obj.proxyUrl).to.eq('http://localhost:8080')
        })
      })
    })

    describe('validation', () => {
      beforeEach(function () {
        this.expectValidationPasses = () => {
          return this.ctx.lifecycleManager.getFullInitialConfig() // shouldn't throw
        }

        this.expectValidationFails = (errorMessage = 'validation error') => {
          return this.ctx.lifecycleManager.getFullInitialConfig()
          .then(() => {
            throw new Error('should throw validation error')
          }).catch((err) => {
            expect(stripAnsi(err.message)).to.include(stripIndent`${errorMessage}`)
          })
        }
      })

      it('values are optional', function () {
        this.setup()

        return this.expectValidationPasses()
      })

      it('validates cypress.config.js', function () {
        this.setup({ reporter: 5 })

        return this.expectValidationFails('Expected reporter to be a string')
      })

      it('only validates known values', function () {
        this.setup({ foo: 'bar' })

        return this.expectValidationPasses()
      })

      describe('animationDistanceThreshold', () => {
        it('passes if a number', function () {
          this.setup({ animationDistanceThreshold: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ animationDistanceThreshold: { foo: 'bar' } })

          return this.expectValidationFails('be a number')
          .then(() => {
            return this.expectValidationFails(`
            the value was: \


            {
              "foo": "bar"
            }`)
          })
        })
      })

      describe('baseUrl', () => {
        it('passes if begins with http://', function () {
          this.setup({ e2e: { baseUrl: 'http://example.com', supportFile: false } })

          return this.expectValidationPasses()
        })

        it('passes if begins with https://', function () {
          this.setup({ e2e: { baseUrl: 'https://example.com', supportFile: false } })

          return this.expectValidationPasses()
        })

        it('fails if not a string', function () {
          this.setup({ e2e: { baseUrl: false } })

          return this.expectValidationFails('be a fully qualified URL')
        })

        it('fails if not a fully qualified url', function () {
          this.setup({ e2e: { baseUrl: 'localhost' } })

          return this.expectValidationFails('be a fully qualified URL')
        })

        it('fails if it is set on root level', function () {
          this.setup({ baseUrl: 'localhost' })

          return this.expectValidationFails('Set it within a testing type property: e2e.baseUrl')
        })
      })

      describe('chromeWebSecurity', () => {
        it('passes if a boolean', function () {
          this.setup({ chromeWebSecurity: false })

          return this.expectValidationPasses()
        })

        it('fails if not a boolean', function () {
          this.setup({ chromeWebSecurity: 42 })

          return this.expectValidationFails('be a boolean')
          .then(() => {
            return this.expectValidationFails('the value was: 42')
          })
        })
      })

      describe('modifyObstructiveCode', () => {
        it('passes if a boolean', function () {
          this.setup({ modifyObstructiveCode: false })

          return this.expectValidationPasses()
        })

        it('fails if not a boolean', function () {
          this.setup({ modifyObstructiveCode: 42 })

          return this.expectValidationFails('be a boolean')
          .then(() => {
            return this.expectValidationFails('the value was: 42')
          })
        })
      })

      describe('component', () => {
        it('passes if an object with valid properties', function () {
          this.setup({
            component: {
              execTimeout: 10000,
            },
          })

          return this.expectValidationPasses()
        })

        it('fails if not a plain object', function () {
          this.setup({ component: false })

          return this.expectValidationFails('to be a plain object')
          .then(() => {
            return this.expectValidationFails('the value was: false')
          })
        })

        it('fails if nested property is incorrect', function () {
          this.setup({ component: { baseUrl: false } })

          return this.expectValidationFails('Expected component.baseUrl to be a fully qualified URL (starting with `http://` or `https://`).')
          .then(() => {
            return this.expectValidationFails('the value was: false')
          })
        })
      })

      describe('e2e', () => {
        it('passes if an object with valid properties', function () {
          this.setup({
            e2e: {
              baseUrl: 'https://cypress.com',
              execTimeout: 10000,
            },
          })
        })

        it('fails if not a plain object', function () {
          this.setup({ e2e: false })

          return this.expectValidationFails('to be a plain object')
          .then(() => {
            return this.expectValidationFails('the value was: false')
          })
        })

        it('fails if nested property is incorrect', function () {
          this.setup({ e2e: { animationDistanceThreshold: 'this is definitely not a number' } })

          return this.expectValidationFails('Expected e2e.animationDistanceThreshold to be a number')
          .then(() => {
            return this.expectValidationFails('the value was: "this is definitely not a number"')
          })
        })

        it('fails if nested property is incorrect', function () {
          this.setup({ component: { baseUrl: false } })

          return this.expectValidationFails('Expected component.baseUrl to be a fully qualified URL (starting with `http://` or `https://`).')
          .then(() => {
            return this.expectValidationFails('the value was: false')
          })
        })
      })

      describe('defaultCommandTimeout', () => {
        it('passes if a number', function () {
          this.setup({ defaultCommandTimeout: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ defaultCommandTimeout: 'foo' })

          return this.expectValidationFails('be a number')
          .then(() => {
            return this.expectValidationFails('the value was: "foo"')
          })
        })
      })

      describe('env', () => {
        it('passes if an object', function () {
          this.setup({ env: {} })

          return this.expectValidationPasses()
        })

        it('fails if not an object', function () {
          this.setup({ env: 'not an object that\'s for sure' })

          return this.expectValidationFails('a plain object')
        })
      })

      describe('execTimeout', () => {
        it('passes if a number', function () {
          this.setup({ execTimeout: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ execTimeout: 'foo' })

          return this.expectValidationFails('be a number')
        })
      })

      describe('taskTimeout', () => {
        it('passes if a number', function () {
          this.setup({ taskTimeout: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ taskTimeout: 'foo' })

          return this.expectValidationFails('be a number')
        })
      })

      describe('fileServerFolder', () => {
        it('passes if a string', function () {
          this.setup({ fileServerFolder: '_files' })

          return this.expectValidationPasses()
        })

        it('fails if not a string', function () {
          this.setup({ fileServerFolder: true })

          return this.expectValidationFails('be a string')
          .then(() => {
            return this.expectValidationFails('the value was: true')
          })
        })

        it('passes if a string contains encoded special characters', function () {
          this.setup({ fileServerFolder: encodeURI('/specialCharacters/无法解析的特殊字符') })

          return this.expectValidationPasses()
        })
      })

      describe('fixturesFolder', () => {
        it('passes if a string', function () {
          this.setup({ fixturesFolder: '_fixtures' })

          return this.expectValidationPasses()
        })

        it('passes if false', function () {
          this.setup({ fixturesFolder: false })

          return this.expectValidationPasses()
        })

        it('fails if not a string or false', function () {
          this.setup({ fixturesFolder: true })

          return this.expectValidationFails('be a string or false')
        })
      })

      describe('excludeSpecPattern', () => {
        it('passes if a string', function () {
          this.setup({ e2e: { excludeSpecPattern: '*.jsx', supportFile: false } })

          return this.expectValidationPasses()
        })

        it('passes if an array of strings', function () {
          this.setup({ e2e: { excludeSpecPattern: ['*.jsx'], supportFile: false } })

          return this.expectValidationPasses()
        })

        it('fails if not a string or array', function () {
          this.setup({ e2e: { excludeSpecPattern: 5 } })

          return this.expectValidationFails('be a string or an array of strings')
        })

        it('fails if not an array of strings', function () {
          this.setup({ e2e: { excludeSpecPattern: [5] } })

          return this.expectValidationFails('be a string or an array of strings')
          .then(() => {
            return this.expectValidationFails(`
            the value was: \


            [
              5
            ]`)
          })
        })
      })

      describe('downloadsFolder', () => {
        it('passes if a string', function () {
          this.setup({ downloadsFolder: '_downloads' })

          return this.expectValidationPasses()
        })

        it('fails if not a string', function () {
          this.setup({ downloadsFolder: true })

          return this.expectValidationFails('be a string')
        })
      })

      describe('userAgent', () => {
        it('passes if a string', function () {
          this.setup({ userAgent: '_tests' })

          return this.expectValidationPasses()
        })

        it('fails if not a string', function () {
          this.setup({ userAgent: true })

          return this.expectValidationFails('be a string')
        })
      })

      describe('numTestsKeptInMemory', () => {
        it('passes if a number', function () {
          this.setup({ numTestsKeptInMemory: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ numTestsKeptInMemory: 'foo' })

          return this.expectValidationFails('be a number')
        })
      })

      describe('pageLoadTimeout', () => {
        it('passes if a number', function () {
          this.setup({ pageLoadTimeout: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ pageLoadTimeout: 'foo' })

          return this.expectValidationFails('be a number')
        })
      })

      describe('port', () => {
        it('passes if a number', function () {
          this.setup({ port: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ port: 'foo' })

          return this.expectValidationFails('be a number')
        })
      })

      describe('reporter', () => {
        it('passes if a string', function () {
          this.setup({ reporter: '_custom' })

          return this.expectValidationPasses()
        })

        it('fails if not a string', function () {
          this.setup({ reporter: true })

          return this.expectValidationFails('be a string')
        })
      })

      describe('requestTimeout', () => {
        it('passes if a number', function () {
          this.setup({ requestTimeout: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ requestTimeout: 'foo' })

          return this.expectValidationFails('be a number')
        })
      })

      describe('responseTimeout', () => {
        it('passes if a number', function () {
          this.setup({ responseTimeout: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ responseTimeout: 'foo' })

          return this.expectValidationFails('be a number')
        })
      })

      describe('specPattern', () => {
        it('passes if a string', function () {
          this.setup({ e2e: { supportFile: false, specPattern: '**/*.coffee' } })

          return this.expectValidationPasses()
        })

        it('passes if an array of strings', function () {
          this.setup({ e2e: { supportFile: false, specPattern: ['**/*.coffee'] } })

          return this.expectValidationPasses()
        })

        it('fails if not a string or array', function () {
          this.setup({ e2e: { supportFile: false, specPattern: 42 } })

          return this.expectValidationFails('be a string or an array of strings')
        })

        it('fails if not an array of strings', function () {
          this.setup({ e2e: { supportFile: false, specPattern: [5] } })

          return this.expectValidationFails('be a string or an array of strings')
          .then(() => {
            return this.expectValidationFails(`
            the value was: \


            [
              5
            ]`)
          })
        })
      })

      describe('experimentalCspAllowList', () => {
        const experimentalCspAllowedDirectives = JSON.stringify(['script-src-elem', 'script-src', 'default-src', 'form-action', 'child-src', 'frame-src']).split(',').join(', ')

        it('passes if false', function () {
          this.setup({ experimentalCspAllowList: false })

          return this.expectValidationPasses()
        })

        it('passes if true', function () {
          this.setup({ experimentalCspAllowList: true })

          return this.expectValidationPasses()
        })

        it('fails if string', function () {
          this.setup({ experimentalCspAllowList: 'fake-directive' })

          return this.expectValidationFails(`be an array including any of these values: ${experimentalCspAllowedDirectives}`)
        })

        it('passes if an empty array', function () {
          this.setup({ experimentalCspAllowList: [] })

          return this.expectValidationPasses()
        })

        it('passes if subset of Cypress.experimentalCspAllowedDirectives[]', function () {
          this.setup({ experimentalCspAllowList: ['default-src', 'form-action'] })

          return this.expectValidationPasses()
        })

        it('passes if null', function () {
          this.setup({ experimentalCspAllowList: null })

          return this.expectValidationPasses()
        })

        it('fails if string[]', function () {
          this.setup({ experimentalCspAllowList: ['script-src', 'fake-directive-2'] })

          return this.expectValidationFails(`be an array including any of these values: ${experimentalCspAllowedDirectives}`)
        })

        it('fails if any[]', function () {
          this.setup({ experimentalCspAllowList: [true, 'default-src'] })

          return this.expectValidationFails(`be an array including any of these values: ${experimentalCspAllowedDirectives}`)
        })

        it('fails if not falsy, or subset of Cypress.experimentalCspAllowedDirectives[]', function () {
          this.setup({ experimentalCspAllowList: 1 })

          return this.expectValidationFails(`be an array including any of these values: ${experimentalCspAllowedDirectives}`)
        })
      })

      describe('supportFile', () => {
        it('passes if false', function () {
          this.setup({ e2e: { supportFile: false } })

          return this.expectValidationPasses()
        })

        it('fails if not a string or false', function () {
          this.setup({ e2e: { supportFile: true } })

          return this.expectValidationFails('be a string or false')
        })

        it('fails if is set at root level', function () {
          this.setup({ supportFile: false })

          return this.expectValidationFails('The supportFile configuration option is invalid when set from the root of the config object')
          .then(() => {
            return this.expectValidationFails('Set it within a testing type property: e2e.supportFile and component.supportFile')
          })
        })
      })

      describe('trashAssetsBeforeRuns', () => {
        it('passes if a boolean', function () {
          this.setup({ trashAssetsBeforeRuns: false })

          return this.expectValidationPasses()
        })

        it('fails if not a boolean', function () {
          this.setup({ trashAssetsBeforeRuns: 42 })

          return this.expectValidationFails('be a boolean')
        })
      })

      describe('videoCompression', () => {
        it('passes if a number', function () {
          this.setup({ videoCompression: 10 })

          return this.expectValidationPasses()
        })

        it('passes if false', function () {
          this.setup({ videoCompression: false })

          return this.expectValidationPasses()
        })

        it('passes if true', function () {
          this.setup({ videoCompression: true })

          return this.expectValidationPasses()
        })

        it('fails if not a valid CRF value', function () {
          this.setup({ videoCompression: 70 })

          return this.expectValidationFails('to be a valid CRF number between 1 & 51, 0 or false to disable compression, or true to use the default compression of 32')
        })

        it('fails if not a number', function () {
          this.setup({ videoCompression: 'foo' })

          return this.expectValidationFails('to be a valid CRF number between 1 & 51, 0 or false to disable compression, or true to use the default compression of 32')
        })
      })

      describe('video', () => {
        it('passes if a boolean', function () {
          this.setup({ video: false })

          return this.expectValidationPasses()
        })

        it('fails if not a boolean', function () {
          this.setup({ video: 42 })

          return this.expectValidationFails('be a boolean')
        })
      })

      describe('videosFolder', () => {
        it('passes if a string', function () {
          this.setup({ videosFolder: '_videos' })

          return this.expectValidationPasses()
        })

        it('fails if not a string', function () {
          this.setup({ videosFolder: true })

          return this.expectValidationFails('be a string')
        })
      })

      describe('screenshotOnRunFailure', () => {
        it('passes if a boolean', function () {
          this.setup({ screenshotOnRunFailure: false })

          return this.expectValidationPasses()
        })

        it('fails if not a boolean', function () {
          this.setup({ screenshotOnRunFailure: 42 })

          return this.expectValidationFails('be a boolean')
        })
      })

      describe('viewportHeight', () => {
        it('passes if a number', function () {
          this.setup({ viewportHeight: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ viewportHeight: 'foo' })

          return this.expectValidationFails('be a number')
        })
      })

      describe('viewportWidth', () => {
        it('passes if a number', function () {
          this.setup({ viewportWidth: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ viewportWidth: 'foo' })

          return this.expectValidationFails('be a number')
        })
      })

      describe('waitForAnimations', () => {
        it('passes if a boolean', function () {
          this.setup({ waitForAnimations: false })

          return this.expectValidationPasses()
        })

        it('fails if not a boolean', function () {
          this.setup({ waitForAnimations: 42 })

          return this.expectValidationFails('be a boolean')
        })
      })

      describe('scrollBehavior', () => {
        it('passes if false', function () {
          this.setup({ scrollBehavior: false })

          return this.expectValidationPasses()
        })

        it('passes if an enum (center)', function () {
          this.setup({ scrollBehavior: 'center' })

          return this.expectValidationPasses()
        })

        it('passes if an enum (top)', function () {
          this.setup({ scrollBehavior: 'top' })

          return this.expectValidationPasses()
        })

        it('passes if an enum (bottom)', function () {
          this.setup({ scrollBehavior: 'bottom' })

          return this.expectValidationPasses()
        })

        it('passes if an enum (nearest)', function () {
          this.setup({ scrollBehavior: 'nearest' })

          return this.expectValidationPasses()
        })

        it('fails if not valid (number)', function () {
          this.setup({ scrollBehavior: 42 })

          return this.expectValidationFails('be one of these values')
        })

        it('fails if not a valid (null)', function () {
          this.setup({ scrollBehavior: null })

          return this.expectValidationFails('be one of these values')
        })

        it('fails if not a valid (true)', function () {
          this.setup({ scrollBehavior: true })

          return this.expectValidationFails('be one of these values')
        })
      })

      describe('watchForFileChanges', () => {
        it('passes if a boolean', function () {
          this.setup({ watchForFileChanges: false })

          return this.expectValidationPasses()
        })

        it('fails if not a boolean', function () {
          this.setup({ watchForFileChanges: 42 })

          return this.expectValidationFails('be a boolean')
        })
      })

      describe('blockHosts', () => {
        it('passes if a string', function () {
          this.setup({ blockHosts: 'google.com' })

          return this.expectValidationPasses()
        })

        it('passes if an array of strings', function () {
          this.setup({ blockHosts: ['google.com'] })

          return this.expectValidationPasses()
        })

        it('fails if not a string or array', function () {
          this.setup({ blockHosts: 5 })

          return this.expectValidationFails('be a string or an array of strings')
        })

        it('fails if not an array of strings', function () {
          this.setup({ blockHosts: [5] })

          return this.expectValidationFails('be a string or an array of strings')
          .then(() => {
            return this.expectValidationFails(`
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
          it(`${expectedError ? 'fails' : 'passes'} ${expectation}`, function () {
            this.setup(config)

            return expectedError ? this.expectValidationFails(expectedError) : this.expectValidationPasses()
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
        it('accepts valid PEM config', function () {
          this.setup(pemCertificate())

          return this.expectValidationPasses()
        })

        it('accepts valid PFX config', function () {
          this.setup(pfxCertificate())

          return this.expectValidationPasses()
        })

        it('detects invalid config with no url', function () {
          let cfg = pemCertificate()

          cfg.clientCertificates[0].url = null
          this.setup(cfg)

          return this.expectValidationFails('clientCertificates[0].url to be a URL matcher.\n\nInstead the value was: null')
        })

        it('detects invalid config with no certs', function () {
          let cfg = pemCertificate()

          cfg.clientCertificates[0].certs = null
          this.setup(cfg)

          return this.expectValidationFails('clientCertificates[0].certs to be an array of certs.\n\nInstead the value was: null')
        })

        it('detects invalid config with no cert', function () {
          let cfg = pemCertificate()

          cfg.clientCertificates[0].certs[0].cert = null
          this.setup(cfg)

          return this.expectValidationFails('`clientCertificates[0].certs[0]` must have either PEM or PFX defined')
        })

        it('detects invalid config with PEM and PFX certs', function () {
          let cfg = pemCertificate()

          cfg.clientCertificates[0].certs[0].pfx = 'a_file'
          this.setup(cfg)

          return this.expectValidationFails('`clientCertificates[0].certs[0]` has both PEM and PFX defined')
        })

        it('detects invalid PEM config with no key', function () {
          let cfg = pemCertificate()

          cfg.clientCertificates[0].certs[0].key = null
          this.setup(cfg)

          return this.expectValidationFails('clientCertificates[0].certs[0].key to be a key filepath.\n\nInstead the value was: null')
        })

        it('detects PEM cert absolute path', function () {
          let cfg = pemCertificate()

          cfg.clientCertificates[0].certs[0].cert = '/home/files/a_file'
          this.setup(cfg)

          return this.expectValidationFails('clientCertificates[0].certs[0].cert to be a relative filepath.\n\nInstead the value was: "/home/files/a_file"')
        })

        it('detects PEM key absolute path', function () {
          let cfg = pemCertificate()

          cfg.clientCertificates[0].certs[0].key = '/home/files/a_file'
          this.setup(cfg)

          return this.expectValidationFails('clientCertificates[0].certs[0].key to be a relative filepath.\n\nInstead the value was: "/home/files/a_file"')
        })

        it('detects PFX absolute path', function () {
          let cfg = pemCertificate()

          cfg.clientCertificates[0].certs[0].cert = undefined
          cfg.clientCertificates[0].certs[0].pfx = '/home/files/a_file'
          this.setup(cfg)

          return this.expectValidationFails('clientCertificates[0].certs[0].pfx to be a relative filepath.\n\nInstead the value was: "/home/files/a_file"')
        })

        it('detects CA absolute path', function () {
          let cfg = pemCertificate()

          cfg.clientCertificates[0].ca[0] = '/home/files/a_file'
          this.setup(cfg)

          return this.expectValidationFails('clientCertificates[0].ca[0] to be a relative filepath.\n\nInstead the value was: "/home/files/a_file"')
        })
      })
    })
  })
})
