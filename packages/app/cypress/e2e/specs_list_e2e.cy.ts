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

  describe('typing the filter', function () {
    // const runAllIntegrationSpecsLabel = 'Run 8 integration specs'

    // beforeEach(function () {
    //   this.specs.integration.push({
    //     name: 'a-b_c/d~e(f)g.spec.js',
    //     absolute: '/user/project/cypress/integration/a-b_c/d~e(f)g.spec.js',
    //     relative: 'cypress/integration/a-b_c/d~e(f)g.spec.js',
    //   })

    //   this.numSpecs = 16

    //   this.ipc.getSpecs.yields(null, this.specs)
    //   this.openProject.resolve(this.config)

    //   cy.contains('.all-tests', runAllIntegrationSpecsLabel)
    //   cy.get('.filter').type('new')
    // })

    it('displays only matching spec', function () {
      cy.get('.specs-list .file')
      .should('have.length', 1)
      .and('contain', 'account_new_spec.coffee')

      cy.contains('.all-tests', 'Run 1 integration spec').click()
      .find('.fa-dot-circle')
      .then(() => {
        expect(this.ipc.launchBrowser).to.have.property('called').equal(true)
        const launchArgs = this.ipc.launchBrowser.lastCall.args

        expect(launchArgs[0].specFilter, 'spec filter').to.eq('new')
      })
    })

    it('only shows matching folders', () => {
      cy.get('.specs-list .folder')
      .should('have.length', 2)
    })

    it('ignores non-letter characters', function () {
      cy.get('.filter').clear().type('appspec')

      cy.get('.specs-list .file')
      .should('have.length', 1)
      .and('contain', 'app_spec.coffee')
    })

    it('ignores non-number characters', function () {
      cy.get('.filter').clear().type('123spec')

      cy.get('.specs-list .file')
      .should('have.length', 1)
      .and('contain', '123_spec.coffee')
    })

    it('ignores commonly used path characters', function () {
      cy.get('.filter').clear().type('abcdefg')

      cy.get('.specs-list .file')
      .should('have.length', 1)
      .and('contain', 'd~e(f)g.spec.js')
    })

    it('treats non-Latin characters as letters', function () {
      cy.get('.filter').clear().type('日本語')

      cy.get('.specs-list .file')
      .should('have.length', 1)
      .and('contain', '日本語_spec.coffee')
    })

    it('clears the filter on clear button click', function () {
      cy.get('.clear-filter').click()
      cy.get('.filter')
      .should('have.value', '')

      cy.get('.specs-list .file')
      .should('have.length', this.numSpecs)

      cy.contains('.all-tests', runAllIntegrationSpecsLabel)
    })

    it('clears the filter if the user press ESC key', function () {
      cy.get('.filter').type('{esc}')
      .should('have.value', '')

      cy.get('.specs-list .file')
      .should('have.length', this.numSpecs)

      cy.contains('.all-tests', runAllIntegrationSpecsLabel)
      .find('.fa-play')
    })

    it('shows empty message if no results', function () {
      cy.get('.filter').clear().type('foobarbaz')
      cy.get('.specs-list').should('not.exist')

      cy.get('.empty-well').should('contain', 'No specs match your search: "foobarbaz"')
      cy.percySnapshot()
    })

    it('removes run all tests buttons if no results', function () {
      cy.get('.filter').clear().type('foobarbaz')

      // the "Run ... tests" buttons should be gone
      cy.get('.all-tests').should('not.exist')
    })

    it('clears and focuses the filter field when clear search is clicked', function () {
      cy.get('.filter').clear().type('foobarbaz')
      cy.get('.btn').contains('Clear search').click()
      cy.focused().should('have.id', 'filter')

      cy.get('.specs-list .file')
      .should('have.length', this.numSpecs)
    })

    it('saves the filter to local storage for the project', function () {
      cy.window().then((win) => {
        expect(win.localStorage[`specsFilter-${this.config.projectId}-/foo/bar`]).to.be.a('string')

        expect(JSON.parse(win.localStorage[`specsFilter-${this.config.projectId}-/foo/bar`])).to.equal('new')
      })
    })

    it('does not update run button label while running', function () {
      cy.contains('.all-tests', 'Run 1 integration spec').click()
      // mock opened browser and running tests
      // to force "Stop" button to show up
      cy.window().its('__project').then((project) => {
        project.browserOpened()
      })

      // the button has its its label reflect the running specs
      cy.contains('.all-tests', 'Running integration tests')
      .should('have.class', 'active')

      // the button has its label unchanged while the specs are running
      cy.get('.filter').clear()
      cy.contains('.all-tests', 'Running integration tests')
      .should('have.class', 'active')

      // but once the project stops running tests, the button gets updated
      cy.get('.close-browser').click()
      cy.contains('.all-tests', runAllIntegrationSpecsLabel)
      .should('not.have.class', 'active')
    })
  })
})
