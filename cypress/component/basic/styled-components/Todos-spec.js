/// <reference types="cypress" />
import { mount } from 'cypress-react-unit-test'
import React, { Component } from 'react'
import Todos from './Todos'

const todos = [
  {
    title: 'clean',
    done: false,
    id: 1,
  },
  {
    title: 'do the dishes',
    done: true,
    id: 2,
  },
]

class App extends Component {
  render() {
    return <Todos todos={todos} />
  }
}

it('renders todos', () => {
  cy.viewport(400, 500)
  mount(<App />)
  cy.contains('[data-cy="todo"]', 'clean')
    .find('input[type=checkbox]')
    .should('not.be.checked')
  cy.contains('[data-cy="todo"]', 'do the dishes')
    .find('input[type=checkbox]')
    .should('be.checked')
})
