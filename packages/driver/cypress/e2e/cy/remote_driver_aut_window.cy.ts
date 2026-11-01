const AUT_PAGE = 'http://www.foobar.com:3500/fixtures/remote-driver-isolation.html'

describe('remote driver: the AUT window', { experimentalRemoteDriver: true }, () => {
  describe('uncaught:exception', () => {
    beforeEach(() => {
      cy.visit(AUT_PAGE)
    })

    it('reports an error the app throws', () => {
      const errors: string[] = []

      cy.on('uncaught:exception', (err) => {
        errors.push(err.message)

        return false
      })

      cy.get('#throw').click()
      cy.wrap(errors).should((e) => expect(e.join()).to.include('app boom'))
    })

    // WebKit gives an unhandled rejection no location to tell the AUT's from the spec's
    it('reports an unhandled rejection', { browser: '!webkit' }, () => {
      const errors: string[] = []

      cy.on('uncaught:exception', (err) => {
        errors.push(err.message)

        return false
      })

      cy.get('#reject').click()
      cy.wrap(errors).should((e) => {
        expect(e.join()).to.include('app rejection')

        // BiDi reports an unhandled rejection the same way as a thrown error
        if (!Cypress.isBrowser('firefox')) {
          expect(e.join()).to.include('It was caused by an unhandled promise rejection.')
        }
      })
    })

    it('fails the test when the error is not handled, even after its last command', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('app boom')
        expect(err.message).to.include('originated from your application code')

        done()
      })

      cy.get('#throw').click()
    })
  })

  describe('navigation', () => {
    const logNames: string[] = []
    const urls: string[] = []

    beforeEach(() => {
      logNames.length = 0
      urls.length = 0

      cy.visit(AUT_PAGE)
      cy.on('log:added', (attrs) => logNames.push(attrs.name))
      cy.on('url:changed', (url) => urls.push(url))
    })

    it('waits for a page load a command started', () => {
      cy.get('#nav').click()
      cy.get('#page').should('have.text', '2')
      cy.wrap(null).then(() => {
        expect(logNames).to.include('page load')
        expect(logNames).to.include('new url')
        expect(urls).to.include(`${AUT_PAGE}?page=2`)
      })
    })

    it('reports a hash change', () => {
      cy.get('#hash').click()
      cy.wrap(urls).should('include', `${AUT_PAGE}#section`)
      cy.wrap(logNames).should('include', 'new url')
      cy.url().should('eq', `${AUT_PAGE}#section`)
    })

    it('reports a URL the app pushes to history', () => {
      cy.get('#push-state').click()
      cy.wrap(urls).should('include', `${AUT_PAGE}?page=pushed`)
      cy.wrap(logNames).should('not.include', 'page load')
    })
  })

  describe('cy.visit callbacks', () => {
    it('runs onBeforeLoad in the page before its scripts', () => {
      cy.visit(AUT_PAGE, {
        args: { value: 'from the test' },
        onBeforeLoad (win, args) {
          Object.assign(win, { presetBeforeLoad: args.value })
        },
      })

      cy.get('#preset').should('have.text', 'from the test')
    })

    it('runs onLoad in the page after it loads', () => {
      cy.visit(AUT_PAGE, {
        onLoad: (win) => {
          win.document.getElementById('page')!.textContent = `loaded:${win.document.readyState}`
        },
      })

      cy.get('#page').should('have.text', 'loaded:complete')
    })

    it('fails the visit when onBeforeLoad throws', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('before load boom')

        done()
      })

      cy.visit(AUT_PAGE, {
        onBeforeLoad () {
          throw new Error('before load boom')
        },
      })
    })

    it('fails the visit when onLoad throws', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('load boom')

        done()
      })

      cy.visit(AUT_PAGE, {
        onLoad () {
          throw new Error('load boom')
        },
      })
    })
  })
})
