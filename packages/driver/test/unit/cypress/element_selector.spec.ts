/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, afterEach } from 'vitest'
import ElementSelector, { DEFAULT_SELECTOR_PRIORITIES } from '../../../src/cypress/element_selector'

describe('src/cypress/element_selector', () => {
  describe('.defaults', () => {
    afterEach(() => {
      ElementSelector.defaults({ selectorPriority: [...DEFAULT_SELECTOR_PRIORITIES] })
    })

    it('accepts every documented selector priority', () => {
      const selectorPriority: Cypress.SelectorPriority[] = ['data-cy', 'data-test-id', 'id', 'class', 'tag', 'attributes', 'nth-child', 'attribute:role', 'attribute:aria-label', 'name']

      ElementSelector.defaults({ selectorPriority })

      expect(ElementSelector.getSelectorPriority()).toEqual(selectorPriority)
    })

    it.each([
      'data-',
      'attribute:',
      'ids',
      'myclass',
      'tag-name',
      'nth-of-type',
      'Name',
      'xdata-cy',
      'id\nname',
    ])('rejects the selector priority %j', (priority) => {
      // Safe because an invalid priority, which the type rules out, is what is under test
      const selectorPriority = [priority] as Cypress.SelectorPriority[]

      expect(() => ElementSelector.defaults({ selectorPriority })).toThrow('invalid `selectorPriority` property')
    })
  })
})
