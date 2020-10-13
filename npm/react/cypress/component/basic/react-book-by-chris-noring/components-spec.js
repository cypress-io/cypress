// from https://softchris.github.io/books/react/components/
/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'

class Jedi extends React.Component {
  render() {
    return <div>I am a Jedi Component</div>
  }
}

class Application extends React.Component {
  render() {
    return (
      <div>
        <Jedi />
      </div>
    )
  }
}

it('renders App and Jedi', () => {
  mount(<Application />)
  cy.contains('I am a Jedi')
})
