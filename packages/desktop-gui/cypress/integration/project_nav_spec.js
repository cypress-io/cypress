describe('Project Nav', function () {
  beforeEach(function () {
    cy.fixture('user').as('user')
    cy.fixture('config').as('config')
    cy.fixture('runs').as('runs')
    cy.fixture('specs').as('specs')

    cy.visitIndex().then(function (win) {
      let start = win.App.start

      this.win = win
      this.ipc = win.App.ipc

      cy.stub(this.ipc, 'getOptions').resolves({ projectRoot: '/foo/bar' })
      cy.stub(this.ipc, 'updaterCheck').resolves(false)
      cy.stub(this.ipc, 'getCurrentUser').resolves(this.user)
      cy.stub(this.ipc, 'getRuns').resolves(this.runs)
      cy.stub(this.ipc, 'getSpecs').yields(null, this.specs)
      cy.stub(this.ipc, 'getRecordKeys').resolves([])
      cy.stub(this.ipc, 'launchBrowser')
      cy.stub(this.ipc, 'closeBrowser').resolves(null)
      cy.stub(this.ipc, 'pingApiServer').resolves()
      cy.stub(this.ipc, 'closeProject')
      cy.stub(this.ipc, 'externalOpen')
      cy.stub(this.ipc, 'offOpenProject')
      cy.stub(this.ipc, 'offGetSpecs')
      cy.stub(this.ipc, 'offOnFocusTests')

      this.openProject = this.util.deferred()
      cy.stub(this.ipc, 'openProject').returns(this.openProject.promise)

      start()
    })
  })

  context('project nav', function () {
    beforeEach(function () {
      this.openProject.resolve(this.config)
    })

    it('displays projects nav', function () {
      cy.get('.empty').should('not.be.visible')

      cy.get('.navbar-default')
    })

    it('displays \'Tests\' nav as active', () => {
      cy.get('.navbar-default').contains('a', 'Tests')
      .should('have.class', 'active')
    })

    describe('when project loads', function () {
      beforeEach(() => {
        cy.wait(600)
      })

      it('displays \'Tests\' page', () => {
        cy.contains('integration')
      })
    })

    describe('runs page', function () {
      beforeEach(function () {
        cy.fixture('runs').as('runs')

        cy.get('.navbar-default')
        .contains('a', 'Runs').as('runsNav').click()
      })

      it('highlights runs on click', () => {
        cy.get('@runsNav')
        .should('have.class', 'active')
      })

      it('displays runs page', function () {
        cy.get('.runs-container li')
        .should('have.length', this.runs.length)
      })
    })

    describe('settings page', function () {
      beforeEach(() => {
        cy.get('.navbar-default')
        .contains('a', 'Settings').as('settingsNav').click()
      })

      it('highlights config on click', () => {
        cy.get('@settingsNav')
        .should('have.class', 'active')
      })

      it('displays settings page', () => {
        cy.contains('Configuration')
      })
    })
  })

  context('browsers dropdown', function () {
    describe('browsers available', function () {
      beforeEach(function () {
        this.openProject.resolve(this.config)
      })

      context('normal browser list behavior', function () {
        it('lists browsers', () => {
          cy.get('.browsers-list').parent()
          .find('.dropdown-menu').first()
          .find('li').should('have.length', 2)
          .should(function ($li) {
            expect($li.first()).to.contain('Chromium')
            expect($li.last()).to.contain('Canary')
          })
        })

        it('does not display stop button', () => {
          cy.get('.close-browser').should('not.exist')
        })

        describe('default browser', function () {
          it('displays default browser name in chosen', () => {
            cy.get('.browsers-list>a').first()
            .should('contain', 'Chrome')
          })

          it('displays default browser icon in chosen', () => {
            cy.get('.browsers-list>a').first()
            .find('.fa-chrome')
          })
        })
      })

      context('switch browser', function () {
        beforeEach(function () {
          cy.get('.browsers-list>a').first().click()

          cy.get('.browsers-list').find('.dropdown-menu')
          .contains('Chromium').click()
        })

        afterEach(() => {
          cy.clearLocalStorage()
        })

        it('switches text in button on switching browser', () => {
          cy.get('.browsers-list>a').first().contains('Chromium')
        })

        it('swaps the chosen browser into the dropdown', () => {
          cy.get('.browsers-list').find('.dropdown-menu')
          .find('li').should('have.length', 2)
          .should(function ($li) {
            expect($li.first()).to.contain('Chrome')

            expect($li.last()).to.contain('Canary')
          })
        })

        it('saves chosen browser in local storage', () => {
          expect(localStorage.getItem('chosenBrowser')).to.eq('chromium')
        })
      })

      context('opening browser by choosing spec', function () {
        beforeEach(() => {
          cy.contains('.file', 'app_spec').click()
        })

        it('displays browser icon as spinner', () => {
          cy.get('.browsers-list>a').first().find('i')
          .should('have.class', 'fa fa-refresh fa-spin')
        })

        it('disables browser dropdown', () => {
          cy.get('.browsers-list>a').first()
          .should('have.class', 'disabled')
        })
      })

      context('browser opened after choosing spec', function () {
        beforeEach(function () {
          this.ipc.launchBrowser.yields(null, { browserOpened: true })

          cy.contains('.file', 'app_spec').click()
        })

        it('displays browser icon as opened', () => {
          cy.get('.browsers-list>a').first().find('i')
          .should('have.class', 'fa fa-check-circle-o')
        })

        it('disables browser dropdown', () => {
          cy.get('.browsers-list>a').first()
          .should('have.class', 'disabled')
        })

        it('displays stop browser button', () => {
          cy.get('.close-browser').should('be.visible')
        })

        it('sends the required parameters to launch a browser', function () {
          const browserArg = this.ipc.launchBrowser.getCall(0).args[0].browser

          expect(browserArg).to.have.keys([
            'family', 'name', 'path', 'version', 'majorVersion', 'displayName', 'info', 'isChosen', 'custom', 'warning',
          ])

          expect(browserArg.path).to.include('/')
          expect(browserArg.family).to.equal('chrome')
        })

        describe('stop browser', function () {
          beforeEach(() => {
            cy.get('.close-browser').click()
          })

          it('calls close:browser on click of stop button', function () {
            expect(this.ipc.closeBrowser).to.be.called
          })

          it('hides close button on click of stop', () => {
            cy.get('.close-browser').should('not.exist')
          })

          it('re-enables browser dropdown', () => {
            cy.get('.browsers-list>a').first()
            .should('not.have.class', 'disabled')
          })

          it('displays default browser icon', () => {
            cy.get('.browsers-list>a').first()
            .find('.fa-chrome')
          })
        })

        describe('browser is closed manually', function () {
          beforeEach(function () {
            this.ipc.launchBrowser.yield(null, { browserClosed: true })
          })

          it('hides close browser button', () => {
            cy.get('.close-browser').should('not.be.visible')
          })

          it('re-enables browser dropdown', () => {
            cy.get('.browsers-list>a').first()
            .and('not.have.class', 'disabled')
          })

          it('displays default browser icon', () => {
            cy.get('.browsers-list>a').first()
            .find('.fa-chrome')
          })
        })
      })
    })

    describe('local storage saved browser', function () {
      beforeEach(function () {
        localStorage.setItem('chosenBrowser', 'chromium')

        this.openProject.resolve(this.config)
      })

      afterEach(() => {
        cy.clearLocalStorage()
      })

      it('displays local storage browser name in chosen', () => {
        cy.get('.browsers-list>a').first()
        .should('contain', 'Chromium')
      })

      it('displays local storage browser icon in chosen', () => {
        cy.get('.browsers-list>a').first()
        .find('.fa-chrome')
      })
    })

    describe('when browser saved in local storage no longer exists', function () {
      beforeEach(function () {
        localStorage.setItem('chosenBrowser', 'netscape-navigator')

        this.openProject.resolve(this.config)
      })

      it('defaults to first browser', () => {
        cy.get('.browsers-list>a').first()
        .should('contain', 'Chrome')
      })
    })

    describe('only one browser available', function () {
      beforeEach(function () {
        this.oneBrowser = [{
          name: 'electron',
          family: 'electron',
          displayName: 'Electron',
          version: '50.0.2661.86',
          path: '',
          majorVersion: '50',
        }]

        this.config.browsers = this.oneBrowser

        this.openProject.resolve(this.config)
      })

      it('displays no dropdown btn', () => {
        cy.get('.browsers-list')
        .find('.dropdown-toggle').should('not.be.visible')
      })
    })

    describe('browser has a warning attached', function () {
      beforeEach(function () {
        this.browsers = [
          {
            'name': 'chromium',
            'displayName': 'Chromium',
            'family': 'chrome',
            'version': '49.0.2609.0',
            'path': '/Users/bmann/Downloads/chrome-mac/Chromium.app/Contents/MacOS/Chromium',
            'majorVersion': '49',
            'warning': 'Cypress detected policy settings on your computer that may cause issues with using this browser. For more information, see https://on.cypress.io/bad-browser-policy',
          },
        ]

        this.config.browsers = this.browsers

        this.openProject.resolve(this.config)
      })

      it('shows warning icon with linkified tooltip', function () {
        cy.get('.browsers .fa-exclamation-triangle').trigger('mouseover')

        cy.get('.cy-tooltip').should('contain', 'Cypress detected policy settings on your computer that may cause issues with using this browser. For more information, see')
        cy.get('.cy-tooltip a').click().then(function () {
          expect(this.ipc.externalOpen).to.be.calledWith('https://on.cypress.io/bad-browser-policy')
        })
      })
    })

    describe('custom browser available', function () {
      beforeEach(function () {
        this.config.browsers.push({
          name: 'chromium',
          family: 'chrome',
          custom: true,
          displayName: 'Custom Chromium',
          version: '72.0.3626.96',
          majorVersion: '72',
          path: '/usr/bin/chromium-x',
          info: 'Loaded from /usr/bin/chromium-x',
        })

        this.openProject.resolve(this.config)
      })

      it('pre-selects the custom browser', () => {
        cy.get('.browsers-list>a').first()
        .should('contain', 'Custom Chromium')
      })

      it('pre-selects the custom browser if chosenBrowser saved locally', function () {
        localStorage.setItem('chosenBrowser', 'electron')
        cy.get('.browsers-list>a').first()
        .should('contain', 'Custom Chromium')

        cy.wrap(localStorage.getItem('chosenBrowser')).should('equal', 'electron')
      })
    })

    describe('browser with info', function () {
      beforeEach(function () {
        this.info = 'The Electron browser is the version of Chrome that is bundled with Electron. Cypress uses this browser when running headlessly, so it may be useful for debugging issues that occur only in headless mode.'
        this.config.browsers = [{
          name: 'electron',
          family: 'electron',
          displayName: 'Electron',
          version: '50.0.2661.86',
          path: '',
          majorVersion: '50',
          info: this.info,
        }]

        this.openProject.resolve(this.config)
      })

      it('shows info icon with tooltip', function () {
        cy.get('.browsers .fa-info-circle')
        .trigger('mouseover')

        cy.get('.cy-tooltip')
        .should('contain', this.info)
      })
    })
  })

  context('issue #869 - nav responsiveness', function () {
    beforeEach(function () {
      this.openProject.resolve(this.config)
    })

    it('main nav does not block project nav when long project name pushes it to multiple lines', () => {
      cy.viewport(400, 400)
      cy.get('.project-nav').should('be.visible')
    })
  })
})
