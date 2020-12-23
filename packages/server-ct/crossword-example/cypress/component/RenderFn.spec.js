import RenderFn from '@/components/RenderFn'
import { mount } from '@cypress/vue'

describe('Foo', () => {
  it('works', () => {
    mount(RenderFn)
    cy.get('h3').contains('Count is: 0')
    cy.get('button').contains('Increment').click()
    cy.get('h3').contains('Count is: 1')
  })
})
