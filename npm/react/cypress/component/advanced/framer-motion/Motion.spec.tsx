import * as React from 'react'
import { Motion } from './Motion'
import { mount } from '@cypress/react'

describe('framer-motion', () => {
  it('Renders component and retries the animation', () => {
    mount(<Motion />)

    cy.get('[data-testid=\'motion\']').should('have.css', 'border-radius', '50%')
    cy.get('[data-testid=\'motion\']').should('have.css', 'border-radius', '20%')
  })

  // NOTE: looks like cy.tick issue. Refer to the https://github.com/bahmutov/cypress-react-unit-test/issues/420
  it.skip('Mocks setTimeout and requestAnimationFrame', () => {
    cy.clock()
    mount(<Motion />)

    // CI is slow, so check only the approximate values
    cy.tick(800)
    cy.get('[data-testid=\'motion\']').within((element) => {
      expect(parseInt(element.css('borderRadius'))).to.equal(43)
    })

    cy.tick(100)
    cy.get('[data-testid=\'motion\']').within((element) => {
      expect(parseInt(element.css('borderRadius'))).to.equal(48)
    })
  })
})
