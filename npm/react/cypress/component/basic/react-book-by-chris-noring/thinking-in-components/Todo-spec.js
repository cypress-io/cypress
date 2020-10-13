/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import Todo from './Todo'

it('renders Todo', () => {
  const todo = {
    title: 'clean',
    done: false,
    id: 1,
  }
  const handleChecked = cy.stub()
  mount(<Todo todo={todo} key={todo.id} handleChecked={handleChecked} />)
  cy.contains('clean')
  cy.get('input[type=checkbox]')
    .check()
    .then(() => {
      expect(handleChecked).to.have.been.calledOnce
    })
})
