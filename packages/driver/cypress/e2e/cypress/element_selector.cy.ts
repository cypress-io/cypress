/// <reference types="cypress" />
import type { ElementSelectorAPI } from '../../../src/cypress/element_selector'
import { DEFAULT_SELECTOR_PRIORITIES } from '../../../src/cypress/element_selector'
const { $: $cypress } = Cypress.$Cypress
const ElementSelector = Cypress.ElementSelector as ElementSelectorAPI

const SELECTOR_DEFAULTS: Cypress.SelectorPriority[] = [...DEFAULT_SELECTOR_PRIORITIES]

describe('src/cypress/element_selector', () => {
  beforeEach(() => {
    ElementSelector.reset()
  })

  it('has defaults', () => {
    expect(ElementSelector.getSelectorPriority()).to.deep.eq(SELECTOR_DEFAULTS)
  })

  context('.defaults', () => {
    it('is noop if not called with selectorPriority', () => {
      ElementSelector.defaults({})
      expect(ElementSelector.getSelectorPriority()).to.deep.eq(SELECTOR_DEFAULTS)
    })

    it('sets element:selector:priority if selectorPriority specified', () => {
      const selectorPriority: Cypress.SelectorPriority[] = [
        'data-1',
        'data-2',
        'id',
        'class',
        'tag',
        'attributes',
        'nth-child',
        'name',
        'attribute:aria-label',
        'attribute:aria-labelledby',
      ]

      ElementSelector.defaults({
        selectorPriority,
      })

      expect(ElementSelector.getSelectorPriority()).to.eql(selectorPriority)
    })

    it('throws if not passed an object', () => {
      const fn = () => {
        ElementSelector.defaults(undefined as any)
      }

      expect(fn).to.throw()
      .with.property('message')
      .and.include('`Cypress.ElementSelector.defaults()` must be called with an object. You passed: ')

      expect(fn).to.throw()
      .with.property('docsUrl')
      .and.include('https://on.cypress.io/element-selector-api')
    })

    it('throws if selectorPriority is not an array', () => {
      const fn = () => {
        ElementSelector.defaults({ selectorPriority: 'foo' as any })
      }

      expect(fn).to.throw()
      .with.property('message')
      .and.include('`Cypress.ElementSelector.defaults()` called with invalid `selectorPriority` property. It must be an array. You passed: `foo`')

      expect(fn).to.throw()
      .with.property('docsUrl')
      .and.include('https://on.cypress.io/element-selector-api')
    })

    it('throws if selectorPriority contains an unsupported priority', () => {
      const fn = () => {
        ElementSelector.defaults({
          selectorPriority: [
            'id',
            // @ts-expect-error - invalid priority
            'attr',
          ],
        })
      }

      expect(fn).to.throw()
      .with.property('message')
      .and.include('`Cypress.ElementSelector.defaults()` called with invalid `selectorPriority` property. It must be one of: `data-*`, `attribute:*`, `id`, `class`, `tag`, `name`,`attributes`, or `nth-child`. You passed: `attr`')
    })

    it('throws if selectorPriority has an unsupported priority that contains a substring of a valid priority', () => {
      const fn = () => {
        ElementSelector.defaults({
          selectorPriority: [
            // @ts-expect-error - invalid priority
            'idIsNotValid',
          ],
        })
      }

      expect(fn).to.throw()
      .with.property('message')
      .and.include('`Cypress.ElementSelector.defaults()` called with invalid `selectorPriority` property. It must be one of: `data-*`, `attribute:*`, `id`, `class`, `tag`, `name`,`attributes`, or `nth-child`. You passed: `idIsNotValid`')
    })
  })

  context('.getSelector', () => {
    it('uses defaults.selectorPriority', () => {
      const $div = $cypress('<div data-cy=\'main button 123\' data-foo-bar-baz=\'quux\' data-test=\'qwerty\' data-foo=\'bar\' />')

      Cypress.$('body').append($div)

      expect(ElementSelector.getSelector($div)).to.eq('[data-cy="main button 123"]')

      ElementSelector.defaults({
        selectorPriority: ['data-foo'],
      })

      expect(ElementSelector.getSelector($div)).to.eq('[data-foo="bar"]')
    })
  })

  describe('Cypress.SelectorPlayground (renamed)', () => {
    it('throws error when calling defaults()', () => {
      const fn = () => {
        Cypress.SelectorPlayground.defaults({})
      }

      expect(fn).to.throw()
      .with.property('message')
      .and.include('`Cypress.SelectorPlayground.defaults()` has been renamed to `Cypress.ElementSelector.defaults()`')

      expect(fn).to.throw()
      .with.property('message')
      .and.include('Please update your code to use `Cypress.ElementSelector` instead')
    })

    it('throws error when calling getSelector()', () => {
      const fn = () => {
        Cypress.SelectorPlayground.getSelector($cypress('body'))
      }

      expect(fn).to.throw()
      .with.property('message')
      .and.include('`Cypress.SelectorPlayground.getSelector()` has been renamed to `Cypress.ElementSelector.getSelector()`')

      expect(fn).to.throw()
      .with.property('message')
      .and.include('Please update your code to use `Cypress.ElementSelector` instead')
    })
  })
})
