const snapshot = require('snap-shot-it')
const v = require('../../src/validation')
const { expect } = require('chai')

describe('src/validation', () => {
  const mockKey = 'mockConfigKey'

  describe('.isValidClientCertificatesSet', () => {
    it('returns error message for certs not passed as an array array', () => {
      const result = v.isValidRetriesConfig(mockKey, '1')

      expect(result).to.not.be.true
      snapshot(result)
    })

    it('returns error message for certs object without url', () => {
      const result = v.isValidClientCertificatesSet(mockKey, [
        { name: 'cert' },
      ])

      expect(result).to.not.be.true
      snapshot(result)
    })

    it('returns error message for certs url not matching *', () => {
      let result = v.isValidClientCertificatesSet(mockKey, [
        { url: 'http://url.com' },
      ])

      expect(result).to.not.be.true
      snapshot('missing https protocol', result)

      result = v.isValidClientCertificatesSet(mockKey, [
        { url: 'not *' },
      ])

      expect(result).to.not.be.true
      snapshot('invalid url', result)
    })

    // it('returns error message for missing CA', () => {
    //   let result = v.isValidClientCertificatesSet(mockKey, [
    //     {
    //       url: 'https://url.com',
    //     }
    //   ])

    //   expect(result).to.not.be.true
    //   snapshot('duplicate client certificate', result)
    // })

    // it('returns error message for duplicate certs', () => {
    //   let result = v.isValidClientCertificatesSet(mockKey, [
    //     {
    //       url: 'https://url.com',
    //       ca: ['array'] },
    //     { url: 'https://url.com', ca: ['array'] },
    //   ])

    //   expect(result).to.not.be.true
    //   snapshot('duplicate client certificate', result)
    // })
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
      return snapshot.apply(null, [v.isValidBrowser].concat(browsers))
    })
  })

  describe('.isValidBrowserList', () => {
    it('does not allow empty or not browsers', () => {
      snapshot('undefined browsers', v.isValidBrowserList('browsers'))
      snapshot('empty list of browsers', v.isValidBrowserList('browsers', []))

      return snapshot('browsers list with a string', v.isValidBrowserList('browsers', ['foo']))
    })
  })

  describe('.isValidRetriesConfig', () => {
    it('returns true for valid retry value', () => {
      let result = v.isValidRetriesConfig(mockKey, null)

      expect(result).to.be.true

      result = v.isValidRetriesConfig(mockKey, 2)
      expect(result).to.be.true
    })

    it('returns true for valid retry objects', () => {
      let result = v.isValidRetriesConfig(mockKey, { runMode: 1 })

      expect(result).to.be.true

      result = v.isValidRetriesConfig(mockKey, { openMode: 1 })
      expect(result).to.be.true

      result = v.isValidRetriesConfig(mockKey, {
        runMode: 3,
        openMode: 0,
      })

      expect(result).to.be.true
    })

    it('returns error message for invalid retry config', () => {
      let result = v.isValidRetriesConfig(mockKey, '1')

      expect(result).to.not.be.true
      snapshot('invalid retry value', result)

      result = v.isValidRetriesConfig(mockKey, { fakeMode: 1 })
      expect(result).to.not.be.true
      snapshot('invalid retry object', result)
    })
  })

  describe('.isPlainObject', () => {
    it('returns true for value=null', () => {
      const result = v.isPlainObject(mockKey, null)

      expect(result).to.be.true
    })

    it('returns true for value=number', () => {
      const result = v.isPlainObject(mockKey, { foo: 'bar' })

      expect(result).to.be.true
    })

    it('returns error message when value is a not an object', () => {
      const result = v.isPlainObject(mockKey, 1)

      expect(result).to.not.be.true
      snapshot(result)
    })
  })

  describe('.isNumber', () => {
    it('returns true for value=null', () => {
      const result = v.isNumber(mockKey, null)

      expect(result).to.be.true
    })

    it('returns true for value=number', () => {
      const result = v.isNumber(mockKey, 1)

      expect(result).to.be.true
    })

    it('returns error message when value is a not a number', () => {
      const result = v.isNumber(mockKey, 'string')

      expect(result).to.not.be.true
      snapshot(result)
    })
  })

  describe('.isNumberOrFalse', () => {
    it('returns true for value=number', () => {
      const result = v.isNumberOrFalse(mockKey, 1)

      expect(result).to.be.true
    })

    it('returns true for value=false', () => {
      const result = v.isNumberOrFalse(mockKey, false)

      expect(result).to.be.true
    })

    it('returns error message when value is a not number or false', () => {
      const result = v.isNumberOrFalse(mockKey, null)

      expect(result).to.not.be.true
      snapshot(result)
    })
  })

  describe('.isFullyQualifiedUrl', () => {
    it('returns true for value=null', () => {
      const result = v.isFullyQualifiedUrl(mockKey, null)

      expect(result).to.be.true
    })

    it('returns true for value=empty string', () => {
      const result = v.isFullyQualifiedUrl(mockKey, '')

      expect(result).to.be.true
    })

    it('returns true for value=qualified urls', () => {
      let result = v.isFullyQualifiedUrl(mockKey, 'https://url.com')

      expect(result).to.be.true
      result = v.isFullyQualifiedUrl(mockKey, 'http://url.com')
      expect(result).to.be.true
    })

    it('returns error message when value is a not qualified url', () => {
      const result = v.isFullyQualifiedUrl(mockKey, 'url.com')

      expect(result).to.not.be.true
      snapshot(result)
    })
  })

  describe('.isBoolean', () => {
    it('returns true for value=null', () => {
      const result = v.isBoolean(mockKey, null)

      expect(result).to.be.true
    })

    it('returns true for value=true', () => {
      const result = v.isBoolean(mockKey, true)

      expect(result).to.be.true
    })

    it('returns true for value=false', () => {
      const result = v.isBoolean(mockKey, false)

      expect(result).to.be.true
    })

    it('returns error message when value is a not a string', () => {
      const result = v.isString(mockKey, 1)

      expect(result).to.not.be.true
      snapshot(result)
    })
  })

  describe('.isString', () => {
    it('returns true for value=null', () => {
      const result = v.isString(mockKey, null)

      expect(result).to.be.true
    })

    it('returns true for value=array', () => {
      const result = v.isString(mockKey, 'string')

      expect(result).to.be.true
    })

    it('returns error message when value is a not a string', () => {
      const result = v.isString(mockKey, 1)

      expect(result).to.not.be.true
      snapshot(result)
    })
  })

  describe('.isArray', () => {
    it('returns true for value=null', () => {
      const result = v.isArray(mockKey, null)

      expect(result).to.be.true
    })

    it('returns true for value=array', () => {
      const result = v.isArray(mockKey, [1, 2, 3])

      expect(result).to.be.true
    })

    it('returns error message when value is a non-array', () => {
      const result = v.isArray(mockKey, 1)

      expect(result).to.not.be.true
      snapshot(result)
    })
  })

  describe('.isStringOrFalse', () => {
    it('returns true for value=string', () => {
      const result = v.isStringOrFalse(mockKey, 'string')

      expect(result).to.be.true
    })

    it('returns true for value=false', () => {
      const result = v.isStringOrFalse(mockKey, false)

      expect(result).to.be.true
    })

    it('returns error message when value is neither string nor false', () => {
      const result = v.isStringOrFalse(mockKey, null)

      expect(result).to.not.be.true
      snapshot(result)
    })
  })

  describe('.isStringOrArrayOfStrings', () => {
    it('returns true for value=string', () => {
      const result = v.isStringOrArrayOfStrings(mockKey, 'string')

      expect(result).to.be.true
    })

    it('returns true for value=array of strings', () => {
      const result = v.isStringOrArrayOfStrings(mockKey, ['string', 'other'])

      expect(result).to.be.true
    })

    it('returns error message when value is neither string nor array of string', () => {
      let result = v.isStringOrArrayOfStrings(mockKey, null)

      expect(result).to.not.be.true
      snapshot('not string or array', result)

      result = v.isStringOrArrayOfStrings(mockKey, [1, 2, 3])

      expect(result).to.not.be.true
      snapshot('array of non-strings', result)
    })
  })

  describe('.isOneOf', () => {
    it('validates a string', () => {
      const validate = v.isOneOf('foo', 'bar')

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
      const validate = v.isOneOf(1, 2, 3)

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
