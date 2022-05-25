import snapshot from 'snap-shot-it'
import { expect } from 'chai'

import * as validation from '../src/validation'

describe('config/src/validation', () => {
  const mockKey = 'mockConfigKey'

  describe('.isValidClientCertificatesSet', () => {
    it('returns error message for certs not passed as an array array', () => {
      const result = validation.isValidRetriesConfig(mockKey, '1')

      expect(result).to.not.be.true
      snapshot(result)
    })

    it('returns error message for certs object without url', () => {
      const result = validation.isValidClientCertificatesSet(mockKey, [
        { name: 'cert' },
      ])

      expect(result).to.not.be.true
      snapshot(result)
    })

    it('returns error message for certs url not matching *', () => {
      let result = validation.isValidClientCertificatesSet(mockKey, [
        { url: 'http://url.com' },
      ])

      expect(result).to.not.be.true
      snapshot('missing https protocol', result)

      result = validation.isValidClientCertificatesSet(mockKey, [
        { url: 'not *' },
      ])

      expect(result).to.not.be.true
      snapshot('invalid url', result)
    })
  })

  describe('.isValidBrowser', () => {
    it('passes valid browsers and forms error messages for invalid ones', () => {
      const browsers = [
      // valid browser
        {
          name: 'Chrome',
          displayName: 'Chrome Browser',
          family: 'chromium',
          path: '/path/to/chrome',
          version: '1.2.3',
          majorVersion: 1,
        },
        // another valid browser
        {
          name: 'FF',
          displayName: 'Firefox',
          family: 'firefox',
          path: '/path/to/firefox',
          version: '1.2.3',
          majorVersion: '1',
        },
        // Electron is a valid browser
        {
          name: 'Electron',
          displayName: 'Electron',
          family: 'chromium',
          path: '',
          version: '99.101.3',
          majorVersion: 99,
        },
        // invalid browser, missing displayName
        {
          name: 'No display name',
          family: 'chromium',
        },
        {
          name: 'bad family',
          displayName: 'Bad family browser',
          family: 'unknown family',
        },
      ]

      // data-driven testing - computers snapshot value for each item in the list passed through the function
      // https://github.com/bahmutov/snap-shot-it#data-driven-testing
      return snapshot.apply(null, [validation.isValidBrowser].concat(browsers as any))
    })
  })

  describe('.isValidBrowserList', () => {
    it('does not allow empty or not browsers', () => {
      snapshot('undefined browsers', validation.isValidBrowserList('browsers', undefined))
      snapshot('empty list of browsers', validation.isValidBrowserList('browsers', []))

      return snapshot('browsers list with a string', validation.isValidBrowserList('browsers', ['foo']))
    })
  })

  describe('.isValidRetriesConfig', () => {
    it('returns true for valid retry value', () => {
      let result = validation.isValidRetriesConfig(mockKey, null)

      expect(result).to.be.true

      result = validation.isValidRetriesConfig(mockKey, 2)
      expect(result).to.be.true
    })

    it('returns true for valid retry objects', () => {
      let result = validation.isValidRetriesConfig(mockKey, { runMode: 1 })

      expect(result).to.be.true

      result = validation.isValidRetriesConfig(mockKey, { openMode: 1 })
      expect(result).to.be.true

      result = validation.isValidRetriesConfig(mockKey, {
        runMode: 3,
        openMode: 0,
      })

      expect(result).to.be.true
    })

    it('returns error message for invalid retry config', () => {
      let result = validation.isValidRetriesConfig(mockKey, '1')

      expect(result).to.not.be.true
      snapshot('invalid retry value', result)

      result = validation.isValidRetriesConfig(mockKey, { fakeMode: 1 })
      expect(result).to.not.be.true
      snapshot('invalid retry object', result)
    })
  })

  describe('.isPlainObject', () => {
    it('returns true for value=null', () => {
      const result = validation.isPlainObject(mockKey, null)

      expect(result).to.be.true
    })

    it('returns true for value=number', () => {
      const result = validation.isPlainObject(mockKey, { foo: 'bar' })

      expect(result).to.be.true
    })

    it('returns error message when value is a not an object', () => {
      const result = validation.isPlainObject(mockKey, 1)

      expect(result).to.not.be.true
      snapshot(result)
    })
  })

  describe('.isNumber', () => {
    it('returns true for value=null', () => {
      const result = validation.isNumber(mockKey, null)

      expect(result).to.be.true
    })

    it('returns true for value=number', () => {
      const result = validation.isNumber(mockKey, 1)

      expect(result).to.be.true
    })

    it('returns error message when value is a not a number', () => {
      const result = validation.isNumber(mockKey, 'string')

      expect(result).to.not.be.true
      snapshot(result)
    })
  })

  describe('.isNumberOrFalse', () => {
    it('returns true for value=number', () => {
      const result = validation.isNumberOrFalse(mockKey, 1)

      expect(result).to.be.true
    })

    it('returns true for value=false', () => {
      const result = validation.isNumberOrFalse(mockKey, false)

      expect(result).to.be.true
    })

    it('returns error message when value is a not number or false', () => {
      const result = validation.isNumberOrFalse(mockKey, null)

      expect(result).to.not.be.true
      snapshot(result)
    })
  })

  describe('.isFullyQualifiedUrl', () => {
    it('returns true for value=null', () => {
      const result = validation.isFullyQualifiedUrl(mockKey, null)

      expect(result).to.be.true
    })

    it('returns true for value=qualified urls', () => {
      let result = validation.isFullyQualifiedUrl(mockKey, 'https://url.com')

      expect(result).to.be.true
      result = validation.isFullyQualifiedUrl(mockKey, 'http://url.com')
      expect(result).to.be.true
    })

    it('returns error message when value is a not qualified url', () => {
      let result = validation.isFullyQualifiedUrl(mockKey, 'url.com')

      expect(result).to.not.be.true
      snapshot('not qualified url', result)

      result = validation.isFullyQualifiedUrl(mockKey, '')
      expect(result).to.not.be.true
      snapshot('empty string', result)
    })
  })

  describe('.isBoolean', () => {
    it('returns true for value=null', () => {
      const result = validation.isBoolean(mockKey, null)

      expect(result).to.be.true
    })

    it('returns true for value=true', () => {
      const result = validation.isBoolean(mockKey, true)

      expect(result).to.be.true
    })

    it('returns true for value=false', () => {
      const result = validation.isBoolean(mockKey, false)

      expect(result).to.be.true
    })

    it('returns error message when value is a not a string', () => {
      const result = validation.isString(mockKey, 1)

      expect(result).to.not.be.true
      snapshot(result)
    })
  })

  describe('.isString', () => {
    it('returns true for value=null', () => {
      const result = validation.isString(mockKey, null)

      expect(result).to.be.true
    })

    it('returns true for value=array', () => {
      const result = validation.isString(mockKey, 'string')

      expect(result).to.be.true
    })

    it('returns error message when value is a not a string', () => {
      const result = validation.isString(mockKey, 1)

      expect(result).to.not.be.true
      snapshot(result)
    })
  })

  describe('.isArray', () => {
    it('returns true for value=null', () => {
      const result = validation.isArray(mockKey, null)

      expect(result).to.be.true
    })

    it('returns true for value=array', () => {
      const result = validation.isArray(mockKey, [1, 2, 3])

      expect(result).to.be.true
    })

    it('returns error message when value is a non-array', () => {
      const result = validation.isArray(mockKey, 1)

      expect(result).to.not.be.true
      snapshot(result)
    })
  })

  describe('.isStringOrFalse', () => {
    it('returns true for value=string', () => {
      const result = validation.isStringOrFalse(mockKey, 'string')

      expect(result).to.be.true
    })

    it('returns true for value=false', () => {
      const result = validation.isStringOrFalse(mockKey, false)

      expect(result).to.be.true
    })

    it('returns error message when value is neither string nor false', () => {
      const result = validation.isStringOrFalse(mockKey, null)

      expect(result).to.not.be.true
      snapshot(result)
    })
  })

  describe('.isStringOrArrayOfStrings', () => {
    it('returns true for value=string', () => {
      const result = validation.isStringOrArrayOfStrings(mockKey, 'string')

      expect(result).to.be.true
    })

    it('returns true for value=array of strings', () => {
      const result = validation.isStringOrArrayOfStrings(mockKey, ['string', 'other'])

      expect(result).to.be.true
    })

    it('returns error message when value is neither string nor array of string', () => {
      let result = validation.isStringOrArrayOfStrings(mockKey, null)

      expect(result).to.not.be.true
      snapshot('not string or array', result)

      result = validation.isStringOrArrayOfStrings(mockKey, [1, 2, 3])

      expect(result).to.not.be.true
      snapshot('array of non-strings', result)
    })
  })

  describe('.isOneOf', () => {
    it('validates a string', () => {
      const validate = validation.isOneOf('foo', 'bar')

      expect(validate).to.be.a('function')
      expect(validate('test', 'foo')).to.be.true
      expect(validate('test', 'bar')).to.be.true

      // different value
      let msg = validate('test', 'nope')

      expect(msg).to.not.be.true
      snapshot('not one of the strings error message', msg)

      msg = validate('test', 42)
      expect(msg).to.not.be.true
      snapshot('number instead of string', msg)

      msg = validate('test', null)
      expect(msg).to.not.be.true

      return snapshot('null instead of string', msg)
    })

    it('validates a number', () => {
      const validate = validation.isOneOf(1, 2, 3)

      expect(validate).to.be.a('function')
      expect(validate('test', 1)).to.be.true
      expect(validate('test', 3)).to.be.true

      // different value
      let msg = validate('test', 4)

      expect(msg).to.not.be.true
      snapshot('not one of the numbers error message', msg)

      msg = validate('test', 'foo')
      expect(msg).to.not.be.true
      snapshot('string instead of a number', msg)

      msg = validate('test', null)
      expect(msg).to.not.be.true

      return snapshot('null instead of a number', msg)
    })
  })
})
