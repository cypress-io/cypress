// example from https://reactjs.org/docs/testing-recipes.html
import React from 'react'
import { mount } from 'cypress-react-unit-test'

function Hello(props) {
  if (props.name) {
    return <h1>Hello, {props.name}!</h1>
  } else {
    return <span>Hey, stranger</span>
  }
}

// shows multiple mount commands
it('renders with or without a name', () => {
  mount(<Hello />)
  cy.contains('Hey, stranger').should('be.visible')

  mount(<Hello name="Jenny" />)
  cy.contains('h1', 'Hello, Jenny!').should('be.visible')

  mount(<Hello name="Margaret" />)
  cy.contains('h1', 'Hello, Margaret!').should('be.visible')
})

// data-driven testing
const names = ['Jenny', 'Margaret']
names.forEach(name => {
  it(`greets ${name}`, () => {
    mount(<Hello name={name} />)
    cy.contains('h1', `Hello, ${name}!`).should('be.visible')
  })
})
