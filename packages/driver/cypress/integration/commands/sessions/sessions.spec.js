const baseUrl = Cypress.config('baseUrl')

if (!Cypress.config('experimentalSessionsAndOrigin')) {
  // eslint-disable-next-line
  it.only('skip tests since the `experimentalSessionsAndOrigin` configuration is disabled', () => {
    cy.log('Run `cypress:open-experimentalSessionAndOrigin` or `cypress:run-experimentalSessionAndOrigin` to run these tests.')
  })
}

const expectCurrentSessionData = (obj) => {
  return Cypress.session.getCurrentSessionData()
  .then((result) => {
    cy.log(result)
    expect(result.cookies.map((v) => v.name)).members(obj.cookies || [])
    expect(result.localStorage).deep.members(obj.localStorage || [])
    expect(result.sessionStorage).deep.members(obj.sessionStorage || [])
  })
}

describe('cy.session', () => {
  describe('args', () => {
    it('accepts string as id', () => {
      cy.session('session-id', () => {})
      cy.session({ name: 'session-id', zkey: 'val' }, () => {})
    })

    it('accepts array as id', () => {
      cy.session('session-id', () => {})
    })

    it('accepts object as id', () => {
      cy.session('session-id', () => {})
    })

    // redundant?
    it('accepts options as third argument', () => {
      const setup = cy.stub().as('setupSession')
      const validate = cy.stub().as('validateSession')

      cy.session('session-id', setup, { validate })
      cy.then(() => {
        expect(setup).to.be.calledOnce
        expect(validate).to.be.calledOnce
      })
    })
  })

  describe('errors', () => {
    let lastLog = null
    let logs = []

    beforeEach(() => {
      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'session') {
          lastLog = log
          logs.push(log)
        }
      })

      return null
    })

    it('throws error when experimentalSessionAndOrigin not enabled', { experimentalSessionAndOrigin: false, experimentalSessionSupport: false }, (done) => {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` requires enabling the `experimentalSessionAndOrigin` flag.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('sessions-not-enabled')
    })

    it('throws error when experimentalSessionSupport is enabled through test config', { experimentalSessionAndOrigin: false, experimentalSessionSupport: true }, (done) => {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('\`cy.session()\` requires enabling the \`experimentalSessionAndOrigin\` flag. The \`experimentalSessionSupport\` flag was enabled but was removed in Cypress version 9.6.0.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('sessions-not-enabled')
    })

    it('throws error when experimentalSessionSupport is enabled through Cypress.config', { experimentalSessionAndOrigin: false }, (done) => {
      Cypress.config('experimentalSessionSupport', true)

      cy.on('fail', (err) => {
        Cypress.config('experimentalSessionSupport', false)
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('\`cy.session()\` requires enabling the \`experimentalSessionAndOrigin\` flag. The \`experimentalSessionSupport\` flag was enabled but was removed in Cypress version 9.6.0.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')
        done()
      })

      cy.session('sessions-not-enabled')
    })

    it('throws when sessionId argument was not provided', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid argument. The first argument `id` must be an string or serializable object.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session()
    })

    it('throws when sessionId argument is not an object', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid argument. The first argument `id` must be an string or serializable object.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session(1)
    })

    it('throws when options argument is provided and is not an object', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid argument. The optional third argument `options` must be an object.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('some-session', () => {}, 'invalid_arg')
    })

    it('throws when options argument has an invalid option', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid option: **invalid_key**\nAvailable options are: `validate`')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('some-session', () => {}, { invalid_key: 2 })
    })

    it('throws when options argument has an option with an invalid type', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('`cy.session()` was passed an invalid option value. **validate** must be of type **function** but was **number**.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('some-session', () => {}, { validate: 2 })
    })

    it('throws when setup function is not provided and existing session is not found', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('No session is defined with the name\n  **some-session**\nIn order to use `cy.session()`, provide a `setup` as the second argument:\n\n`cy.session(id, setup)`')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        done()
      })

      cy.session('some-session')
    })

    it('throws when multiple session calls with same sessionId but different options', function (done) {
      cy.on('fail', (err) => {
        expect(lastLog.get('error')).to.eq(err)
        expect(lastLog.get('state')).to.eq('failed')
        expect(err.message).to.eq('You may not call `cy.session()` with a previously used name and different options. If you want to specify different options, please use a unique name other than **duplicate-session**.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/session')

        expectCurrentSessionData({
          localStorage: [{ origin: baseUrl, value: { one: 'value' } }],
        })

        done()
      })

      cy.session('duplicate-session', () => {
        // function content
        window.localStorage.one = 'value'
      })

      cy.session('duplicate-session', () => {
        // different function content
        window.localStorage.two = 'value'
      })
    })

    describe('options.validate failures', () => {
      const errorHookMessage = 'This error occurred in a session validate hook after initializing the session. Because validation failed immediately after session setup we failed the test.'

      it('throws when options.validate has a failing Cypress command', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).contain('Expected to find element: `#does_not_exist`')
          expect(err.message).contain(errorHookMessage)
          expect(err.codeFrame).exist

          done()
        })

        cy.session(['mock-session', 'command'], () => {
          cy.log('setup')
        }, {
          validate () {
            cy.get('#does_not_exist', { timeout: 20 })
          },
        })
      })

      it('throws when options.validate throws an error', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).contain('validate error')
          expect(err.message).contain(errorHookMessage)
          expect(err.codeFrame).exist
          done()
        })

        cy.session(['mock-session', 'throws'], () => {
          cy.log('setup')
        }, {
          validate () {
            throw new Error('validate error')
          },
        })
      })

      it('throws when options.validate rejects', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).contain('validate error')
          expect(err.message).contain(errorHookMessage)
          expect(err.codeFrame).exist

          done()
        })

        cy.session(['mock-session', 'rejects'], () => {
          cy.log('setup')
        }, {
          validate () {
            return Promise.reject(new Error('validate error'))
          },
        })
      })

      it('throws when options.validate returns false', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('Your `cy.session` **validate** callback returned false.')
          expect(err.message).contain(errorHookMessage)
          expect(err.codeFrame).exist

          done()
        })

        cy.session(['mock-session', 'return false'], () => {
          cy.log('setup')
        }, {
          validate () {
            return false
          },
        })
      })

      it('throws when options.validate resolves false', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('Your `cy.session` **validate** callback resolved false.')
          expect(err.message).contain(errorHookMessage)
          expect(err.codeFrame).exist
          done()
        })

        cy.session(['mock-session', 'resolves false'], () => {
          cy.log('setup')
        }, {
          validate () {
            return Promise.resolve(false)
          },
        })
      })

      // TODO: emilyrohrbough - 4/3/2022 - figure out what the below comment means
      // TODO: cy.validate that will fail, hook into event, soft-reload inside and test everything is halted
      // Look at other tests for cancellation
      // make error collapsible by default

      it('throws when options.validate returns Chainer<false>', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('Your `cy.session` **validate** callback resolved false.')
          expect(err.message).contain(errorHookMessage)
          done()
        })

        cy.session(['mock-session', 'Chainer<false>'], () => {
          cy.log('setup')
        }, {
          validate () {
            return cy.wrap(false)
          },
        })
      })
    })
  })
})
