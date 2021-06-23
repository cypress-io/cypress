import BaseAccordion from './BaseAccordion'
import { h } from 'vue'

it('renders', () => {
  cy.mount(BaseAccordion,
    {
      slots: {
        default() {
          return h('h1', 'inner content')
        },
        header() {
          const content = h(`p`, `Header Content`)
          return h('header', [content])
        }
      }
    }
  )
    .get('header').as('header')
    .should('contain.text', 'Header Content')
    .get('@header')
    .click()
    .get('h1')
    .should('be.visible')
    .should('contain.text', `inner content`)
    .get('@header')
    .click()
    .get('h1')
    .should('not.exist')
})