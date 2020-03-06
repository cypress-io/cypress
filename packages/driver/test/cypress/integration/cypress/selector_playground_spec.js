/* eslint-disable
    brace-style,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { SelectorPlayground, $ } = Cypress

const SELECTOR_DEFAULTS = [
  'data-cy', 'data-test', 'data-testid', 'id', 'class', 'tag', 'attributes', 'nth-child',
]

describe('src/cypress/selector_playground', () => {
  beforeEach(() => // reset state since this is a singleton
  {
    return SelectorPlayground.reset()
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
      SelectorPlayground.defaults({
        selectorPriority: ['foo'],
      })

      expect(SelectorPlayground.getSelectorPriority()).to.eql(['foo'])
    })

    it('sets selector:playground:on:element if onElement specified', () => {
      const onElement = function () {}

      SelectorPlayground.defaults({ onElement })

      expect(SelectorPlayground.getOnElement()).to.equal(onElement)
    })

    it('throws if not passed an object', () => {
      expect(() => {
        return SelectorPlayground.defaults()
      }).to.throw('Cypress.SelectorPlayground.defaults() must be called with an object. You passed: ')
    })

    it('throws if selectorPriority is not an array', () => {
      expect(() => {
        return SelectorPlayground.defaults({ selectorPriority: 'foo' })
      }).to.throw('Cypress.SelectorPlayground.defaults() called with invalid \'selectorPriority\' property. It must be an array. You passed: foo')
    })

    it('throws if onElement is not a function', () => {
      expect(() => {
        return SelectorPlayground.defaults({ onElement: 'foo' })
      }).to.throw('Cypress.SelectorPlayground.defaults() called with invalid \'onElement\' property. It must be a function. You passed: foo')
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

      expect(SelectorPlayground.getSelector($div)).to.eq('[data-foo=bar]')

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

      expect(SelectorPlayground.getSelector($div)).to.eq('[data-foo=bar]')
    })
  })
})
