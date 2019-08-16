/// <reference types="cypress"/>

describe('test', () => {
  it('works', () => {
    // cy.visit('https://example.com')
    cy.wait(1001).then(() => {
      expect(true).to.be.true
    })

    // cy.get('button').eq(0).click()
  })
  // it('works 2', () => {
  //   // cy.visit('https://example.com')
  //   cy.wait(100)
  //   // cy.get('button').eq(0).click()
  // })
  // it('works 3', () => {
  //   // cy.visit('https://example.com')
  //   cy.wait(100)
  //   // cy.get('button').eq(0).click()
  // })
  // it('works 4', () => {
  //   // cy.visit('https://example.com')
  //   cy.wait(100)
  //   // cy.get('button').eq(0).click()
  // })
})
