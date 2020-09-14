import * as React from 'react'
import { Motion } from './Motion'
import { mount } from 'cypress-react-unit-test'

describe('framer-motion', () => {
  it('Renders component and retries the animation', () => {
    mount(<Motion />)

    cy.get("[data-testid='motion']").should('have.css', 'border-radius', '50%')
    cy.get("[data-testid='motion']").should('have.css', 'border-radius', '20%')
  })

  it('Mocks setTimeout and requestAnimationFrame', () => {
    cy.clock()
    mount(<Motion />)

    // CI is slow, so check only the approximate values
    cy.tick(800)
    cy.get("[data-testid='motion']").within(element => {
      expect(parseInt(element.css('borderRadius'))).to.equal(43)
    })

    cy.tick(100)
    cy.get("[data-testid='motion']").within(element => {
      expect(parseInt(element.css('borderRadius'))).to.equal(48)
    })
  })
})
