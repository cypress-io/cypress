import React from 'react'
import { Dropdown } from 'react-bootstrap'
import { mount } from 'cypress-react-unit-test'

class UserControls extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    return (
      <Dropdown>
        <Dropdown.Toggle>Top Toggle</Dropdown.Toggle>
        <Dropdown.Menu>
          <li>First</li>
          <li>Second</li>
          <li>Third</li>
        </Dropdown.Menu>
      </Dropdown>
    )
  }
}

UserControls.displayName = 'UserControls'

// https://github.com/bahmutov/cypress-react-unit-test/issues/99
describe('react-bootstrap Dropdown', () => {
  it('works', () => {
    mount(<UserControls />, {
      cssFile: 'node_modules/bootstrap/dist/css/bootstrap.min.css',
    })
    cy.contains('Top Toggle').click()
    cy.contains('li', 'First').should('be.visible')
    cy.get('li').should('have.length', 3)
  })
})
