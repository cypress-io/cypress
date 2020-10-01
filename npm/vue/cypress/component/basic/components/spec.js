/// <reference types="cypress" />
import MessageList from '../MessageList.vue'
import { mountCallback } from '@cypress/vue'

// common utils for MessageList
const getItems = () => cy.get('ul li')

describe('Global components', () => {
  // two different components, each gets "numbers" list
  // into its property "messages"
  const template = `
    <div>
      <message-list :messages="numbers"/>
      <a-list :messages="numbers"/>
    </div>
  `
  // our top level data
  const data = () => ({ numbers: ['uno', 'dos'] })
  // register same component globally under different names
  const components = {
    'message-list': MessageList,
    'a-list': MessageList,
  }
  // extend Vue with global components
  const extensions = {
    components,
  }

  beforeEach(mountCallback({ template, data }, { extensions }))

  it('shows two items at the start in both lists', () => {
    getItems().should('have.length', 4)
  })
})
