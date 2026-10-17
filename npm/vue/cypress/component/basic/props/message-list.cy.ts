/// <reference types="cypress" />
import type { ComponentPublicInstance } from 'vue'
import MessageList from '../MessageList.vue'
import { mount } from '@cypress/vue'

// common utils for MessageList
const getItems = () => cy.get('ul li')

describe('Props', () => {
  context('Set props when mounting', () => {
    it('has props', () => {
      const messages = ['one 🍎', 'two 🍌']

      mount(MessageList, { props: { messages } })
      getItems()
      .should('have.length', 2)
      .then((list) => {
        expect(list[0].textContent).to.contain(messages[0])
        expect(list[1].textContent).to.contain(messages[1])
      })
    })
  })

  context('MessageList without props', () => {
    beforeEach(() => {
      mount(MessageList)
    })

    it('shows no messages', () => {
      getItems().should('not.exist')
    })

    it('shows messages', () => {
      getItems().should('not.exist')
      // after mounting we can set props using "vueWrapper.setProps"
      cy.log('setting messages').then(() => {
        Cypress.vueWrapper.setProps({ messages: ['one', 'two'] })
      })

      getItems().should('have.length', 2)
    })
  })

  // TODO: fix with https://github.com/cypress-io/cypress/issues/30706
  context.skip('MessageList with props', () => {
    const template = `
      <div>
        <MessageList :messages="messages"/>
      </div>
    `

    const data = () => ({ messages: ['uno', 'dos'] })

    const components = {
      MessageList,
    }

    beforeEach(() => {
      mount({ template, data, components })
    })

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

    beforeEach(() => {
      mount({ template, data, components })
    })

    it('starts with two items', () => {
      // Safe because the component mounted in beforeEach gets its data from data()
      const vm = Cypress.vue as ComponentPublicInstance<{}, {}, ReturnType<typeof data>>

      expect(vm.messages).to.deep.equal(['uno', 'dos'])
    })

    // TODO: fix with https://github.com/cypress-io/cypress/issues/30706
    it.skip('shows two items at the start', () => {
      getItems().should('have.length', 2)
    })
  })
})
