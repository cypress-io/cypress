describe('AUT window patches', () => {
  describe('window.parent', () => {
    // https://github.com/cypress-io/cypress/issues/1436
    it('returns the AUT window, not Cypress top', () => {
      cy.visit('/fixtures/issue-1436.html')
      cy.window().then((win: any) => {
        win.__app__ = true

        expect(win.getParent(win).__app__).to.be.true
        expect(win.getParentMin(win).__app__).to.be.true
      })
    })

    // NOTE: 11/15/18 jira is throwing an error in one
    // of their scripts and its causing this test to fail
    it.skip('can visit jira', () => {
      // no javascript errors should have been thrown.
      // NOTE: this is potentially a bad idea because we don't
      // control Jira, and therefore they could push changes
      // which cause Cypress to throw (or be down). if this
      // ends up happening we'll need to remove this test.
      cy.visit('https://jira.atlassian.com/secure/BrowseProjects.jspa?selectedCategory=all&selectedProjectType=all')
    })

    // https://github.com/cypress-io/cypress/issues/6412
    it('clicks an element without an Illegal invocation error when the AUT defines a global named parent', () => {
      cy.visit('/fixtures/global_parent_definition.html')
      cy.get('.foo').click()
    })
  })

  describe('setTimeout', () => {
    // https://github.com/cypress-io/cypress/issues/1854
    it('does not error when the callback is a string referencing a global', () => {
      cy.visit('/fixtures/generic.html')
      cy.window().then((win: any) => {
        win.foo = (arg) => {
          win.bar = arg
        }

        win.setTimeout('foo(true)', 100)
      })

      cy.window().its('bar').should('be.true')
    })

    // https://github.com/cypress-io/cypress/issues/5707
    it('calls the callback with the correct context', () => {
      cy.visit('/fixtures/issue-5707.html')
      cy.window().its('foo').should('eq', 'bar')
    })
  })

  // https://github.com/cypress-io/cypress/issues/2582
  describe('frameElement', () => {
    it('is rewritten to null on the AUT', () => {
      cy.visit('http://localhost:3500/fixtures/generic.html')

      cy.window().its('frameElement').should('be.null')
    })

    describe('with modifyObstructiveCode: false', () => {
      let modifyObstructiveCode

      // Cypress.config() mutations made inside a test persist for the rest of
      // the spec, so restore the value for the tests that follow
      beforeEach(() => {
        modifyObstructiveCode = Cypress.config('modifyObstructiveCode')
        // @ts-expect-error
        Cypress.config('modifyObstructiveCode', false)
      })

      afterEach(() => {
        // @ts-expect-error
        Cypress.config('modifyObstructiveCode', modifyObstructiveCode)
      })

      it('is not rewritten', () => {
        cy.visit('http://localhost:3500/fixtures/generic.html')

        cy.window().then((win) => {
          expect(win.frameElement).not.to.be.null
          expect(win.frameElement).to.eq(cy.state('$autIframe').get(0))
        })
      })
    })
  })

  // https://github.com/cypress-io/cypress/issues/4295
  describe('document.referrer', () => {
    it('is rewritten to an empty string on visit', () => {
      cy.visit('http://localhost:3500/fixtures/generic.html')

      cy.window().its('document').its('referrer').should('equal', '')
    })

    it('is rewritten to an empty string on visit before user calls onBeforeLoad', () => {
      cy.visit('http://localhost:3500/fixtures/generic.html', { onBeforeLoad: (contentWindow) => {
        expect(contentWindow.document.referrer).to.equal('')
      } })
    })

    it('is not rewritten if navigation was triggered by click on a link', () => {
      cy.visit('http://localhost:3500/fixtures/generic.html')

      cy.get('#dimensions').click()

      cy.window().its('document').its('referrer').should('equal', 'http://localhost:3500/fixtures/generic.html')
    })
  })

  // https://github.com/cypress-io/cypress/issues/599
  describe('XMLHttpRequest onreadystatechange', () => {
    it('does not error when the AUT redefines onreadystatechange', () => {
      cy.visit('/fixtures/issue-599.html')
      cy.contains('xhr test').click()
      cy.contains('xhr test').click()
    })
  })

  // https://github.com/cypress-io/cypress/issues/2784
  describe('cross origin iframe embedded in the AUT', () => {
    it('does not throw when embedding a cross origin iframe', () => {
      cy.visit('/fixtures/generic.html')
      cy.document().then((doc) => {
        return new Cypress.Promise((resolve) => {
          const iframe = doc.createElement('iframe')

          iframe.onload = resolve
          iframe.src = 'http://localhost:3501/fixtures/generic.html'
          doc.body.appendChild(iframe)
        })
      })

      // change the subject to be <window>
      cy.window()
      cy.get('a').should('be.visible')
    })
  })
})
