/// <reference path="../../../../dist/index.d.ts" />
import Message from './Message.vue'
import { mount } from '@cypress/vue'

// test example from
// https://github.com/alexjoverm/vue-testing-series/blob/lesson-1/test/Message.test.js

const createCmp = (propsData) => mount(Message, { propsData })

/* eslint-env mocha */
describe('Message', () => {
  describe('properties', () => {
    it('has a message property', () => {
      createCmp({ message: 'hey' })
      cy.wrap(Cypress).its('vue.message').should('equal', 'hey')
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
        expect(message.validator && message.validator('a')).to.be.not.ok
        expect(message.validator && message.validator('aa')).to.be.ok
      })
    })
  })

  describe('Events', () => {
    it('calls handleClick when click on message', () => {
      // need to spy on the _original_ method before it gets
      // passed to the Vue.extend and gets into private closure
      const spy = cy.spy(Message.methods, 'handleClick')

      createCmp({ message: 'Cat' })
      cy.get('.message')
      .click()
      .then(() => {
        expect(spy).to.be.calledOnce
      })
    })

    it('triggers a message-clicked event clicked', () => {
      createCmp({ message: 'Cat' }).then(() => {
        cy.get('.message')
        .click()
        .then(() => {
          expect(Cypress.vueWrapper.emitted()).to.have.property('message-clicked')
        })
      })
    })
  })
})
