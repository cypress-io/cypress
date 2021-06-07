import { mountCallback } from '@cypress/vue'

/* eslint-env mocha */
describe('Declarative rendering', () => {
  // Vue code from https://vuejs.org/v2/guide/#Declarative-Rendering
  const template = `
    <div id="app">
      {{ message }}
    </div>
  `

  beforeEach(
    mountCallback({
      template,
      data () {
        return { message: 'Hello Vue!' }
      },
    }),
  )

  it('shows hello', () => {
    cy.contains('Hello Vue!')
  })

  it('changes message if data changes', () => {
    // mounted Vue instance is available under Cypress.vue
    Cypress.vue.message = 'Vue rocks!'
    cy.contains('Vue rocks!')
  })
})
