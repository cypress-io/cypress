import { mount } from '@cypress/vue'

// TODO: fix with https://github.com/cypress-io/cypress/issues/30706
describe.skip('Declarative rendering', () => {
  // Vue code from https://vuejs.org/v2/guide/#Declarative-Rendering
  const template = `
    <div id="app">
      {{ message }}
    </div>
  `

  beforeEach(() => {
    mount({
      template,
      data () {
        return { message: 'Hello Vue!' }
      },
    })
  })

  it('shows hello', () => {
    cy.contains('Hello Vue!')
  })

  it('changes message if data changes', () => {
    // mounted Vue instance is available under Cypress.vueWrapper
    Cypress.vueWrapper.setData({ message: 'Vue rocks!' })
    cy.contains('Vue rocks!')
  })
})
