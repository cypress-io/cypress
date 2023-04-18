import * as M from './add'

describe('spying ESM', () => {
  it('spies', () => {
    cy.spy(M, 'add').as('add')
    expect(M.add(2, 5)).to.eq(7)
    cy.get('@add').should('have.been.calledWith', 2, 5)
  })
})
