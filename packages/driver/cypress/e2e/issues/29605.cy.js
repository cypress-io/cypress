// https://github.com/cypress-io/cypress/issues/29605
describe('issue #29605 - els with display: contents', () => {
  beforeEach(() => {
    cy.visit('/fixtures/issue-29605.html')
  })

  it('children of parent with no width/height are visible', () => {
    cy.get('#parent').should('not.be.visible')
    cy.get('#child').should('be.visible')
  })

  // https://drafts.csswg.org/css-display/#unbox
  it('not rendered by CSS box concept are not visible', () => {
    cy.get('#input').should('not.be.visible')
    cy.get('#select').should('not.be.visible')
  })
})
