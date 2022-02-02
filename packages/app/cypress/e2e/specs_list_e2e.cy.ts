describe('App: Spec List (E2E)', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('e2e')
    cy.visitApp()
  })

  it('shows the "Specs" navigation as highlighted in the lefthand nav bar', () => {
    cy.findByLabelText('Sidebar').within(() => {
      cy.findByText('Specs').should('be.visible')
      cy.findByText('Specs').click()
    })

    cy.get('.router-link-active').findByText('Specs').should('be.visible')
  })

  it('displays the App Top Nav', () => {
    cy.get('[data-cy="app-header-bar"]').should('be.visible')
    cy.get('[data-cy="app-header-bar"]').findByText('Specs').should('be.visible')
  })

  it('shows the "E2E Specs" label as the header for the Spec Name column', () => {
    cy.get('[data-cy="specs-testing-type-header"]').should('contain', 'E2E Specs')
  })

  it('allows you to search and filter the list of specs in the list', () => {
    cy.get('button').contains('1 Match')

    cy.get('input').type('dom', { force: true })

    cy.get('[data-cy="spec-item"]').should('have.length', 1)
    .should('contain', 'dom-content.spec.js')

    cy.get('button').contains('1 Match')

    cy.get('input').clear().type('asdf', { force: true })

    cy.get('[data-cy="spec-item"]').should('have.length', 0)

    cy.get('button').contains('0 Matches')
  })

  // TODO: find a test project that shows git statuses
  it.skip('shows a git status for each spec', () => {

  })

  it('collapses folders that are clicked, hiding the specs within it', () => {
    cy.get('[data-cy="spec-item"]').should('contain', 'dom-content.spec.js')
    cy.get('[data-cy="row-directory-depth-0"]').click()
    cy.get('[data-cy="spec-item"]').should('not.exist')
  })

  it('opens the "Create a new spec" modal after clicking the "New Specs" button', () => {
    cy.get('[data-cy="standard-modal"]').should('not.exist')
    cy.get('[data-cy="new-spec-button"]').click()
    cy.get('[data-cy="standard-modal"]').get('h2').contains('Create a new spec')
    cy.get('button').get('[aria-label="Close"]').click()
    cy.get('[data-cy="standard-modal"]').should('not.exist')
  })

  it('has an <a> tag in the Spec File Row that runs the selected spec when clicked', () => {
    cy.get('[data-selected-spec="true"]').should('not.exist')
    cy.get('[data-cy="spec-item-link"]').should('have.attr', 'href')
    cy.get('[data-cy="spec-item-link"]').click()
    cy.get('[data-selected-spec="true"]').contains('dom-content.spec.js')
    cy.get('[data-cy="runnable-header"]').should('be.visible')
  })

  it('cannot open the Spec File Row link in a new tab with "cmd + click"', () => {
    cy.get('[data-cy="spec-item-link"]').click({ metaKey: true })
    cy.window().then((win) => {
      cy.spy(win, 'open').as('newtab')
    })

    cy.get('@newtab').should('not.be.called')
  })
})
