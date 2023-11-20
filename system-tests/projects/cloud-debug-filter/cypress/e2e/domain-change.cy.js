it('t1', () => { })

it('t2', () => {
  cy.visit('http://www.cypress.io')
  expect(1).to.equal(2)
})

it('t3', () => {
  cy.visit('http://www.cypress.io')
  cy.origin('https://example.cypress.io', {}, () => {
    cy.visit('/')
  })

  expect(1).to.equal(2)
})

it('t4', () => { })
