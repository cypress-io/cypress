import React from 'react'
import { mount } from 'cypress-react-unit-test'
import User from './user'

it('renders user data', () => {
  const fakeUser = {
    name: 'Joni Baez',
    age: '32',
    address: '123, Charming Avenue',
  }

  // window.fetch
  cy.window().then(win => {
    // Cypress cleans up stubs automatically after each test
    // https://on.cypress.io/stub
    cy.stub(win, 'fetch')
      .withArgs('/123')
      .resolves({
        json: () => Promise.resolve(fakeUser),
      })
  })

  mount(<User id="123" />)
  cy.contains('summary', fakeUser.name).click()
  cy.contains('strong', fakeUser.age).should('be.visible')
  cy.contains(fakeUser.address)
})
