import Hello from './Hello.vue'
import { mount } from '@cypress/vue'

describe('Hello.vue', () => {
  it('shows hello', () => {
    mount(Hello)
    cy.contains('Hello World!')
  })
})

// TODO: fix with https://github.com/cypress-io/cypress/issues/30706
describe.skip('Several components', () => {
  const template = `
    <div>
      <hello></hello>
      <hello></hello>
      <hello></hello>
    </div>
  `
  const components = {
    hello: Hello,
  }

  it('greets the world 3 times', () => {
    mount({ template, components })
    cy.get('p').should('have.length', 3)
  })
})
