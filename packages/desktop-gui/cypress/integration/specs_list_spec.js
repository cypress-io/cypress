describe('Specs List', function () {
  beforeEach(function () {
    cy.fixture('user').as('user')
    cy.fixture('config').as('config')
    cy.fixture('specs').as('specs')
    cy.fixture('specs_windows').as('specsWindows')

    cy.visitIndex().then(function (win) {
      let start = win.App.start

      this.win = win
      this.ipc = win.App.ipc

      this.numSpecs = this.specs.integration.length + this.specs.unit.length

      cy.stub(this.ipc, 'getOptions').resolves({ projectRoot: '/foo/bar' })
      cy.stub(this.ipc, 'getCurrentUser').resolves(this.user)
      cy.stub(this.ipc, 'getSpecs').yields(null, this.specs)
      cy.stub(this.ipc, 'closeBrowser').resolves(null)
      cy.stub(this.ipc, 'launchBrowser')
      cy.stub(this.ipc, 'openFinder')
      cy.stub(this.ipc, 'externalOpen')
      cy.stub(this.ipc, 'onboardingClosed')
      cy.stub(this.ipc, 'onSpecChanged')

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
    })

    it('displays integration test folder path', function () {
      cy.contains(this.config.integrationFolder)
    })

    it('triggers open:finder on click of text folder', function () {
      cy.contains(this.config.integrationFolder).click().then(function () {
        expect(this.ipc.openFinder).to.be.calledWith(this.config.integrationFolder)
      })
    })

    it('displays help link', () => {
      cy.contains('a', 'Need help?')
    })

    it('opens link to docs on click of help link', () => {
      cy.contains('a', 'Need help?').click().then(function () {
        expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/writing-first-test')
      })
    })
  })

  describe('first time onboarding specs', function () {
    beforeEach(function () {
      this.config.isNewProject = true

      this.openProject.resolve(this.config)
    })

    it('displays modal', () => {
      cy.contains('.modal', 'To help you get started').should('be.visible')
    })

    it('displays the scaffolded files', () => {
      cy.get('.folder-preview-onboarding').within(function () {
        cy.contains('span', 'fixtures').siblings('ul').within(function () {})
        cy.contains('example.json')
        cy.contains('span', 'integration').siblings('ul').within(() => {
          cy.contains('examples')
        })

        cy.contains('span', 'support').siblings('ul').within(function () {
          cy.contains('commands.js')
          cy.contains('defaults.js')

          cy.contains('index.js')
        })

        cy.contains('span', 'plugins').siblings('ul').within(() => {
          cy.contains('index.js')
        })
      })
    })

    it('lists folders and files alphabetically', () => {
      cy.get('.folder-preview-onboarding').within(() => {
        cy.contains('fixtures').parent().next()
        .contains('integration')
      })
    })

    it('truncates file lists with more than 3 items', () => {
      cy.get('.folder-preview-onboarding').within(function () {
        cy.contains('examples').closest('.new-item').find('li')
        .should('have.length', 3)

        cy.get('.is-more').should('have.text', ' ... 17 more files ...')
      })
    })

    it('can dismiss the modal', function () {
      cy.contains('OK, got it!').click()

      cy.get('.modal').should('not.be.visible')
      .then(function () {
        expect(this.ipc.onboardingClosed).to.be.called
      })
    })

    it('triggers open:finder on click of example folder', function () {
      cy.get('.modal').contains('examples').click().then(() => {
        expect(this.ipc.openFinder).to.be.calledWith(this.config.integrationExamplePath)
      })
    })

    it('triggers open:finder on click of text folder', function () {
      cy.get('.modal').contains('cypress/integration').click().then(() => {
        expect(this.ipc.openFinder).to.be.calledWith(this.config.integrationFolder)
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
          cy.get('.file a').last().should('contain', 'last_list_spec.coffee')
          cy.get('.file a').last().should('not.contain', 'admin_users')
        })
      })
    })

    context('Linux paths', function () {
      beforeEach(function () {
        this.ipc.getSpecs.yields(null, this.specs)

        this.openProject.resolve(this.config)
      })

      context('run all specs', function () {
        it('displays run all specs button', () => {
          cy.contains('.btn', 'Run all specs')
        })

        it('has play icon', () => {
          cy.contains('.btn', 'Run all specs')
          .find('i').should('have.class', 'fa-play')
        })

        it('triggers browser launch on click of button', () => {
          cy.contains('.btn', 'Run all specs').click()
          .then(function () {
            const launchArgs = this.ipc.launchBrowser.lastCall.args

            expect(launchArgs[0].browser.name).to.eq('chrome')

            expect(launchArgs[0].spec.name).to.eq('All Specs')
          })
        })

        describe('all specs running in browser', function () {
          beforeEach(() => {
            cy.contains('.btn', 'Run all specs').as('allSpecs').click()
          })

          it('updates spec icon', function () {
            cy.get('@allSpecs').find('i').should('have.class', 'fa-dot-circle-o')

            cy.get('@allSpecs').find('i').should('not.have.class', 'fa-play')
          })

          it('sets spec as active', () => {
            cy.get('@allSpecs').should('have.class', 'active')
          })
        })
      })

      context('displays list of specs', function () {
        it('lists main folders of specs', function () {
          cy.contains('.folder.level-0', 'integration')
          cy.contains('.folder.level-0', 'unit')
        })

        it('lists nested folders', () => {
          cy.get('.folder.level-0 .folder.level-1').contains('accounts')
        })

        it('lists test specs', () => {
          cy.get('.folder.level-0 .file.level-1 a').contains('app_spec.coffee')
        })

        it('lists folder with \'.\'', function () {
          cy.get('.file').should('have.length', this.numSpecs)
          cy.get('.folder').should('have.length', 10)
        })
      })

      context('collapsing specs', function () {
        it('sets folder collapsed when clicked', function () {
          cy.get('.folder:first').should('have.class', 'folder-expanded')
          cy.get('.folder .folder-name:first').click()

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
          cy.get('.file').should('have.length', 6)

          cy.get(lastExpandedFolderSelector).click()
          cy.get('.file').should('have.length', 6)

          cy.get(lastExpandedFolderSelector).click()
          cy.get('.file').should('have.length', 5)

          cy.get(lastExpandedFolderSelector).click()
          cy.get('.file').should('have.length', 5)

          cy.get(lastExpandedFolderSelector).click()
          cy.get('.file').should('have.length', 5)

          cy.get(lastExpandedFolderSelector).click()
          cy.get('.file').should('have.length', 5)

          cy.get(lastExpandedFolderSelector).click()
          cy.get('.file').should('have.length', 4)

          cy.get(lastExpandedFolderSelector).click()
          cy.get('.file').should('have.length', 3)

          cy.get(lastExpandedFolderSelector).click()
          cy.get('.file').should('have.length', 1)

          cy.get(lastExpandedFolderSelector).click()

          cy.get('.file').should('have.length', 0)
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
        beforeEach(function () {
          this.ipc.getSpecs.yields(null, this.specs)
          this.openProject.resolve(this.config)

          cy.get('.filter').type('new')
        })

        it('displays only matching spec', () => {
          cy.get('.specs-list .file')
          .should('have.length', 1)
          .and('contain', 'account_new_spec.coffee')
        })

        it('only shows matching folders', () => {
          cy.get('.specs-list .folder')
          .should('have.length', 2)
        })

        it('clears the filter on clear button click', function () {
          cy.get('.clear-filter').click()
          cy.get('.filter')
          .should('have.value', '')

          cy.get('.specs-list .file')
          .should('have.length', this.numSpecs)
        })

        it('clears the filter if the user press ESC key', function () {
          cy.get('.filter').type('{esc}')
          .should('have.value', '')

          cy.get('.specs-list .file')
          .should('have.length', this.numSpecs)
        })

        it('shows empty message if no results', function () {
          cy.get('.filter').clear().type('foobarbaz')
          cy.get('.specs-list').should('not.exist')

          cy.get('.empty-well').should('contain', 'No specs match your search: "foobarbaz"')
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
        })

        it('does not apply it for a different project', function () {
          this.config.projectId = 'different'
          this.openProject.resolve(this.config)

          cy.get('.filter').should('have.value', '')
        })
      })
    })

    context('click on spec', function () {
      beforeEach(function () {
        this.ipc.getSpecs.yields(null, this.specs)
        this.openProject.resolve(this.config)

        cy.contains('.file a', 'app_spec.coffee').as('firstSpec')
      })

      it('closes then launches browser on click of file', () => {
        cy.get('@firstSpec')
        .click()
        .then(function () {
          expect(this.ipc.closeBrowser).to.be.called

          const launchArgs = this.ipc.launchBrowser.lastCall.args

          expect(launchArgs[0].browser.name).to.equal('chrome')

          expect(launchArgs[0].spec.relative).to.equal('cypress/integration/app_spec.coffee')
        })
      })

      it('adds \'active\' class on click', () => {
        cy.get('@firstSpec')
        .should('not.have.class', 'active')
        .click()
        .should('have.class', 'active')
      })

      it('maintains active selection if specs change', function () {
        cy.get('@firstSpec').click().then(() => {
          this.ipc.getSpecs.yield(null, this.specs)
        })

        cy.get('@firstSpec').should('have.class', 'active')
      })
    })

    context('spec running in browser', function () {
      beforeEach(function () {
        this.ipc.getSpecs.yields(null, this.specs)

        this.openProject.resolve(this.config)
      })

      context('choose shallow spec', function () {
        beforeEach(() => {
          cy.get('.file a').contains('a', 'app_spec.coffee').as('firstSpec').click()
        })

        it('updates spec icon', function () {
          cy.get('@firstSpec').find('i').should('have.class', 'fa-dot-circle-o')
          cy.get('@firstSpec').find('i').should('not.have.class', 'fa-file-code-o')
        })

        it('sets spec as active', () => {
          cy.get('@firstSpec').should('have.class', 'active')
        })
      })

      context('choose deeper nested spec', function () {
        beforeEach(() => {
          cy.get('.file a').contains('a', 'last_list_spec.coffee').as('deepSpec').click()
        })

        it('updates spec icon', () => {
          cy.get('@deepSpec').find('i').should('have.class', 'fa-dot-circle-o')
        })

        it('sets spec as active', () => {
          cy.get('@deepSpec').should('have.class', 'active')
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
        cy.get('@firstSpec').find('i').should('not.have.class', 'fa-dot-circle-o')
        cy.get('@secondSpec').find('i').should('have.class', 'fa-dot-circle-o')
      })

      it('updates active spec', function () {
        cy.get('@firstSpec').should('not.have.class', 'active')
        cy.get('@secondSpec').should('have.class', 'active')
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

      cy.get('@firstSpec').should('have.class', 'active')
      .then(function () {
        this.ipc.onSpecChanged.yield(null, 'integration/accounts/account_new_spec.coffee')
      })

      cy.get('@firstSpec').should('not.have.class', 'active')

      cy.contains('a', 'account_new_spec.coffee')
      .should('have.class', 'active')
    })
  })
})
