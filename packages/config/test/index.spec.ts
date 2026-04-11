import { vi, describe, it, expect } from 'vitest'
import path from 'path'
import * as configUtil from '../src/index'

describe('config/src/index', () => {
  describe('.allowed', () => {
    it('returns filter config only containing allowed keys', () => {
      const keys = configUtil.allowed({
        'baseUrl': 'https://url.com',
        'videoUploadOnPasses': true,
        'devServerPublicPathRoute': 'internal key',
        'random': 'not a config option',
      })

      expect(keys).toEqual({
        'baseUrl': 'https://url.com',
        'videoUploadOnPasses': true,
      })
    })
  })

  describe('.getBreakingKeys', () => {
    it('returns list of breaking config keys', () => {
      const breakingKeys = configUtil.getBreakingKeys()

      expect(breakingKeys).to.include('videoUploadOnPasses')
      expect(breakingKeys).toMatchSnapshot()
    })
  })

  describe('.getDefaultValues', () => {
    it('returns list of public config keys', () => {
      const defaultValues = configUtil.getDefaultValues()

      expect(defaultValues).toEqual(expect.objectContaining({
        defaultCommandTimeout: 4000,
        scrollBehavior: 'top',
        watchForFileChanges: true,
      }))

      expect(defaultValues.env).toEqual({})
      const cypressBinaryRoot = defaultValues.cypressBinaryRoot.split(path.sep).pop()

      expect(cypressBinaryRoot).toEqual('cypress')
      defaultValues.cypressBinaryRoot = `/root/cypress`

      // remove these since they are different depending on your machine
      ;['platform', 'arch', 'version'].forEach((x) => {
        expect(defaultValues[x]).to.exist
        delete defaultValues[x]
      })

      expect(defaultValues).toMatchSnapshot()
    })

    it('returns list of public config keys for selected testing type', () => {
      const defaultValues = configUtil.getDefaultValues({ testingType: 'e2e' })

      expect(defaultValues).toEqual(expect.objectContaining({
        defaultCommandTimeout: 4000,
        scrollBehavior: 'top',
        watchForFileChanges: true,
      }))

      expect(defaultValues.env).toEqual({})
      const cypressBinaryRoot = defaultValues.cypressBinaryRoot.split(path.sep).pop()

      expect(cypressBinaryRoot).toEqual('cypress')
      defaultValues.cypressBinaryRoot = `/root/cypress`

      // remove these since they are different depending on your machine
      ;['platform', 'arch', 'version'].forEach((x) => {
        expect(defaultValues[x]).to.exist
        delete defaultValues[x]
      })

      expect(defaultValues).toMatchSnapshot()
    })
  })

  describe('.getPublicConfigKeys', () => {
    it('returns list of public config keys', () => {
      const publicConfigKeys = configUtil.getPublicConfigKeys()

      expect(publicConfigKeys).toContain('blockHosts')
      expect(publicConfigKeys).not.toContain('devServerPublicPathRoute')
      expect(publicConfigKeys).toMatchSnapshot()
    })
  })

  describe('.getCloudRecordingConfigKeys', () => {
    it('includes every public config key plus component recording extras', () => {
      const cloudKeys = configUtil.getCloudRecordingConfigKeys()
      const publicKeys = configUtil.getPublicConfigKeys()

      for (const key of publicKeys) {
        expect(cloudKeys).toContain(key)
      }

      expect(cloudKeys).toContain('devServer')
      expect(cloudKeys).toContain('devServerConfig')
      expect(cloudKeys).toContain('indexHtmlFile')
    })

    it('returns the same array instance on each call', () => {
      expect(configUtil.getCloudRecordingConfigKeys()).toBe(configUtil.getCloudRecordingConfigKeys())
    })
  })

  describe('.matchesConfigKey', () => {
    it('returns normalized key when config key has a default value', () => {
      let normalizedKey = configUtil.matchesConfigKey('EXEC_TIMEOUT')

      expect(normalizedKey).toEqual('execTimeout')

      normalizedKey = configUtil.matchesConfigKey('Base-url')
      expect(normalizedKey).toEqual('baseUrl')
    })

    it('returns nothing when config key does not has a default value', () => {
      let normalizedKey = configUtil.matchesConfigKey('random')

      expect(normalizedKey).toBeUndefined()
    })
  })

  describe('.validate', () => {
    it('validates config', () => {
      const errorFn = vi.fn()
      const config = {
        e2e: {
          testIsolation: false,
          'baseUrl': 'https://',
          viewportHeight: 200,
        },
        component: {
          indexHtmlFile: 'index.html',
        },
      }

      configUtil.validate(config, errorFn, null)
      expect(errorFn).toHaveBeenCalledTimes(0)

      configUtil.validate(config, errorFn, 'e2e')
      expect(errorFn).toHaveBeenCalledTimes(0)

      configUtil.validate(config, errorFn, 'component')
      expect(errorFn).toHaveBeenCalledTimes(0)
    })

    it('calls error callback if config is invalid', () => {
      const errorFn = vi.fn()

      configUtil.validate({
        'baseUrl': ' ',
      }, errorFn, 'e2e')

      expect(errorFn).toHaveBeenCalledWith(expect.objectContaining({ key: 'baseUrl' }))
      expect(errorFn).toHaveBeenCalledWith(expect.objectContaining({ type: 'a fully qualified URL (starting with `http://` or `https://`)' }))
    })
  })

  describe('.validateNoBreakingConfig', () => {
    it('calls warning callback if config contains breaking option that warns', () => {
      const warningFn = vi.fn()
      const errorFn = vi.fn()

      configUtil.validateNoBreakingConfig({
        'experimentalSessionAndOrigin': 'should break',
        configFile: 'config.js',
      }, warningFn, errorFn, 'e2e')

      expect(warningFn).toHaveBeenCalledExactlyOnceWith('EXPERIMENTAL_SESSION_AND_ORIGIN_REMOVED', {
        name: 'experimentalSessionAndOrigin',
        newName: undefined,
        value: undefined,
        testingType: 'e2e',
        configFile: 'config.js',
      })

      expect(errorFn).toHaveBeenCalledTimes(0)
    })

    it('calls warning callback if config contains experimentalPromptCommand', () => {
      const warningFn = vi.fn()
      const errorFn = vi.fn()

      configUtil.validateNoBreakingConfig({
        experimentalPromptCommand: true,
        configFile: 'config.js',
      }, warningFn, errorFn, 'e2e')

      expect(warningFn).toHaveBeenCalledExactlyOnceWith('EXPERIMENTAL_PROMPT_COMMAND_REMOVED', {
        name: 'experimentalPromptCommand',
        newName: undefined,
        value: undefined,
        testingType: 'e2e',
        configFile: 'config.js',
      })

      expect(errorFn).toHaveBeenCalledTimes(0)
    })

    it('calls error callback if config contains breaking option that should throw an error', () => {
      const warningFn = vi.fn()
      const errorFn = vi.fn()

      configUtil.validateNoBreakingConfig({
        experimentalSkipDomainInjection: true,
        configFile: 'config.js',
      }, warningFn, errorFn, 'e2e')

      expect(warningFn).toHaveBeenCalledTimes(0)
      expect(errorFn).toHaveBeenCalledExactlyOnceWith('EXPERIMENTAL_SKIP_DOMAIN_INJECTION_REMOVED', {
        name: 'experimentalSkipDomainInjection',
        newName: undefined,
        value: undefined,
        testingType: 'e2e',
        configFile: 'config.js',
      })
    })
  })

  describe('.validateOverridableAtRunTime', () => {
    it('calls onError handler if configuration override level=never', () => {
      const errorFn = vi.fn()

      configUtil.validateOverridableAtRunTime({ chromeWebSecurity: false }, false, errorFn)

      expect(errorFn).toHaveBeenCalledTimes(1)
      expect(errorFn).toHaveBeenCalledWith(expect.objectContaining({
        invalidConfigKey: 'chromeWebSecurity',
        supportedOverrideLevel: 'never',
      }))
    })

    describe('configuration override level=suite', () => {
      it('does not calls onError handler if validating level is suite', () => {
        const errorFn = vi.fn()

        const isSuiteOverride = true

        configUtil.validateOverridableAtRunTime({ testIsolation: true }, isSuiteOverride, errorFn)

        expect(errorFn).toHaveBeenCalledTimes(0)
      })

      it('calls onError handler if validating level is not suite', () => {
        const errorFn = vi.fn()

        const isSuiteOverride = false

        configUtil.validateOverridableAtRunTime({ testIsolation: 'off' }, isSuiteOverride, errorFn)

        expect(errorFn).toHaveBeenCalledTimes(1)
        expect(errorFn).toHaveBeenCalledWith(expect.objectContaining({
          invalidConfigKey: 'testIsolation',
          supportedOverrideLevel: 'suite',
        }))
      })
    })

    it(`does not call onErr if config override level=any`, () => {
      const errorFn = vi.fn()

      configUtil.validateOverridableAtRunTime({ requestTimeout: 1000 }, false, errorFn)

      expect(errorFn).toHaveBeenCalledTimes(0)
    })

    it('does not call onErr if configuration is a non-Cypress config option', () => {
      const errorFn = vi.fn()

      configUtil.validateOverridableAtRunTime({ foo: 'bar' }, true, errorFn)

      expect(errorFn).toHaveBeenCalledTimes(0)
    })
  })

  describe('.validateNeedToRestartOnChange', () => {
    it('returns the need to restart if given key has changed', () => {
      expect(configUtil.validateNeedToRestartOnChange({ blockHosts: [] }, { blockHosts: ['https://example.com'] })).toEqual({
        server: true,
        browser: false,
      })

      expect(configUtil.validateNeedToRestartOnChange({ injectDocumentDomain: true }, {})).toEqual({
        server: true,
        browser: false,
      })

      expect(configUtil.validateNeedToRestartOnChange({ env: { TEST_VAR: 'test' } }, {})).toEqual({
        server: true,
        browser: false,
      })
    })

    it('detects changed Date values', () => {
      const d1 = new Date('2024-01-01')
      const d2 = new Date('2024-06-01')

      expect(configUtil.validateNeedToRestartOnChange({ env: { d: d1 } }, { env: { d: d2 } })).toEqual({
        server: true,
        browser: false,
      })
    })

    it('treats equal Date values as unchanged', () => {
      const d1 = new Date('2024-01-01')
      const d2 = new Date('2024-01-01')

      expect(configUtil.validateNeedToRestartOnChange({ env: { d: d1 } }, { env: { d: d2 } })).toEqual({
        server: false,
        browser: false,
      })
    })

    it('detects changed RegExp values', () => {
      expect(configUtil.validateNeedToRestartOnChange({ env: { r: /foo/i } }, { env: { r: /bar/i } })).toEqual({
        server: true,
        browser: false,
      })
    })

    it('treats reordered-but-equal objects as unchanged', () => {
      expect(configUtil.validateNeedToRestartOnChange({ env: { a: 1, b: 2 } }, { env: { b: 2, a: 1 } })).toEqual({
        server: false,
        browser: false,
      })
    })

    it('detects devServer changes with function-valued fields', () => {
      const fn1 = () => {}
      const fn2 = () => {}

      expect(configUtil.validateNeedToRestartOnChange(
        { devServer: { framework: 'react', bundler: 'vite', setup: fn1 } },
        { devServer: { framework: 'react', bundler: 'vite', setup: fn2 } },
      )).toEqual({
        server: true,
        browser: false,
      })
    })

    it('handles asymmetric cyclic objects correctly', () => {
      const a: any = { x: 1 }

      a.self = a

      const b: any = { x: 2 }

      b.self = b

      // a and b are both cyclic but have different x values
      expect(configUtil.validateNeedToRestartOnChange({ env: a }, { env: b })).toEqual({
        server: true,
        browser: false,
      })
    })

    it('handles Map values with deep-equal keys', () => {
      const m1 = new Map([[{ id: 1 }, 'a']])
      const m2 = new Map([[{ id: 1 }, 'a']])

      expect(configUtil.validateNeedToRestartOnChange({ env: { m: m1 } }, { env: { m: m2 } })).toEqual({
        server: false,
        browser: false,
      })
    })

    it('handles Set values with deep-equal elements', () => {
      const s1 = new Set([{ id: 1 }, { id: 2 }])
      const s2 = new Set([{ id: 1 }, { id: 2 }])

      expect(configUtil.validateNeedToRestartOnChange({ env: { s: s1 } }, { env: { s: s2 } })).toEqual({
        server: false,
        browser: false,
      })
    })
  })
})
