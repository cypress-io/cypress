describe('cy.origin - uncaught errors', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="errors-link"]').click()
  })

  describe('sync errors', () => {
    it('appropriately reports negative assertions', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.eq('AssertionError')
        expect(err.message).to.include('expected true to be false')
        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        cy.then(() => {
          expect(true).to.be.false
        })
      })
    })

    it('fails the current test/command if sync errors are thrown from the cy.origin callback', (done) => {
      const uncaughtExceptionSpy = cy.spy()
      const r = cy.state('runnable')

      cy.on('uncaught:exception', uncaughtExceptionSpy)
      cy.on('fail', (err, runnable) => {
        // TODO: we likely need to change the messaging around this error to make it clear to cy.origin users that
        // this behavior is configurable with 'uncaught:exception', but it MUST be declared inside the cy.origin callback
        // and that 'uncaught:exception' will NOT be triggered outside that callback (inside the primary origin)
        // https://github.com/cypress-io/cypress/issues/20969
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('sync error')
        expect(err.message).to.include('The following error originated from your application code, not from Cypress.')
        expect(err.message).to.not.include('https://on.cypress.io/uncaught-exception-from-application')
        expect(err.docsUrl).to.deep.eq(['https://on.cypress.io/uncaught-exception-from-application'])

        // lastly, make sure the `uncaught:exception' handler is NOT called in the primary
        expect(uncaughtExceptionSpy).not.to.be.called
        expect(runnable).to.be.equal(r)

        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('.trigger-sync-error').click()
      })
    })

    it('returns false from cy.on(uncaught:exception), resulting in cy:fail to not be called in the primary and passes the test', () => {
      const uncaughtExceptionSpy = cy.spy()
      const failureSpy = cy.spy()

      cy.on('uncaught:exception', uncaughtExceptionSpy)

      cy.on('fail', failureSpy)

      cy.origin('http://www.foobar.com:3500', () => {
        cy.on('uncaught:exception', () => false)
        cy.get('.trigger-sync-error').click()
      }).then(() => {
        expect(uncaughtExceptionSpy).not.to.be.called
        expect(failureSpy).not.to.be.called
      })
    })

    it('returns true from cy.on(uncaught:exception), resulting in cy:fail to be called in the primary', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('sync error')
        expect(err.message).to.include('The following error originated from your application code, not from Cypress.')
        expect(err.message).to.not.include('https://on.cypress.io/uncaught-exception-from-application')
        expect(err.docsUrl).to.deep.eq(['https://on.cypress.io/uncaught-exception-from-application'])

        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        cy.once('uncaught:exception', () => true)
        cy.get('.trigger-sync-error').click()
      })
    })

    // if we mutate the error, the app's listeners for 'error' or
    // 'unhandledrejection' will have our wrapped error instead of the original
    it('original error is not mutated for "error" in the origin', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.once('uncaught:exception', () => false)

        cy.get('.trigger-sync-error').click()
        cy.get('.error-one').invoke('text').should('equal', 'sync error')
        cy.get('.error-two').invoke('text').should('equal', 'sync error')
      })
    })
  })

  describe('async errors', () => {
    it('fails the current test/command if async errors are thrown from the cy.origin callback', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('setTimeout error')
        expect(err.message).to.include('The following error originated from your test code, not from Cypress.')
        // ensure error doesn't get wrapped twice
        expect(err.message).not.to.include('> The following error originated')
        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        setTimeout(() => {
          throw new Error('setTimeout error')
        }, 50)

        // add the cy.wait here to keep commands streaming in, forcing the
        // cy.origin callback window to be open long enough for the error to occur
        cy.wait(250)
      })
    })

    it('fails the current test/command if async errors are thrown from the secondary origin AUT', (done) => {
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

        expect(uncaughtExceptionSpy).not.to.be.called
        expect(runnable).to.be.equal(r)

        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('.trigger-async-error').click()

        // add the cy.wait here to keep commands streaming in,
        // forcing the cy.origin callback window to be open long enough for an async error to occur
        cy.wait(1000)
      })
    })

    it('passes the current test/command if async errors are thrown from the secondary origin AUT, but the cy.origin callback is finished running', () => {
      const uncaughtExceptionSpy = cy.spy()
      const failureSpy = cy.spy()

      cy.on('uncaught:exception', uncaughtExceptionSpy)

      cy.on('fail', failureSpy)

      cy.origin('http://www.foobar.com:3500', () => {
        // the async error here should be thrown AFTER the current command and test has finished, resulting in a passed test with no fail being triggered in the primary
        cy.get('.trigger-async-error').click()
      }).then(() => {
        expect(uncaughtExceptionSpy).not.to.be.called
        expect(failureSpy).not.to.be.called
      })
    })

    it('fails the current test/command if async errors are thrown from the cy.origin callback after it is finished running', (done) => {
      cy.once('fail', (err) => {
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('setTimeout error')
        expect(err.message).to.include('The following error originated from your test code, not from Cypress.')
        // ensure error doesn't get wrapped twice
        expect(err.message).not.to.include('> The following error originated')
        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        setTimeout(() => {
          throw new Error('setTimeout error')
        }, 50)
      })

      cy.wait(250)
    })
  })

  describe('unhandled rejections', () => {
    it('unhandled rejection triggers uncaught:exception and has promise as third argument', () => {
      cy.origin('http://www.foobar.com:3500', () => {
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
      cy.origin('http://www.foobar.com:3500', () => {
        cy.once('uncaught:exception', () => false)

        cy.get('.trigger-unhandled-rejection').click()
        cy.get('.error-one').invoke('text').should('equal', 'promise rejection')
        cy.get('.error-two').invoke('text').should('equal', 'promise rejection')
      })
    })

    it('fails the current test/command if a promise is rejected from the test code in cy.origin', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('rejected promise')
        expect(err.message).to.include('The following error originated from your test code, not from Cypress. It was caused by an unhandled promise rejection.')
        expect(err.message).to.not.include('https://on.cypress.io/uncaught-exception-from-application')

        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        // tslint:disable:no-floating-promises
        Promise.reject(new Error('rejected promise'))

        // add the cy.wait here to keep commands streaming in, forcing the
        // cy.origin callback window to be open long enough for the error to occur
        cy.wait(250)
      })
    })

    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23484
    it('fails the current test/command if a promise is rejected from the cy.origin callback after it is finished running', { retries: 15 }, (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('rejected promise')
        expect(err.message).to.include('The following error originated from your test code, not from Cypress. It was caused by an unhandled promise rejection.')
        expect(err.message).to.not.include('https://on.cypress.io/uncaught-exception-from-application')

        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        // tslint:disable:no-floating-promises
        Promise.reject(new Error('rejected promise'))
      })

      cy.wait(250)
    })
  })

  describe('unserializable errors', () => {
    it('handles users throwing dom elements', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('CypressError')
        expect(err.message).to.equal('`cy.origin()` could not serialize the thrown value. Please make sure the value being thrown is supported by the structured clone algorithm.')
        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        throw document.createElement('h1')
      })
    })

    it('handles users throwing functions', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('CypressError')
        expect(err.message).to.equal('`cy.origin()` could not serialize the thrown value. Please make sure the value being thrown is supported by the structured clone algorithm.')
        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        throw () => undefined
      })
    })

    it('handles users throwing symbols', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('CypressError')
        expect(err.message).to.equal('`cy.origin()` could not serialize the thrown value. Please make sure the value being thrown is supported by the structured clone algorithm.')
        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        throw Symbol('foo')
      })
    })

    it('handles users throwing promises', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('CypressError')
        expect(err.message).to.equal('`cy.origin()` could not serialize the thrown value. Please make sure the value being thrown is supported by the structured clone algorithm.')
        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        throw new Promise(() => {})
      })
    })
  })

  describe('serializable errors', () => {
    it('errors thrown prior to attaching are forwarded to top', (done) => {
      cy.origin('http://www.foobar.com:3500', () => {}).then(() => {
        // Force remove the spec bridge
        window?.top?.document.getElementById('Spec Bridge: http://www.foobar.com:3500')?.remove()
      })

      cy.on('fail', (err) => {
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('this is the message')
        expect(err.message).to.include('The following error originated from your application code, not from Cypress.')
        expect(err.message).to.include('this is the message')
        expect(err.message).to.include('\`cy.origin(\'http://www.foobar.com:3500\', () => {\`')
        expect(err.message).to.include('\`cy.visit(\'http://www.foobar.com:3500/fixtures/auth/error-on-load.html\')\`')
        expect(err.docsUrl).to.deep.eq(['https://on.cypress.io/uncaught-exception-from-application', 'https://on.cypress.io/origin'])

        done()
      })

      cy.visit('http://www.foobar.com:3500/fixtures/auth/error-on-load.html')
    })

    it('errors thrown post attaching are send by the spec bridge', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.eq('Error')
        expect(err.message).to.include('this is the message')
        expect(err.message).to.include('The following error originated from your application code, not from Cypress.')
        expect(err.docsUrl).to.deep.eq(['https://on.cypress.io/uncaught-exception-from-application'])

        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/auth/error-on-load.html')
      })
    })

    it('handles users throwing complex errors/classes', (done) => {
      cy.on('fail', (err: any) => {
        expect(err.name).to.equal('CustomError')
        expect(err.message).to.equal('custom error')
        expect(err._name).to.equal('CustomError')
        expect(err.foo).to.equal('bar')

        const { writable } = Object.getOwnPropertyDescriptor(err, 'name') as PropertyDescriptor

        // After serialization, read-only properties are now writable
        expect(writable).to.be.true
        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
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
        customErrorInstance.foo = 'bar'

        const { writable } = Object.getOwnPropertyDescriptor(CustomError, 'name') as PropertyDescriptor

        // make sure the name property is read-only before serializing it through postMessage
        expect(writable).to.be.false

        cy.then(() => {
          throw customErrorInstance
        })
      })
    })

    it('handles users throwing complex objects/classes', (done) => {
      cy.on('fail', (err: any) => {
        expect(err.customMethod).to.be.undefined
        expect(err.customProp).to.equal('foobar')
        expect(err._metasyntaticList).to.deep.equal(['foo', 'bar'])
        expect(err.metasyntaticList).to.deep.equal(['foo', 'bar'])
        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        class FooBar {
          private _metasyntaticList = ['foo']
          get metasyntaticList (): string[] {
            return this._metasyntaticList
          }
          set metasyntaticList (itemsToAdd: string[]) {
            this._metasyntaticList = this._metasyntaticList.concat(itemsToAdd)
          }
        }

        const foobarInstance: any = new FooBar

        foobarInstance.customProp = 'foobar'
        foobarInstance.metasyntaticList = ['bar']
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

      cy.origin('http://www.foobar.com:3500', () => {
        throw 'oops'
      })
    })

    it('handles users throwing arrays', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('Error')
        expect(err.message).to.equal('why would anyone do this?,this is odd')
        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        throw ['why would anyone do this?', 'this is odd']
      })
    })

    it('handles users throwing numbers', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('Error')
        expect(err.message).to.equal('2')
        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        throw 2
      })
    })

    it('handles users throwing booleans', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('Error')
        expect(err.message).to.equal('true')
        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        throw true
      })
    })

    it('handles users throwing null', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('Error')
        expect(err.message).to.equal('null')
        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        throw null
      })
    })

    it('handles users throwing undefined', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('Error')
        expect(err.message).to.equal('undefined')
        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        throw undefined
      })
    })

    it('handles throwing of arbitrary data types that are serializable but cannot be mapped to an error', (done) => {
      cy.on('fail', (err) => {
        expect(err.name).to.equal('CypressError')
        expect(err.message).to.equal('`cy.origin()` could not serialize the thrown value. Please make sure the value being thrown is supported by the structured clone algorithm.')
        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        throw new Date()
      })
    })
  })
})
