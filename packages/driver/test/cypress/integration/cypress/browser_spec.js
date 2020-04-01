import browserProps from '../../../../src/cypress/browser'

describe('src/cypress/browser', () => {
  beforeEach(() => {
    this.commands = (browser = { name: 'chrome', family: 'chromium' }) => browserProps({ browser })
  })

  context('.browser', () => {
    it('returns the current browser', () => {
      expect(this.commands().browser).to.eql({ name: 'chrome', family: 'chromium' })
    })
  })

  context('.isBrowser', () => {
    it('returns true if it\'s a match', () => {
      expect(this.commands().isBrowser('chrome')).to.be.true

      expect(this.commands().isBrowser({ family: 'chromium' })).to.be.true
    })

    it('returns false if it\'s not a match', () => {
      expect(this.commands().isBrowser('firefox')).to.be.false
    })

    it('is case-insensitive', () => {
      expect(this.commands().isBrowser('Chrome')).to.be.true
    })

    it('throws if arg is not a string or object', () => {
      expect(() => {
        this.commands().isBrowser(true)
      }).to.throw('`Cypress.isBrowser()` must be passed the name of a browser or an object to filter with. You passed: `true`')
    })

    it('returns true if it\'s a match or a \'parent\' browser', () => {
      expect(this.commands().isBrowser('chrome')).to.be.true
      expect(this.commands({ name: 'electron' }).isBrowser('chrome')).to.be.false
      expect(this.commands({ name: 'chromium' }).isBrowser('chrome')).to.be.false
      expect(this.commands({ name: 'canary' }).isBrowser('chrome')).to.be.false
      expect(this.commands({ name: 'firefox' }).isBrowser('firefox')).to.be.true

      expect(this.commands({ name: 'ie' }).isBrowser('ie')).to.be.true
    })

    it('matches on name if has unknown family', () => {
      expect(this.commands({ name: 'customFoo' }).isBrowser('customfoo')).to.be.true
    })
  })
})
