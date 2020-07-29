import React from 'react'
import PizzaProps from './PizzaProps'
import { mount } from 'cypress-react-unit-test'

const ingredients = ['bacon', 'tomato', 'mozzarella', 'pineapples']

describe('PizzaProps', () => {
  it('mocks method in the default props', () => {
    cy.stub(PizzaProps.defaultProps, 'fetchIngredients')
      .resolves({ args: { ingredients } })
      .as('fetchMock')
    mount(<PizzaProps />)
    cy.contains('button', /cook/i).click()

    for (const ingredient of ingredients) {
      cy.contains(ingredient)
    }

    cy.get('@fetchMock').should('have.been.calledOnce')
  })
})
