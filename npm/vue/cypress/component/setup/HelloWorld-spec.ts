import { h } from 'vue'
import { mount } from '@cypress/vue'
import HelloWorld from './HelloWorld.vue'

describe('HelloWorld', () => {
  it('normal mount', () => {
    mount(HelloWorld, { props: { msg: 'Hello Cypress' } })
  })

  it('functional mount', () => {
    mount(() => h(HelloWorld, { msg: 'Hello Cypress' }))
  })

  it('renders properly', () => {
    mount(HelloWorld, { props: { msg: 'Hello Cypress' } })
    cy.get('h1').should('contain', 'Hello Cypress')
  })

  it('adds 1 when clicking the plus button', () => {
    mount(HelloWorld, { props: { msg: 'Hello Cypress' } })

    cy.get('button')
    .should('contain', '0')
    .click()
    .should('contain', '1')
  })
})
