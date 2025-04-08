import snapshot from 'snap-shot-it'
import { expect } from 'chai'

import * as validation from '../src/validation'

describe('config/src/validation', () => {
  const mockKey = 'mockConfigKey'

  describe('.validateAny', () => {
    it('returns new validation function that accepts 2 arguments', () => {
      const validate = validation.validateAny(() => true, () => false)

      expect(validate).to.be.a.instanceof(Function)
      expect(validate.length).to.eq(2)
    })

    it('returned validation function will return true when any validations pass', () => {
      const value = Date.now()
      const key = `key_${value}`
      const validatePass1 = validation.validateAny((k, v) => `${value}`, (k, v) => true)

      expect(validatePass1(key, value)).to.equal(true)

      const validatePass2 = validation.validateAny((k, v) => true, (k, v) => `${value}`)

      expect(validatePass2(key, value)).to.equal(true)
    })

    it('returned validation function will return last failure result when all validations fail', () => {
      const value = Date.now()
      const key = `key_${value}`
      const validateFail1 = validation.validateAny((k, v) => `${value}`, (k, v) => false)

      expect(validateFail1(key, value)).to.equal(false)

      const validateFail2 = validation.validateAny((k, v) => false, (k, v) => `${value}`)

      expect(validateFail2(key, value)).to.equal(`${value}`)
    })
  })

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

      result = validation.isValidRetriesConfig(mockKey, 250)
      expect(result).to.be.true
    })

    it('returns true for valid retry objects', () => {
      let result = validation.isValidRetriesConfig(mockKey, { runMode: 1 })

      expect(result).to.be.true

      result = validation.isValidRetriesConfig(mockKey, { runMode: 250 })
      expect(result).to.be.true

      result = validation.isValidRetriesConfig(mockKey, { openMode: 1 })
      expect(result).to.be.true

      result = validation.isValidRetriesConfig(mockKey, { openMode: 250 })
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

    it('returns error message for openMode as boolean without strategy', () => {
      let result = validation.isValidRetriesConfig(mockKey, { openMode: true })

      expect(result).to.not.be.true
      snapshot(result)
    })

    it('returns error message for runMode as boolean without strategy', () => {
      let result = validation.isValidRetriesConfig(mockKey, { runMode: true })

      expect(result).to.not.be.true
      snapshot(result)
    })

    it('returns true for valid retry object with experimental keys (default)', () => {
      let result = validation.isValidRetriesConfig(mockKey, {
        openMode: 0,
        runMode: 0,
        experimentalStrategy: undefined,
        experimentalOptions: undefined,
      })

      expect(result).to.be.true
    })

    describe('experimental options', () => {
      describe('passes with', () => {
        ['detect-flake-but-always-fail', 'detect-flake-and-pass-on-threshold'].forEach((strategy) => {
          it(`experimentalStrategy is "${strategy}" with no "experimentalOptions" & valid runMode and openMode`, () => {
            let result = validation.isValidRetriesConfig(mockKey, {
              runMode: true,
              openMode: false,
              experimentalStrategy: strategy,
            })

            expect(result).to.be.true

            result = validation.isValidRetriesConfig(mockKey, {
              experimentalStrategy: strategy,
            })

            expect(result).to.be.true
          })

          it(`experimentalStrategy is "${strategy}" with only "maxRetries" in "experimentalOptions"`, () => {
            const result = validation.isValidRetriesConfig(mockKey, {
              experimentalStrategy: strategy,
              experimentalOptions: {
                maxRetries: 4,
              },
            })

            expect(result).to.not.be.true
          })
        })

        it('experimentalStrategy is "detect-flake-but-always-fail" and has option "stopIfAnyPassed"', () => {
          let result = validation.isValidRetriesConfig(mockKey, {
            runMode: true,
            openMode: false,
            experimentalStrategy: 'detect-flake-but-always-fail',
            experimentalOptions: {
              maxRetries: 1,
              stopIfAnyPassed: true,
            },
          })

          expect(result).to.be.true

          result = validation.isValidRetriesConfig(mockKey, {
            experimentalStrategy: 'detect-flake-but-always-fail',
            experimentalOptions: {
              maxRetries: 4,
              stopIfAnyPassed: false,
            },
          })

          expect(result).to.be.true
        })

        it('experimentalStrategy is "detect-flake-and-pass-on-threshold" and has option "passesRequired"', () => {
          let result = validation.isValidRetriesConfig(mockKey, {
            runMode: true,
            openMode: false,
            experimentalStrategy: 'detect-flake-and-pass-on-threshold',
            experimentalOptions: {
              maxRetries: 1,
              passesRequired: 1,
            },
          })

          expect(result).to.be.true

          result = validation.isValidRetriesConfig(mockKey, {
            experimentalStrategy: 'detect-flake-and-pass-on-threshold',
            experimentalOptions: {
              maxRetries: 4,
              passesRequired: 2,
            },
          })

          expect(result).to.be.true
        })
      })

      describe('fails with', () => {
        it('invalid strategy', () => {
          const result = validation.isValidRetriesConfig(mockKey, {
            experimentalStrategy: 'foo',
          })

          expect(result).to.not.be.true
          snapshot(result)
        })

        it('invalid strategy w/ other options (valid)', () => {
          const result = validation.isValidRetriesConfig(mockKey, {
            runMode: 1,
            openMode: 2,
            experimentalStrategy: 'bar',
          })

          expect(result).to.not.be.true
          snapshot(result)
        })

        ;['detect-flake-but-always-fail', 'detect-flake-and-pass-on-threshold'].forEach((strategy) => {
          it(`${strategy}: valid strategy w/ other invalid options with experiment`, () => {
            const result = validation.isValidRetriesConfig(mockKey, {
              runMode: 1,
              openMode: 0,
              experimentalStrategy: strategy,
            })

            expect(result).to.not.be.true
            snapshot(result)
          })

          it(`${strategy}: maxRetries is negative`, () => {
            const result = validation.isValidRetriesConfig(mockKey, {
              experimentalStrategy: strategy,
              experimentalOptions: {
                maxRetries: -2,
              },
            })

            expect(result).to.not.be.true
            snapshot(result)
          })

          it(`${strategy}: maxRetries is 0`, () => {
            const result = validation.isValidRetriesConfig(mockKey, {
              experimentalStrategy: strategy,
              experimentalOptions: {
                maxRetries: 0,
              },
            })

            expect(result).to.not.be.true
            snapshot(result)
          })

          it(`${strategy}: maxRetries is floating`, () => {
            const result = validation.isValidRetriesConfig(mockKey, {
              experimentalStrategy: strategy,
              experimentalOptions: {
                maxRetries: 3.5,
              },
            })

            expect(result).to.not.be.true
            snapshot(result)
          })
        })

        describe('detect-flake-and-pass-on-threshold', () => {
          it(`passesRequired is negative`, () => {
            const result = validation.isValidRetriesConfig(mockKey, {
              experimentalStrategy: 'detect-flake-and-pass-on-threshold',
              experimentalOptions: {
                maxRetries: 1,
                passesRequired: -4,
              },
            })

            expect(result).to.not.be.true
            snapshot(result)
          })

          it(`passesRequired is 0`, () => {
            const result = validation.isValidRetriesConfig(mockKey, {
              experimentalStrategy: 'detect-flake-and-pass-on-threshold',
              experimentalOptions: {
                maxRetries: 1,
                passesRequired: 0,
              },
            })

            expect(result).to.not.be.true
            snapshot(result)
          })

          it(`passesRequired is floating`, () => {
            const result = validation.isValidRetriesConfig(mockKey, {
              experimentalStrategy: 'detect-flake-and-pass-on-threshold',
              experimentalOptions: {
                maxRetries: 1,
                passesRequired: 3.5,
              },
            })

            expect(result).to.not.be.true
            snapshot(result)
          })

          it('provides passesRequired without maxRetries', () => {
            const result = validation.isValidRetriesConfig(mockKey, {
              experimentalStrategy: 'detect-flake-and-pass-on-threshold',
              experimentalOptions: {
                passesRequired: 3,
              },
            })

            expect(result).to.not.be.true
            snapshot(result)
          })

          it('provides passesRequired that is greater than maxRetries', () => {
            const result = validation.isValidRetriesConfig(mockKey, {
              experimentalStrategy: 'detect-flake-and-pass-on-threshold',
              experimentalOptions: {
                maxRetries: 3,
                passesRequired: 5,
              },
            })

            expect(result).to.not.be.true
            snapshot(result)
          })

          it('provides stopIfAnyPassed option', () => {
            const result = validation.isValidRetriesConfig(mockKey, {
              experimentalStrategy: 'detect-flake-and-pass-on-threshold',
              experimentalOptions: {
                maxRetries: 3,
                passesRequired: 2,
                stopIfAnyPassed: true,
              },
            })

            expect(result).to.not.be.true
            snapshot(result)
          })
        })

        describe('detect-flake-but-always-fail', () => {
          it('provides passesRequired option', () => {
            const result = validation.isValidRetriesConfig(mockKey, {
              experimentalStrategy: 'detect-flake-but-always-fail',
              experimentalOptions: {
                maxRetries: 3,
                passesRequired: 2,
                stopIfAnyPassed: true,
              },
            })

            expect(result).to.not.be.true
            snapshot(result)
          })

          it('provides stopIfAnyPassed without maxRetries', () => {
            const result = validation.isValidRetriesConfig(mockKey, {
              experimentalStrategy: 'detect-flake-but-always-fail',
              experimentalOptions: {
                stopIfAnyPassed: false,
              },
            })

            expect(result).to.not.be.true
            snapshot(result)
          })

          it('provides maxRetries without stopIfAnyPassed', () => {
            const result = validation.isValidRetriesConfig(mockKey, {
              experimentalStrategy: 'detect-flake-but-always-fail',
              experimentalOptions: {
                maxRetries: 2,
              },
            })

            expect(result).to.not.be.true
            snapshot(result)
          })

          it('stopIfAnyPassed is a number (0 and 1 do not work)', () => {
            const result = validation.isValidRetriesConfig(mockKey, {
              experimentalStrategy: 'detect-flake-but-always-fail',
              experimentalOptions: {
                maxRetries: 2,
                stopIfAnyPassed: 1,
              },
            })

            expect(result).to.not.be.true
            snapshot(result)
          })
        })
      })
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

  describe('.isArrayIncludingAny', () => {
    it('returns new validation function that accepts 2 arguments', () => {
      const validate = validation.isArrayIncludingAny(true, false)

      expect(validate).to.be.a.instanceof(Function)
      expect(validate.length).to.eq(2)
    })

    it('returned validation function will return true when value is a subset of the provided values', () => {
      const value = 'fakeValue'
      const key = 'fakeKey'
      const validatePass1 = validation.isArrayIncludingAny(true, false)

      expect(validatePass1(key, [false])).to.equal(true)

      const validatePass2 = validation.isArrayIncludingAny(value, value + 1, value + 2)

      expect(validatePass2(key, [value])).to.equal(true)
    })

    it('returned validation function will fail if values is not an array', () => {
      const value = 'fakeValue'
      const key = 'fakeKey'
      const validateFail = validation.isArrayIncludingAny(true, false)

      let msg = validateFail(key, value)

      expect(msg).to.not.be.true
      snapshot('not an array error message', msg)
    })

    it('returned validation function will fail if any values are not present in the provided values', () => {
      const value = 'fakeValue'
      const key = 'fakeKey'
      const validateFail = validation.isArrayIncludingAny(value, value + 1, value + 2)

      let msg = validateFail(key, [null])

      expect(msg).to.not.be.true
      snapshot('not a subset of error message', msg)

      msg = validateFail(key, [value, value + 1, value + 2, value + 3])

      expect(msg).to.not.be.true
      snapshot('not all in subset error message', msg)
    })
  })

  describe('.isValidCrfOrBoolean', () => {
    it('validates booleans', () => {
      const validate = validation.isValidCrfOrBoolean

      expect(validate).to.be.a('function')
      expect(validate('test', false)).to.be.true
      expect(validate('test', true)).to.be.true
    })

    it('validates any number between 0 and 51', () => {
      const validate = validation.isValidCrfOrBoolean

      const validConfigNumbers = [...Array(51).keys()]

      validConfigNumbers.forEach((num) => {
        expect(validate('test', num)).to.be.true
      })
    })

    it('invalidates lower bound', () => {
      const validate = validation.isValidCrfOrBoolean

      const lowerBoundMsg = validate('test', -1)

      expect(lowerBoundMsg).to.not.be.true

      return snapshot('invalid lower bound', lowerBoundMsg)
    })

    it('invalidates upper bound', () => {
      const validate = validation.isValidCrfOrBoolean

      const upperBoundMsg = validate('test', 52)

      expect(upperBoundMsg).to.not.be.true

      return snapshot('invalid upper bound', upperBoundMsg)
    })
  })
})
