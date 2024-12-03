import { mount } from '@cypress/vue'

// TODO: fix with https://github.com/cypress-io/cypress/issues/30706
describe.skip('Declarative rendering', () => {
  // List example from https://vuejs.org/v2/guide/#Declarative-Rendering
  const template = `
    <ol>
      <li v-for="todo in todos">
        {{ todo.text }}
      </li>
    </ol>
  `

  function data () {
    return {
      todos: [
        { text: 'Learn JavaScript' },
        { text: 'Learn Vue' },
        { text: 'Build something awesome' },
      ],
    }
  }

  beforeEach(() => {
    mount({ template, data })
  })

  it('shows 3 items', () => {
    cy.get('li').should('have.length', 3)
  })

  it('can add an item', () => {
    Cypress.vue.todos.push({ text: 'Test using Cypress' })
    cy.get('li').should('have.length', 4)
  })
})
