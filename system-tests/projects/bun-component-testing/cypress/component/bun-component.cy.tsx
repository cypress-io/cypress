import React from 'react'
import { mount } from 'cypress/react'

describe('Bun Component Test', () => {
  it('should render a simple React component', () => {
    const TestComponent = () => (
      <div>
        <h1>Hello from Bun!</h1>
        <p>This component is tested using Bun package manager</p>
      </div>
    )

    mount(<TestComponent />)
    cy.contains('Hello from Bun!').should('be.visible')
    cy.contains('This component is tested using Bun package manager').should('be.visible')
  })

  it('should work with TypeScript', () => {
    interface Props {
      message: string
    }

    const TypeScriptComponent: React.FC<Props> = ({ message }) => (
      <div>
        <h2>TypeScript Component</h2>
        <p>{message}</p>
      </div>
    )

    mount(<TypeScriptComponent message="Bun + TypeScript + Cypress" />)
    cy.contains('TypeScript Component').should('be.visible')
    cy.contains('Bun + TypeScript + Cypress').should('be.visible')
  })
})
