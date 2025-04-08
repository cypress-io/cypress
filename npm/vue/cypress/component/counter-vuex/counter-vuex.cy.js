// testing Vuex component
// https://github.com/vuejs/vuex/tree/dev/examples/counter
import Counter from './Counter.vue'
import store from './store'
import { mount } from '@cypress/vue'

// TODO: fix with https://github.com/cypress-io/cypress/issues/30706
describe.skip('Vuex Counter', () => {
  // configure component
  const extensions = {
    plugins: [store],
    components: {
      Counter,
    },
  }

  // define component template
  const template = '<counter />'

  // define count get and set helpers
  const getCount = () => Cypress.vue.$store.state.count
  const setCount = (value) => Cypress.vue.$store.commit('set', value)

  // initialize a fresh Vue app before each test
  beforeEach(() => {
    mount({ template, store }, { extensions })
  })

  it('starts with zero', () => {
    cy.contains('0 times')
  })

  it('increments the counter on click of "+"', () => {
    cy.contains('button', '+').click()
    cy.contains('1 times')
  })

  it('decrements the counter on click of "-"', () => {
    cy.contains('button', '-').click()
    cy.contains('0 times')
  })

  it('increments the counter if count is odd', () => {
    setCount(3) // start with an odd number
    cy.contains('odd')
    cy.contains('button', 'Increment if odd').as('btn').click()
    cy.contains('even')
    cy.get('@btn').click()
    cy.contains('even')
  })

  it('asynchronously increments counter', () => {
    const count = getCount()

    // increment mutation is delayed by 1 second
    // Cypress waits 4 seconds by default
    cy.contains('button', 'Increment async').click()
    cy.contains(`${count + 1} times`)
  })

  it('count is zero when input is cleared', () => {
    cy.get('input').type(`{selectall}{backspace}`)
    cy.contains('0 times')
  }),
  it('set count via input field', () => {
    const count = 42

    cy.get('input').type(`{selectall}{backspace}${count}`)
    cy.contains(`${count} times`)
  })
})
