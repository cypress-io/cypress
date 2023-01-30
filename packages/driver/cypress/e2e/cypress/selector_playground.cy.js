const { $ } = window.Cypress.$Cypress
const SelectorPlayground = Cypress.SelectorPlayground

const SELECTOR_DEFAULTS = [
  'data-cy', 'data-test', 'data-testid', 'data-qa', 'id', 'class', 'tag', 'attributes', 'nth-child',
]

describe('src/cypress/selector_playground', () => {
  beforeEach(() => {
    SelectorPlayground.reset()
  })

  it('has defaults', () => {
    expect(SelectorPlayground.getSelectorPriority()).to.deep.eq(SELECTOR_DEFAULTS)
    expect(SelectorPlayground.getOnElement()).to.be.null
  })

  context('.defaults', () => {
    it('is noop if not called with selectorPriority or onElement', () => {
      SelectorPlayground.defaults({})
      expect(SelectorPlayground.getSelectorPriority()).to.deep.eq(SELECTOR_DEFAULTS)
      expect(SelectorPlayground.getOnElement()).to.be.null
    })

    it('sets selector:playground:priority if selectorPriority specified', () => {
      const selectorPriority = [
        'data-1',
        'data-2',
        'id',
        'class',
        'tag',
        'attributes',
        'nth-child',
      ]

      SelectorPlayground.defaults({
        selectorPriority,
      })

      expect(SelectorPlayground.getSelectorPriority()).to.eql(selectorPriority)
    })

    it('throws if selectorPriority contains an unsupported priority', () => {
      const fn = () => {
        SelectorPlayground.defaults({
          selectorPriority: [
            'id',
            'name',
          ],
        })
      }

      expect(fn).to.throw()
      .with.property('message')
      .and.include('`Cypress.SelectorPlayground.defaults()` called with invalid `selectorPriority` property. It must be one of: `data-*`, `id`, `class`, `tag`, `attributes`, `nth-child`. You passed: `name`')
    })

    it('throws if selectorPriority has an unsupported priority that contains a substring of a valid priority', () => {
      const fn = () => {
        SelectorPlayground.defaults({
          selectorPriority: [
            'idIsNotValid',
          ],
        })
      }

      expect(fn).to.throw()
      .with.property('message')
      .and.include('`Cypress.SelectorPlayground.defaults()` called with invalid `selectorPriority` property. It must be one of: `data-*`, `id`, `class`, `tag`, `attributes`, `nth-child`. You passed: `idIsNotValid`')
    })

    it('sets selector:playground:on:element if onElement specified', () => {
      const onElement = () => {}

      SelectorPlayground.defaults({ onElement })

      expect(SelectorPlayground.getOnElement()).to.equal(onElement)
    })

    it('throws if not passed an object', () => {
      const fn = () => {
        SelectorPlayground.defaults()
      }

      expect(fn).to.throw()
      .with.property('message')
      .and.include('`Cypress.SelectorPlayground.defaults()` must be called with an object. You passed: ')

      expect(fn).to.throw()
      .with.property('docsUrl')
      .and.include('https://on.cypress.io/selector-playground-api')
    })

    it('throws if selectorPriority is not an array', () => {
      const fn = () => {
        SelectorPlayground.defaults({ selectorPriority: 'foo' })
      }

      expect(fn).to.throw()
      .with.property('message')
      .and.include('`Cypress.SelectorPlayground.defaults()` called with invalid `selectorPriority` property. It must be an array. You passed: `foo`')

      expect(fn).to.throw()
      .with.property('docsUrl')
      .and.include('https://on.cypress.io/selector-playground-api')
    })

    it('throws if onElement is not a function', () => {
      const fn = () => {
        SelectorPlayground.defaults({ onElement: 'foo' })
      }

      expect(fn).to.throw()
      .with.property('message')
      .and.include('`Cypress.SelectorPlayground.defaults()` called with invalid `onElement` property. It must be a function. You passed: `foo`')

      expect(fn).to.throw()
      .with.property('docsUrl')
      .and.include('https://on.cypress.io/selector-playground-api')
    })
  })

  context('.getSelector', () => {
    it('uses defaults.selectorPriority', () => {
      const $div = $('<div data-cy=\'main button 123\' data-foo-bar-baz=\'quux\' data-test=\'qwerty\' data-foo=\'bar\' />')

      Cypress.$('body').append($div)

      expect(SelectorPlayground.getSelector($div)).to.eq('[data-cy="main button 123"]')

      SelectorPlayground.defaults({
        selectorPriority: ['data-foo'],
      })

      expect(SelectorPlayground.getSelector($div)).to.eq('[data-foo="bar"]')

      SelectorPlayground.defaults({
        onElement ($el) {
          return 'quux'
        },
      })

      expect(SelectorPlayground.getSelector($div)).to.eq('quux')

      SelectorPlayground.defaults({
        onElement ($el) {
          return null
        },
      })

      expect(SelectorPlayground.getSelector($div)).to.eq('[data-foo="bar"]')
    })
  })
})
