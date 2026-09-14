// The published `Cypress.Keyboard` type covers only the documented `defaults()`
// and `Keys`. This spec exercises the internal surface, which also exposes
// `reset()` and `getConfig()`, and resolves `defaults()` to the updated config.
const Keyboard = Cypress.Keyboard as unknown as {
  defaults: (options: Partial<Cypress.KeyboardDefaultsOptions>) => Partial<Cypress.KeyboardDefaultsOptions>
  getConfig: () => Partial<Cypress.KeyboardDefaultsOptions>
  reset: () => void
}

const DEFAULTS = {
  keystrokeDelay: null,
}

describe('src/cypress/keyboard', () => {
  beforeEach(() => {
    Keyboard.reset()
  })

  it('has defaults', () => {
    expect(Keyboard.getConfig()).to.deep.eq(DEFAULTS)
  })

  context('.getConfig', () => {
    it('returns config', () => {
      expect(Keyboard.getConfig()).to.deep.eq(DEFAULTS)
    })

    it('does not allow mutation of config', () => {
      const config = Keyboard.getConfig()

      config.keystrokeDelay = 999

      expect(Keyboard.getConfig().keystrokeDelay).to.eq(DEFAULTS.keystrokeDelay)
    })
  })

  context('.defaults', () => {
    it('is noop if not called with any valid properties', () => {
      Keyboard.defaults({})
      expect(Keyboard.getConfig()).to.deep.eq(DEFAULTS)
    })

    it('sets keystrokeDelay if specified', () => {
      Keyboard.defaults({
        keystrokeDelay: 5,
      })

      expect(Keyboard.getConfig().keystrokeDelay).to.eql(5)
    })

    it('returns new config', () => {
      const result = Keyboard.defaults({
        keystrokeDelay: 5,
      })

      expect(result).to.eql({
        keystrokeDelay: 5,
      })
    })

    it('does not allow mutation via returned config', () => {
      const result = Keyboard.defaults({
        keystrokeDelay: 5,
      })

      result.keystrokeDelay = 0

      expect(Keyboard.getConfig().keystrokeDelay).to.eq(5)
    })

    describe('errors', () => {
      it('throws if not passed an object', () => {
        const fn = () => {
          // @ts-expect-error - asserting the runtime guard against a missing argument
          Keyboard.defaults()
        }

        expect(fn).to.throw()
        .with.property('message')
        .and.eq('`Cypress.Keyboard.defaults()` must be called with an object. You passed: ``')

        expect(fn).to.throw()
        .with.property('docsUrl')
        .and.eq('https://on.cypress.io/keyboard-api')
      })

      it('throws if keystrokeDelay is not a number', () => {
        const fn = () => {
          // @ts-expect-error - asserting the runtime guard against a non-numeric delay
          Keyboard.defaults({ keystrokeDelay: false })
        }

        expect(fn).to.throw()
        .with.property('message')
        .and.eq('`Cypress.Keyboard.defaults()` `keystrokeDelay` option must be 0 (zero) or a positive number. You passed: `false`')

        expect(fn).to.throw()
        .with.property('docsUrl')
        .and.eq('https://on.cypress.io/keyboard-api')
      })

      it('throws if keystrokeDelay is a negative number', () => {
        const fn = () => {
          Keyboard.defaults({ keystrokeDelay: -10 })
        }

        expect(fn).to.throw()
        .with.property('message')
        .and.eq('`Cypress.Keyboard.defaults()` `keystrokeDelay` option must be 0 (zero) or a positive number. You passed: `-10`')

        expect(fn).to.throw()
        .with.property('docsUrl')
        .and.eq('https://on.cypress.io/keyboard-api')
      })
    })
  })
})
