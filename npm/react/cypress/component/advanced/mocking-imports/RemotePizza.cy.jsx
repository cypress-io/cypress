import React from 'react'
import RemotePizza from './RemotePizza'
import { mount } from '@cypress/react'
// prepare for import mocking
import * as services from './services'

const ingredients = ['bacon', 'tomato', 'mozzarella', 'pineapples']

// TODO: Support stubbing ES Modules
describe.skip('RemotePizza', () => {
  it('mocks named import from services', () => {
    cy.stub(services, 'fetchIngredients')
    .resolves({ args: { ingredients } })
    .as('fetchMock')

    mount(<RemotePizza />)
    cy.contains('button', /cook/i).click()

    for (const ingredient of ingredients) {
      cy.contains(ingredient)
    }

    cy.get('@fetchMock').should('have.been.calledOnce')
  })
})
