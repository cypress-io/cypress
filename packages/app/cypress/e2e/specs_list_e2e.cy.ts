import { getPathForPlatform } from '../../src/paths'

describe('App: Spec List (E2E)', () => {
  beforeEach(() => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('e2e')

    cy.withCtx((ctx, o) => {
      const yesterday = new Date()

      yesterday.setDate(yesterday.getDate() - 1)

      o.sinon.stub(ctx.lifecycleManager.git!, 'gitInfoFor').callsFake(() => {
        return {
          author: 'Test Author',
          lastModifiedTimestamp: yesterday.toDateString(),
          lastModifiedHumanReadable: yesterday.toDateString(),
          statusType: 'unmodified',
          subject: 'commit subject',
          shortHash: '1234567890',
        }
      })
    })

    cy.visitApp()
    cy.contains('E2E specs')
  })

  it('shows the "Specs" navigation as highlighted in the lefthand nav bar', () => {
    cy.findByTestId('sidebar').within(() => {
      cy.findByTestId('sidebar-link-specs-page').should('be.visible')
      cy.findByTestId('sidebar-link-specs-page').click()
    })

    cy.findByTestId('sidebar-link-specs-page').find('[data-selected="true"]').should('be.visible')
  })

  it('displays the App Top Nav', () => {
    cy.get('[data-cy="app-header-bar"]').should('be.visible')
    cy.get('[data-cy="app-header-bar"]').findByText('Specs').should('be.visible')
  })

  it('shows the "E2E specs" label as the header for the Spec Name column', () => {
    cy.get('[data-cy="specs-testing-type-header"]').should('contain', 'E2E specs')
  })

  it('shows a git status for each spec', () => {
    cy.get('[data-cy="git-info-row"]').each((row) => {
      cy.wrap(row).find('svg').should('have.length', 1)
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

  it('has the correct defaultSpecFileName in the "Create a new spec" modal', () => {
    cy.get('[data-cy="standard-modal"]').should('not.exist')
    cy.get('[data-cy="new-spec-button"]').click()
    cy.get('[data-cy="standard-modal"]').get('h2').contains('Create a new spec')
    cy.get('button').contains('Scaffold example specs').should('be.visible')
    cy.get('button').contains('Create new empty spec').should('be.visible').click()
    cy.get('input').get('[aria-label="Enter a relative path..."]').invoke('val').should('contain', getPathForPlatform('cypress/e2e/spec.spec.js'))
  })

  it('has an <a> tag in the Spec File Row that runs the selected spec when clicked', () => {
    cy.get('[data-selected-spec="true"]').should('not.exist')
    cy.get('[data-cy="spec-item-link"]').should('have.attr', 'href')
    cy.get('[data-cy="spec-item-link"]').contains('dom-content.spec.js').click()

    cy.contains('[aria-controls=reporter-inline-specs-list]', 'Specs')
    cy.findByText('Your tests are loading...').should('not.be.visible')
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

  describe('typing the filter', function () {
    it('displays only matching spec', function () {
      cy.get('button').contains('23 Matches')
      cy.findByLabelText('Search Specs').type('content')
      cy.get('[data-cy="spec-item"]')
      .should('have.length', 2)
      .and('contain', 'dom-content.spec.js')

      cy.get('button').contains('2 of 23 Matches')

      cy.findByLabelText('Search Specs').clear().type('asdf')
      cy.get('[data-cy="spec-item"]')
      .should('have.length', 0)

      cy.get('button').contains('0 of 23 Matches')
    })

    it('only shows matching folders', () => {
      cy.findByLabelText('Search Specs').type('new')
      cy.get('[data-cy="spec-list-directory"]')
      .should('have.length', 1)

      cy.findByLabelText('Search Specs').clear().type('admin')
      cy.get('[data-cy="spec-list-directory"]')
      .should('have.length', 2)
    })

    it('ignores non-letter characters', function () {
      cy.findByLabelText('Search Specs').clear().type('appspec')

      cy.get('[data-cy="spec-item"]')
      .should('have.length', 1)
      .and('contain', 'app.spec.js')
    })

    it('ignores non-number characters', function () {
      cy.findByLabelText('Search Specs').clear().type('123spec')

      cy.get('[data-cy="spec-item"]')
      .should('have.length', 1)
      .and('contain', '123.spec.js')
    })

    it('ignores commonly used path characters', function () {
      cy.findByLabelText('Search Specs').clear().type('defg')

      cy.get('[data-cy="spec-item"]')
      .should('have.length', 1)
      .and('contain', 'd~e(f)g.spec.js')
    })

    it('treats non-Latin characters as letters', function () {
      cy.findByLabelText('Search Specs').clear().type('柏树很棒')

      cy.get('[data-cy="spec-item"]')
      .should('have.length', 1)
      .and('contain', '柏树很棒.spec.js')
    })

    // TODO: https://cypress-io.atlassian.net/browse/UNIFY-682
    it.skip('clears the filter on search bar clear button click', function () {
      cy.get('.clear-filter').click()
      cy.findByLabelText('Search Specs')
      .should('have.value', '')

      cy.get('[data-cy="spec-item"]')
      .should('have.length', 23)
    })

    it('clears the filter if the user presses ESC key', function () {
      cy.findByLabelText('Search Specs').type('asdf')

      cy.findByLabelText('Search Specs').realType('{esc}')

      cy.findByLabelText('Search Specs')
      .should('have.value', '')

      cy.get('button').contains('23 Matches')
    })

    it('shows empty message if no results', function () {
      cy.findByLabelText('Search Specs').clear().type('foobarbaz')
      cy.get('[data-cy="spec-item"]').should('not.exist')

      cy.findByText('No specs matched your search:')
    })

    it('clears and focuses the filter field when clear search is clicked', function () {
      cy.findByLabelText('Search Specs').type('asdf')
      cy.findByText('Clear Search').click()
      cy.focused().should('have.id', 'spec-filter')

      cy.get('button').contains('23 Matches')
    })

    //TODO: https://cypress-io.atlassian.net/browse/UNIFY-1588
    it.skip('saves the filter to local storage for the project', function () {
      cy.window().then((win) => {
        expect(win.localStorage[`specsFilter-${this.config.projectId}-/foo/bar`]).to.be.a('string')

        expect(JSON.parse(win.localStorage[`specsFilter-${this.config.projectId}-/foo/bar`])).to.equal('new')
      })
    })
  })
})
