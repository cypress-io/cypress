// FIXME: sync thrown errors inside of multi-domain cause cross origin errors in firefox when using experimentalSessionSupport
// This is likely due to cypress being redeclared while on a cross origin iframe before the application navigates back.
// To reproduce, just add "experimentalSessionSupport" = true into the describe block below

// @ts-ignore / session support is needed for visiting about:blank between tests
describe('multi-domain - uncaught errors', () => {
  // TODO: add system test for codeFrame/ cy.switchToDomain('foobar.com', () => { as stack
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="errors-link"]').click()
  })

  describe('sync errors', () => {
    it('appropriately reports negative assertions', () => {
      cy.on('fail', (err) => {
        expect(err.name).to.eq('AssertionError')
        expect(err.message).to.include('expected true to be false')
      })

      cy.switchToDomain('foobar.com', () => {
        cy.wrap({}).then(() => {
          expect(true).to.be.false
        })
      })
    })

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

  describe('unserializable errors', () => {
    it('handles users throwing dom elements', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('CypressError')
        expect(err.message).to.equal('`cy.switchToDomain()` could not serialize or map the thrown value. Please make sure the value being thrown is supported by the structured clone algorithm.')
        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        throw document.createElement('h1')
      })
    })

    it('handles users throwing functions', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('CypressError')
        expect(err.message).to.equal('`cy.switchToDomain()` could not serialize or map the thrown value. Please make sure the value being thrown is supported by the structured clone algorithm.')
        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        throw () => undefined
      })
    })

    it('handles users throwing symbols', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('CypressError')
        expect(err.message).to.equal('`cy.switchToDomain()` could not serialize or map the thrown value. Please make sure the value being thrown is supported by the structured clone algorithm.')
        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        throw Symbol('foo')
      })
    })

    it('handles users throwing promises', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('CypressError')
        expect(err.message).to.equal('`cy.switchToDomain()` could not serialize or map the thrown value. Please make sure the value being thrown is supported by the structured clone algorithm.')
        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        throw new Promise(() => {})
      })
    })
  })

  describe('serializable errors', () => {
    it('handles users throwing complex errors/classes', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('CustomError')
        expect(err.message).to.equal('custom error')
        // @ts-ignore
        expect(err._name).to.equal('CustomError')
        // @ts-ignore
        expect(err.customProp).to.equal('foobar')
        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        class CustomError extends Error {
          private _name = 'CustomError'
          get name () {
            return this._name
          }
          set name (name: string) {
            this._name = name
          }
        }

        const customErrorInstance = new CustomError('custom error')

        // @ts-ignore
        customErrorInstance.customProp = 'foobar'

        throw customErrorInstance
      })
    })

    it('handles users throwing complex objects/classes', (done) => {
      cy.on('fail', (err) => {
        // @ts-ignore
        expect(err.customMethod).to.be.undefined
        // @ts-ignore
        expect(err.customProp).to.equal('foobar')
        // @ts-ignore
        expect(err._metasyntaticList).to.deep.equal(['foo', 'bar'])
        // @ts-ignore
        expect(err.metasyntaticList).to.deep.equal(['foo', 'bar'])
        // TODO: assert method
        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        class FooBar {
          private _metasyntaticList = ['foo']
          get metasyntaticList (): string[] {
            return this._metasyntaticList
          }
          set metasyntaticList (itemsToAdd: string[]) {
            this._metasyntaticList = this._metasyntaticList.concat(itemsToAdd)
          }
        }

        const foobarInstance = new FooBar

        // @ts-ignore
        foobarInstance.customProp = 'foobar'
        foobarInstance.metasyntaticList = ['bar']
        // @ts-ignore
        foobarInstance.customMethod = () => undefined

        throw foobarInstance
      })
    })

    it('handles users throwing strings', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('Error')
        expect(err.message).to.equal(`oops`)
        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        throw 'oops'
      })
    })

    it('handles users throwing arrays', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('Error')
        expect(err.message).to.equal('why would anyone do this?,this is odd')
        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        throw ['why would anyone do this?', 'this is odd']
      })
    })

    it('handles users throwing numbers', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('Error')
        expect(err.message).to.equal('2')
        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        throw 2
      })
    })

    it('handles users throwing booleans', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('Error')
        expect(err.message).to.equal('true')
        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        throw true
      })
    })

    it('handles users throwing null', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('Error')
        expect(err.message).to.equal('null')
        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        throw null
      })
    })

    it('handles users throwing undefined', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('Error')
        expect(err.message).to.equal('undefined')
        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        throw undefined
      })
    })

    it('handles throwing of arbitrary data types that are serializable but cannot be mapped to an error', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('CypressError')
        expect(err.message).to.equal('`cy.switchToDomain()` could not serialize or map the thrown value. Please make sure the value being thrown is supported by the structured clone algorithm.')
        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com', () => {
        throw new Date()
      })
    })
  })

  it('does not fail if thrown custom error has a readonly name', (done) => {
    cy.once('fail', (err) => {
      expect(err.name).to.include('CustomError')
      expect(err.message).to.include('custom error')

      done()
    })

    // @ts-ignore
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
