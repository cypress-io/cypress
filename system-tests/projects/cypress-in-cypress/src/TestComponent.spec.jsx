import React from 'react'

describe('<TestComponent />', () => {
  it('renders a test component', () => {
    cy.mount(<div>Test</div>)
  })
})
