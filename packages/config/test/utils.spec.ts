import { vi, describe, it, expect } from 'vitest'

import {
  hideKeys,
  setUrls,
  coerce,
  isResolvedConfigPropDefault,
} from '../src/utils'
import {
  getProcessEnvVars,
} from '../src/project/utils'

describe('config/src/utils', () => {
  beforeEach(function () {
    vi.unstubAllEnvs()
    vi.stubEnv('CYPRESS_COMMERCIAL_RECOMMENDATIONS', undefined)
    vi.stubEnv('CYPRESS_LOCAL_CY_PROMPT_PATH', undefined)
  })

  describe('hideKeys', () => {
    it('removes middle part of the string', () => {
      const hidden = hideKeys('12345-xxxx-abcde')

      expect(hidden).toEqual('12345...abcde')
    })

    it('returns undefined for missing key', () => {
      expect(hideKeys()).toBeUndefined()
    })

    // https://github.com/cypress-io/cypress/issues/14571
    it('returns undefined for non-string argument', () => {
      expect(hideKeys(true)).toBeUndefined()
      expect(hideKeys(1234)).toBeUndefined()
    })
  })

  describe('.setUrls', () => {
    it('does not mutate existing obj', () => {
      const obj = {}

      expect(setUrls(obj)).not.toEqual(obj)
    })

    it('uses baseUrl when set', () => {
      const obj = {
        port: 65432,
        baseUrl: 'https://www.google.com',
        clientRoute: '/__/',
      }

      const urls = setUrls(obj)

      expect(urls.browserUrl).toEqual('https://www.google.com/__/')
      expect(urls.proxyUrl).toEqual('http://localhost:65432')
    })

    it('strips baseUrl to host when set', () => {
      const obj = {
        port: 65432,
        baseUrl: 'http://localhost:9999/app/?foo=bar#index.html',
        clientRoute: '/__/',
      }

      const urls = setUrls(obj)

      expect(urls.browserUrl).toEqual('http://localhost:9999/__/')
      expect(urls.proxyUrl).toEqual('http://localhost:65432')
    })
  })

  describe('coerce', () => {
    it('coerces string', () => {
      expect(coerce('foo')).toEqual('foo')
    })

    it('coerces string from process.env', () => {
      process.env['CYPRESS_STRING'] = 'bar'
      const cypressEnvVar = getProcessEnvVars(process.env)

      expect(coerce(cypressEnvVar)).toEqual(expect.objectContaining({ STRING: 'bar' }))
    })

    it('coerces number', () => {
      expect(coerce('123')).toEqual(123)
    })

    // NOTE: When exporting shell variables, they are saved in `process.env` as strings, hence why
    // all `process.env` variables are assigned as strings in these unit tests
    it('coerces number from process.env', () => {
      process.env['CYPRESS_NUMBER'] = '8000'
      const cypressEnvVar = getProcessEnvVars(process.env)

      expect(coerce(cypressEnvVar)).toEqual(expect.objectContaining({ NUMBER: 8000 }))
    })

    it('coerces boolean', () => {
      expect(coerce('true')).toBe(true)
    })

    it('coerces boolean from process.env', () => {
      process.env['CYPRESS_BOOLEAN'] = 'false'
      const cypressEnvVar = getProcessEnvVars(process.env)

      expect(coerce(cypressEnvVar)).toEqual(expect.objectContaining({ BOOLEAN: false }))
    })

    // https://github.com/cypress-io/cypress/issues/8818
    it('coerces JSON string', () => {
      expect(coerce('[{"type": "foo", "value": "bar"}, {"type": "fizz", "value": "buzz"}]')).toEqual(
        [{ 'type': 'foo', 'value': 'bar' }, { 'type': 'fizz', 'value': 'buzz' }],
      )
    })

    // https://github.com/cypress-io/cypress/issues/8818
    it('coerces JSON string from process.env', () => {
      process.env['CYPRESS_stringified_json'] = '[{"type": "foo", "value": "bar"}, {"type": "fizz", "value": "buzz"}]'
      const cypressEnvVar = getProcessEnvVars(process.env)
      const coercedCypressEnvVar = coerce(cypressEnvVar)

      expect(coercedCypressEnvVar).toHaveProperty('stringified_json')
      expect(coercedCypressEnvVar['stringified_json']).toHaveLength(2)
      expect(coercedCypressEnvVar['stringified_json']).toEqual(expect.arrayContaining([{ 'type': 'foo', 'value': 'bar' }, { 'type': 'fizz', 'value': 'buzz' }]))
    })

    it('coerces array', () => {
      const coercedCypressEnvVar = coerce('[foo,bar]')

      expect(coercedCypressEnvVar).toHaveLength(2)
      expect(coercedCypressEnvVar).toEqual(expect.arrayContaining(['foo', 'bar']))
    })

    it('coerces array from process.env', () => {
      process.env['CYPRESS_ARRAY'] = '[google.com,yahoo.com]'
      const cypressEnvVar = getProcessEnvVars(process.env)

      const coercedCypressEnvVar = coerce(cypressEnvVar)

      expect(coercedCypressEnvVar).toHaveProperty('ARRAY')
      expect(coercedCypressEnvVar['ARRAY']).toHaveLength(2)
      expect(coercedCypressEnvVar['ARRAY']).toEqual(expect.arrayContaining(['google.com', 'yahoo.com']))
    })

    it('defaults value with multiple types to string', () => {
      expect(coerce('123foo456')).toEqual('123foo456')
    })
  })

  describe('.isResolvedConfigPropDefault', () => {
    it('returns true if value is default value', () => {
      const options = {
        resolved: {
          baseUrl: { from: 'default' },
        },
      }

      expect(isResolvedConfigPropDefault(options, 'baseUrl')).toBe(true)
    })

    it('returns false if value is not default value', () => {
      const options = {
        resolved: {
          baseUrl: { from: 'cli' },
        },
      }

      expect(isResolvedConfigPropDefault(options, 'baseUrl')).toBe(false)
    })
  })
})
