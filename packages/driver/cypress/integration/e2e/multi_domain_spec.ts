import _ from 'lodash'

// @ts-ignore / session support is needed for visiting about:blank between tests
describe('multi-domain', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a').click()
  })

  it('runs commands in secondary domain', () => {
    cy.switchToDomain('foobar.com', () => {
      cy
      .get('[data-cy="dom-check"]')
      .invoke('text')
      .should('equal', 'From a secondary domain')
    })

    cy.log('after switchToDomain')
  })

  it('handles querying nested elements', () => {
    cy.switchToDomain('foobar.com', () => {
      cy
      .get('form button')
      .invoke('text')
      .should('equal', 'Submit')
    })

    cy.log('after switchToDomain')
  })

  it('sets up window.Cypress in secondary domain', () => {
    cy.switchToDomain('foobar.com', () => {
      cy
      .get('[data-cy="cypress-check"]')
      .invoke('text')
      .should('equal', 'Has window.Cypress')
    })
  })

  describe('data argument', () => {
    it('passes object to callback function', () => {
      cy.switchToDomain('foobar.com', { foo: 'foo', bar: 'bar' }, ({ foo, bar }) => {
        expect(foo).to.equal('foo')
        expect(bar).to.equal('bar')
      })
    })

    it('passes array to callback function', () => {
      cy.switchToDomain('foobar.com', ['foo', 'bar'], ([foo, bar]) => {
        expect(foo).to.equal('foo')
        expect(bar).to.equal('bar')
      })
    })

    it('passes string to callback function', () => {
      cy.switchToDomain('foobar.com', 'foo', (foo) => {
        expect(foo).to.equal('foo')
      })
    })

    it('passes number to callback function', () => {
      cy.switchToDomain('foobar.com', 1, (num) => {
        expect(num).to.equal(1)
      })
    })

    it('passes boolean to callback function', () => {
      cy.switchToDomain('foobar.com', true, (bool) => {
        expect(bool).to.be.true
      })
    })

    it('works with done callback', (done) => {
      cy.switchToDomain('foobar.com', done, true, (bool) => {
        Cypress.once('form:submitted', (e) => {
          done()
        })

        cy.get('form').submit()
      })
    })
  })

  describe('window events', () => {
    it('form:submitted', (done) => {
      cy.switchToDomain('foobar.com', done, () => {
        const $form = cy.$$('form')

        Cypress.once('form:submitted', (e) => {
          expect(e.target).to.eq($form.get(0))
          done()
        })

        cy.get('form').submit()
      })
    })

    // FIXME: reloading the page is problematic because the proxy delays the
    // request, but the driver currently waits for a switchToDomain, which
    // has already been called and won't be called again. need to handle any
    // sort of page reloading in the AUT when it's cross-domain
    it.skip('window:before:unload', (done) => {
      cy.switchToDomain('foobar.com', done, () => {
        Cypress.once('window:before:unload', () => {
          expect(location.host).to.equal('foobar.com')
          done()
        })

        cy.window().then((window) => {
          window.location.href = '/fixtures/multi-domain.html'
        })
      })
    })

    // FIXME: currently causes tests to hang. need to implement proper
    // stability-handling on secondary domains
    it.skip('window:unload', (done) => {
      cy.switchToDomain('foobar.com', done, () => {
        Cypress.once('window:unload', () => {
          expect(location.host).to.equal('foobar.com')
          done()
        })

        cy.window().then((window) => {
          window.location.href = '/fixtures/multi-domain.html'
        })
      })
    })

    it('navigation:changed', (done) => {
      cy.switchToDomain('foobar.com', done, () => {
        Cypress.once('navigation:changed', () => {
          expect(location.host).to.equal('foobar.com')
          done()
        })

        cy.window().then((window) => {
          window.location.hash = '#hashbrowns'
        })
      })
    })

    it('window:alert', (done) => {
      cy.switchToDomain('foobar.com', done, () => {
        Cypress.once('window:alert', (text) => {
          expect(location.host).to.equal('foobar.com')
          expect(`window:alert ${text}`).to.equal('window:alert the alert text')
          done()
        })

        cy.get('[data-cy="alert"]').click()
      })
    })

    it('window:confirm', (done) => {
      cy.switchToDomain('foobar.com', done, () => {
        Cypress.once('window:confirm', (text) => {
          expect(location.host).to.equal('foobar.com')
          expect(`window:confirm ${text}`).to.equal('window:confirm the confirm text')
          done()
        })

        cy.get('[data-cy="confirm"]').click()
      })
    })

    it('window:confirmed - true when no window:confirm listeners return false', (done) => {
      cy.switchToDomain('foobar.com', done, () => {
        Cypress.once('window:confirmed', (text, returnedFalse) => {
          expect(location.host).to.equal('foobar.com')
          expect(`window:confirmed ${text} - ${returnedFalse}`).to.equal('window:confirmed the confirm text - true')
          done()
        })

        Cypress.on('window:confirm', () => {})
        Cypress.on('window:confirm', () => {
          return true
        })

        cy.get('[data-cy="confirm"]').click()
      })
    })

    it('window:confirmed - false when any window:confirm listeners return false', (done) => {
      cy.switchToDomain('foobar.com', done, () => {
        Cypress.once('window:confirmed', (text, returnedFalse) => {
          expect(location.host).to.equal('foobar.com')
          expect(`window:confirmed ${text} - ${returnedFalse}`).to.equal('window:confirmed the confirm text - false')
          done()
        })

        Cypress.on('window:confirm', () => {
          return false
        })

        Cypress.on('window:confirm', () => {})

        cy.get('[data-cy="confirm"]').click()
      })
    })
  })

  describe('errors', () => {
    // @ts-ignore
    it('errors if experimental flag is not enabled', { experimentalMultiDomain: false }, (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires enabling the experimentalMultiDomain flag')

        done()
      })

      // @ts-ignore
      cy.switchToDomain()
    })

    it('errors if passed a non-string for the domain argument', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires the first argument to be a string. You passed: ``')

        done()
      })

      // @ts-ignore
      cy.switchToDomain()
    })

    it('errors if passed a non-serializable data value', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('data argument specified is not serializable')

        if (Cypress.browser.family === 'chromium') {
          expect(err.message).to.include('HTMLDivElement object could not be cloned')
        } else if (Cypress.browser.family === 'firefox') {
          expect(err.message).to.include('The object could not be cloned')
        }

        done()
      })

      const el = document.createElement('div')

      cy.switchToDomain('foobar.com', el, (bool) => {
        expect(bool).to.be.true
      })
    })

    it('errors if last argument is absent', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires the last argument to be a function. You passed: ``')

        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com')
    })

    it('errors if last argument is not a function', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires the last argument to be a function. You passed: `{}`')

        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com', {})
    })

    // TODO: Proper stack trace printing still needs to be addressed here
    it('propagates secondary domain errors to the primary that occur within the test', () => {
      return new Promise((resolve) => {
        cy.on('fail', (e) => {
          expect(e.message).to.equal('done is not defined')
          resolve(undefined)
        })

        cy.switchToDomain('foobar.com', () => {
          // done is not defined on purpose here as we want to test the error gets sent back to the primary domain correctly
          // @ts-ignore
          done()
        })
      })
    })

    it('propagates thrown errors in the secondary domain back to the primary w/ done', (done) => {
      cy.on('fail', (e) => {
        expect(e.message).to.equal('oops')
        done()
      })

      cy.switchToDomain('foobar.com', () => {
        throw 'oops'
      })
    })

    it('propagates thrown errors in the secondary domain back to the primary w/o done', () => {
      return new Promise((resolve) => {
        cy.on('fail', (e) => {
          expect(e.message).to.equal('oops')
          resolve(undefined)
        })

        cy.switchToDomain('foobar.com', () => {
          throw 'oops'
        })
      })
    })

    it('errors if three or more arguments are used and the second argument is not the done() fn', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` must have done as its second argument when three or more arguments are used.')

        done()
      })

      cy.switchToDomain('foobar.com', () => {}, () => {})
    })

    it('waits for all logs to finish streaming in from switchToDomain, expecting commands to not be pending', (done) => {
      const domain = 'foobar.com'
      const logsAddedNeedingUpdate = {}
      const logsChangedGivingUpdate = {}

      cy.on('log:added', (addedLog) => {
        if (!addedLog?.ended && addedLog?.id.includes(domain)) {
          logsAddedNeedingUpdate[addedLog.id] = addedLog
        }
      })

      cy.on('log:changed', (changedLog) => {
        if (changedLog?.ended && changedLog?.id.includes(domain)) {
          logsChangedGivingUpdate[changedLog.id] = changedLog
        }

        const addedLogsSize = _.size(logsAddedNeedingUpdate)
        const changedLogsSize = _.size(logsChangedGivingUpdate)

        // if all logs are done streaming
        if (addedLogsSize === changedLogsSize && addedLogsSize > 0) {
          // make sure each log added in the secondary domain is finished and has passed
          _.forOwn(logsAddedNeedingUpdate, (_, key) => {
            expect(logsChangedGivingUpdate[key].ended).to.be.true
            expect(logsChangedGivingUpdate[key].state).to.not.equal('pending')
          })

          done()
        }
      })

      cy.switchToDomain(domain, () => {
        cy.get('form').submit()
      })
    })

    it('receives command failures from the secondary domain', (done) => {
      const timeout = 1000

      cy.on('fail', (e) => {
        const errString = e.toString()

        expect(errString).to.have.string(`Timed out retrying after ${timeout}ms: Expected to find element: \`#doesnt-exist\`, but never found it`)
        //  make sure that the secondary domain failures do NOT show up as spec failures or AUT failures
        expect(errString).to.not.have.string(`The following error originated from your test code, not from Cypress`)
        expect(errString).to.not.have.string(`The following error originated from your application code, not from Cypress`)
        done()
      })

      cy.switchToDomain('foobar.com', timeout, (timeout) => {
        cy.get('#doesnt-exist', {
          timeout,
        })
      })
    })

    // TODO: this following tests needs to be implemented in a cy-in-cy test or more e2e style test as we need to test the 'done' function
    it('propagates user defined secondary domain errors to the primary')

    it('short circuits the secondary domain command queue when "done()" is called early')
  })
})
