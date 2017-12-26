import ButtonCounter from '../../components/ButtonCounter.vue'
const mountVue = require('../..')

/* eslint-env mocha */
describe('ButtonCounter', () => {
  beforeEach(mountVue(ButtonCounter))

  it('starts with zero', () => {
    cy.contains('button', '0')
  })

  it('increments the counter on click', () => {
    cy.get('button').click().click().click().contains('3')
  })

  it('emits "increment" event on click', () => {
    const spy = cy.spy()
    Cypress.vue.$on('increment', spy)
    cy.get('button').click().click().then(() => {
      expect(spy).to.be.calledTwice
    })
  })
})
