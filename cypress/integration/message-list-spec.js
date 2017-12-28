import MessageList from '../../components/MessageList.vue'
const mountVue = require('../..')

// common utils for MessageList
const getItems = () => cy.get('ul li')

/* eslint-env mocha */
describe('MessageList', () => {
  beforeEach(mountVue(MessageList))

  it('shows no messages', () => {
    getItems().should('not.exist')
  })

  it('shows messages', () => {
    Cypress.vue.messages = ['one', 'two']
    getItems().should('have.length', 2)
    cy.then(() => {
      Cypress.vue.messages.push('three')
      getItems().should('have.length', 3)
    })
  })
})

describe('MessageList as global component', () => {
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
    'a-list': MessageList
  }
  // extend Vue with global components
  const extensions = {
    components
  }
  beforeEach(mountVue({ template, data }, { extensions }))

  it('registers global component', () => {
    cy
      .window()
      .its('Vue')
      .invoke('component', 'message-list')
      // returns component constructor
      // so we can compare with our component's constructor (Ctor)
      .should('equal', MessageList._Ctor[0])
  })

  it('shows two items at the start in both lists', () => {
    getItems().should('have.length', 4)
  })
})

describe('MessageList with props', () => {
  const template = `
    <div>
      <MessageList :messages="messages"/>
    </div>
  `

  const data = () => ({ messages: ['uno', 'dos'] })

  const components = {
    MessageList
  }

  beforeEach(mountVue({ template, data, components }))

  it('shows two items at the start', () => {
    getItems().should('have.length', 2)
  })
})

describe('MessageList under message-list name', () => {
  const template = `
    <div>
      <message-list :messages="messages"/>
    </div>
  `

  const data = () => ({ messages: ['uno', 'dos'] })

  const components = {
    'message-list': MessageList
  }

  beforeEach(mountVue({ template, data, components }))

  it('starts with two items', () => {
    expect(Cypress.vue.messages).to.deep.equal(['uno', 'dos'])
  })

  it('shows two items at the start', () => {
    getItems().should('have.length', 2)
  })
})
