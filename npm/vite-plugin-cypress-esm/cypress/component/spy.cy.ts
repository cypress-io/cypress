/// <reference types="cypress" />

import * as M from './fixtures/add'

describe('spying ES modules', () => {
  it('spies', () => {
    cy.spy(M, 'add').as('add')
    expect(M.add(2, 5)).to.eq(7)
    cy.get('@add').should('have.been.calledWith', 2, 5)
  })
})
