const expected = 'large spec bundle ok'

describe('large spec bundle', () => {
  it('loads the spec bundle again after visiting another origin', () => {
    cy.visit('http://www.foobar.com:4466/')
    cy.get('body').should('contain', expected)
  })

  it('runs a cy.origin block on a third origin', () => {
    cy.visit('http://www.foobar.com:4466/')

    cy.origin('http://www.barbaz.com:4466', () => {
      cy.visit('/')
      cy.get('body').should('contain', 'large spec bundle ok')
    })
  })
})
