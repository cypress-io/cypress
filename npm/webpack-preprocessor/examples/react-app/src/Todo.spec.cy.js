import React from 'react'
import { Todo } from './App'
import { mount } from '@cypress/react'

describe('Todo', () => {
  it('renders new item', () => {
    const todo = {
      text: 'test item',
      isCompleted: false,
    }

    mount(
      <Todo todo={todo} />,
      {
        stylesheets: [
          'https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.2/css/bulma.css',
        ],
      },
    )

    cy.contains('.todo button', 'Complete')
  })

  it('renders with styles', () => {
    const todo = {
      text: 'test item',
      isCompleted: false,
    }
    const TestTodo = () => <div className="app"><Todo todo={todo} /></div>

    mount(
      <TestTodo />,
      {
        stylesheets: [
          'https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.2/css/bulma.css',
        ],
        cssFile: 'src/App.css',
      },
    )

    cy.contains('.todo button', 'Complete')
  })

  it('renders completed item', () => {
    const todo = {
      text: 'test item',
      isCompleted: true,
    }

    mount(
      <Todo todo={todo} />,
      {
        stylesheets: [
          'https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.2/css/bulma.css',
        ],
      },
    )

    cy.contains('.todo button', 'Redo')
  })

  it('deletes an item', () => {
    const todo = {
      text: 'test item',
      isCompleted: false,
    }
    const removeTodo = cy.stub().as('remove')

    mount(
      <Todo todo={todo} index={123} removeTodo={removeTodo} />,
      {
        stylesheets: [
          'https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.2/css/bulma.css',
        ],
      },
    )

    cy.contains('.todo', 'test item')
    .find('[data-cy="remove"]').click()

    cy.get('@remove').should('have.been.calledWith', 123)
  })

  it('completes todo', () => {
    const todo = {
      text: 'test item',
      isCompleted: false,
    }
    const toggleTodo = cy.stub().as('toggle')

    mount(
      <Todo todo={todo} index={123} toggleTodo={toggleTodo} />,
      {
        stylesheets: [
          'https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.2/css/bulma.css',
        ],
      },
    )

    cy.contains('.todo', 'test item')
    .contains('Complete').click()

    cy.get('@toggle').should('have.been.calledWith', 123)
  })
})
