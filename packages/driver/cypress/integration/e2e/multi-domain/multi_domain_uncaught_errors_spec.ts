// @ts-ignore / session support is needed for visiting about:blank between tests
describe('multi-domain - uncaught errors', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="errors-link"]').click()
  })

  describe('sync errors', () => {
    it('fails the current test/command if sync errors are thrown from the switchToDomain callback', () => {
      const uncaughtExceptionSpy = cy.spy()
      const r = cy.state('runnable')

      cy.on('uncaught:exception', uncaughtExceptionSpy)
      cy.on('fail', (err, runnable) => {
        // TODO: we likely need to change the messaging around this error to make it clear to multi-domain users that
        // this behavior is configurable with 'uncaught:exception', but it MUST be declared inside the switchToDomain callback
        // and that 'uncaught:exception' will NOT be triggered outside that callback (inside the primary domain)
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('sync error')
        expect(err.message).to.include('The following error originated from your application code, not from Cypress.')
        expect(err.message).to.not.include('https://on.cypress.io/uncaught-exception-from-application')
        // @ts-ignore
        expect(err.docsUrl).to.deep.eq(['https://on.cypress.io/uncaught-exception-from-application'])

        // lastly, make sure the `uncaught:exception' handler is NOT called in the primary
        expect(uncaughtExceptionSpy).not.to.be.called
        expect(runnable).to.be.equal(r)
      })

      cy.switchToDomain('foobar.com', () => {
        cy.get('.trigger-sync-error').click()
      })
    })

    it('returns false from cy.on(uncaught:exception), resulting in cy:fail to not be called in the primary and passes the test', () => {
      const uncaughtExceptionSpy = cy.spy()
      const failureSpy = cy.spy()

      cy.on('uncaught:exception', uncaughtExceptionSpy)

      cy.on('fail', failureSpy)

      cy.switchToDomain('foobar.com', () => {
        cy.on('uncaught:exception', () => false)
        cy.get('.trigger-sync-error').click()
      }).then(() => {
        expect(uncaughtExceptionSpy).not.to.be.called
        expect(failureSpy).not.to.be.called
      })
    })

    it('returns true from cy.on(uncaught:exception), resulting in cy:fail to be called in the primary', () => {
      cy.on('fail', (err) => {
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('sync error')
        expect(err.message).to.include('The following error originated from your application code, not from Cypress.')
        expect(err.message).to.not.include('https://on.cypress.io/uncaught-exception-from-application')
        // @ts-ignore
        expect(err.docsUrl).to.deep.eq(['https://on.cypress.io/uncaught-exception-from-application'])
      })

      cy.switchToDomain('foobar.com', () => {
        cy.once('uncaught:exception', () => true)
        cy.get('.trigger-sync-error').click()
      })
    })

    // if we mutate the error, the app's listeners for 'error' or
    // 'unhandledrejection' will have our wrapped error instead of the original
    it('original error is not mutated for "error" in the switchToDomain', () => {
      cy.switchToDomain('foobar.com', () => {
        cy.once('uncaught:exception', () => false)

        cy.get('.trigger-sync-error').click()
        cy.get('.error-one').invoke('text').should('equal', 'sync error')
        cy.get('.error-two').invoke('text').should('equal', 'sync error')
      })
    })
  })

  describe('async errors', () => {
    it('fails the current test/command if async errors are thrown from the switchToDomain callback', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('setTimeout error')
        expect(err.message).to.include('The following error originated from your test code, not from Cypress.')

        done()
      })

      cy.switchToDomain('foobar.com', () => {
        setTimeout(() => {
          throw new Error('setTimeout error')
        }, 50)

        // add the cy.wait here to keep commands streaming in, forcing the
        // switchToDomain callback window to be open long enough for the error to occur
        cy.wait(250)
      })
    })

    it('fails the current test/command if async errors are thrown from the secondary domain AUT', () => {
      const uncaughtExceptionSpy = cy.spy()
      const r = cy.state('runnable')

      cy.on('uncaught:exception', uncaughtExceptionSpy)

      cy.on('fail', (err, runnable) => {
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('async error')
        expect(err.message).to.include('The following error originated from your application code, not from Cypress.')
        expect(err.message).to.not.include('https://on.cypress.io/uncaught-exception-from-application')
        // @ts-ignore
        expect(err.docsUrl).to.deep.eq(['https://on.cypress.io/uncaught-exception-from-application'])

        expect(uncaughtExceptionSpy).not.to.be.called
        expect(runnable).to.be.equal(r)
      })

      cy.switchToDomain('foobar.com', () => {
        cy.get('.trigger-async-error').click()

        // add the cy.wait here to keep commands streaming in,
        // forcing the switchToDomain callback window to be open long enough for an async error to occur
        cy.wait(1000)
      })
    })

    it('passes the current test/command if async errors are thrown from the secondary domain AUT, but the switchToDomain callback is finished running', () => {
      const uncaughtExceptionSpy = cy.spy()
      const failureSpy = cy.spy()

      cy.on('uncaught:exception', uncaughtExceptionSpy)

      cy.on('fail', failureSpy)

      cy.switchToDomain('foobar.com', () => {
        // the async error here should be thrown AFTER the current command and test has finished, resulting in a passed test with no fail being triggered in the primary
        cy.get('.trigger-async-error').click()
      }).then(() => {
        expect(uncaughtExceptionSpy).not.to.be.called
        expect(failureSpy).not.to.be.called
      })
    })

    it('fails the current test/command if async errors are thrown from the switchToDomain callback after it is finished running', (done) => {
      cy.once('fail', (err) => {
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('setTimeout error')
        expect(err.message).to.include('The following error originated from your test code, not from Cypress.')

        done()
      })

      cy.switchToDomain('foobar.com', () => {
        setTimeout(() => {
          throw new Error('setTimeout error')
        }, 50)
      })

      cy.wait(250)
    })
  })

  describe('unhandled rejections', () => {
    it('unhandled rejection triggers uncaught:exception and has promise as third argument', () => {
      cy.switchToDomain('foobar.com', () => {
        const r = cy.state('runnable')

        const afterUncaughtException = new Promise<void>((resolve) => {
          cy.once('uncaught:exception', (err, runnable, promise) => {
            expect(err.stack).to.include('promise rejection')
            expect(err.stack).to.include('one')
            expect(err.stack).to.include('two')
            expect(err.stack).to.include('three')
            expect(runnable).to.be.equal(r)
            expect(promise).to.be.a('promise')

            resolve()

            return false
          })
        })

        cy.get('.trigger-unhandled-rejection').click()
        cy.wrap(afterUncaughtException)
      })
    })

    it('original error is not mutated for "unhandledrejection"', () => {
      cy.switchToDomain('foobar.com', () => {
        cy.once('uncaught:exception', () => false)

        cy.get('.trigger-unhandled-rejection').click()
        cy.get('.error-one').invoke('text').should('equal', 'promise rejection')
        cy.get('.error-two').invoke('text').should('equal', 'promise rejection')
      })
    })

    it('fails the current test/command if a promise is rejected from the test code in switchToDomain', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('rejected promise')
        expect(err.message).to.include('The following error originated from your test code, not from Cypress. It was caused by an unhandled promise rejection.')
        expect(err.message).to.not.include('https://on.cypress.io/uncaught-exception-from-application')

        done()
      })

      cy.switchToDomain('foobar.com', () => {
        Promise.reject(new Error('rejected promise'))

        // add the cy.wait here to keep commands streaming in, forcing the
        // switchToDomain callback window to be open long enough for the error to occur
        cy.wait(250)
      })
    })

    it('fails the current test/command if a promise is rejected from the switchToDomain callback after it is finished running', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('rejected promise')
        expect(err.message).to.include('The following error originated from your test code, not from Cypress. It was caused by an unhandled promise rejection.')
        expect(err.message).to.not.include('https://on.cypress.io/uncaught-exception-from-application')

        done()
      })

      cy.switchToDomain('foobar.com', () => {
        Promise.reject(new Error('rejected promise'))
      })

      cy.wait(250)
    })
  })

  it('does not fail if thrown custom error has a readonly name', (done) => {
    cy.once('fail', (err) => {
      expect(err.name).to.include('CustomError')
      expect(err.message).to.include('custom error')

      done()
    })

    cy.switchToDomain('foobar.com', () => {
      cy.then(() => {
        throw new class CustomError extends Error {
          get name () {
            return 'CustomError'
          }
        }('custom error')
      })
    })
  })
})
