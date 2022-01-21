describe('uncaught errors', () => {
  it('runnable does not have timer visit failure', function (done) {
    const r = cy.state('runnable')

    cy.on('fail', () => {
      // this runnable should not have a timer
      expect(r.timer).not.to.be.ok

      done()

      // and still not have a timer
      expect(r.timer).not.to.be.ok
    })

    // when this beforeEach hook fails
    // it will skip invoking the test
    // but run the other suite
    cy.visit('/fixtures/errors.html?error-on-visit')
  })

  it('return false from cy.on(uncaught:exception) to pass test', () => {
    const r = cy.state('runnable')

    cy.on('uncaught:exception', (err, runnable) => {
      expect(err.name).to.eq('Error')
      expect(err.message).to.include('sync error')
      expect(err.message).to.include('The following error originated from your application code, not from Cypress.')
      expect(err.message).to.not.include('https://on.cypress.io/uncaught-exception-from-application')
      expect(err.docsUrl).to.deep.eq(['https://on.cypress.io/uncaught-exception-from-application'])
      expect(runnable === r).to.be.true

      return false
    })

    cy.visit('/fixtures/errors.html')
    cy.get('.trigger-sync-error').click()
  })

  it('return false from Cypress.on(uncaught:exception) to pass test', () => {
    const r = cy.state('runnable')

    Cypress.once('uncaught:exception', (err, runnable) => {
      expect(err.message).to.include('sync error')
      expect(runnable === r).to.be.true

      return false
    })

    cy.visit('/fixtures/errors.html')
    cy.get('.trigger-sync-error').click()
  })

  it('sync error triggers uncaught:exception', (done) => {
    cy.once('uncaught:exception', (err) => {
      expect(err.stack).to.include('sync error')
      expect(err.stack).to.include('one')
      expect(err.stack).to.include('two')
      expect(err.stack).to.include('three')

      done()

      return false
    })

    cy.visit('/fixtures/errors.html')
    cy.get('.trigger-sync-error').click()
  })

  // https://github.com/cypress-io/cypress/issues/987
  it('async error triggers uncaught:exception', (done) => {
    cy.once('uncaught:exception', (err) => {
      expect(err.stack).to.include('async error')
      expect(err.stack).to.include('one')
      expect(err.stack).to.include('two')
      expect(err.stack).to.include('three')

      done()

      return false
    })

    cy.visit('/fixtures/errors.html')
    cy.get('.trigger-async-error').click()
  })

  // we used to wrap timers with "proxy" tracking functions
  // this has been called from the top frame
  // and thus its error handler has been catching the error and not the one in AUT
  it('async error triggers the app-under-test error handler', () => {
    // mute auto-failing this test
    cy.once('uncaught:exception', () => false)

    cy.visit('/fixtures/errors.html')
    cy.get('.trigger-async-error').click()

    cy.get('.error-one').invoke('text').should('equal', 'async error')
    cy.get('.error-two').invoke('text').should('equal', 'async error')
  })

  it('unhandled rejection triggers uncaught:exception and has promise as third argument', (done) => {
    cy.once('uncaught:exception', (err, runnable, promise) => {
      expect(err.stack).to.include('promise rejection')
      expect(err.stack).to.include('one')
      expect(err.stack).to.include('two')
      expect(err.stack).to.include('three')
      expect(promise).to.be.a('promise')

      done()

      return false
    })

    cy.visit('/fixtures/errors.html')
    cy.get('.trigger-unhandled-rejection').click()
  })

  // if we mutate the error, the app's listeners for 'error' or
  // 'unhandledrejection' will have our wrapped error instead of the original
  it('original error is not mutated for "error"', () => {
    cy.once('uncaught:exception', () => false)

    cy.visit('/fixtures/errors.html')
    cy.get('.trigger-sync-error').click()
    cy.get('.error-one').invoke('text').should('equal', 'sync error')
    cy.get('.error-two').invoke('text').should('equal', 'sync error')
  })

  it('original error is not mutated for "unhandledrejection"', () => {
    cy.once('uncaught:exception', () => false)

    cy.visit('/fixtures/errors.html')
    cy.get('.trigger-unhandled-rejection').click()
    cy.get('.error-one').invoke('text').should('equal', 'promise rejection')
    cy.get('.error-two').invoke('text').should('equal', 'promise rejection')
  })

  // we used to define window.onerror ourselves for catching uncaught errors,
  // so if an app overwrote it, we wouldn't catch them. now we use
  // window.addEventListener('error'), so it's no longer an issue
  it('fails correctly for uncaught error on a site with window.onerror handler defined', function (done) {
    let uncaughtErr = false

    cy.once('uncaught:exception', () => {
      uncaughtErr = true
    })

    cy.on('fail', (err) => {
      expect(err.message).to.include('sync error')
      expect(uncaughtErr).to.eq(true)
      done()
    })

    cy.visit('/fixtures/errors.html')
    cy.get('.define-window-onerror').click()
    cy.get('.trigger-sync-error').click()
  })

  // https://github.com/cypress-io/cypress/issues/7590
  it('creates error object from error that is just a string', (done) => {
    cy.once('uncaught:exception', (err) => {
      expect(err).not.to.be.a('string')
      expect(err.message).to.include('string error')

      done()

      return false
    })

    cy
    .visit('/fixtures/jquery.html')
    .window().then((win) => {
      return win.$('button:first').on('click', () => {
        throw 'string error'
      })
    }).get('button:first').click()
  })

  it('does not fail if thrown custom error with readonly name', (done) => {
    cy.once('fail', (err) => {
      expect(err.name).to.include('CustomError')
      expect(err.message).to.include('custom error')

      done()
    })

    cy.then(() => {
      throw new class CustomError extends Error {
        get name () {
          return 'CustomError'
        }
      }('custom error')
    })
  })

  it('fails test based on an uncaught error after last command and before completing', (done) => {
    cy.on('fail', () => {
      done()
    })

    cy.visit('/fixtures/errors.html')
    cy.get('.trigger-async-error').click()
  })
})
