describe('Launchpad: Setup Project', () => {
  before(() => {
    cy.scaffoldProject('todos')
  })

  beforeEach(() => {
    cy.openProject('todos')
    cy.visitLaunchpad()
  })

  it('no initial setup displays welcome page', () => {
    cy.contains('Welcome to Cypress!').should('be.visible')
    cy.contains('E2E Testing').should('be.visible')
    cy.contains('Component Testing').should('be.visible')
  })

  describe('"learn about testing types" modal', () => {
    it('welcome page has "learn about testing types" link which opens modal', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')
      cy.contains('Key Differences').should('be.visible')
      cy.contains('Need help?').should('be.visible')

      cy.get('[data-cy="end-to-end-comparison"]').within(() => {
        cy.contains('End-to-end Tests').should('be.visible')
        cy.get('li').should('have.length', 3)
        cy.contains('Code Example').should('be.visible')
      })

      cy.get('[data-cy="component-comparison"]').within(() => {
        cy.contains('Component Tests').should('be.visible')
        cy.get('li').should('have.length', 3)
        cy.contains('Code Example').should('be.visible')
      })
    })

    it('close modal with escape key', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')
      cy.contains('Key Differences').should('be.visible')
      cy.get('body').type('{esc}')
      cy.get('#app').should('not.have.attr', 'aria-hidden')
    })

    it('closes modal by clicking outside of modal', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')
      cy.contains('Key Differences').should('be.visible')
      cy.get('body').click(5, 5)
      cy.get('#app').should('not.have.attr', 'aria-hidden')
    })

    it('closes modal by clicking close button', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')
      cy.get('h2').contains('Key Differences').should('be.visible')
      cy.get('[aria-label=Close]').click()
      cy.get('#app').should('not.have.attr', 'aria-hidden')
    })

    it('closes modal by pressing enter key when close button is focused', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')
      cy.get('h2').contains('Key Differences').should('be.visible')
      cy.get('[aria-label=Close]').focus().type('{enter}')
      cy.get('#app').should('not.have.attr', 'aria-hidden')
    })

    it('clicking "Need Help?" links to Cypress documentation', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')
      cy.contains('Key Differences').should('be.visible')
      cy.validateExternalLink({
        name: 'Need help?',
        href: 'https://on.cypress.io',
      })
    })
  })
})
