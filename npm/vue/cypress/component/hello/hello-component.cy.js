import Hello from './Hello.vue'
import { mountCallback } from '@cypress/vue'

/* eslint-env mocha */
describe('Hello.vue', () => {
  beforeEach(mountCallback(Hello))

  it('shows hello', () => {
    cy.contains('Hello World!')
  })
})

describe('Several components', () => {
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

  beforeEach(mountCallback({ template, components }))

  it('greets the world 3 times', () => {
    cy.get('p').should('have.length', 3)
  })
})
