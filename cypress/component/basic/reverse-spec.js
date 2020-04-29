import {mountCallback} from 'cypress-vue-unit-test'

/* eslint-env mocha */
describe('Handling User Input', () => {
  // Example from https://vuejs.org/v2/guide/#Handling-User-Input
  const template = `
    <div>
      <p>{{ message }}</p>
      <button v-on:click="reverseMessage">Reverse Message</button>
    </div>
  `

  const data = {
    message: 'Hello Vue.js!'
  }

  const methods = {
    reverseMessage: function () {
      this.message = this.message.split('').reverse().join('')
    }
  }

  beforeEach(mountCallback({ template, data, methods }))

  it('reverses text', () => {
    cy.contains('Hello Vue')
    cy.get('button').click()
    cy.contains('!sj.euV olleH')
  })
})
