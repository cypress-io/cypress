import { mountCallback } from '@cypress/vue'

const template = `
    <div id="app">
      {{ message }}
    </div>
  `

describe('Mount component', () => {
  // hmm, there are no more options to pass

  const component = {
    template,
    data () {
      return {
        message: 'Hello Vue!',
      }
    },
  }

  beforeEach(mountCallback(component))

  it('shows hello', () => {
    cy.contains('Hello Vue!')
  })

  it('has version', () => {
    cy.window().its('Vue.version').should('be.a', 'string')
  })
})
