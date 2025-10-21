require('../../spec_helper')
import 'chai-as-promised'
import { expect } from 'chai'
import sinon from 'sinon'
import utils from '../../../lib/browsers/utils'
import * as plugins from '../../../lib/plugins'
import * as errors from '../../../lib/errors'

describe('lib/browsers/utils', () => {
  let browser: any
  let launchOptions: any
  let options: any
  let pluginsHasStub: sinon.SinonStub
  let pluginsExecuteStub: sinon.SinonStub
  let errorsThrowErrStub: sinon.SinonStub

  beforeEach(() => {
    browser = {
      name: 'chrome',
      channel: 'stable',
      version: '120.0.0',
      isHeadless: false,
    }

    launchOptions = {
      preferences: {},
      extensions: [],
      args: [],
      env: {},
    }

    options = {}

    pluginsHasStub = sinon.stub(plugins, 'has')
    pluginsExecuteStub = sinon.stub(plugins, 'execute')
    errorsThrowErrStub = sinon.stub(errors, 'throwErr')
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('executeBeforeBrowserLaunch', () => {
    context('when before:browser:launch hook is not registered', () => {
      it('should not execute the hook and return launchOptions unchanged', async () => {
        pluginsHasStub.withArgs('before:browser:launch').returns(false)

        const result = await utils.executeBeforeBrowserLaunch(browser, launchOptions, options)

        expect(result).to.equal(launchOptions)
        expect(pluginsExecuteStub).not.to.be.called
        expect(errorsThrowErrStub).not.to.be.called
      })
    })

    context('when before:browser:launch hook is registered', () => {
      beforeEach(() => {
        pluginsHasStub.withArgs('before:browser:launch').returns(true)
      })

      context('successful execution', () => {
        it('should execute successfully when plugin returns null', async () => {
          pluginsExecuteStub.withArgs('before:browser:launch', browser, launchOptions).resolves(null)

          const result = await utils.executeBeforeBrowserLaunch(browser, launchOptions, options)

          expect(result).to.equal(launchOptions)
          expect(errorsThrowErrStub).not.to.be.called
        })

        it('should execute successfully when plugin returns undefined', async () => {
          pluginsExecuteStub.withArgs('before:browser:launch', browser, launchOptions).resolves(undefined)

          const result = await utils.executeBeforeBrowserLaunch(browser, launchOptions, options)

          expect(result).to.equal(launchOptions)
          expect(errorsThrowErrStub).not.to.be.called
        })

        it('should execute successfully when plugin returns valid launch options', async () => {
          const pluginResult = {
            preferences: { 'test-preference': 'value' },
            args: ['--test-arg'],
            extensions: ['/path/to/extension'],
            env: { TEST_ENV: 'value' },
          }

          pluginsExecuteStub.withArgs('before:browser:launch', browser, launchOptions).resolves(pluginResult)

          const result = await utils.executeBeforeBrowserLaunch(browser, launchOptions, options)

          expect(result).to.equal(launchOptions)
          expect(errorsThrowErrStub).not.to.be.called
        })
      })

      context('error handling', () => {
        it('should handle plugin errors', async () => {
          const testError = new Error('Something went wrong in the plugin')

          testError.stack = 'Error: Something went wrong in the plugin\n    at Object.<anonymous> (/path/to/plugins.js:5:10)'

          pluginsExecuteStub.withArgs('before:browser:launch', browser, launchOptions).rejects(testError)

          await utils.executeBeforeBrowserLaunch(browser, launchOptions, options)

          expect(errorsThrowErrStub).to.be.calledWith('PLUGINS_RUN_EVENT_ERROR', 'before:browser:launch', testError)
        })
      })

      context('launch options validation', () => {
        it('should handle unexpected properties in plugin result', async () => {
          const pluginResult = {
            preferences: { 'test-preference': 'value' },
            invalidProperty: 'should-not-be-here',
            anotherInvalidProperty: 'also-invalid',
          }

          pluginsExecuteStub.withArgs('before:browser:launch', browser, launchOptions).resolves(pluginResult)

          await utils.executeBeforeBrowserLaunch(browser, launchOptions, options)

          expect(errorsThrowErrStub).to.be.calledWith(
            'UNEXPECTED_BEFORE_BROWSER_LAUNCH_PROPERTIES',
            ['invalidProperty', 'anotherInvalidProperty'],
            ['preferences', 'extensions', 'args', 'env'],
          )
        })

        it('should handle mixed valid and invalid properties', async () => {
          const pluginResult = {
            preferences: { 'test-preference': 'value' },
            args: ['--test-arg'],
            invalidProperty: 'should-not-be-here',
          }

          pluginsExecuteStub.withArgs('before:browser:launch', browser, launchOptions).resolves(pluginResult)

          await utils.executeBeforeBrowserLaunch(browser, launchOptions, options)

          expect(errorsThrowErrStub).to.be.calledWith(
            'UNEXPECTED_BEFORE_BROWSER_LAUNCH_PROPERTIES',
            ['invalidProperty'],
            ['preferences', 'extensions', 'args', 'env'],
          )
        })
      })
    })
  })

  describe('extendLaunchOptionsFromPlugins', () => {
    let pluginConfigResult: any

    beforeEach(() => {
      pluginConfigResult = {
        preferences: { 'test-preference': 'value' },
        args: ['--test-arg'],
        extensions: ['/path/to/extension'],
        env: { TEST_ENV: 'value' },
      }
    })

    context('successful extension', () => {
      it('should extend launch options with plugin result', () => {
        const result = utils.extendLaunchOptionsFromPlugins(launchOptions, pluginConfigResult, options)

        expect(result).to.equal(launchOptions)
        expect(launchOptions.preferences).to.deep.equal({ 'test-preference': 'value' })
        expect(launchOptions.args).to.deep.equal(['--test-arg'])
        expect(launchOptions.extensions).to.deep.equal(['/path/to/extension'])
        expect(launchOptions.env).to.deep.equal({ TEST_ENV: 'value' })
      })

      it('should merge object properties correctly', () => {
        launchOptions.preferences = { existing: 'value' }
        pluginConfigResult.preferences = { new: 'value' }

        utils.extendLaunchOptionsFromPlugins(launchOptions, pluginConfigResult, options)

        expect(launchOptions.preferences).to.deep.equal({
          existing: 'value',
          new: 'value',
        })
      })

      it('should replace non-object properties', () => {
        launchOptions.args = ['existing-arg']
        pluginConfigResult.args = ['new-arg']

        utils.extendLaunchOptionsFromPlugins(launchOptions, pluginConfigResult, options)

        expect(launchOptions.args).to.deep.equal(['new-arg'])
      })
    })

    context('error handling', () => {
      it('should handle unexpected properties', () => {
        pluginConfigResult.invalidProperty = 'value'

        utils.extendLaunchOptionsFromPlugins(launchOptions, pluginConfigResult, options)

        expect(errorsThrowErrStub).to.be.calledWith(
          'UNEXPECTED_BEFORE_BROWSER_LAUNCH_PROPERTIES',
          ['invalidProperty'],
          ['preferences', 'extensions', 'args', 'env'],
        )
      })

      it('should handle multiple unexpected properties', () => {
        pluginConfigResult.invalidProperty1 = 'value1'
        pluginConfigResult.invalidProperty2 = 'value2'

        utils.extendLaunchOptionsFromPlugins(launchOptions, pluginConfigResult, options)

        expect(errorsThrowErrStub).to.be.calledWith(
          'UNEXPECTED_BEFORE_BROWSER_LAUNCH_PROPERTIES',
          ['invalidProperty1', 'invalidProperty2'],
          ['preferences', 'extensions', 'args', 'env'],
        )
      })
    })
  })

  describe('integration scenarios', () => {
    beforeEach(() => {
      pluginsHasStub.withArgs('before:browser:launch').returns(true)
    })

    it('should handle plugin errors', async () => {
      const testError = new TypeError('Cannot read property "a" of undefined')

      testError.stack = 'TypeError: Cannot read property "a" of undefined\n    at Object.<anonymous> (/path/to/plugins.js:2:15)'

      pluginsExecuteStub.withArgs('before:browser:launch', browser, launchOptions).rejects(testError)

      await utils.executeBeforeBrowserLaunch(browser, launchOptions, options)

      expect(errorsThrowErrStub).to.be.calledWith('PLUGINS_RUN_EVENT_ERROR', 'before:browser:launch', testError)
    })

    it('should handle complex plugin scenarios with mixed success and failure', async () => {
      // First call succeeds
      pluginsExecuteStub.withArgs('before:browser:launch', browser, launchOptions).resolves({
        preferences: { 'test-preference': 'value' },
      })

      let result = await utils.executeBeforeBrowserLaunch(browser, launchOptions, options)

      expect(result).to.equal(launchOptions)
      expect(errorsThrowErrStub).not.to.be.called

      // Reset for second call
      errorsThrowErrStub.resetHistory()

      // Second call fails
      const testError = new Error('Plugin failed on second call')

      pluginsExecuteStub.withArgs('before:browser:launch', browser, launchOptions).rejects(testError)

      await utils.executeBeforeBrowserLaunch(browser, launchOptions, options)

      expect(errorsThrowErrStub).to.be.calledWith('PLUGINS_RUN_EVENT_ERROR', 'before:browser:launch', testError)
    })
  })
})
