/// <reference types="cypress" />
import Card from './card-without-effect.jsx'
import React from 'react'
import { mount, unmount } from 'cypress-react-unit-test'
import { unmountComponentAtNode } from 'react-dom'

it('should select null after timing out', () => {
  const onSelect = cy.stub()
  // https://on.cypress.io/clock
  cy.clock()
  mount(<Card onSelect={onSelect} />)

  cy.tick(100).then(() => {
    expect(onSelect).to.not.have.been.called
  })
  cy.tick(5000).then(() => {
    expect(onSelect).to.have.been.calledWith(null)
  })
})

it('should cleanup on being removed', () => {
  const onSelect = cy.stub()
  cy.clock()
  mount(<Card onSelect={onSelect} />)
  cy.tick(100).then(() => {
    expect(onSelect).to.not.have.been.called
  })

  cy.get('#cypress-root').then($el => {
    unmountComponentAtNode($el[0])
  })

  cy.tick(5000).then(() => {
    expect(onSelect).to.not.have.been.called
  })
})

it('should cleanup on being removed (using unmount)', () => {
  const onSelect = cy.stub()
  cy.clock()
  mount(<Card onSelect={onSelect} />)
  cy.tick(100).then(() => {
    expect(onSelect).to.not.have.been.called
  })

  unmount()

  cy.tick(5000).then(() => {
    expect(onSelect).to.not.have.been.called
  })
})

it('should accept selections', () => {
  const onSelect = cy.stub()
  mount(<Card onSelect={onSelect} />)
  cy.get("[data-testid='2']")
    .click()
    .then(() => {
      expect(onSelect).to.have.been.calledWith(2)
    })
})
