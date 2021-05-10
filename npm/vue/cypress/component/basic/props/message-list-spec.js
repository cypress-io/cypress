/// <reference types="cypress" />
import MessageList from '../MessageList.vue'
import { mount, mountCallback } from '@cypress/vue'

// common utils for MessageList
const getItems = () => cy.get('ul li')

describe('Props', () => {
  context('Set props when mounting', () => {
    it('has props', () => {
      const messages = ['one 🍎', 'two 🍌']

      mount(MessageList, { propsData: { messages } })
      getItems()
      .should('have.length', 2)
      .then((list) => {
        expect(list[0].textContent.trim()).to.equal(messages[0])
        expect(list[1].textContent.trim()).to.equal(messages[1])
      })
    })
  })

  context('MessageList without props', () => {
    beforeEach(mountCallback(MessageList))

    it('shows no messages', () => {
      getItems().should('not.exist')
    })

    it('shows messages', () => {
      getItems().should('not.exist')
      // after mounting we can set props using "Cypress.vue"
      cy.log('setting messages').then(() => {
        Cypress.vue.messages = ['one', 'two']
      })

      getItems().should('have.length', 2)
      cy.then(() => {
        Cypress.vue.messages.push('three')
        getItems().should('have.length', 3)
      })
    })
  })

  context('MessageList with props', () => {
    const template = `
    <div>
      <MessageList :messages="messages"/>
    </div>
  `

    const data = () => ({ messages: ['uno', 'dos'] })

    const components = {
      MessageList,
    }

    beforeEach(mountCallback({ template, data, components }))

    it('shows two items at the start', () => {
      getItems().should('have.length', 2)
    })
  })

  context('MessageList under message-list name', () => {
    const template = `
    <div>
      <message-list :messages="messages"/>
    </div>
  `

    const data = () => ({ messages: ['uno', 'dos'] })

    const components = {
      'message-list': MessageList,
    }

    beforeEach(mountCallback({ template, data, components }))

    it('starts with two items', () => {
      expect(Cypress.vue.messages).to.deep.equal(['uno', 'dos'])
    })

    it('shows two items at the start', () => {
      getItems().should('have.length', 2)
    })
  })
})
