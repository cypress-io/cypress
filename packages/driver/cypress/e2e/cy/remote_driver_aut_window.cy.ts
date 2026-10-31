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

    it('fails the test when the error is not handled', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('app boom')
        expect(err.message).to.include('originated from your application code')

        done()
      })

      cy.get('#throw').click()
      cy.wait(2000)
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
