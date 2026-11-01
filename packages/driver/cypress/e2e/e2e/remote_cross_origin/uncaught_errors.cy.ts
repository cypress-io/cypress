describe('remote driver: uncaught errors in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="errors-link"]').click()
    cy.location('host').should('equal', 'www.foobar.com:3500')
  })

  describe('sync errors', () => {
    it('appropriately reports negative assertions', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.eq('AssertionError')
        expect(err.message).to.include('expected true to be false')
        done()
      })

      cy.then(() => {
        expect(true).to.be.false
      })
    })

    it('fails the current test/command if sync errors are thrown from the AUT', (done) => {
      const uncaughtExceptionSpy = cy.spy()
      const r = cy.state('runnable')

      cy.on('uncaught:exception', uncaughtExceptionSpy)
      cy.on('fail', (err, runnable) => {
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('sync error')
        expect(err.message).to.include('The following error originated from your application code, not from Cypress.')
        expect(err.message).to.not.include('https://on.cypress.io/uncaught-exception-from-application')
        expect(err.docsUrl).to.deep.eq(['https://on.cypress.io/uncaught-exception-from-application'])

        expect(uncaughtExceptionSpy).to.be.called
        expect(runnable).to.be.equal(r)

        done()
      })

      cy.get('.trigger-sync-error').click()
    })

    it('returns false from cy.on(uncaught:exception), resulting in cy:fail to not be called and passes the test', () => {
      const errors: string[] = []
      const failureSpy = cy.spy()

      cy.on('uncaught:exception', (err) => {
        errors.push(err.message)

        return false
      })

      cy.on('fail', failureSpy)

      cy.get('.trigger-sync-error').click()
      cy.wrap(errors).should((e) => expect(e.join()).to.include('sync error')).then(() => {
        expect(failureSpy).not.to.be.called
      })
    })

    it('returns true from cy.on(uncaught:exception), resulting in cy:fail to be called', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('sync error')
        expect(err.message).to.include('The following error originated from your application code, not from Cypress.')
        expect(err.message).to.not.include('https://on.cypress.io/uncaught-exception-from-application')
        expect(err.docsUrl).to.deep.eq(['https://on.cypress.io/uncaught-exception-from-application'])

        done()
      })

      cy.once('uncaught:exception', () => true)
      cy.get('.trigger-sync-error').click()
    })

    // if we mutate the error, the app's listeners for 'error' or
    // 'unhandledrejection' will have our wrapped error instead of the original
    it('original error is not mutated for "error"', () => {
      cy.once('uncaught:exception', () => false)

      cy.get('.trigger-sync-error').click()
      cy.get('.error-one').invoke('text').should('equal', 'sync error')
      cy.get('.error-two').invoke('text').should('equal', 'sync error')
    })
  })

  describe('async errors', () => {
    it('fails the current test/command if async errors are thrown from the AUT', (done) => {
      const uncaughtExceptionSpy = cy.spy()
      const r = cy.state('runnable')

      cy.on('uncaught:exception', uncaughtExceptionSpy)

      cy.on('fail', (err, runnable) => {
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('async error')
        expect(err.message).to.include('The following error originated from your application code, not from Cypress.')
        // ensure error doesn't get wrapped twice
        expect(err.message).not.to.include('> The following error originated')
        expect(err.message).to.not.include('https://on.cypress.io/uncaught-exception-from-application')
        expect(err.docsUrl).to.deep.eq(['https://on.cypress.io/uncaught-exception-from-application'])

        expect(uncaughtExceptionSpy).to.be.called
        expect(runnable).to.be.equal(r)

        done()
      })

      cy.get('.trigger-async-error').click()
      cy.wait(1000)
    })
  })

  describe('unhandled rejections', () => {
    it('unhandled rejection triggers uncaught:exception', () => {
      const r = cy.state('runnable')
      const errors: Error[] = []

      cy.on('uncaught:exception', (err, runnable, promise) => {
        expect(runnable).to.be.equal(r)
        expect(promise).to.be.undefined
        errors.push(err)

        return false
      })

      cy.get('.trigger-unhandled-rejection').click()
      cy.wrap(errors).should((e) => {
        expect(e).to.have.length(1)
        expect(e[0].stack).to.include('promise rejection')
        expect(e[0].stack).to.include('one')
        expect(e[0].stack).to.include('two')
        expect(e[0].stack).to.include('three')
      })
    })

    it('original error is not mutated for "unhandledrejection"', () => {
      cy.once('uncaught:exception', () => false)

      cy.get('.trigger-unhandled-rejection').click()
      cy.get('.error-one').invoke('text').should('equal', 'promise rejection')
      cy.get('.error-two').invoke('text').should('equal', 'promise rejection')
    })

    it('fails gracefully with an unknown error message when the AUT rejects a promise with undefined', () => {
      const messages: string[] = []

      cy.on('uncaught:exception', (err) => {
        messages.push(err.message)

        return false
      })

      cy.visit('http://barbaz.com:3500/fixtures/generic.html')
      cy.visit('http://foobar.com:3500/fixtures/throws-undefined.html')
      cy.wrap(messages).should((m) => expect(m.join()).to.contain('An unknown error has occurred: undefined'))
    })
  })

  describe('errors while loading', () => {
    it('fails the visit when the page throws while loading', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('this is the message')
        expect(err.message).to.include('The following error originated from your application code, not from Cypress.')
        expect(err.docsUrl).to.deep.eq(['https://on.cypress.io/uncaught-exception-from-application'])

        done()
      })

      cy.visit('http://www.foobar.com:3500/fixtures/auth/error-on-load.html')
    })
  })
})
