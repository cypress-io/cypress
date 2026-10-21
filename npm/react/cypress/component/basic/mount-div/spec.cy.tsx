import React from 'react'
import { mount } from '@cypress/react'

function Button () {
  return <button>Hello</button>
}

describe('mounting a div', () => {
  it('works', () => {
    mount(<div className="example">Works</div>)
    cy.contains('Works').should('be.visible')
  })

  it('mount multiple components', function () {
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
