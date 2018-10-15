/// <reference types="cypress"/>

describe('test', () => {
  it('works', () => {
    cy.visit('https://example.com')
    cy.get('button').eq(0).click()
  })
})
