import Hello from '../../components/Hello.vue'
const mountVue = require('../..')

/* eslint-env mocha */
describe('Hello.vue', () => {
  beforeEach(mountVue(Hello))

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
    hello: Hello
  }
  beforeEach(mountVue({ template, components }))

  it('greets the world 3 times', () => {
    cy.get('p').should('have.length', 3)
  })
})
