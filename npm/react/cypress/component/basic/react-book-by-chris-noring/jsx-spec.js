// a few exploratory tests to go with
// https://softchris.github.io/books/react/jsx/

/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'

const Elem = () => <h1>Some title</h1>

it('has title attribute', () => {
  mount(<Elem title="a title"></Elem>)
  cy.contains('h1', 'Some title') // the element contains header
})

it('calls React.createElement with props and text', () => {
  cy.spy(React, 'createElement')
  mount(<Elem title="a title"></Elem>).then(() => {
    expect(React.createElement).to.have.been.calledWith(Elem, {
      title: 'a title',
    })
  })
})

it('renders fragments', () => {
  const ElemFragment = () => (
    <React.Fragment>
      <h1>Some title</h1>
      <div>Some content</div>
    </React.Fragment>
  )
  mount(<ElemFragment />)
  cy.contains('h1', 'Some title')
  cy.contains('Some content')
})
