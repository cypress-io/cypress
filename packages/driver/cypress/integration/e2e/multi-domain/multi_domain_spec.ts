import _ from 'lodash'

// @ts-ignore / session support is needed for visiting about:blank between tests
describe('multi-domain', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
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
      cy.switchToDomain('foobar.com', [{ foo: 'foo', bar: 'bar' }], ([{ foo, bar }]) => {
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
      cy.switchToDomain('foobar.com', ['foo'], ([foo]) => {
        expect(foo).to.equal('foo')
      })
    })

    it('passes number to callback function', () => {
      cy.switchToDomain('foobar.com', [1], ([num]) => {
        expect(num).to.equal(1)
      })
    })

    it('passes boolean to callback function', () => {
      cy.switchToDomain('foobar.com', [true], ([bool]) => {
        expect(bool).to.be.true
      })
    })

    it('passes mixed types to callback function', () => {
      cy.switchToDomain('foobar.com', ['foo', 1, true], ([foo, num, bool]) => {
        expect(foo).to.equal('foo')
        expect(num).to.equal(1)
        expect(bool).to.be.true
      })
    })

    it('works with done callback', (done) => {
      cy.switchToDomain('foobar.com', done, [true], ([bool]) => {
        expect(bool).to.be.true

        Cypress.once('form:submitted', () => {
          done()
        })

        cy.get('form').submit()
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

    it('errors passing non-array to callback function', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires the \'data\' argument to be an array. You passed: `foo`')

        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com', 'foo', () => {})
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

      cy.switchToDomain('foobar.com', ['foo', '1', el], () => {})
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

    // TODO: this following tests needs to be implemented in a cy-in-cy test or more e2e style test as we need to test the 'done' function
    it('propagates user defined secondary domain errors to the primary')

    it('short circuits the secondary domain command queue when "done()" is called early')
  })

  // it.only('testing', async () => {
  //   cy.wrap('derp').then((testThing) => {
  //     return 'junk'
  //   }).then((result) => {
  //     console.log('last result:', result)
  //   })
  // })
  describe('yields', () => {
    it.only('yields a value', async () => {
      cy.switchToDomain('foobar.com', () => {
        cy
        .get('[data-cy="dom-check"]')
        .invoke('text')
      }).should('equal', 'From a secondary domain')

      // .then((result) => {
      //   console.log('last result:', result)
      // })
    })

    it.only('yields a value again', async () => {
      cy.switchToDomain('foobar.com', () => {
        cy
        .get('[data-cy="dom-check"]')
        .invoke('text')
      }).should('equal', 'From a secondary domain')

      // .then((result) => {
      //   console.log('last result:', result)
      // })
    })

    it('yields synchronously ', async () => {
      cy.switchToDomain('foobar.com', () => {
        // const $form = cy.$$('[data-cy="dom-check"]')

        return 'From a secondary domain'
      }).should('equal', 'From a secondary domain')

      // .then((result) => {
      //   console.log('result synchronous:', result)

      //   return result
      // }).should('equal', 'From a secondary domain')
    })

    it('yields undefined', async () => {
      cy.switchToDomain('foobar.com', () => {
        cy
        .get('[data-cy="dom-check"]')
      }).should('equal', undefined)

      // .then((result) => {
      //   console.log('result undefined:', result)

      //   return result
      // }).should('equal', undefined)
    })

    it('yields undefined if an object contains undefined', () => {
      cy.switchToDomain('foobar.com', () => {
        cy.wrap({
          key: undefined,
        })
      }).should('equal', undefined)
    })

    it('yields undefined if an object contains a function', () => {
      cy.switchToDomain('foobar.com', () => {
        cy.wrap({
          key: () => {
            return 'whoops'
          },
        })
      }).should('equal', undefined)
    })

    it('yields undefined if an object contains a symbol', () => {
      cy.switchToDomain('foobar.com', () => {
        cy.wrap({
          key: Symbol('whoops'),
        })
      }).should('equal', undefined)
    })

    it('yields an object containing valid types', () => {
      cy.switchToDomain('foobar.com', () => {
        cy.wrap({
          array: [
            1,
            2,
          ],
          bool: true,
          null: null,
          number: 12,
          object: {
            key: 'key',
          },
          string: 'string',
        })
      }).should('deep.equal', {
        array: [
          1,
          2,
        ],
        bool: true,
        null: null,
        number: 12,
        object: {
          key: 'key',
        },
        string: 'string',
      })
    })
  })
})
