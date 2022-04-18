describe('App: Spec List (E2E)', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('e2e')

    cy.withCtx((ctx) => {
      const yesterday = new Date()

      yesterday.setDate(yesterday.getDate() - 1)

      sinon.stub(ctx.lifecycleManager.git!, 'gitInfoFor').callsFake(() => {
        return {
          author: 'Test Author',
          lastModifiedTimestamp: yesterday.toDateString(),
          lastModifiedHumanReadable: yesterday.toDateString(),
          statusType: 'unmodified',
        }
      })
    })

    cy.visitApp()
    cy.contains('E2E Specs')
  })

  it('shows the "Specs" navigation as highlighted in the lefthand nav bar', () => {
    cy.findByLabelText('Sidebar').within(() => {
      cy.findByText('Specs').should('be.visible')
      cy.findByText('Specs').click()
    })

    cy.get('[data-selected="true"]').contains('Specs').should('be.visible')
  })

  it('displays the App Top Nav', () => {
    cy.get('[data-cy="app-header-bar"]').should('be.visible')
    cy.get('[data-cy="app-header-bar"]').findByText('Specs').should('be.visible')
  })

  it('shows the "E2E Specs" label as the header for the Spec Name column', () => {
    cy.get('[data-cy="specs-testing-type-header"]').should('contain', 'E2E Specs')
  })

  it('allows you to search and filter the list of specs in the list', () => {
    cy.get('button').contains('6 Matches')

    cy.get('input').type('content', { force: true })

    cy.get('[data-cy="spec-item"]').should('have.length', 2)
    .should('contain', 'dom-content.spec.js')

    cy.get('button').contains('2 of 6 Matches')

    cy.get('input').clear().type('asdf', { force: true })

    cy.get('[data-cy="spec-item"]').should('have.length', 0)

    cy.get('button').contains('0 of 6 Matches')
  })

  it('shows a git status for each spec', () => {
    cy.get('[data-cy="spec-list-file"]').each((row) => {
      cy.wrap(row).contains('.git-info-row', 'Test Author')
    })
  })

  it('collapses or expands folders when clicked, hiding or revealing the specs within it', () => {
    cy.get('[data-cy="spec-item"]').should('contain', 'dom-content.spec.js')
    cy.get('[data-cy="row-directory-depth-0"]').click()
    cy.get('[data-cy="spec-item"]').should('not.exist')
    cy.get('[data-cy="row-directory-depth-0"]').click()
    cy.get('[data-cy="spec-item"]').should('contain', 'dom-content.spec.js')
  })

  it('opens the "Create a new spec" modal after clicking the "New Specs" button', () => {
    cy.get('[data-cy="standard-modal"]').should('not.exist')
    cy.get('[data-cy="new-spec-button"]').click()
    cy.get('[data-cy="standard-modal"]').get('h2').contains('Create a new spec')
    cy.get('button').contains('Scaffold example specs').should('be.visible')
    cy.get('button').contains('Create new empty spec').should('be.visible')
    cy.get('button').get('[aria-label="Close"]').click()
    cy.get('[data-cy="standard-modal"]').should('not.exist')
  })

  it('has an <a> tag in the Spec File Row that runs the selected spec when clicked', () => {
    cy.get('[data-selected-spec="true"]').should('not.exist')
    cy.get('[data-cy="spec-item-link"]').should('have.attr', 'href')
    cy.get('[data-cy="spec-item-link"]').contains('dom-content.spec.js').click()
    cy.wait(1000)
    cy.get('body').type('f')
    cy.get('[data-selected-spec="true"]').contains('dom-content.spec.js')
    cy.get('[data-cy="runnable-header"]').should('be.visible')
  })

  it('cannot open the Spec File Row link in a new tab with "cmd + click"', (done) => {
    let numTargets
    let newNumTargets

    Cypress.automation('remote:debugger:protocol', { command: 'Target.getTargets' }).then((res) => {
      numTargets = res.targetInfos.length

      cy.get('[data-cy="spec-item-link"]').first().click({ metaKey: true }).then(async () => {
        await Cypress.automation('remote:debugger:protocol', { command: 'Target.getTargets' }).then((res) => {
          newNumTargets = res.targetInfos.length
        })

        expect(numTargets).to.eq(newNumTargets)

        done()
      })
    })
  })
})
