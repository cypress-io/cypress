import React from 'react'
import PizzaProps, { defaultProps } from './PizzaProps'
import { mount } from '@cypress/react'

const ingredients = ['bacon', 'tomato', 'mozzarella', 'pineapples']

describe('PizzaProps', () => {
  it('mocks method in the default props', () => {
    cy.stub(defaultProps, 'fetchIngredients')
    .as('fetchMock')
    .resolves({ args: { ingredients } })

    mount(<PizzaProps />)
    cy.contains('button', /cook/i).click()

    for (const ingredient of ingredients) {
      cy.contains(ingredient)
    }

    cy.get('@fetchMock').should('have.been.calledOnce')
  })
})
