import Foo from '@/components/Foo'
import { mount } from '@cypress/vue'

describe('Foo', () => {
  it('works', () => {
    mount(Foo)
    cy.get('h3').contains('Count is: 0')
    cy.get('button').contains('Increment').click()
    cy.get('h3').contains('Count is: 1')
  })
})
