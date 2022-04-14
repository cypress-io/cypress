/// <reference types="cypress" />
import React from 'react'
import { mount } from '@cypress/react'
import { InputAccumulator } from './input-accumulator'

it('should rerender preserving input values', () => {
  mount(<InputAccumulator input="initial" />).then(({ rerender }) => {
    cy.get('li').eq(0).contains('initial')

    rerender(<InputAccumulator input="Rerendered value" />)
    cy.get('li:nth-child(1)').should('contain', 'initial')
    cy.get('li:nth-child(2)').should('contain', 'Rerendered value')

    rerender(<InputAccumulator input="Second rerendered value" />)

    cy.get('li:nth-child(1)').should('contain', 'initial')
    cy.get('li:nth-child(2)').should('contain', 'Rerendered value')
    cy.get('li:nth-child(3)').should('contain', 'Second rerendered value')
  })
})
