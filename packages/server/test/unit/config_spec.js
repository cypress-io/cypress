require('../spec_helper')

const _ = require('lodash')
const path = require('path')
const R = require('ramda')
const debug = require('debug')('test')
const config = require(`${root}lib/config`)
const errors = require(`${root}lib/errors`)
const configUtil = require(`${root}lib/util/config`)
const findSystemNode = require(`${root}lib/util/find_system_node`)
const scaffold = require(`${root}lib/scaffold`)
let settings = require(`${root}lib/util/settings`)

describe('lib/config', () => {
  beforeEach(function () {
    this.env = process.env

    process.env = _.omit(process.env, 'CYPRESS_DEBUG')
  })

  afterEach(function () {
    process.env = this.env
  })

  context('environment name check', () => {
    it('throws an error for unknown CYPRESS_INTERNAL_ENV', () => {
      sinon.stub(errors, 'throw').withArgs('INVALID_CYPRESS_INTERNAL_ENV', 'foo-bar')
      process.env.CYPRESS_INTERNAL_ENV = 'foo-bar'
      const cfg = {
        projectRoot: '/foo/bar/',
      }
      const options = {}

      config.mergeDefaults(cfg, options)

      expect(errors.throw).have.been.calledOnce
    })

    it('allows production CYPRESS_INTERNAL_ENV', () => {
      sinon.stub(errors, 'throw')
      process.env.CYPRESS_INTERNAL_ENV = 'production'
      const cfg = {
        projectRoot: '/foo/bar/',
      }
      const options = {}

      config.mergeDefaults(cfg, options)

      expect(errors.throw).not.to.be.called
    })
  })

  context('.get', () => {
    beforeEach(function () {
      this.projectRoot = '/_test-output/path/to/project'

      this.setup = (cypressJson = {}, cypressEnvJson = {}) => {
        sinon.stub(settings, 'read').withArgs(this.projectRoot).resolves(cypressJson)

        return sinon.stub(settings, 'readEnv').withArgs(this.projectRoot).resolves(cypressEnvJson)
      }
    })

    it('sets projectRoot', function () {
      this.setup({}, { foo: 'bar' })

      return config.get(this.projectRoot)
      .then((obj) => {
        expect(obj.projectRoot).to.eq(this.projectRoot)

        expect(obj.env).to.deep.eq({ foo: 'bar' })
      })
    })

    it('sets projectName', function () {
      this.setup({}, { foo: 'bar' })

      return config.get(this.projectRoot)
      .then((obj) => {
        expect(obj.projectName).to.eq('project')
      })
    })

    context('port', () => {
      beforeEach(function () {
        return this.setup({}, { foo: 'bar' })
      })

      it('can override default port', function () {
        return config.get(this.projectRoot, { port: 8080 })
        .then((obj) => {
          expect(obj.port).to.eq(8080)
        })
      })

      it('updates browserUrl', function () {
        return config.get(this.projectRoot, { port: 8080 })
        .then((obj) => {
          expect(obj.browserUrl).to.eq('http://localhost:8080/__/')
        })
      })

      it('updates proxyUrl', function () {
        return config.get(this.projectRoot, { port: 8080 })
        .then((obj) => {
          expect(obj.proxyUrl).to.eq('http://localhost:8080')
        })
      })
    })

    context('validation', () => {
      beforeEach(function () {
        this.expectValidationPasses = () => {
          return config.get(this.projectRoot) // shouldn't throw
        }

        this.expectValidationFails = (errorMessage = 'validation error') => {
          return config.get(this.projectRoot)
          .then(() => {
            throw new Error('should throw validation error')
          }).catch((err) => {
            expect(err.message).to.include(errorMessage)
          })
        }
      })

      it('values are optional', function () {
        this.setup()

        return this.expectValidationPasses()
      })

      it('validates cypress.json', function () {
        this.setup({ reporter: 5 })

        return this.expectValidationFails('cypress.json')
      })

      it('validates cypress.env.json', function () {
        this.setup({}, { reporter: 5 })

        return this.expectValidationFails('cypress.env.json')
      })

      it('only validates known values', function () {
        this.setup({ foo: 'bar' })

        return this.expectValidationPasses()
      })

      context('animationDistanceThreshold', () => {
        it('passes if a number', function () {
          this.setup({ animationDistanceThreshold: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ animationDistanceThreshold: { foo: 'bar' } })
          this.expectValidationFails('be a number')

          return this.expectValidationFails('the value was: \`{"foo":"bar"}\`')
        })
      })

      context('baseUrl', () => {
        it('passes if begins with http://', function () {
          this.setup({ baseUrl: 'http://example.com' })

          return this.expectValidationPasses()
        })

        it('passes if begins with https://', function () {
          this.setup({ baseUrl: 'https://example.com' })

          return this.expectValidationPasses()
        })

        it('fails if not a string', function () {
          this.setup({ baseUrl: false })

          return this.expectValidationFails('be a fully qualified URL')
        })

        it('fails if not a fully qualified url', function () {
          this.setup({ baseUrl: 'localhost' })

          return this.expectValidationFails('be a fully qualified URL')
        })
      })

      context('chromeWebSecurity', () => {
        it('passes if a boolean', function () {
          this.setup({ chromeWebSecurity: false })

          return this.expectValidationPasses()
        })

        it('fails if not a boolean', function () {
          this.setup({ chromeWebSecurity: 42 })
          this.expectValidationFails('be a boolean')

          return this.expectValidationFails('the value was: `42`')
        })
      })

      context('modifyObstructiveCode', () => {
        it('passes if a boolean', function () {
          this.setup({ modifyObstructiveCode: false })

          return this.expectValidationPasses()
        })

        it('fails if not a boolean', function () {
          this.setup({ modifyObstructiveCode: 42 })
          this.expectValidationFails('be a boolean')

          return this.expectValidationFails('the value was: `42`')
        })
      })

      context('defaultCommandTimeout', () => {
        it('passes if a number', function () {
          this.setup({ defaultCommandTimeout: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ defaultCommandTimeout: 'foo' })
          this.expectValidationFails('be a number')

          return this.expectValidationFails('the value was: `"foo"`')
        })
      })

      context('env', () => {
        it('passes if an object', function () {
          this.setup({ env: {} })

          return this.expectValidationPasses()
        })

        it('fails if not an object', function () {
          this.setup({ env: 'not an object that\'s for sure' })

          return this.expectValidationFails('a plain object')
        })
      })

      context('execTimeout', () => {
        it('passes if a number', function () {
          this.setup({ execTimeout: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ execTimeout: 'foo' })

          return this.expectValidationFails('be a number')
        })
      })

      context('taskTimeout', () => {
        it('passes if a number', function () {
          this.setup({ taskTimeout: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ taskTimeout: 'foo' })

          return this.expectValidationFails('be a number')
        })
      })

      context('fileServerFolder', () => {
        it('passes if a string', function () {
          this.setup({ fileServerFolder: '_files' })

          return this.expectValidationPasses()
        })

        it('fails if not a string', function () {
          this.setup({ fileServerFolder: true })
          this.expectValidationFails('be a string')

          return this.expectValidationFails('the value was: `true`')
        })
      })

      context('fixturesFolder', () => {
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

      context('ignoreTestFiles', () => {
        it('passes if a string', function () {
          this.setup({ ignoreTestFiles: '*.jsx' })

          return this.expectValidationPasses()
        })

        it('passes if an array of strings', function () {
          this.setup({ ignoreTestFiles: ['*.jsx'] })

          return this.expectValidationPasses()
        })

        it('fails if not a string or array', function () {
          this.setup({ ignoreTestFiles: 5 })

          return this.expectValidationFails('be a string or an array of strings')
        })

        it('fails if not an array of strings', function () {
          this.setup({ ignoreTestFiles: [5] })
          this.expectValidationFails('be a string or an array of strings')

          return this.expectValidationFails('the value was: `[5]`')
        })
      })

      context('integrationFolder', () => {
        it('passes if a string', function () {
          this.setup({ integrationFolder: '_tests' })

          return this.expectValidationPasses()
        })

        it('fails if not a string', function () {
          this.setup({ integrationFolder: true })

          return this.expectValidationFails('be a string')
        })
      })

      context('userAgent', () => {
        it('passes if a string', function () {
          this.setup({ userAgent: '_tests' })

          return this.expectValidationPasses()
        })

        it('fails if not a string', function () {
          this.setup({ userAgent: true })

          return this.expectValidationFails('be a string')
        })
      })

      context('numTestsKeptInMemory', () => {
        it('passes if a number', function () {
          this.setup({ numTestsKeptInMemory: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ numTestsKeptInMemory: 'foo' })

          return this.expectValidationFails('be a number')
        })
      })

      context('pageLoadTimeout', () => {
        it('passes if a number', function () {
          this.setup({ pageLoadTimeout: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ pageLoadTimeout: 'foo' })

          return this.expectValidationFails('be a number')
        })
      })

      context('pluginsFile', () => {
        it('passes if a string', function () {
          this.setup({ pluginsFile: 'cypress/plugins' })

          return this.expectValidationPasses()
        })

        it('passes if false', function () {
          this.setup({ pluginsFile: false })

          return this.expectValidationPasses()
        })

        it('fails if not a string or false', function () {
          this.setup({ pluginsFile: 42 })

          return this.expectValidationFails('be a string')
        })
      })

      context('port', () => {
        it('passes if a number', function () {
          this.setup({ port: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ port: 'foo' })

          return this.expectValidationFails('be a number')
        })
      })

      context('reporter', () => {
        it('passes if a string', function () {
          this.setup({ reporter: '_custom' })

          return this.expectValidationPasses()
        })

        it('fails if not a string', function () {
          this.setup({ reporter: true })

          return this.expectValidationFails('be a string')
        })
      })

      context('requestTimeout', () => {
        it('passes if a number', function () {
          this.setup({ requestTimeout: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ requestTimeout: 'foo' })

          return this.expectValidationFails('be a number')
        })
      })

      context('responseTimeout', () => {
        it('passes if a number', function () {
          this.setup({ responseTimeout: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ responseTimeout: 'foo' })

          return this.expectValidationFails('be a number')
        })
      })

      context('testFiles', () => {
        it('passes if a string', function () {
          this.setup({ testFiles: '**/*.coffee' })

          return this.expectValidationPasses()
        })

        it('passes if an array of strings', function () {
          this.setup({ testFiles: ['**/*.coffee', '**/*.jsx'] })

          return this.expectValidationPasses()
        })

        it('fails if not a string or array', function () {
          this.setup({ testFiles: 42 })

          return this.expectValidationFails('be a string or an array of strings')
        })

        it('fails if not an array of strings', function () {
          this.setup({ testFiles: [5] })
          this.expectValidationFails('be a string or an array of strings')

          return this.expectValidationFails('the value was: `[5]`')
        })
      })

      context('supportFile', () => {
        it('passes if a string', function () {
          this.setup({ supportFile: 'cypress/support' })

          return this.expectValidationPasses()
        })

        it('passes if false', function () {
          this.setup({ supportFile: false })

          return this.expectValidationPasses()
        })

        it('fails if not a string or false', function () {
          this.setup({ supportFile: true })

          return this.expectValidationFails('be a string or false')
        })
      })

      context('trashAssetsBeforeRuns', () => {
        it('passes if a boolean', function () {
          this.setup({ trashAssetsBeforeRuns: false })

          return this.expectValidationPasses()
        })

        it('fails if not a boolean', function () {
          this.setup({ trashAssetsBeforeRuns: 42 })

          return this.expectValidationFails('be a boolean')
        })
      })

      context('videoCompression', () => {
        it('passes if a number', function () {
          this.setup({ videoCompression: 10 })

          return this.expectValidationPasses()
        })

        it('passes if false', function () {
          this.setup({ videoCompression: false })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ videoCompression: 'foo' })

          return this.expectValidationFails('be a number or false')
        })
      })

      context('video', () => {
        it('passes if a boolean', function () {
          this.setup({ video: false })

          return this.expectValidationPasses()
        })

        it('fails if not a boolean', function () {
          this.setup({ video: 42 })

          return this.expectValidationFails('be a boolean')
        })
      })

      context('videoUploadOnPasses', () => {
        it('passes if a boolean', function () {
          this.setup({ videoUploadOnPasses: false })

          return this.expectValidationPasses()
        })

        it('fails if not a boolean', function () {
          this.setup({ videoUploadOnPasses: 99 })

          return this.expectValidationFails('be a boolean')
        })
      })

      context('videosFolder', () => {
        it('passes if a string', function () {
          this.setup({ videosFolder: '_videos' })

          return this.expectValidationPasses()
        })

        it('fails if not a string', function () {
          this.setup({ videosFolder: true })

          return this.expectValidationFails('be a string')
        })
      })

      context('screenshotOnRunFailure', () => {
        it('passes if a boolean', function () {
          this.setup({ screenshotOnRunFailure: false })

          return this.expectValidationPasses()
        })

        it('fails if not a boolean', function () {
          this.setup({ screenshotOnRunFailure: 42 })

          return this.expectValidationFails('be a boolean')
        })
      })

      context('viewportHeight', () => {
        it('passes if a number', function () {
          this.setup({ viewportHeight: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ viewportHeight: 'foo' })

          return this.expectValidationFails('be a number')
        })
      })

      context('viewportWidth', () => {
        it('passes if a number', function () {
          this.setup({ viewportWidth: 10 })

          return this.expectValidationPasses()
        })

        it('fails if not a number', function () {
          this.setup({ viewportWidth: 'foo' })

          return this.expectValidationFails('be a number')
        })
      })

      context('waitForAnimations', () => {
        it('passes if a boolean', function () {
          this.setup({ waitForAnimations: false })

          return this.expectValidationPasses()
        })

        it('fails if not a boolean', function () {
          this.setup({ waitForAnimations: 42 })

          return this.expectValidationFails('be a boolean')
        })
      })

      context('scrollBehavior', () => {
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

      context('watchForFileChanges', () => {
        it('passes if a boolean', function () {
          this.setup({ watchForFileChanges: false })

          return this.expectValidationPasses()
        })

        it('fails if not a boolean', function () {
          this.setup({ watchForFileChanges: 42 })

          return this.expectValidationFails('be a boolean')
        })
      })

      context('blockHosts', () => {
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
          this.expectValidationFails('be a string or an array of strings')

          return this.expectValidationFails('the value was: `[5]`')
        })
      })

      context('retries', () => {
        const retriesError = 'a positive number or null or an object with keys "openMode" and "runMode" with values of numbers or nulls'

        // need to keep the const here or it'll get stripped by the build
        // eslint-disable-next-line no-unused-vars
        const cases = [
          [{ retries: null }, 'with null', true],
          [{ retries: 3 }, 'when a number', true],
          [{ retries: 3.2 }, 'when a float', false],
          [{ retries: -1 }, 'with a negative number', false],
          [{ retries: true }, 'when true', false],
          [{ retries: false }, 'when false', false],
          [{ retries: {} }, 'with an empty object', true],
          [{ retries: { runMode: 3 } }, 'when runMode is a positive number', true],
          [{ retries: { runMode: -1 } }, 'when runMode is a negative number', false],
          [{ retries: { openMode: 3 } }, 'when openMode is a positive number', true],
          [{ retries: { openMode: -1 } }, 'when openMode is a negative number', false],
          [{ retries: { openMode: 3, TypoRunMode: 3 } }, 'when there is an additional unknown key', false],
          [{ retries: { openMode: 3, runMode: 3 } }, 'when both runMode and openMode are positive numbers', true],
        ].forEach(([config, expectation, shouldPass]) => {
          it(`${shouldPass ? 'passes' : 'fails'} ${expectation}`, function () {
            this.setup(config)

            return shouldPass ? this.expectValidationPasses() : this.expectValidationFails(retriesError)
          })
        })
      })

      context('firefoxGcInterval', () => {
        it('passes if a number', function () {
          this.setup({ firefoxGcInterval: 1 })

          return this.expectValidationPasses()
        })

        it('passes if null', function () {
          this.setup({ firefoxGcInterval: null })

          return this.expectValidationPasses()
        })

        it('passes if correctly shaped object', function () {
          this.setup({ firefoxGcInterval: { runMode: 1, openMode: null } })

          return this.expectValidationPasses()
        })

        it('fails if string', function () {
          this.setup({ firefoxGcInterval: 'foo' })

          return this.expectValidationFails('a positive number or null or an object')
        })

        it('fails if invalid object', function () {
          this.setup({ firefoxGcInterval: { foo: 'bar' } })

          return this.expectValidationFails('a positive number or null or an object')
        })
      })
    })
  })

  context('.getConfigKeys', () => {
    beforeEach(function () {
      this.includes = (key) => {
        expect(config.getConfigKeys()).to.include(key)
      }
    })

    it('includes blockHosts', function () {
      return this.includes('blockHosts')
    })
  })

  context('.resolveConfigValues', () => {
    beforeEach(function () {
      this.expected = function (obj) {
        const merged = config.resolveConfigValues(obj.config, obj.defaults, obj.resolved)

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

  context('.mergeDefaults', () => {
    beforeEach(function () {
      this.defaults = (prop, value, cfg = {}, options = {}) => {
        cfg.projectRoot = '/foo/bar/'

        return config.mergeDefaults(cfg, options)
        .then(R.prop(prop))
        .then((result) => {
          expect(result).to.deep.eq(value)
        })
      }
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

    it('javascripts=[]', function () {
      return this.defaults('javascripts', [])
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

    it('video=true', function () {
      return this.defaults('video', true)
    })

    it('videoCompression=32', function () {
      return this.defaults('videoCompression', 32)
    })

    it('videoUploadOnPasses=true', function () {
      return this.defaults('videoUploadOnPasses', true)
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

    it('resets numTestsKeptInMemory to 0 when runMode', () => {
      return config.mergeDefaults({ projectRoot: '/foo/bar/' }, { isTextTerminal: true })
      .then((cfg) => {
        expect(cfg.numTestsKeptInMemory).to.eq(0)
      })
    })

    it('resets watchForFileChanges to false when runMode', () => {
      return config.mergeDefaults({ projectRoot: '/foo/bar/' }, { isTextTerminal: true })
      .then((cfg) => {
        expect(cfg.watchForFileChanges).to.be.false
      })
    })

    it('can override morgan in options', () => {
      return config.mergeDefaults({ projectRoot: '/foo/bar/' }, { morgan: false })
      .then((cfg) => {
        expect(cfg.morgan).to.be.false
      })
    })

    it('can override isTextTerminal in options', () => {
      return config.mergeDefaults({ projectRoot: '/foo/bar/' }, { isTextTerminal: true })
      .then((cfg) => {
        expect(cfg.isTextTerminal).to.be.true
      })
    })

    it('can override socketId in options', () => {
      return config.mergeDefaults({ projectRoot: '/foo/bar/' }, { socketId: 1234 })
      .then((cfg) => {
        expect(cfg.socketId).to.eq(1234)
      })
    })

    it('deletes envFile', () => {
      const obj = {
        projectRoot: '/foo/bar/',
        env: {
          foo: 'bar',
          version: '0.5.2',
        },
        envFile: {
          bar: 'baz',
          version: '1.0.1',
        },
      }

      return config.mergeDefaults(obj)
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

    it('merges env into @config.env', () => {
      const obj = {
        projectRoot: '/foo/bar/',
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

      return config.mergeDefaults(obj, options)
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

    it('warns if experimentalShadowDomSupport is passed', async function () {
      const warning = sinon.spy(errors, 'warning')

      await this.defaults('experimentalShadowDomSupport', true, {
        experimentalShadowDomSupport: true,
      })

      expect(warning).to.be.calledWith('EXPERIMENTAL_SHADOW_DOM_REMOVED')
    })

    // @see https://github.com/cypress-io/cypress/pull/9185
    it('warns if experimentalNetworkStubbing is passed', async function () {
      const warning = sinon.spy(errors, 'warning')

      await this.defaults('experimentalNetworkStubbing', true, {
        experimentalNetworkStubbing: true,
      })

      expect(warning).to.be.calledWith('EXPERIMENTAL_NETWORK_STUBBING_REMOVED')
    })

    describe('.resolved', () => {
      it('sets reporter and port to cli', () => {
        const obj = {
          projectRoot: '/foo/bar',
        }

        const options = {
          reporter: 'json',
          port: 1234,
        }

        return config.mergeDefaults(obj, options)
        .then((cfg) => {
          expect(cfg.resolved).to.deep.eq({
            animationDistanceThreshold: { value: 5, from: 'default' },
            baseUrl: { value: null, from: 'default' },
            blockHosts: { value: null, from: 'default' },
            browsers: { value: [], from: 'default' },
            chromeWebSecurity: { value: true, from: 'default' },
            componentFolder: { value: 'cypress/component', from: 'default' },
            defaultCommandTimeout: { value: 4000, from: 'default' },
            env: {},
            execTimeout: { value: 60000, from: 'default' },
            experimentalComponentTesting: { value: false, from: 'default' },
            experimentalFetchPolyfill: { value: false, from: 'default' },
            experimentalSourceRewriting: { value: false, from: 'default' },
            fileServerFolder: { value: '', from: 'default' },
            firefoxGcInterval: { value: { openMode: null, runMode: 1 }, from: 'default' },
            fixturesFolder: { value: 'cypress/fixtures', from: 'default' },
            hosts: { value: null, from: 'default' },
            ignoreTestFiles: { value: '*.hot-update.js', from: 'default' },
            includeShadowDom: { value: false, from: 'default' },
            integrationFolder: { value: 'cypress/integration', from: 'default' },
            modifyObstructiveCode: { value: true, from: 'default' },
            nodeVersion: { value: 'default', from: 'default' },
            numTestsKeptInMemory: { value: 50, from: 'default' },
            pageLoadTimeout: { value: 60000, from: 'default' },
            pluginsFile: { value: 'cypress/plugins', from: 'default' },
            port: { value: 1234, from: 'cli' },
            projectId: { value: null, from: 'default' },
            reporter: { value: 'json', from: 'cli' },
            reporterOptions: { value: null, from: 'default' },
            requestTimeout: { value: 5000, from: 'default' },
            responseTimeout: { value: 30000, from: 'default' },
            retries: { value: { runMode: 0, openMode: 0 }, from: 'default' },
            screenshotOnRunFailure: { value: true, from: 'default' },
            screenshotsFolder: { value: 'cypress/screenshots', from: 'default' },
            supportFile: { value: 'cypress/support', from: 'default' },
            taskTimeout: { value: 60000, from: 'default' },
            testFiles: { value: '**/*.*', from: 'default' },
            trashAssetsBeforeRuns: { value: true, from: 'default' },
            userAgent: { value: null, from: 'default' },
            video: { value: true, from: 'default' },
            videoCompression: { value: 32, from: 'default' },
            videosFolder: { value: 'cypress/videos', from: 'default' },
            videoUploadOnPasses: { value: true, from: 'default' },
            viewportHeight: { value: 660, from: 'default' },
            viewportWidth: { value: 1000, from: 'default' },
            waitForAnimations: { value: true, from: 'default' },
            scrollBehavior: { value: 'top', from: 'default' },
            watchForFileChanges: { value: true, from: 'default' },
          })
        })
      })

      it('sets config, envFile and env', () => {
        sinon.stub(config, 'getProcessEnvVars').returns({
          quux: 'quux',
          RECORD_KEY: 'foobarbazquux',
          PROJECT_ID: 'projectId123',
        })

        const obj = {
          projectRoot: '/foo/bar',
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

        return config.mergeDefaults(obj, options)
        .then((cfg) => {
          expect(cfg.resolved).to.deep.eq({
            animationDistanceThreshold: { value: 5, from: 'default' },
            baseUrl: { value: 'http://localhost:8080', from: 'config' },
            blockHosts: { value: null, from: 'default' },
            browsers: { value: [], from: 'default' },
            chromeWebSecurity: { value: true, from: 'default' },
            componentFolder: { value: 'cypress/component', from: 'default' },
            defaultCommandTimeout: { value: 4000, from: 'default' },
            execTimeout: { value: 60000, from: 'default' },
            experimentalComponentTesting: { value: false, from: 'default' },
            experimentalFetchPolyfill: { value: false, from: 'default' },
            experimentalSourceRewriting: { value: false, from: 'default' },
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
            firefoxGcInterval: { value: { openMode: null, runMode: 1 }, from: 'default' },
            fixturesFolder: { value: 'cypress/fixtures', from: 'default' },
            hosts: { value: null, from: 'default' },
            ignoreTestFiles: { value: '*.hot-update.js', from: 'default' },
            includeShadowDom: { value: false, from: 'default' },
            integrationFolder: { value: 'cypress/integration', from: 'default' },
            modifyObstructiveCode: { value: true, from: 'default' },
            nodeVersion: { value: 'default', from: 'default' },
            numTestsKeptInMemory: { value: 50, from: 'default' },
            pageLoadTimeout: { value: 60000, from: 'default' },
            pluginsFile: { value: 'cypress/plugins', from: 'default' },
            port: { value: 2020, from: 'config' },
            projectId: { value: 'projectId123', from: 'env' },
            reporter: { value: 'spec', from: 'default' },
            reporterOptions: { value: null, from: 'default' },
            requestTimeout: { value: 5000, from: 'default' },
            responseTimeout: { value: 30000, from: 'default' },
            retries: { value: { runMode: 0, openMode: 0 }, from: 'default' },
            screenshotOnRunFailure: { value: true, from: 'default' },
            screenshotsFolder: { value: 'cypress/screenshots', from: 'default' },
            supportFile: { value: 'cypress/support', from: 'default' },
            taskTimeout: { value: 60000, from: 'default' },
            testFiles: { value: '**/*.*', from: 'default' },
            trashAssetsBeforeRuns: { value: true, from: 'default' },
            userAgent: { value: null, from: 'default' },
            video: { value: true, from: 'default' },
            videoCompression: { value: 32, from: 'default' },
            videosFolder: { value: 'cypress/videos', from: 'default' },
            videoUploadOnPasses: { value: true, from: 'default' },
            viewportHeight: { value: 660, from: 'default' },
            viewportWidth: { value: 1000, from: 'default' },
            waitForAnimations: { value: true, from: 'default' },
            scrollBehavior: { value: 'top', from: 'default' },
            watchForFileChanges: { value: true, from: 'default' },
          })
        })
      })
    })
  })

  context('.setPluginResolvedOn', () => {
    it('resolves an object with single property', () => {
      const cfg = {}
      const obj = {
        foo: 'bar',
      }

      config.setPluginResolvedOn(cfg, obj)

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

      config.setPluginResolvedOn(cfg, obj)

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

      config.setPluginResolvedOn(cfg, obj)

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

      config.setPluginResolvedOn(cfg, obj)

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

  context('.updateWithPluginValues', () => {
    it('is noop when no overrides', () => {
      expect(config.updateWithPluginValues({ foo: 'bar' }, null)).to.deep.eq({
        foo: 'bar',
      })
    })

    it('is noop with empty overrides', () => {
      expect(config.updateWithPluginValues({ foo: 'bar' }, {})).to.deep.eq({
        foo: 'bar',
      })
    })

    it('updates resolved config values and returns config with overrides', () => {
      const cfg = {
        foo: 'bar',
        baz: 'quux',
        quux: 'foo',
        lol: 1234,
        env: {
          a: 'a',
          b: 'b',
        },
        // previously resolved values
        resolved: {
          foo: { value: 'bar', from: 'default' },
          baz: { value: 'quux', from: 'cli' },
          quux: { value: 'foo', from: 'default' },
          lol: { value: 1234, from: 'env' },
          env: {
            a: { value: 'a', from: 'config' },
            b: { value: 'b', from: 'config' },
          },
        },
      }

      const overrides = {
        baz: 'baz',
        quux: ['bar', 'quux'],
        env: {
          b: 'bb',
          c: 'c',
        },
      }

      expect(config.updateWithPluginValues(cfg, overrides)).to.deep.eq({
        foo: 'bar',
        baz: 'baz',
        lol: 1234,
        quux: ['bar', 'quux'],
        env: {
          a: 'a',
          b: 'bb',
          c: 'c',
        },
        resolved: {
          foo: { value: 'bar', from: 'default' },
          baz: { value: 'baz', from: 'plugin' },
          quux: { value: ['bar', 'quux'], from: 'plugin' },
          lol: { value: 1234, from: 'env' },
          env: {
            a: { value: 'a', from: 'config' },
            b: { value: 'bb', from: 'plugin' },
            c: { value: 'c', from: 'plugin' },
          },
        },
      })
    })

    it('keeps the list of browsers if the plugins returns empty object', () => {
      const browser = {
        name: 'fake browser name',
        family: 'chromium',
        displayName: 'My browser',
        version: 'x.y.z',
        path: '/path/to/browser',
        majorVersion: 'x',
      }

      const cfg = {
        browsers: [browser],
        resolved: {
          browsers: {
            value: [browser],
            from: 'default',
          },
        },
      }

      const overrides = {}

      expect(config.updateWithPluginValues(cfg, overrides)).to.deep.eq({
        browsers: [browser],
        resolved: {
          browsers: {
            value: [browser],
            from: 'default',
          },
        },
      })
    })

    it('catches browsers=null returned from plugins', () => {
      const browser = {
        name: 'fake browser name',
        family: 'chromium',
        displayName: 'My browser',
        version: 'x.y.z',
        path: '/path/to/browser',
        majorVersion: 'x',
      }

      const cfg = {
        browsers: [browser],
        resolved: {
          browsers: {
            value: [browser],
            from: 'default',
          },
        },
      }

      const overrides = {
        browsers: null,
      }

      sinon.stub(errors, 'throw')
      config.updateWithPluginValues(cfg, overrides)

      expect(errors.throw).to.have.been.calledWith('CONFIG_VALIDATION_ERROR')
    })

    it('allows user to filter browsers', () => {
      const browserOne = {
        name: 'fake browser name',
        family: 'chromium',
        displayName: 'My browser',
        version: 'x.y.z',
        path: '/path/to/browser',
        majorVersion: 'x',
      }
      const browserTwo = {
        name: 'fake electron',
        family: 'chromium',
        displayName: 'Electron',
        version: 'x.y.z',
        // Electron browser is built-in, no external path
        path: '',
        majorVersion: 'x',
      }

      const cfg = {
        browsers: [browserOne, browserTwo],
        resolved: {
          browsers: {
            value: [browserOne, browserTwo],
            from: 'default',
          },
        },
      }

      const overrides = {
        browsers: [browserTwo],
      }

      const updated = config.updateWithPluginValues(cfg, overrides)

      expect(updated.resolved, 'resolved values').to.deep.eq({
        browsers: {
          value: [browserTwo],
          from: 'plugin',
        },
      })

      expect(updated, 'all values').to.deep.eq({
        browsers: [browserTwo],
        resolved: {
          browsers: {
            value: [browserTwo],
            from: 'plugin',
          },
        },
      })
    })
  })

  context('.parseEnv', () => {
    it('merges together env from config, env from file, env from process, and env from CLI', () => {
      sinon.stub(config, 'getProcessEnvVars').returns({
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

      expect(config.parseEnv(obj, envCLI)).to.deep.eq({
        version: '0.14.0',
        project: 'pie',
        host: 'http://localhost:8888',
        user: 'bob',
        foo: 'bar',
        baz: 'quux',
      })
    })
  })

  context('.getProcessEnvVars', () => {
    ['cypress_', 'CYPRESS_'].forEach((key) => {
      it(`reduces key: ${key}`, () => {
        const obj = {
          cypress_host: 'http://localhost:8888',
          foo: 'bar',
          env: '123',
        }

        obj[`${key}version`] = '0.12.0'

        expect(config.getProcessEnvVars(obj)).to.deep.eq({
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
      }

      expect(config.getProcessEnvVars(obj)).to.deep.eq({
        FOO: 'bar',
        PROJECT_ID: 'abc123',
        CRASH_REPORTS: 0,
      })
    })
  })

  context('.setUrls', () => {
    it('does not mutate existing obj', () => {
      const obj = {}

      expect(config.setUrls(obj)).not.to.eq(obj)
    })

    it('uses baseUrl when set', () => {
      const obj = {
        port: 65432,
        baseUrl: 'https://www.google.com',
        clientRoute: '/__/',
      }

      const urls = config.setUrls(obj)

      expect(urls.browserUrl).to.eq('https://www.google.com/__/')

      expect(urls.proxyUrl).to.eq('http://localhost:65432')
    })

    it('strips baseUrl to host when set', () => {
      const obj = {
        port: 65432,
        baseUrl: 'http://localhost:9999/app/?foo=bar#index.html',
        clientRoute: '/__/',
      }

      const urls = config.setUrls(obj)

      expect(urls.browserUrl).to.eq('http://localhost:9999/__/')

      expect(urls.proxyUrl).to.eq('http://localhost:65432')
    })
  })

  context('.setScaffoldPaths', () => {
    it('sets integrationExamplePath + integrationExampleName + scaffoldedFiles', () => {
      const obj = {
        integrationFolder: '/_test-output/path/to/project/cypress/integration',
      }

      sinon.stub(scaffold, 'fileTree').resolves([])

      return config.setScaffoldPaths(obj).then((result) => {
        expect(result).to.deep.eq({
          integrationFolder: '/_test-output/path/to/project/cypress/integration',
          integrationExamplePath: '/_test-output/path/to/project/cypress/integration/examples',
          integrationExampleName: 'examples',
          scaffoldedFiles: [],
        })
      })
    })
  })

  context('.setSupportFileAndFolder', () => {
    it('does nothing if supportFile is falsey', () => {
      const obj = {
        projectRoot: '/_test-output/path/to/project',
      }

      return config.setSupportFileAndFolder(obj)
      .then((result) => {
        expect(result).to.eql(obj)
      })
    })

    it('sets the full path to the supportFile and supportFolder if it exists', () => {
      const projectRoot = process.cwd()

      const obj = config.setAbsolutePaths({
        projectRoot,
        supportFile: 'test/unit/config_spec.js',
      })

      return config.setSupportFileAndFolder(obj)
      .then((result) => {
        expect(result).to.eql({
          projectRoot,
          supportFile: `${projectRoot}/test/unit/config_spec.js`,
          supportFolder: `${projectRoot}/test/unit`,
        })
      })
    })

    it('sets the supportFile to default index.js if it does not exist, support folder does not exist, and supportFile is the default', () => {
      const projectRoot = path.join(process.cwd(), 'test/support/fixtures/projects/no-scaffolding')

      const obj = config.setAbsolutePaths({
        projectRoot,
        supportFile: 'cypress/support',
      })

      return config.setSupportFileAndFolder(obj)
      .then((result) => {
        expect(result).to.eql({
          projectRoot,
          supportFile: `${projectRoot}/cypress/support/index.js`,
          supportFolder: `${projectRoot}/cypress/support`,
        })
      })
    })

    it('sets the supportFile to false if it does not exist, support folder exists, and supportFile is the default', () => {
      const projectRoot = path.join(process.cwd(), 'test/support/fixtures/projects/empty-folders')

      const obj = config.setAbsolutePaths({
        projectRoot,
        supportFile: 'cypress/support',
      })

      return config.setSupportFileAndFolder(obj)
      .then((result) => {
        expect(result).to.eql({
          projectRoot,
          supportFile: false,
        })
      })
    })

    it('throws error if supportFile is not default and does not exist', () => {
      const projectRoot = process.cwd()

      const obj = config.setAbsolutePaths({
        projectRoot,
        supportFile: 'does/not/exist',
      })

      return config.setSupportFileAndFolder(obj)
      .catch((err) => {
        expect(err.message).to.include('The support file is missing or invalid.')
      })
    })

    it('sets the supportFile to index.ts if it exists (without ts require hook)', () => {
      const projectRoot = path.join(process.cwd(), 'test/support/fixtures/projects/ts-proj')
      const supportFolder = `${projectRoot}/cypress/support`
      const supportFilename = `${supportFolder}/index.ts`

      const e = new Error('Cannot resolve TS file by default')

      e.code = 'MODULE_NOT_FOUND'
      sinon.stub(config.utils, 'resolveModule').withArgs(supportFolder).throws(e)

      const obj = config.setAbsolutePaths({
        projectRoot,
        supportFile: 'cypress/support',
      })

      return config.setSupportFileAndFolder(obj)
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
      const projectRoot = path.join(process.cwd(), 'test/support/fixtures/projects/ts-proj-custom-names')
      const supportFolder = `${projectRoot}/cypress`
      const supportFilename = `${supportFolder}/support.ts`

      const e = new Error('Cannot resolve TS file by default')

      e.code = 'MODULE_NOT_FOUND'
      sinon.stub(config.utils, 'resolveModule').withArgs(supportFilename).throws(e)

      const obj = config.setAbsolutePaths({
        projectRoot,
        supportFile: 'cypress/support.ts',
      })

      return config.setSupportFileAndFolder(obj)
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

  context('.setPluginsFile', () => {
    it('does nothing if pluginsFile is falsey', () => {
      const obj = {
        projectRoot: '/_test-output/path/to/project',
      }

      return config.setPluginsFile(obj)
      .then((result) => {
        expect(result).to.eql(obj)
      })
    })

    it('sets the pluginsFile to default index.js if does not exist', () => {
      const projectRoot = path.join(process.cwd(), 'test/support/fixtures/projects/no-scaffolding')

      const obj = {
        projectRoot,
        pluginsFile: `${projectRoot}/cypress/plugins`,
      }

      return config.setPluginsFile(obj)
      .then((result) => {
        expect(result).to.eql({
          projectRoot,
          pluginsFile: `${projectRoot}/cypress/plugins/index.js`,
        })
      })
    })

    it('sets the pluginsFile to index.ts if it exists', () => {
      const projectRoot = path.join(process.cwd(), 'test/support/fixtures/projects/ts-proj-with-module-esnext')

      const obj = {
        projectRoot,
        pluginsFile: `${projectRoot}/cypress/plugins`,
      }

      return config.setPluginsFile(obj)
      .then((result) => {
        expect(result).to.eql({
          projectRoot,
          pluginsFile: `${projectRoot}/cypress/plugins/index.ts`,
        })
      })
    })

    it('sets the pluginsFile to index.ts if it exists (without ts require hook)', () => {
      const projectRoot = path.join(process.cwd(), 'test/support/fixtures/projects/ts-proj-with-module-esnext')
      const pluginsFolder = `${projectRoot}/cypress/plugins`
      const pluginsFilename = `${pluginsFolder}/index.ts`

      const e = new Error('Cannot resolve TS file by default')

      e.code = 'MODULE_NOT_FOUND'
      sinon.stub(config.utils, 'resolveModule').withArgs(pluginsFolder).throws(e)

      const obj = {
        projectRoot,
        pluginsFile: pluginsFolder,
      }

      return config.setPluginsFile(obj)
      .then((result) => {
        expect(result).to.eql({
          projectRoot,
          pluginsFile: pluginsFilename,
        })
      })
    })

    it('set the pluginsFile to false if it does not exist, plugins folder exists, and pluginsFile is the default', () => {
      const projectRoot = path.join(process.cwd(), 'test/support/fixtures/projects/empty-folders')

      const obj = config.setAbsolutePaths({
        projectRoot,
        pluginsFile: `${projectRoot}/cypress/plugins`,
      })

      return config.setPluginsFile(obj)
      .then((result) => {
        expect(result).to.eql({
          projectRoot,
          pluginsFile: false,
        })
      })
    })

    it('throws error if pluginsFile is not default and does not exist', () => {
      const projectRoot = process.cwd()

      const obj = {
        projectRoot,
        pluginsFile: 'does/not/exist',
      }

      return config.setPluginsFile(obj)
      .catch((err) => {
        expect(err.message).to.include('The plugins file is missing or invalid.')
      })
    })

    it('uses custom TS pluginsFile if it exists (without ts require hook)', () => {
      const projectRoot = path.join(process.cwd(), 'test/support/fixtures/projects/ts-proj-custom-names')
      const pluginsFolder = `${projectRoot}/cypress`
      const pluginsFile = `${pluginsFolder}/plugins.ts`

      const e = new Error('Cannot resolve TS file by default')

      e.code = 'MODULE_NOT_FOUND'
      sinon.stub(config.utils, 'resolveModule').withArgs(pluginsFile).throws(e)

      const obj = {
        projectRoot,
        pluginsFile,
      }

      return config.setPluginsFile(obj)
      .then((result) => {
        expect(result).to.eql({
          projectRoot,
          pluginsFile,
        })
      })
    })
  })

  context('.setParentTestsPaths', () => {
    it('sets parentTestsFolder and parentTestsFolderDisplay', () => {
      const obj = {
        projectRoot: '/_test-output/path/to/project',
        integrationFolder: '/_test-output/path/to/project/cypress/integration',
      }

      expect(config.setParentTestsPaths(obj)).to.deep.eq({
        projectRoot: '/_test-output/path/to/project',
        integrationFolder: '/_test-output/path/to/project/cypress/integration',
        parentTestsFolder: '/_test-output/path/to/project/cypress',
        parentTestsFolderDisplay: 'project/cypress',
      })
    })

    it('sets parentTestsFolderDisplay to parentTestsFolder if they are the same', () => {
      const obj = {
        projectRoot: '/_test-output/path/to/project',
        integrationFolder: '/_test-output/path/to/project/tests',
      }

      expect(config.setParentTestsPaths(obj)).to.deep.eq({
        projectRoot: '/_test-output/path/to/project',
        integrationFolder: '/_test-output/path/to/project/tests',
        parentTestsFolder: '/_test-output/path/to/project',
        parentTestsFolderDisplay: 'project',
      })
    })
  })

  context('.setAbsolutePaths', () => {
    it('is noop without projectRoot', () => {
      expect(config.setAbsolutePaths({})).to.deep.eq({})
    })

    // it "resolves fileServerFolder with projectRoot", ->
    //   obj = {
    //     projectRoot: "/_test-output/path/to/project"
    //     fileServerFolder: "foo"
    //   }

    //   expect(config.setAbsolutePaths(obj)).to.deep.eq({
    //     projectRoot: "/_test-output/path/to/project"
    //     fileServerFolder: "/_test-output/path/to/project/foo"
    //   })

    it('does not mutate existing obj', () => {
      const obj = {}

      expect(config.setAbsolutePaths(obj)).not.to.eq(obj)
    })

    it('ignores non special *folder properties', () => {
      const obj = {
        projectRoot: '/_test-output/path/to/project',
        blehFolder: 'some/rando/path',
        foo: 'bar',
        baz: 'quux',
      }

      expect(config.setAbsolutePaths(obj)).to.deep.eq(obj)
    })

    return ['fileServerFolder', 'fixturesFolder', 'integrationFolder', 'unitFolder', 'supportFile', 'pluginsFile'].forEach((folder) => {
      it(`converts relative ${folder} to absolute path`, () => {
        const obj = {
          projectRoot: '/_test-output/path/to/project',
        }

        obj[folder] = 'foo/bar'

        const expected = {
          projectRoot: '/_test-output/path/to/project',
        }

        expected[folder] = '/_test-output/path/to/project/foo/bar'

        expect(config.setAbsolutePaths(obj)).to.deep.eq(expected)
      })
    })
  })

  context('.setNodeBinary', () => {
    beforeEach(function () {
      this.findSystemNode = sinon.stub(findSystemNode, 'findNodePathAndVersion')
      this.nodeVersion = process.versions.node
    })

    it('sets current Node ver if nodeVersion != system', function () {
      return config.setNodeBinary({
        nodeVersion: undefined,
      })
      .then((obj) => {
        expect(this.findSystemNode).to.not.be.called

        expect(obj).to.deep.eq({
          nodeVersion: undefined,
          resolvedNodeVersion: this.nodeVersion,
        })
      })
    })

    it('sets found Node ver if nodeVersion = system and findNodePathAndVersion resolves', function () {
      this.findSystemNode.resolves({
        path: '/foo/bar/node',
        version: '1.2.3',
      })

      return config.setNodeBinary({
        nodeVersion: 'system',
      })
      .then((obj) => {
        expect(this.findSystemNode).to.be.calledOnce

        expect(obj).to.deep.eq({
          nodeVersion: 'system',
          resolvedNodeVersion: '1.2.3',
          resolvedNodePath: '/foo/bar/node',
        })
      })
    })

    it('sets current Node ver and warns if nodeVersion = system and findNodePathAndVersion rejects', function () {
      const err = new Error()
      const onWarning = sinon.stub()

      this.findSystemNode.rejects(err)

      return config.setNodeBinary({
        nodeVersion: 'system',
      }, onWarning)
      .then((obj) => {
        expect(this.findSystemNode).to.be.calledOnce
        expect(onWarning).to.be.calledOnce
        expect(obj).to.deep.eq({
          nodeVersion: 'system',
          resolvedNodeVersion: this.nodeVersion,
        })

        expect(obj.resolvedNodePath).to.be.undefined
      })
    })
  })
})

describe('lib/util/config', () => {
  context('.isDefault', () => {
    it('returns true if value is default value', () => {
      settings = { baseUrl: null }
      const defaults = { baseUrl: null }
      const resolved = {}
      const merged = config.setResolvedConfigValues(settings, defaults, resolved)

      expect(configUtil.isDefault(merged, 'baseUrl')).to.be.true
    })

    it('returns false if value is not default value', () => {
      settings = { baseUrl: null }
      const defaults = { baseUrl: 'http://localhost:8080' }
      const resolved = {}
      const merged = config.setResolvedConfigValues(settings, defaults, resolved)

      expect(configUtil.isDefault(merged, 'baseUrl')).to.be.false
    })
  })
})
