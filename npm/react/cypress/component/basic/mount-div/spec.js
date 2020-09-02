/// <reference types="cypress" />
/// <reference types="../../lib" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'

function Button() {
  return <button>Hello</button>
}

describe('mounting a div', () => {
  it('works', () => {
    mount(<div className="example">Works</div>)
    cy.contains('Works').should('be.visible')
  })

  // https://github.com/bahmutov/cypress-react-unit-test/issues/98
  it('mount multiple components', function() {
    mount(
      <div>
        <Button />
        <hr />
        <Button />
      </div>,
    )
    cy.get('button').should('have.length', 2)
  })
})
