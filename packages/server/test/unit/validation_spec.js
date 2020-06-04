require('../spec_helper')
const snapshot = require('snap-shot-it')
const v = require(`${root}lib/util/validation`)

describe('lib/util/validation', () => {
  context('#isValidBrowserList', () => {
    it('does not allow empty or not browsers', () => {
      snapshot('undefined browsers', v.isValidBrowserList('browsers'))
      snapshot('empty list of browsers', v.isValidBrowserList('browsers', []))

      return snapshot('browsers list with a string', v.isValidBrowserList('browsers', ['foo']))
    })
  })

  context('#isValidBrowser', () => {
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

  context('#isOneOf', () => {
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
