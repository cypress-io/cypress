import Message from '../../components/Message.vue'
const mountVue = require('../..')

// test example from
// https://github.com/alexjoverm/vue-testing-series/blob/lesson-1/test/Message.test.js

const createCmp = propsData => mountVue(Message, { propsData })()

/* eslint-env mocha */
describe('Message', () => {
  describe('properties', () => {
    it('has a message property', () => {
      createCmp({ message: 'hey' })
      cy.wrap(Cypress).its('vue.message').should('equal', 'hey')
    })

    it('has no cat property', () => {
      createCmp({ cat: 'hey', message: 'hey' })
      cy.wrap(Cypress).its('vue').should('not.have.property', 'cat')
    })

    it('Paco is the default author', () => {
      createCmp({ message: 'hey' })
      cy.wrap(Cypress).its('vue.author').should('equal', 'Paco')
    })

    describe('Validation', () => {
      let message

      beforeEach(() => {
        createCmp().then(() => {
          message = Cypress.vue.$options.props.message
        })
      })

      it('message is of type string', () => {
        expect(message.type).to.equal(String)
      })

      it('message is required', () => {
        expect(message.required).to.be.true
      })

      it('message has at least length 2', () => {
        expect(message.validator && message.validator('a')).to.be.falsy
        expect(message.validator && message.validator('aa')).to.be.truthy
      })
    })
  })
})
