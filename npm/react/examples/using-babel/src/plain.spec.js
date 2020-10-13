import * as calc from './calc'

// checking mocked value if there is no React involved
describe('plain', () => {
  it('mocks es6 import', () => {
    cy.stub(calc, 'getRandomNumber')
      .as('lucky')
      .returns(777)

    cy.then(() => {
      return calc.getRandomNumber()
    }).should('equal', 777)
  })
})
