import Todo from './Todo.vue'
import { mount } from '@cypress/vue'
import './style.css'

// TODO: fix with https://github.com/cypress-io/cypress/issues/30706
it.skip('imports and applies style', () => {
  // see https://vuejs.org/v2/guide/components-props.html
  const template = `
    <Todo title="write tests" v-bind:done="false" />
  `
  const components = {
    Todo,
  }

  mount({ template, components })
  cy.get('input[type=checkbox]')
  .should('not.be.checked')
  .check()
  .should('be.checked')

  // once the checkbox is set, there should be class "done" on the component
  cy.get('.todo')
  .should('have.class', 'done')
  // and the style was correctly applied
  .should('have.css', 'text-decoration-line', 'line-through')

  // and if we uncheck the element, the class should be gone
  cy.get('input[type=checkbox]').uncheck()
  cy.get('.todo').should('not.have.class', 'done')
})

it('passes props via options object', () => {
  // if you want to pass props right away, without creating a template use "props" key
  const options = {
    props: {
      title: 'finish test',
      done: true,
    },
  }

  mount(Todo, options)
  cy.get('.todo')
  .should('have.class', 'done')
  // and the style was correctly applied
  .should('have.css', 'text-decoration-line', 'line-through')
})
