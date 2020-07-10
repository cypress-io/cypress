import { mount } from 'cypress-vue-unit-test'
import HelloWorld from './HelloWorld.vue'

describe('HelloWorld', () => {
  it('shows links', () => {
    // @ts-ignore
    mount(HelloWorld)
    // there are a lot of links
    cy.get('li').should('have.length.gt', 10)
  })
})
