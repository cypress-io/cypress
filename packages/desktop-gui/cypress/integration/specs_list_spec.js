describe('Specs List', function () {
  beforeEach(function () {
    cy.fixture('user').as('user')
    cy.fixture('config').as('config')
    cy.fixture('specs_with_components').as('specs')
    cy.fixture('specs_windows').as('specsWindows')

    cy.visitIndex().then(function (win) {
      let start = win.App.start

      this.win = win
      this.ipc = win.App.ipc

      expect(this.specs.integration.length, 'has integration tests').to.be.gt(0)
      expect(this.specs.component.length, 'has component tests').to.be.gt(0)
      this.numSpecs = this.specs.integration.length + this.specs.component.length

      cy.stub(this.ipc, 'getOptions').resolves({ projectRoot: '/foo/bar' })
      cy.stub(this.ipc, 'getCurrentUser').resolves(this.user)
      cy.stub(this.ipc, 'getSpecs').yields(null, this.specs)
      cy.stub(this.ipc, 'getUserEditor').resolves({})
      cy.stub(this.ipc, 'closeBrowser').resolves(null)
      cy.stub(this.ipc, 'launchBrowser')
      cy.stub(this.ipc, 'openFinder')
      cy.stub(this.ipc, 'openFile')
      cy.stub(this.ipc, 'externalOpen')
      cy.stub(this.ipc, 'hasOpenedCypress').resolves(true)
      cy.stub(this.ipc, 'onSpecChanged')
      cy.stub(this.ipc, 'setUserEditor')
      cy.stub(this.ipc, 'showNewSpecDialog').resolves({ specs: null, path: null })
      cy.stub(this.ipc, 'removeScaffoldedFiles').resolves()

      this.openProject = this.util.deferred()
      cy.stub(this.ipc, 'openProject').returns(this.openProject.promise)

      start()
    })
  })

  describe('no specs', function () {
    beforeEach(function () {
      this.ipc.getSpecs.yields(null, [])

      this.openProject.resolve(this.config)
    })

    it('displays empty message', () => {
      cy.contains('No files found')
      cy.percySnapshot()
    })

    it('displays integration test folder path', function () {
      cy.contains(this.config.integrationFolder)
    })

    it('triggers open:finder on click of text folder', function () {
      cy.contains(this.config.integrationFolder).click().then(function () {
        expect(this.ipc.openFinder).to.be.calledWith(this.config.integrationFolder)
      })
    })

    it('launches system save dialog on click of new spec file', function () {
      cy.contains('New Spec File').click().then(function () {
        expect(this.ipc.showNewSpecDialog).to.be.called
      })
    })

    it('opens link to docs on click of help link', () => {
      cy.contains('a', 'Need help?').click().then(function () {
        expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/writing-first-test')
      })
    })
  })

  describe('integration and component specs', function () {
    beforeEach(function () {
      cy.fixture('component_specs').as('componentSpecs')
    })

    beforeEach(function () {
      this.ipc.getSpecs.yields(null, this.componentSpecs)

      this.openProject.resolve(this.config)
    })

    it('shows both types of specs', () => {
      cy.get('.specs-list li.level-0').should('have.length', 2)
      cy.contains('.folder.level-0', 'integration')
      cy.contains('.folder.level-0', 'component')

      // component specs should be visible
      cy.get('.folder').eq(1).find('.file').should('be.visible')
      cy.percySnapshot()

      // let's check if the specs search works
      cy.get('.filter').type('Nav')
      cy.get('.file').should('have.length', 1)
      cy.contains('.file', 'Navigation.spec.js').should('be.visible')
    })
  })

  describe('new project onboarding', function () {
    beforeEach(function () {
      this.config.isNewProject = true

      this.openProject.resolve(this.config)
    })

    context('banner', function () {
      it('displays', function () {
        cy.get('.new-project-banner')
        cy.percySnapshot()
      })

      it('is dismissable', function () {
        cy.get('.new-project-banner').find('.close').click()
        cy.get('.new-project-banner').should('not.exist')
      })

      it('does not display new user banner even when closed', function () {
        this.ipc.hasOpenedCypress.resolves(false)

        cy.get('.new-user-banner').should('not.exist')
        cy.get('.new-project-banner').find('.close').click()
        cy.get('.new-project-banner').should('not.exist')
        cy.get('.new-user-banner').should('not.exist')
      })

      it('opens link to docs on click of help link', function () {
        cy.contains('a', 'How to write your first test').click().then(function () {
          expect(this.ipc.externalOpen).to.be.calledWithMatch({ url: 'https://on.cypress.io/writing-first-test' })
        })
      })

      it('removes scaffolded files on click and confirmation', function () {
        cy.contains('delete example files').click()
        cy.get('.confirm-remove-scaffolded-files').should('be.visible')
        cy.contains('Yes, delete files').click().then(function () {
          expect(this.ipc.removeScaffoldedFiles).to.be.called
          cy.get('.new-project-banner').should('not.exist')
        })
      })
    })
  })

  describe('first time user in existing project', function () {
    beforeEach(function () {
      this.openProject.resolve(this.config)
      this.ipc.hasOpenedCypress.resolves(false)
    })

    context('banner', function () {
      it('displays', function () {
        cy.get('.new-user-banner')
        cy.percySnapshot()
      })

      it('is dismissable', function () {
        cy.get('.new-user-banner').find('.close').click()
        cy.get('.new-user-banner').should('not.exist')
      })

      it('opens link to docs on click of how to link', function () {
        cy.contains('a', 'How to write your first test').click().then(function () {
          expect(this.ipc.externalOpen).to.be.calledWithMatch({ url: 'https://on.cypress.io/writing-first-test' })
        })
      })

      it('opens link to intro guide on click of intro link', function () {
        cy.contains('a', 'Introduction guide to Cypress').click().then(function () {
          expect(this.ipc.externalOpen).to.be.calledWithMatch({ url: 'https://on.cypress.io/intro-to-cypress' })
        })
      })
    })
  })

  describe('lists specs', function () {
    context('Windows paths', function () {
      beforeEach(function () {
        this.ipc.getSpecs.yields(null, this.specsWindows)

        this.openProject.resolve(this.config)
      })

      context('displays list of specs', function () {
        it('lists nested folders', () => {
          cy.get('.folder .folder').contains('accounts')
        })

        it('lists test specs', function () {
          cy.get('.file .file-name-wrapper').last().should('contain', 'last_list_spec.coffee')
          cy.get('.file .file-name-wrapper').last().should('not.contain', 'admin_users')
        })

        it('sets focus on search files filters if user presses Cmd + F', () => {
          if (Cypress.platform === 'darwin') {
            cy.get('.filter').type('{cmd}F')
            cy.get('.filter').should('have.focus')
          }
        })

        it('sets focus on search files filter if user presses Ctrl + F', () => {
          if (Cypress.platform !== 'darwin') {
            cy.get('.filter').type('{ctrl}F')
            cy.get('.filter').should('have.focus')
          }
        })
      })
    })

    context('Linux paths', function () {
      beforeEach(function () {
        this.ipc.getSpecs.yields(null, this.specs)

        this.openProject.resolve(this.config)
      })

      context('run all specs', function () {
        const runAllIntegrationSpecsLabel = 'Run 7 integration specs'

        it('displays run all specs button', () => {
          cy.contains('.all-tests', runAllIntegrationSpecsLabel)
          .should('have.attr', 'title', 'Run integration specs together')
        })

        it('has play icon', () => {
          cy.contains('.all-tests', runAllIntegrationSpecsLabel)
          .find('i').should('have.class', 'fa-play')
        })

        it('triggers browser launch on click of button', () => {
          cy.contains('.all-tests', runAllIntegrationSpecsLabel).click()
          .find('.fa-dot-circle')
          .then(function () {
            const launchArgs = this.ipc.launchBrowser.lastCall.args

            expect(launchArgs[0].browser.name, 'browser name').to.eq('chrome')

            expect(launchArgs[0].spec.name, 'spec name').to.eq('All Integration Specs')

            expect(launchArgs[0].specFilter, 'spec filter').to.eq(null)
          })
        })

        describe('all specs running in browser', function () {
          beforeEach(() => {
            cy.contains('.all-tests', runAllIntegrationSpecsLabel).as('allSpecs').click()
          })

          it('updates spec icon', function () {
            cy.get('@allSpecs').find('i').should('have.class', 'fa-dot-circle')

            cy.get('@allSpecs').find('i').should('not.have.class', 'fa-play')
            cy.percySnapshot()
          })

          it('sets spec as active', () => {
            cy.get('@allSpecs').should('have.class', 'active')
          })
        })
      })

      context('displays list of specs', function () {
        it('lists main folders of specs', () => {
          cy.get('.folder.level-0').should('have.length', 2)
          cy.contains('.folder.level-0', 'integration')
          cy.contains('.folder.level-0', 'component')
        })

        it('lists nested folders', () => {
          cy.get('.folder.level-0 .folder.level-1').contains('accounts')
        })

        it('lists test specs', () => {
          cy.get('.folder.level-0 .file.level-1 a').contains('app_spec.coffee')
        })

        it('lists folder with "."', function () {
          cy.get('.file').should('have.length', this.numSpecs)
          cy.get('.folder').should('have.length', 10)
        })

        it('lists files after folders when in same directory', () => {
          // 📁 bar
          // 📁 foo
          // app
          cy.get('.list-as-table.integration')
          .find('li').first().should('contain', 'accounts')

          cy.get('.list-as-table.integration')
          .find('li').last().should('contain', '123_spec')
        })
      })

      context('collapsing specs', function () {
        it('sets folder collapsed when clicked with correct icon', () => {
          cy.get('.folder:first').should('have.class', 'folder-expanded')
          cy.get('.folder-collapse-icon:first').should('have.class', 'fa-caret-down')
          cy.get('.folder .folder-name:first').click()

          cy.get('.folder-collapse-icon:first').should('have.class', 'fa-caret-right')
          cy.get('.folder:first').should('have.class', 'folder-collapsed')
        })

        it('hides children when folder clicked', function () {
          cy.get('.file').should('have.length', this.numSpecs)
          cy.get('.folder .folder-name:first').click()

          cy.get('.file').should('have.length', 8)
        })

        it('sets folder expanded when clicked twice', function () {
          cy.get('.folder .folder-name:first').click()
          cy.get('.folder:first').should('have.class', 'folder-collapsed')
          cy.get('.folder .folder-name:first').click()

          cy.get('.folder:first').should('have.class', 'folder-expanded')
        })

        it('hides children for every folder collapsed', function () {
          const lastExpandedFolderSelector = '.folder-expanded:last > div > .folder-name:last'

          cy.get('.file').should('have.length', this.numSpecs)

          cy.get(lastExpandedFolderSelector).click()
          cy.get('.file').should('have.length', 9)

          cy.get(lastExpandedFolderSelector).click()
          cy.get('.file').should('have.length', 9)

          cy.get(lastExpandedFolderSelector).click()
          cy.get('.file').should('have.length', 7)

          cy.get(lastExpandedFolderSelector).click()
          cy.get('.file').should('have.length', 7)

          cy.get(lastExpandedFolderSelector).click()
          cy.get('.file').should('have.length', 7)

          cy.get(lastExpandedFolderSelector).click()
          cy.get('.file').should('have.length', 7)

          cy.get(lastExpandedFolderSelector).click()
          cy.get('.file').should('have.length', 6)

          cy.get(lastExpandedFolderSelector).click()
          cy.get('.file').should('have.length', 5)

          cy.get(lastExpandedFolderSelector).click()
          cy.get('.file').should('have.length', 3)

          cy.get(lastExpandedFolderSelector).click()
          cy.get('.file').should('have.length', 0)
        })
      })
    })

    context('expand/collapse root specs', function () {
      describe('with folders', function () {
        beforeEach(function () {
          this.ipc.getSpecs.yields(null, this.specs)

          this.openProject.resolve(this.config)
        })

        it('collapsing root spec will keep root itself expanded', function () {
          cy.get('.level-0 .folder-name').find('a:first').click({ multiple: true })
          cy.get('.folder.folder-collapsed').should('have.length', 3)
          cy.get('.folder.folder-expanded').should('have.length', 2)
        })

        it('collapses all children folders', function () {
          cy.get('.level-0 .folder-name').find('a:first').click({ multiple: true })

          const lastCollapsedFolderSelector = '.folder-collapsed:last .folder-name'
          const rootSpecCollapsedFoldersSelector = '.folder-collapsed'

          cy.get(lastCollapsedFolderSelector).click()
          cy.get(rootSpecCollapsedFoldersSelector).should('have.length', 3)

          cy.get(lastCollapsedFolderSelector).click()
          cy.get(rootSpecCollapsedFoldersSelector).should('have.length', 3)

          cy.get(lastCollapsedFolderSelector).click()
          cy.get(rootSpecCollapsedFoldersSelector).should('have.length', 3)

          cy.get(lastCollapsedFolderSelector).click()
          cy.get(rootSpecCollapsedFoldersSelector).should('have.length', 3)

          cy.get(lastCollapsedFolderSelector).click()
          cy.get(rootSpecCollapsedFoldersSelector).should('have.length', 2)

          cy.get(lastCollapsedFolderSelector).click()
          cy.get(rootSpecCollapsedFoldersSelector).should('have.length', 2)

          cy.get(lastCollapsedFolderSelector).click()
          cy.get(rootSpecCollapsedFoldersSelector).should('have.length', 1)

          cy.get(lastCollapsedFolderSelector).click()
          cy.get(rootSpecCollapsedFoldersSelector).should('have.length', 0)
        })

        it('expand all expands all sub folders', function () {
          cy.get('.level-0 .folder-name').find('a:first').click({ multiple: true })
          cy.get('.folder-expanded').should('have.length', 2)
          cy.get('.folder-collapsed').should('have.length', 3)

          cy.get('.level-0 .folder-name').find('a:last').click({ multiple: true })
          cy.get('.folder-expanded').should('have.length', 10)
          cy.get('.folder-collapsed').should('have.length', 0)
        })

        it('folders toggle expand & collapse with spacebar/enter keys', () => {
          cy.get('.folder-name').first().focus().type('{enter}')
          cy.get('.folder').first().should('have.class', 'folder-collapsed')
          cy.get('.folder-name').first().focus().type('{enter}')
          cy.get('.folder').first().should('have.class', 'folder-expanded')

          cy.get('.folder-name').first().trigger('keydown', { keyCode: 32 })
          cy.get('.folder').first().should('have.class', 'folder-collapsed')
          cy.get('.folder-name').first().trigger('keydown', { keyCode: 32 })
          cy.get('.folder').first().should('have.class', 'folder-expanded')
        })
      })

      describe('without folders', function () {
        beforeEach(function () {
          this.ipc.getSpecs.yields(null, {
            integration: [
              {
                name: 'app_spec.coffee',
                relative: 'app_spec.coffee',
              },
              {
                name: 'account_new_spec.coffee',
                relative: 'account_new_spec.coffee',
              },
            ],
            unit: [],
          })

          this.openProject.resolve(this.config)
        })

        it('hides expand/collapse buttons when there are no folders', function () {
          cy.get('.level-0 .folder-name a').should('not.exist')
        })
      })
    })

    context('filtering specs', function () {
      it('scrolls the specs and not the filter', function () {
        this.ipc.getSpecs.yields(null, this.specs)
        this.openProject.resolve(this.config)

        cy.contains('last_list_spec').scrollIntoView()
        cy.get('.filter').should('be.visible')
      })

      describe('typing the filter', function () {
        const runAllIntegrationSpecsLabel = 'Run 8 integration specs'

        beforeEach(function () {
          this.specs.integration.push({
            name: 'a-b_c/d~e(f)g.spec.js',
            absolute: '/user/project/cypress/integration/a-b_c/d~e(f)g.spec.js',
            relative: 'cypress/integration/a-b_c/d~e(f)g.spec.js',
          })

          this.numSpecs = 16

          this.ipc.getSpecs.yields(null, this.specs)
          this.openProject.resolve(this.config)

          cy.contains('.all-tests', runAllIntegrationSpecsLabel)
          cy.get('.filter').type('new')
        })

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

      describe('when there\'s a saved filter', function () {
        beforeEach(function () {
          this.ipc.getSpecs.yields(null, this.specs)

          cy.window().then(function (win) {
            win.localStorage[`specsFilter-${this.config.projectId}-/foo/bar`] = JSON.stringify('app')
          })
        })

        it('applies it for the appropriate project', function () {
          this.openProject.resolve(this.config)

          cy.get('.filter').should('have.value', 'app')
          cy.contains('.all-tests', 'Run 1 integration spec')
        })

        it('does not apply it for a different project', function () {
          this.config.projectId = 'different'
          this.openProject.resolve(this.config)

          cy.get('.filter').should('have.value', '')
        })
      })

      describe('when project has null id', function () {
        beforeEach(function () {
          this.ipc.getSpecs.yields(null, this.specs)
          this.config.projectId = null
        })

        it('saves the filter to local storage', function () {
          this.openProject.resolve(this.config)

          cy.get('.filter').type('my-filter')
          cy.window().then((win) => {
            expect(win.localStorage[`specsFilter-<no-id>-/foo/bar`]).to.be.a('string')

            expect(JSON.parse(win.localStorage[`specsFilter-<no-id>-/foo/bar`])).to.equal('my-filter')
          })
        })

        it('applies the saved filter when returning to the project', function () {
          cy.window().then(function (win) {
            win.localStorage[`specsFilter-<no-id>-/foo/bar`] = JSON.stringify('my-filter')
            this.openProject.resolve(this.config)
          })

          cy.get('.filter').should('have.value', 'my-filter')
        })
      })
    })

    context('click on spec', function () {
      beforeEach(function () {
        this.ipc.getSpecs.yields(null, this.specs)
        this.openProject.resolve(this.config)

        cy.contains('.file .file-name-wrapper', 'app_spec.coffee').as('firstSpec')
      })

      it('closes then launches browser on click of file', () => {
        cy.get('@firstSpec')
        .click()
        .then(function () {
          expect(this.ipc.closeBrowser).to.have.property('called', true)

          const launchArgs = this.ipc.launchBrowser.lastCall.args

          expect(launchArgs[0].browser.name).to.equal('chrome')

          expect(launchArgs[0].spec.relative).to.equal('cypress/integration/app_spec.coffee')
        })
      })

      it('adds \'active\' class on click', () => {
        cy.get('@firstSpec').parent()
        .should('not.have.class', 'active')

        cy.get('@firstSpec').click()
        .parent()
        .should('have.class', 'active')
      })

      it('shows the running spec label', () => {
        cy.get('@firstSpec').click()
        cy.contains('.all-tests', 'Running 1 spec')
        .find('.fa-dot-circle')
      })

      it('maintains active selection if specs change', function () {
        cy.get('@firstSpec').click().then(() => {
          this.ipc.getSpecs.yield(null, this.specs)
        })

        cy.get('@firstSpec').parent().should('have.class', 'active')
      })
    })

    context('spec running in browser', function () {
      beforeEach(function () {
        this.ipc.getSpecs.yields(null, this.specs)

        this.openProject.resolve(this.config)
      })

      context('choose shallow spec', function () {
        beforeEach(() => {
          cy.get('.file .file-name-wrapper').contains('a', 'app_spec.coffee').as('firstSpec').click()
        })

        it('updates spec icon', function () {
          cy.get('@firstSpec').find('i').should('have.class', 'fa-dot-circle')
          cy.get('@firstSpec').find('i').should('not.have.class', 'fa-file-code')
        })

        it('sets spec as active', () => {
          cy.get('@firstSpec').parent().should('have.class', 'active')
        })
      })

      context('choose deeper nested spec', function () {
        beforeEach(() => {
          cy.get('.file .file-name-wrapper').contains('a', 'last_list_spec.coffee').as('deepSpec').click()
        })

        it('updates spec icon', () => {
          cy.get('@deepSpec').find('i').should('have.class', 'fa-dot-circle')
        })

        it('sets spec as active', () => {
          cy.get('@deepSpec').parent().should('have.class', 'active')
        })
      })
    })

    context('switching specs', function () {
      beforeEach(function () {
        this.ipc.getSpecs.yields(null, this.specs)
        this.openProject.resolve(this.config)

        cy.get('.file').contains('a', 'app_spec.coffee').as('firstSpec')
        .click()

        cy.get('.file').contains('a', 'account_new_spec.coffee').as('secondSpec')
        .click()
      })

      it('updates spec icon', function () {
        cy.get('@firstSpec').find('i').should('not.have.class', 'fa-dot-circle')
        cy.get('@secondSpec').find('i').should('have.class', 'fa-dot-circle')
      })

      it('updates active spec', function () {
        cy.get('@firstSpec').parent().should('not.have.class', 'active')
        cy.get('@secondSpec').parent().should('have.class', 'active')
      })
    })

    context('with component tests', function () {
      beforeEach(function () {
        this.ipc.getSpecs.yields(null, this.specs)
        this.openProject.resolve(this.config)
      })

      it('shows separate run specs buttons', function () {
        cy.get('.all-tests').should('have.length', 2)
        cy.contains('.folder-name', 'integration tests')
        .contains('.all-tests', 'Run 7 integration specs')

        cy.contains('.folder-name', 'component tests')
        .contains('.all-tests', 'Run 8 component specs')
      })

      it('runs all component tests together', function () {
        cy.contains('.all-tests', 'Run 8 component specs').click()
        // all other "Run .." buttons should disappear
        cy.get('.all-tests').should('have.length', 1)
        // and the label changes
        cy.contains('.folder-name', 'component tests')
        .contains('.all-tests', 'Running component tests').should('be.visible')
        .and('have.class', 'active')
      })

      it('runs single component spec', function () {
        cy.contains('bar_list_spec.coffee').click()
        .parent()
        .should('have.class', 'active')

        // all other "Run .." buttons should disappear
        cy.get('.all-tests').should('have.length', 1)
        // and the label changes
        cy.contains('.folder-name', 'component tests')
        .contains('.all-tests', 'Running 1 spec').should('be.visible')
        // the button does not get the class active, it stays with the file
        .and('not.have.class', 'active')
      })

      it('filters all spec types using filter', function () {
        cy.get('.filter').type('fo')
        cy.contains('.all-tests', 'Run 1 integration spec')
        cy.contains('.all-tests', 'Run 1 component spec')

        cy.log('**clearing the search**')
        cy.get('.filter').clear()
        cy.contains('.all-tests', 'Run 7 integration specs')
        cy.contains('.all-tests', 'Run 8 component specs')
      })
    })

    context('returning to specs tab', function () {
      beforeEach(function () {
        this.ipc.getSpecs.yields(null, this.specs)
        this.openProject.resolve(this.config)
      })

      // https://github.com/cypress-io/cypress/issues/9151
      it('does not crash when running', function () {
        cy.contains('.file-name', 'app_spec.coffee').click()
        .then(function () {
          this.ipc.onSpecChanged.yield(null, 'integration/app_spec.coffee')
        })

        cy.contains('.all-tests', 'Running 1 spec')

        cy.contains('.project-nav a', 'Settings').click()
        cy.get('.settings').should('be.visible')
        cy.contains('.project-nav a', 'Tests').click()

        // the specs list renders again
        cy.contains('.file-name', 'app_spec.coffee')
        cy.contains('.all-tests', 'Running 1 spec')
      })
    })
  })

  describe('spec list updates', function () {
    beforeEach(function () {
      this.ipc.getSpecs.yields(null, this.specs)

      this.openProject.resolve(this.config)
    })

    it('updates spec list selected on specChanged', function () {
      cy.get('.file a')
      .contains('a', 'app_spec.coffee').as('firstSpec')
      .then(function () {
        this.ipc.onSpecChanged.yield(null, 'integration/app_spec.coffee')
      })

      cy.get('@firstSpec').parent().should('have.class', 'active')
      .then(function () {
        this.ipc.onSpecChanged.yield(null, 'integration/accounts/account_new_spec.coffee')
      })

      cy.get('@firstSpec').parent().should('not.have.class', 'active')

      cy.contains('a', 'account_new_spec.coffee')
      .parent()
      .should('have.class', 'active')
    })
  })

  describe('open in IDE', function () {
    beforeEach(function () {
      this.ipc.getSpecs.yields(null, this.specs)

      this.openProject.resolve(this.config)

      cy.get('.file').contains('a', 'app_spec.coffee').parent().as('spec')
      cy.get('@spec').contains('Open in IDE').as('button')
    })

    it('does not display button without hover', function () {
      cy.contains('Open in IDE').should('not.be.visible')
    })

    it('displays when spec is hovered over', function () {
      cy.get('@spec').realHover()
      cy.get('@button').should('be.visible')

      // invoke show for snapshot since hover doesn't do it
      cy.get('@button').invoke('show')
      cy.percySnapshot()
    })

    it('displays when spec is active and hovered over', function () {
      cy.get('@spec').click().should('have.class', 'active')

      cy.get('@spec').realHover()
      cy.get('@button').should('be.visible')

      cy.get('@button').invoke('show')
      cy.percySnapshot()
    })

    describe('opens files', function () {
      beforeEach(function () {
        this.availableEditors = [
          { id: 'computer', name: 'On Computer', isOther: false, openerId: 'computer' },
          { id: 'atom', name: 'Atom', isOther: false, openerId: 'atom' },
          { id: 'vim', name: 'Vim', isOther: false, openerId: 'vim' },
          { id: 'sublime', name: 'Sublime Text', isOther: false, openerId: 'sublime' },
          { id: 'vscode', name: 'Visual Studio Code', isOther: false, openerId: 'vscode' },
          { id: 'other', name: 'Other', isOther: true, openerId: '' },
        ]

        cy.get('@spec').realHover()
      })

      context('when user has not already set opener and opens file', function () {
        beforeEach(function () {
          this.ipc.getUserEditor.resolves({
            availableEditors: this.availableEditors,
            preferredOpener: this.availableEditors[4],
          })
        })

        it('opens in preferred opener', function () {
          cy.get('@button').click()
          .then(() => {
            expect(this.ipc.openFile).to.be.calledWith({
              where: this.availableEditors[4],
              file: '/user/project/cypress/integration/app_spec.coffee',
              line: 0,
              column: 0,
            })
          })
        })
      })

      context('when user has not already set opener and opens file', function () {
        beforeEach(function () {
          this.ipc.getUserEditor.resolves({
            availableEditors: this.availableEditors,
          })

          cy.get('@button').click()
        })

        it('opens modal with available editors', function () {
          this.availableEditors.forEach(({ name }) => {
            cy.contains(name)
          })

          cy.contains('Set preference and open file')
          cy.percySnapshot()
        })

        it('closes modal when cancel is clicked', function () {
          cy.contains('Cancel').click()
          cy.contains('Set preference and open file').should('not.exist')
        })

        describe('when editor is not selected', function () {
          it('disables submit button', function () {
            cy.contains('Set preference and open file')
            .should('have.class', 'is-disabled')
            .click()
            .then(function () {
              expect(this.ipc.setUserEditor).not.to.be.called
              expect(this.ipc.openFile).not.to.be.called
            })
          })

          it('shows validation message when hovering over submit button', function () {
            cy.get('.editor-picker-modal .submit').trigger('mouseover')
            cy.get('.cy-tooltip').should('have.text', 'Please select a preference')
          })
        })

        describe('when Other is selected but path is not entered', function () {
          beforeEach(function () {
            cy.contains('Other').click()
          })

          it('disables submit button', function () {
            cy.contains('Set preference and open file')
            .should('have.class', 'is-disabled')
            .click()
            .then(function () {
              expect(this.ipc.setUserEditor).not.to.be.called
              expect(this.ipc.openFile).not.to.be.called
            })
          })

          it('shows validation message when hovering over submit button', function () {
            cy.get('.editor-picker-modal .submit').trigger('mouseover')
            cy.get('.cy-tooltip').should('have.text', 'Please enter the path for the "Other" editor')
          })
        })

        describe('when editor is set', function () {
          beforeEach(function () {
            cy.contains('Visual Studio Code').click()
            cy.contains('Set preference and open file').click()
          })

          it('closes modal', function () {
            cy.contains('Set preference and open file').should('not.exist')
          })

          it('sets user editor', function () {
            expect(this.ipc.setUserEditor).to.be.calledWith(this.availableEditors[4])
          })

          it('opens file in selected editor', function () {
            expect(this.ipc.openFile).to.be.calledWith({
              where: this.availableEditors[4],
              file: '/user/project/cypress/integration/app_spec.coffee',
              line: 0,
              column: 0,
            })
          })
        })
      })
    })
  })

  describe('new spec file', function () {
    beforeEach(function () {
      this.openProject.resolve(this.config)
    })

    it('launches system save dialog', function () {
      cy.contains('New Spec File').click().then(function () {
        expect(this.ipc.showNewSpecDialog).to.be.called
      })
    })

    context('POSIX paths', function () {
      context('when file is created within project path', function () {
        beforeEach(function () {
          this.newSpec = {
            name: 'new_spec.js',
            absolute: '/user/project/cypress/integration/new_spec.js',
            relative: 'cypress/integration/new_spec.js',
          }

          this.ipc.showNewSpecDialog.resolves({
            specs: { ...this.specs, integration: this.specs.integration.concat(this.newSpec) },
            path: this.newSpec.absolute,
          })
        })

        it('adds and highlights new spec item', function () {
          cy.contains('New Spec File').click()
          cy.contains('new_spec.js').closest('.file').should('have.class', 'new-spec')
        })

        it('scrolls the new spec item into view', function () {
          cy.contains('New Spec File').click()
          cy.contains('new_spec.js').closest('.file').then(function ($el) {
            cy.stub($el[0], 'scrollIntoView')
            cy.contains('New Spec File').click()
            cy.wrap($el[0].scrollIntoView).should('be.called')
          })
        })

        it('does not display warning message', function () {
          cy.contains('New Spec File').click()
          cy.contains('Your file has been successfully created').should('not.be.visible')
        })
      })

      context('when file is created outside of project path', function () {
        beforeEach(function () {
          this.newSpec = {
            name: 'new_spec.js',
            absolute: '/user/desktop/my_folder/new_spec.js',
          }

          this.ipc.showNewSpecDialog.resolves({
            specs: this.specs,
            path: this.newSpec.absolute,
          })
        })

        it('displays a dismissable warning message', function () {
          cy.contains('New Spec File').click()

          cy.contains('Your file has been successfully created')
          .should('be.visible')
          .closest('.notification-wrap')
          .find('.notification-close')
          .click()

          cy.contains('Your file has been successfully created').should('not.be.visible')
        })
      })
    })

    context('Windows paths', function () {
      beforeEach(function () {
        this.ipc.getSpecs.yields(null, this.specsWindows)
      })

      context('when file is created within project path', function () {
        beforeEach(function () {
          this.newSpec = {
            name: 'new_spec.js',
            absolute: 'C:\\Users\\user\\project\\cypress\\integration\\new_spec.js',
            relative: 'cypress\\integration\\new_spec.js',
          }

          this.ipc.showNewSpecDialog.resolves({
            specs: { ...this.specsWindows, integration: this.specs.integration.concat(this.newSpec) },
            path: this.newSpec.absolute,
          })
        })

        it('adds and highlights new spec item', function () {
          cy.contains('New Spec File').click()
          cy.contains('new_spec.js').closest('.file').should('have.class', 'new-spec')
        })

        it('scrolls the new spec item into view', function () {
          cy.contains('New Spec File').click()
          cy.contains('new_spec.js').closest('.file').then(function ($el) {
            cy.stub($el[0], 'scrollIntoView')
            cy.contains('New Spec File').click()
            cy.wrap($el[0].scrollIntoView).should('be.called')
          })
        })

        it('does not display warning message', function () {
          cy.contains('New Spec File').click()
          cy.contains('Your file has been successfully created').should('not.be.visible')
        })
      })

      context('when file is created outside of project path', function () {
        beforeEach(function () {
          this.newSpec = {
            name: 'new_spec.js',
            absolute: 'C:\\Users\\user\\Desktop\\my_folder\\new_spec.js',
          }

          this.ipc.showNewSpecDialog.resolves({
            specs: this.specsWindows,
            path: this.newSpec.absolute,
          })
        })

        it('displays a dismissable warning message', function () {
          cy.contains('New Spec File').click()

          cy.contains('Your file has been successfully created')
          .should('be.visible')
          .closest('.notification-wrap')
          .find('.notification-close')
          .click()

          cy.contains('Your file has been successfully created').should('not.be.visible')
        })
      })
    })
  })
})
