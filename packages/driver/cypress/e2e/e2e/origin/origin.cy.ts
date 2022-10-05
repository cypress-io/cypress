describe('cy.origin', () => {
  it('passes viewportWidth/Height state to the secondary origin', () => {
    const expectedViewport = [320, 480]

    cy.viewport(320, 480).then(() => {
      const primaryViewport = [cy.state('viewportWidth'), cy.state('viewportHeight')]

      expect(primaryViewport).to.deep.equal(expectedViewport)
    })

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://www.foobar.com:3500', { args: expectedViewport }, (expectedViewport) => {
      const secondaryViewport = [cy.state('viewportWidth'), cy.state('viewportHeight')]

      expect(secondaryViewport).to.deep.equal(expectedViewport)
    })
  })

  describe('ensure that visiting a cross origin page with a cy.origin command with no cy commands may cause subsequent tests to hang.', () => {
    it('executes quickly', () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()
      cy.origin('http://www.foobar.com:3500', () => {
        expect(true).to.equal(true)
      })
    })

    it('does not hang', () => {
      cy.log('I log correctly')
    })
  })

  describe('async attach', () => {
    it('attaches to an origin at any time', () => {
      cy.visit('/fixtures/auth/index.html')
      // Visit a cross origin page
      cy.visit('http://www.idp.com:3500/fixtures/auth/index.html')
      // execute a command on the primary origin while the AUT is cross origin
      cy.log('This command runs in the primary origin while the AUT is cross origin.')
      // attach to the cross origin aut.
      cy.origin('http://www.idp.com:3500', () => {
        cy.get('[data-cy="login-idp"]')
      })
    })

    it('errors if you try to use onload when visiting a cross origin page', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include(`\`cy.visit()\` was called to visit a cross origin site with an \`onLoad\` callback. \`onLoad\` callbacks can only be used with same origin sites.
          If you wish to specify an \`onLoad\` callback please use the \`cy.origin\` command to setup a \`window:load\` event prior to visiting the cross origin site.`)

        expect(err.message).to.include(`\`cy.origin('http://www.idp.com:3500', () => {\``)
        expect(err.message).to.include(`\`  cy.on('window:load', () => {\``)
        expect(err.message).to.include(`  \`    <onLoad callback goes here>\``)
        expect(err.message).to.include(`  \`cy.visit('http://www.idp.com:3500/fixtures/auth/index.html')\``)

        done()
      })

      cy.visit('/fixtures/auth/index.html')
      cy.visit('http://www.idp.com:3500/fixtures/auth/index.html', {
        onLoad: () => {
          cy.log('onLoad')
        },
      })
    })

    it('errors if you try to use onBeforeLoad when visiting a cross origin page', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include(`\`cy.visit()\` was called to visit a cross origin site with an \`onBeforeLoad\` callback. \`onBeforeLoad\` callbacks can only be used with same origin sites.
        If you wish to specify an \`onBeforeLoad\` callback please use the \`cy.origin\` command to setup a \`window:before:load\` event prior to visiting the cross origin site.`)

        expect(err.message).to.include(`\`cy.origin('http://www.idp.com:3500', () => {\``)
        expect(err.message).to.include(`\`  cy.on('window:before:load', () => {\``)
        expect(err.message).to.include(`  \`    <onBeforeLoad callback goes here>\``)
        expect(err.message).to.include(`  \`cy.visit('http://www.idp.com:3500/fixtures/auth/index.html')\``)

        done()
      })

      cy.visit('/fixtures/auth/index.html')
      cy.visit('http://www.idp.com:3500/fixtures/auth/index.html', {
        onBeforeLoad: () => {
          cy.log('onBeforeLoad')
        },
      })
    })
  })

  context('withBeforeEach', () => {
    beforeEach(() => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()
    })

    it('runs commands in secondary origin', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy
        .get('[data-cy="dom-check"]')
        .invoke('text')
        .should('equal', 'From a secondary origin')
      })

      cy.log('after cy.origin')
    })

    it('passes runnable state to the secondary origin', () => {
      const runnable = cy.state('runnable')
      const expectedRunnable = {
        clearTimeout: null,
        isPending: null,
        resetTimeout: null,
        timeout: null,
        id: runnable.id,
        _currentRetry: runnable._currentRetry,
        _timeout: 4000,
        type: 'test',
        title: 'passes runnable state to the secondary origin',
        titlePath: [
          'cy.origin',
          'withBeforeEach',
          'passes runnable state to the secondary origin',
        ],
        parent: {
          id: runnable.parent.id,
          type: 'suite',
          title: 'withBeforeEach',
          titlePath: [
            'withBeforeEach',
          ],
          parent: {
            id: runnable.parent.parent.id,
            type: 'suite',
            title: '',
            titlePath: undefined,
            ctx: {},
          },
          ctx: {},
        },
        ctx: {},
      }

      cy.origin('http://www.foobar.com:3500', { args: expectedRunnable }, (expectedRunnable) => {
        const actualRunnable = cy.state('runnable')

        expect(actualRunnable.titlePath()).to.deep.equal(expectedRunnable.titlePath)
        expectedRunnable.titlePath = actualRunnable.titlePath

        expect(actualRunnable.title).to.equal(expectedRunnable.title)
        expect(actualRunnable.id).to.equal(expectedRunnable.id)
        expect(actualRunnable.ctx).to.deep.equal(expectedRunnable.ctx)
        expect(actualRunnable._timeout).to.equal(expectedRunnable._timeout)
        expect(actualRunnable.type).to.equal(expectedRunnable.type)
        expect(actualRunnable.callback).to.exist
        expect(actualRunnable.timeout).to.exist
        expect(actualRunnable.parent.title).to.equal(expectedRunnable.parent.title)
        expect(actualRunnable.parent.type).to.equal(expectedRunnable.parent.type)
      })
    })

    it('handles querying nested elements', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy
        .get('form button')
        .invoke('text')
        .should('equal', 'Submit')
      })

      cy.log('after cy.origin')
    })

    it('sets up window.Cypress in secondary origin', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy
        .get('[data-cy="cypress-check"]')
        .invoke('text')
        .should('equal', 'Has window.Cypress')
      })
    })

    describe('data argument', () => {
      it('passes object to callback function', () => {
        cy.origin('http://www.foobar.com:3500', { args: { foo: 'foo', bar: 'bar' } }, ({ foo, bar }) => {
          expect(foo).to.equal('foo')
          expect(bar).to.equal('bar')
        })
      })

      it('passes array to callback function', () => {
        cy.origin('http://www.foobar.com:3500', { args: ['foo', 'bar'] }, ([foo, bar]) => {
          expect(foo).to.equal('foo')
          expect(bar).to.equal('bar')
        })
      })

      it('passes string to callback function', () => {
        cy.origin('http://www.foobar.com:3500', { args: 'foo' }, (foo) => {
          expect(foo).to.equal('foo')
        })
      })

      it('passes number to callback function', () => {
        cy.origin('http://www.foobar.com:3500', { args: 1 }, (num) => {
          expect(num).to.equal(1)
        })
      })

      it('passes boolean to callback function', () => {
        cy.origin('http://www.foobar.com:3500', { args: true }, (bool) => {
          expect(bool).to.be.true
        })
      })

      it('passes mixed types to callback function', () => {
        cy.origin('http://www.foobar.com:3500', { args: { foo: 'foo', num: 1, bool: true } }, ({ foo, num, bool }) => {
          expect(foo).to.equal('foo')
          expect(num).to.equal(1)
          expect(bool).to.be.true
        })
      })
    })

    describe('errors', () => {
      it('propagates secondary origin errors to the primary that occur within the test', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('variable is not defined')
          expect(err.message).to.include(`Variables must either be defined within the \`cy.origin()\` command or passed in using the args option.`)
          expect(err.stack).to.include(`Variables must either be defined within the \`cy.origin()\` command or passed in using the args option.`)
          //  make sure that the secondary origin failures do NOT show up as spec failures or AUT failures
          expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
          expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
          expect(err.codeFrame).to.exist
          expect(err.codeFrame!.frame).to.include('cy.origin')
          done()
        })

        const variable = 'string'

        cy.origin('http://www.foobar.com:3500', () => {
          cy.log(variable)
        })
      })

      it('propagates thrown errors in the secondary origin back to the primary w/ done', (done) => {
        cy.on('fail', (e) => {
          expect(e.message).to.equal('oops')
          done()
        })

        cy.origin('http://www.foobar.com:3500', () => {
          throw 'oops'
        })
      })

      it('propagates thrown errors in the secondary origin back to the primary w/o done', () => {
        return new Promise((resolve) => {
          cy.on('fail', (e) => {
            expect(e.message).to.equal('oops')
            resolve(undefined)
          })

          cy.origin('http://www.foobar.com:3500', () => {
            throw 'oops'
          })
        })
      })

      it('receives command failures from the secondary origin', (done) => {
        const timeout = 50

        cy.on('fail', (err) => {
          expect(err.message).to.include(`Timed out retrying after ${timeout}ms: Expected to find element: \`#doesnt-exist\`, but never found it`)
          //  make sure that the secondary origin failures do NOT show up as spec failures or AUT failures
          expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
          expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
          done()
        })

        cy.origin('http://www.foobar.com:3500', { args: timeout }, (timeout) => {
          cy.get('#doesnt-exist', {
            timeout,
          })
        })
      })

      it('receives command failures from the secondary origin with the default timeout', { defaultCommandTimeout: 50 }, (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include(`Timed out retrying after 50ms: Expected to find element: \`#doesnt-exist\`, but never found it`)
          //  make sure that the secondary origin failures do NOT show up as spec failures or AUT failures
          expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
          expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
          done()
        })

        cy.origin('http://www.foobar.com:3500', () => {
          cy.get('#doesnt-exist')
        })
      })

      it('has non serializable arguments', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include(`This is likely because the arguments specified are not serializable. Note that functions and DOM objects cannot be serialized.`)
          expect(err.stack).to.include(`This is likely because the arguments specified are not serializable. Note that functions and DOM objects cannot be serialized.`)
          //  make sure that the secondary origin failures do NOT show up as spec failures or AUT failures
          expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
          expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
          expect(err.codeFrame).to.exist
          expect(err.codeFrame!.frame).to.include('cy.origin')

          done()
        })

        const variable = () => {}

        cy.origin('http://www.foobar.com:3500', { args: variable }, (variable) => {
          variable()
        })
      })
    })
  })
})
