import './todos.css'
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import Todos from './Todos'

describe('reactive-state Todos', () => {
  it('adds and removes todos', () => {
    mount(
      <div className="App">
        <Todos />
      </div>,
    )
    cy.get('.add-todo input').type('code{enter}')
    cy.get('.add-todo input').type('test')
    cy.get('.add-todo')
      .contains('Add')
      .click()
    // now check things
    cy.get('.todos .todo').should('have.length', 2)
    // remove the first one
    cy.get('.todos .todo')
      .first()
      .should('contain', 'code')
      .find('.todo_remove')
      .click()
    // single todo left
    cy.get('.todos .todo')
      .should('have.length', 1)
      .first()
      .should('contain', 'test')
  })
})
