/// <reference types="cypress" />
import type { ElementSelectorAPI, SelectorType } from '../../../src/cypress/element_selector'
import { DEFAULT_SELECTOR_PRIORITIES } from '../../../src/cypress/element_selector'
const { $: $cypress } = Cypress.$Cypress
const ElementSelector = Cypress.ElementSelector as ElementSelectorAPI

const SELECTOR_DEFAULTS: SelectorType[] = [...DEFAULT_SELECTOR_PRIORITIES]

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
      const selectorPriority: SelectorType[] = [
        'data-1',
        'data-2',
        'id',
        'class',
        'tag',
        'attributes',
        'nth-child',
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
})
