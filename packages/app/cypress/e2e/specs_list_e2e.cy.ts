import { getPathForPlatform } from '../../src/paths'

describe('App: Spec List (E2E)', () => {
  const launchApp = (specFilter?: string) => {
    cy.scaffoldProject('cypress-in-cypress')
    cy.openProject('cypress-in-cypress')
    cy.startAppServer('e2e', {
      // we can't use skipMockingPrompts when we mock saved state for the spec filter
      // due to it already being wrapped in startAppServer(), so we skip if a specFilter is passed
      skipMockingPrompts: Boolean(specFilter),
    })

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

      if (o.specFilter) {
        o.sinon.stub(ctx._apis.projectApi, 'getCurrentProjectSavedState').resolves({
          // avoid prompts being shown
          firstOpened: 1609459200000,
          lastOpened: 1609459200000,
          promptsShown: { ci1: 1609459200000 },
          // set the desired spec filter value
          specFilter: o.specFilter,
        })
      }
    }, {
      specFilter,
    })

    cy.visitApp()
    cy.specsPageIsVisible()
    cy.verifyE2ESelected()
  }

  const clearSearchAndType = (search: string) => {
    return cy.get('@searchField').clear().type(search)
  }

  context('with no saved spec filter', () => {
    beforeEach(() => {
      launchApp()
    })

    it('shows the "Specs" navigation as highlighted in the lefthand nav bar', () => {
      cy.findByTestId('sidebar').within(() => {
        cy.findByTestId('sidebar-link-specs-page').should('be.visible')
        cy.findByTestId('sidebar-link-specs-page').click()
      })

      cy.findByTestId('sidebar-link-specs-page').find('[data-selected="true"]').should('be.visible')
    })

    it('displays the App Top Nav', () => {
      cy.findByTestId('app-header-bar').should('be.visible')
      cy.findByTestId('app-header-bar').findByText('Specs').should('be.visible')
    })

    it('shows a git status for each spec', () => {
      cy.findAllByTestId('git-info-row').each((row) => {
        cy.wrap(row).find('svg').should('have.length', 1)
      })
    })

    it('collapses or expands folders when clicked, hiding or revealing the specs within it', () => {
      cy.findAllByTestId('spec-item').should('contain', 'dom-content.spec.js')
      cy.findByTestId('row-directory-depth-0').click()
      cy.findAllByTestId('spec-item').should('not.exist')
      cy.findByTestId('row-directory-depth-0').click()
      cy.findAllByTestId('spec-item').should('contain', 'dom-content.spec.js')
    })

    it('lists files after folders when in same directory', () => {
      cy.findAllByTestId('row-directory-depth-2').first().click()

      const rowId = getPathForPlatform('speclist-cypress/e2e/admin_users/').replaceAll('\\', '\\\\')

      cy.get(`[id="${rowId}"]`)
      .next()
      .should('contain', 'admin.user')
      .next()
      .should('contain', 'admin_users_list.spec.js')
    })

    it('opens the "Create new spec" modal after clicking the "New specs" button', () => {
      cy.findByTestId('standard-modal').should('not.exist')
      cy.findByTestId('new-spec-button').click()
      cy.findByTestId('standard-modal').get('h2').contains('Create new spec')
      cy.get('button').contains('Scaffold example specs').should('be.visible')
      cy.get('button').contains('Create new spec').should('be.visible')
      cy.get('button').get('[aria-label="Close"]').click()
      cy.findByTestId('standard-modal').should('not.exist')
    })

    it('has the correct defaultSpecFileName in the "Create new spec" modal', () => {
      cy.findByTestId('standard-modal').should('not.exist')
      cy.findByTestId('new-spec-button').click()
      cy.findByTestId('standard-modal').get('h2').contains('Create new spec')
      cy.get('button').contains('Scaffold example specs').should('be.visible')
      cy.get('button').contains('Create new spec').should('be.visible').click()
      cy.get('input').get('[aria-label="Enter a relative path..."]').invoke('val').should('contain', getPathForPlatform('cypress/e2e/spec.spec.js'))
      cy.get('button').get('[aria-label="Close"]').click()
    })

    it('has an <a> tag in the Spec File Row that runs the selected spec when clicked', () => {
      cy.get('[data-selected-spec="true"]').should('not.exist')
      cy.findAllByTestId('spec-item-link').should('have.attr', 'href')
      cy.findAllByTestId('spec-item-link').contains('dom-content.spec.js').click()

      cy.contains('[aria-controls=reporter-inline-specs-list]', 'Specs')
      cy.findByText('Your tests are loading...').should('not.be.visible')
      cy.get('body').type('f')

      cy.get('[data-selected-spec="true"]').contains('dom-content.spec.js')
      cy.findByTestId('runnable-header').should('be.visible')
    })

    it('updates the spec filename when a new spec is selected', () => {
      // load the first spec
      cy.findAllByTestId('spec-item-link').contains('accounts_list.spec.js').click()

      // ensure the tests are loaded
      cy.contains('[aria-controls=reporter-inline-specs-list]', 'Specs')
      cy.findByText('Your tests are loading...').should('not.be.visible')

      // open the inline spec list
      cy.get('body').type('f')

      // verify the first spec filename
      cy.findByTestId('runnable-header').contains('accounts_list.spec.js')

      // select the second spec from the inline spec list
      cy.findAllByTestId('spec-file-item').contains('accounts_new.spec.js').click()
      // verify the spec filename was updated
      cy.findByTestId('runnable-header').contains('accounts_new.spec.js')
    })

    it('cannot open the Spec File Row link in a new tab with "cmd + click"', (done) => {
      let numTargets
      let newNumTargets

      Cypress.automation('remote:debugger:protocol', { command: 'Target.getTargets' }).then((res) => {
        numTargets = res.targetInfos.length

        cy.findAllByTestId('spec-item-link').first().click({ metaKey: true }).then(async () => {
          await Cypress.automation('remote:debugger:protocol', { command: 'Target.getTargets' }).then((res) => {
            newNumTargets = res.targetInfos.length
          })

          expect(numTargets).to.eq(newNumTargets)

          done()
        })
      })
    })

    describe('typing the filter', function () {
      beforeEach(() => {
        cy.findByLabelText('Search specs').as('searchField')
      })

      it('displays only matching spec', function () {
        cy.get('button')
        .contains('28 matches')
        .should('not.contain.text', 'of')

        clearSearchAndType('content')
        cy.findAllByTestId('spec-item')
        .should('have.length', 3)
        .and('contain', 'dom-content.spec.js')

        cy.get('button').contains('3 of 28 matches')

        cy.findByLabelText('Search specs').clear().type('asdf')
        cy.findAllByTestId('spec-item')
        .should('have.length', 0)

        cy.get('button').contains('0 of 28 matches')
      })

      it('only shows matching folders', () => {
        clearSearchAndType('new')
        cy.findAllByTestId('spec-list-directory')
        .should('have.length', 1)

        clearSearchAndType('admin')
        cy.findAllByTestId('spec-list-directory')
        .should('have.length', 2)
      })

      it('ignores non-letter characters', function () {
        clearSearchAndType('appspec')

        cy.findByTestId('spec-item')
        .should('have.length', 1)
        .and('contain', 'app.spec.js')
      })

      it('search by digits inside long strings', function () {
        clearSearchAndType('4276')

        cy.findByTestId('spec-item')
        .should('have.length', 1)
        .and('contain', 'dummyTest4276_test.spec.js')

        clearSearchAndType('7890')

        cy.findByTestId('spec-item')
        .should('have.length', 1)
        .and('contain', 'dummy7890Test_test.spec.js')
      })

      it('ignores non-number characters', function () {
        clearSearchAndType('123spec')

        cy.findByTestId('spec-item')
        .should('have.length', 1)
        .and('contain', '123.spec.js')
      })

      it('ignores commonly used path characters', function () {
        clearSearchAndType('defg')

        cy.findByTestId('spec-item')
        .should('have.length', 1)
        .and('contain', 'd~e(f)g.spec.js')
      })

      it('treats non-Latin characters as letters', function () {
        clearSearchAndType('柏树很棒')

        cy.findByTestId('spec-item')
        .should('have.length', 1)
        .and('contain', '柏树很棒.spec.js')
      })

      it('clears the filter on search bar clear button click', function () {
        clearSearchAndType('123')
        cy.findByLabelText('Clear search field').click()
        cy.findByLabelText('Search specs')
        .should('have.value', '')

        cy.get('button').contains('28 matches')
      })

      it('clears the filter if the user presses ESC key', function () {
        clearSearchAndType('123')
        cy.get('@searchField').realType('{esc}')

        cy.get('@searchField').should('have.value', '')

        cy.get('button').contains('28 matches')
      })

      it('shows empty message if no results', function () {
        clearSearchAndType('foobarbaz')
        cy.findByTestId('spec-item').should('not.exist')

        cy.findByText('No specs matched your search:')
      })

      it('clears and focuses the filter field when clear search is clicked', function () {
        clearSearchAndType('asdf')

        cy.findByText('Clear search').click()
        cy.focused().should('have.id', 'spec-filter')

        cy.get('button').contains('28 matches')
      })

      it('normalizes directory path separators for Windows', function () {
        // On Windows, when a user types `e2e/accounts`, it should match `e2e\accounts`
        clearSearchAndType('e2e/accounts')
        cy.findAllByTestId('spec-item').should('have.length', 2)

        cy.findByText('No specs matched your search:').should('not.be.visible')
      })

      it('searches specs with "-" or "_" when search contains space', function () {
        clearSearchAndType('accounts list')

        cy.findAllByTestId('spec-item')
        .should('have.length', 1)
        .and('contain', 'accounts_list.spec.js')

        cy.findByText('No specs matched your search:').should('not.be.visible')
      })

      it('searches specs with "-" or "_" when search contains "-"', function () {
        clearSearchAndType('accounts-list')

        cy.findAllByTestId('spec-item')
        .should('have.length', 1)
        .and('contain', 'accounts_list.spec.js')

        cy.findByText('No specs matched your search:').should('not.be.visible')
      })

      it('searches specs with "-" or "_" when search contains "_"', function () {
        clearSearchAndType('accounts_list')

        cy.findAllByTestId('spec-item')
        .should('have.length', 1)
        .and('contain', 'accounts_list.spec.js')

        cy.findByText('No specs matched your search:').should('not.be.visible')
      })

      it('searches folders with "-" or "_" when search contains space', function () {
        clearSearchAndType('a b c')

        cy.findAllByTestId('spec-list-directory')
        .should('have.length', 1)
        .and('contain', 'a-b_c')

        cy.findByText('No specs matched your search:').should('not.be.visible')
      })

      it('searches folders with "-" or "_" when search contains "-"', function () {
        clearSearchAndType('a-b-c')

        cy.findAllByTestId('spec-list-directory')
        .should('have.length', 1)
        .and('contain', 'a-b_c')

        cy.findByText('No specs matched your search:').should('not.be.visible')
      })

      it('searches folders with "-" or "_" when search contains "_"', function () {
        clearSearchAndType('a_b_c')

        cy.findAllByTestId('spec-list-directory')
        .should('have.length', 1)
        .and('contain', 'a-b_c')

        cy.findByText('No specs matched your search:').should('not.be.visible')
      })

      it('saves the filter when navigating to a spec and back', function () {
        const targetSpecFile = 'accounts_list.spec.js'

        clearSearchAndType(targetSpecFile)

        // wait for filter
        cy.findAllByTestId('spec-item').should('have.length', 1)

        cy.contains('a', targetSpecFile).click()

        // make sure we are on the spec view before clicking back to the specs list
        cy.findByTestId('runnable-header').contains(targetSpecFile)

        cy.contains('input', targetSpecFile).should('not.exist')

        cy.contains('button', 'Specs').click({ force: true })

        // wait until specs list is visible
        cy.findByTestId('specs-list-container').should('be.visible')

        cy.get('@searchField').should('have.value', targetSpecFile)

        cy.findByTestId('sidebar-link-specs-page').click()

        // make sure we are back on the main specs list
        cy.location().its('hash').should('eq', '#/specs')

        cy.get('input').should('have.value', targetSpecFile)
      })
    })
  })

  context('with a saved spec filter', () => {
    it('starts with saved filter when one is present', function () {
      const targetSpecFile = 'accounts_new.spec.js'

      launchApp(targetSpecFile)

      cy.findByLabelText('Search specs').should('have.value', targetSpecFile)
    })
  })
})
