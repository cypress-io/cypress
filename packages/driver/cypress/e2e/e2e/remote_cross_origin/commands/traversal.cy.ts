describe('remote driver: traversal in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.children()', () => {
    cy.get('#by-id').children().should('have.length', 3)
  })

  it('.closest()', () => {
    cy.get('#by-id').closest('form').should('have.id', 'by-id')
  })

  it('.eq()', () => {
    cy.get('#by-id>input').eq(1).should('have.id', 'name')
  })

  it('.filter()', () => {
    cy.get('#by-name>input')
    .filter('[name="dogs"]').should('have.length', 4)
  })

  it('.find()', () => {
    cy.get('#by-id').find('input').should('have.length', 3)
  })

  it('.first()', () => {
    cy.get('#by-id>input').first().should('have.id', 'input')
  })

  it('.last()', () => {
    cy.get('#by-id>input').last().should('have.id', 'age')
  })

  it('.next()', () => {
    cy.get('#input').next().should('have.id', 'name')
  })

  it('.nextAll()', () => {
    cy.get('#input').nextAll().should('have.length', 2)
  })

  it('.nextUntil()', () => {
    cy.get('#input').nextUntil('#age').should('have.length', 1)
  })

  it('.not()', () => {
    cy.get('#by-id>input').not('#age').should('have.length', 2)
  })

  it('.parent()', () => {
    cy.get('#by-id').parent().should('have.id', 'dom')
  })

  it('.parents()', () => {
    cy.get('#by-id').parents().should('have.length', 3)
  })

  it('.parentsUntil()', () => {
    cy.get('#by-id').parentsUntil('body').should('have.length', 1)
  })

  it('.prev()', () => {
    cy.get('#age').prev().should('have.id', 'name')
  })

  it('.prevAll()', () => {
    cy.get('#age').prevAll().should('have.length', 2)
  })

  it('.prevUntil()', () => {
    cy.get('#age').prevUntil('#input').should('have.length', 1)
  })

  it('.siblings()', () => {
    cy.get('#input').siblings().should('have.length', 2)
  })
})
