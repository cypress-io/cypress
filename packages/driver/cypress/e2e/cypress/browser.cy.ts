import browserProps from '@packages/driver/src/cypress/browser'

const commands = (browser: Partial<Cypress.Browser> = { name: 'chrome', family: 'chromium', isHeadless: false }) => {
  return browserProps({ browser })
}

// `BrowserFamily` is a closed union, so it cannot express the `!` exclusion prefix
// that `isBrowser` supports - unlike `BrowserName`, which is widened to `string`
const NOT_CHROMIUM = { family: '!chromium' } as unknown as Partial<Cypress.Browser>

describe('src/cypress/browser', () => {
  context('.browser', () => {
    it('returns the current browser', () => {
      expect(commands().browser).to.eql({ name: 'chrome', family: 'chromium', isHeadless: false })
    })
  })

  context('.isBrowser', () => {
    it('returns true if it\'s a match', () => {
      expect(commands().isBrowser('chrome')).to.be.true
      expect(commands().isBrowser({ family: 'chromium' })).to.be.true
      expect(commands().isBrowser({ isHeadless: false })).to.be.true
    })

    it('returns false if it\'s not a match', () => {
      expect(commands().isBrowser('firefox')).to.be.false
      expect(commands().isBrowser({ isHeadless: true })).to.be.false
    })

    it('is case-insensitive', () => {
      expect(commands().isBrowser('Chrome')).to.be.true
    })

    // https://github.com/cypress-io/cypress/issues/7168
    it('can match with exclusives', () => {
      expect(commands().isBrowser(['!firefox'])).to.be['true']
      expect(commands().isBrowser({
        family: 'chromium',
        name: '!firefox',
        isHeadless: false,
      })).to.be['true']

      expect(commands().isBrowser(NOT_CHROMIUM)).to.be['false']

      expect(commands().isBrowser({
        family: 'chromium',
        name: '!chrome',
      })).to.be['false']
    })

    it('can accept an array of matchers', () => {
      expect(commands().isBrowser(['firefox', 'chrome'])).to.be['true']
      expect(commands().isBrowser(['chrome', '!firefox'])).to.be['true']
      expect(commands().isBrowser([NOT_CHROMIUM, '!firefox', 'chrome'])).to.be['true']

      expect(commands().isBrowser([NOT_CHROMIUM, '!firefox'])).to.be['false']

      expect(commands().isBrowser(['!chrome', '!firefox'])).to.be['false']
      expect(commands().isBrowser(['!chrome', '!firefox'])).to.be['false']
      expect(commands().isBrowser(['!firefox', '!chrome'])).to.be['false']

      expect(commands().isBrowser([])).to.be['false']
    })

    it('throws if arg is not a string or object', () => {
      expect(() => {
        commands().isBrowser(true as unknown as Cypress.IsBrowserMatcher)
      })
      .to.throw('`Cypress.isBrowser()` must be passed a string, object, or an array. You passed: `true`')
    })

    it('returns true if it\'s a match or a \'parent\' browser', () => {
      expect(commands().isBrowser('chrome')).to.be.true
      expect(commands({ name: 'electron' }).isBrowser('chrome')).to.be.false
      expect(commands({ name: 'chromium' }).isBrowser('chrome')).to.be.false
      expect(commands({ name: 'canary' }).isBrowser('chrome')).to.be.false
      expect(commands({ name: 'firefox' }).isBrowser('firefox')).to.be.true
      expect(commands({ name: 'ie' }).isBrowser('ie')).to.be.true
    })

    it('matches on name if has unknown family', () => {
      expect(commands({ name: 'customFoo' }).isBrowser('customfoo')).to.be.true
    })
  })
})
