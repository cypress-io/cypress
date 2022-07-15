import { expect } from 'chai'
import {
  hideKeys,
  setUrls,
  coerce,
  isResolvedConfigPropDefault,
} from '../src/utils'
import {
  utils as projectUtils,
} from '../src/project/utils'

describe('config/src/utils', () => {
  describe('hideKeys', () => {
    it('removes middle part of the string', () => {
      const hidden = hideKeys('12345-xxxx-abcde')

      expect(hidden).to.equal('12345...abcde')
    })

    it('returns undefined for missing key', () => {
      expect(hideKeys()).to.be.undefined
    })

    // https://github.com/cypress-io/cypress/issues/14571
    it('returns undefined for non-string argument', () => {
      expect(hideKeys(true)).to.be.undefined
      expect(hideKeys(1234)).to.be.undefined
    })
  })

  context('.setUrls', () => {
    it('does not mutate existing obj', () => {
      const obj = {}

      expect(setUrls(obj)).not.to.eq(obj)
    })

    it('uses baseUrl when set', () => {
      const obj = {
        port: 65432,
        baseUrl: 'https://www.google.com',
        clientRoute: '/__/',
      }

      const urls = setUrls(obj)

      expect(urls.browserUrl).to.eq('https://www.google.com/__/')
      expect(urls.proxyUrl).to.eq('http://localhost:65432')
    })

    it('strips baseUrl to host when set', () => {
      const obj = {
        port: 65432,
        baseUrl: 'http://localhost:9999/app/?foo=bar#index.html',
        clientRoute: '/__/',
      }

      const urls = setUrls(obj)

      expect(urls.browserUrl).to.eq('http://localhost:9999/__/')
      expect(urls.proxyUrl).to.eq('http://localhost:65432')
    })
  })

  context('coerce', () => {
    beforeEach(function () {
      this.env = process.env
    })

    afterEach(function () {
      process.env = this.env
    })

    it('coerces string', () => {
      expect(coerce('foo')).to.eq('foo')
    })

    it('coerces string from process.env', () => {
      process.env['CYPRESS_STRING'] = 'bar'
      const cypressEnvVar = projectUtils.getProcessEnvVars(process.env)

      expect(coerce(cypressEnvVar)).to.deep.include({ STRING: 'bar' })
    })

    it('coerces number', () => {
      expect(coerce('123')).to.eq(123)
    })

    // NOTE: When exporting shell variables, they are saved in `process.env` as strings, hence why
    // all `process.env` variables are assigned as strings in these unit tests
    it('coerces number from process.env', () => {
      process.env['CYPRESS_NUMBER'] = '8000'
      const cypressEnvVar = projectUtils.getProcessEnvVars(process.env)

      expect(coerce(cypressEnvVar)).to.deep.include({ NUMBER: 8000 })
    })

    it('coerces boolean', () => {
      expect(coerce('true')).to.be.true
    })

    it('coerces boolean from process.env', () => {
      process.env['CYPRESS_BOOLEAN'] = 'false'
      const cypressEnvVar = projectUtils.getProcessEnvVars(process.env)

      expect(coerce(cypressEnvVar)).to.deep.include({ BOOLEAN: false })
    })

    // https://github.com/cypress-io/cypress/issues/8818
    it('coerces JSON string', () => {
      expect(coerce('[{"type": "foo", "value": "bar"}, {"type": "fizz", "value": "buzz"}]')).to.deep.equal(
        [{ 'type': 'foo', 'value': 'bar' }, { 'type': 'fizz', 'value': 'buzz' }],
      )
    })

    // https://github.com/cypress-io/cypress/issues/8818
    it('coerces JSON string from process.env', () => {
      process.env['CYPRESS_stringified_json'] = '[{"type": "foo", "value": "bar"}, {"type": "fizz", "value": "buzz"}]'
      const cypressEnvVar = projectUtils.getProcessEnvVars(process.env)
      const coercedCypressEnvVar = coerce(cypressEnvVar)

      expect(coercedCypressEnvVar).to.have.keys('stringified_json')
      expect(coercedCypressEnvVar['stringified_json']).to.deep.equal([{ 'type': 'foo', 'value': 'bar' }, { 'type': 'fizz', 'value': 'buzz' }])
    })

    it('coerces array', () => {
      expect(coerce('[foo,bar]')).to.have.members(['foo', 'bar'])
    })

    it('coerces array from process.env', () => {
      process.env['CYPRESS_ARRAY'] = '[google.com,yahoo.com]'
      const cypressEnvVar = projectUtils.getProcessEnvVars(process.env)

      const coercedCypressEnvVar = coerce(cypressEnvVar)

      expect(coercedCypressEnvVar).to.have.keys('ARRAY')
      expect(coercedCypressEnvVar['ARRAY']).to.have.members(['google.com', 'yahoo.com'])
    })

    it('defaults value with multiple types to string', () => {
      expect(coerce('123foo456')).to.eq('123foo456')
    })
  })

  context('.isResolvedConfigPropDefault', () => {
    it('returns true if value is default value', () => {
      const options = {
        resolved: {
          baseUrl: { from: 'default' },
        },
      }

      expect(isResolvedConfigPropDefault(options, 'baseUrl')).to.be.true
    })

    it('returns false if value is not default value', () => {
      const options = {
        resolved: {
          baseUrl: { from: 'cli' },
        },
      }

      expect(isResolvedConfigPropDefault(options, 'baseUrl')).to.be.false
    })
  })
})
