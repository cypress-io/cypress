import { mount } from '@cypress/vue'

// TODO: fix with https://github.com/cypress-io/cypress/issues/30706
describe.skip('Handling User Input', () => {
  // Example from https://vuejs.org/v2/guide/#Handling-User-Input
  const template = `
    <div>
      <p>{{ message }}</p>
      <button v-on:click="reverseMessage">Reverse Message</button>
    </div>
  `

  function data () {
    return { message: 'Hello Vue.js!' }
  }

  const methods = {
    reverseMessage () {
      this.message = this.message.split('').reverse().join('')
    },
  }

  beforeEach(() => {
    mount({ template, data, methods })
  })

  it('reverses text', () => {
    cy.contains('Hello Vue')
    cy.get('button').click()
    cy.contains('!sj.euV olleH')
  })
})
