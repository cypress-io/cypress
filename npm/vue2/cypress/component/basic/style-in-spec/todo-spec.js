import Todo from './Todo.vue'
import { mount } from '@cypress/vue'

// let's make sure we can show the checked Todo item using CSS
const style = `
  .todo.done {
    text-decoration: line-through;
    color: gray;
  }
`

it('injects local style', () => {
  // see https://vuejs.org/v2/guide/components-props.html
  const template = `
    <Todo title="write tests" v-bind:done="false" />
  `
  const components = {
    Todo,
  }

  mount({ template, components }, { style })
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
  // if you want to pass props right away, without creating a template
  // use "propsData" key
  const options = {
    propsData: {
      title: 'finish test',
      done: true,
    },
    style,
  }

  mount(Todo, options)
  cy.get('.todo')
  .should('have.class', 'done')
  // and the style was correctly applied
  .should('have.css', 'text-decoration-line', 'line-through')
})
