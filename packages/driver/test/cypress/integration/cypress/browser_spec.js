/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {
  _,
} = Cypress

const browserProps = require('../../../../src/cypress/browser')

describe('src/cypress/browser', function () {
  beforeEach(function () {
    this.commands = (browser = { name: 'chrome', family: 'chromium' }) => browserProps({ browser })
  })

  context('.browser', () => {
    return it('returns the current browser', function () {
      return expect(this.commands().browser).to.eql({ name: 'chrome', family: 'chromium' })
    })
  })

  return context('.isBrowser', function () {
    it('returns true if it\'s a match', function () {
      expect(this.commands().isBrowser('chrome')).to.be.true

      return expect(this.commands().isBrowser({ family: 'chromium' })).to.be.true
    })

    it('returns false if it\'s not a match', function () {
      return expect(this.commands().isBrowser('firefox')).to.be.false
    })

    it('is case-insensitive', function () {
      return expect(this.commands().isBrowser('Chrome')).to.be.true
    })

    it('throws if arg is not a string or object', function () {
      return expect(() => {
        return this.commands().isBrowser(true)
      }).to.throw('`Cypress.isBrowser()` must be passed the name of a browser or an object to filter with. You passed: `true`')
    })

    it('returns true if it\'s a match or a \'parent\' browser', function () {
      expect(this.commands().isBrowser('chrome')).to.be.true
      expect(this.commands({ name: 'electron' }).isBrowser('chrome')).to.be.false
      expect(this.commands({ name: 'chromium' }).isBrowser('chrome')).to.be.false
      expect(this.commands({ name: 'canary' }).isBrowser('chrome')).to.be.false
      expect(this.commands({ name: 'firefox' }).isBrowser('firefox')).to.be.true

      return expect(this.commands({ name: 'ie' }).isBrowser('ie')).to.be.true
    })

    return it('matches on name if has unknown family', function () {
      return expect(this.commands({ name: 'customFoo' }).isBrowser('customfoo')).to.be.true
    })
  })
})
