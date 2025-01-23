const { assertLogLength } = require('../../../support/utils')

describe('cy.origin Cypress API', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  context('Commands', () => {
    it('adds a custom command', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        // @ts-ignore
        Cypress.Commands.add('foo', () => 'bar')

        // @ts-ignore
        cy.foo().should('equal', 'bar')
      })

      // persists added command through spec bridge
      cy.origin('http://www.foobar.com:3500', () => {
        // @ts-ignore
        cy.foo().should('equal', 'bar')
      })
    })

    it('overwrites an existing command in the spec bridge', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        // @ts-ignore
        Cypress.Commands.overwrite('foo', () => 'baz')

        // @ts-ignore
        cy.foo().should('equal', 'baz')
      })

      // persists overwritten command through spec bridge
      cy.origin('http://www.foobar.com:3500', () => {
        // @ts-ignore
        cy.foo().should('equal', 'baz')
      })
    })
  })

  context('Keyboard', () => {
    it('does NOT sync defaults', () => {
      const defaults = Cypress.Keyboard.defaults({
        keystrokeDelay: 30,
      })

      cy.origin('http://www.foobar.com:3500', { args: defaults }, (primaryKeyboardDefaults) => {
        const crossOriginKeyboardDefaults = Cypress.Keyboard.defaults({})

        expect(crossOriginKeyboardDefaults).to.not.deep.equal(primaryKeyboardDefaults)
      })
    })

    it('allows a user to configure defaults', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        const crossOriginKeyboardDefaults = Cypress.Keyboard.defaults({
          keystrokeDelay: 60,
        })

        expect(crossOriginKeyboardDefaults).to.deep.include({
          keystrokeDelay: 60,
        })
      })

      // persists default configuration changes through spec bridge
      cy.origin('http://www.foobar.com:3500', () => {
        const crossOriginKeyboardDefaults = Cypress.Keyboard.defaults({})

        expect(crossOriginKeyboardDefaults).to.deep.include({
          keystrokeDelay: 60,
        })
      })
    })
  })

  context('Screenshot', () => {
    it('does NOT sync defaults', () => {
      Cypress.Screenshot.defaults({
        blackout: ['foo'],
        overwrite: true,
        onBeforeScreenshot: () => undefined,
        onAfterScreenshot: () => undefined,
      })

      cy.origin('http://www.foobar.com:3500', () => {
        const crossOriginScreenshotDefaults = Cypress.Screenshot.defaults({})

        expect(crossOriginScreenshotDefaults).to.not.deep.include({
          blackout: ['foo'],
          overwrite: true,
          onBeforeScreenshot: () => undefined,
          onAfterScreenshot: () => undefined,
        })
      })
    })

    it('allows a user to configure defaults', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        const crossOriginScreenshotDefaults = Cypress.Screenshot.defaults({
          blackout: ['foo'],
          overwrite: true,
        })

        expect(crossOriginScreenshotDefaults).to.deep.include({
          blackout: ['foo'],
          overwrite: true,
        })
      })

      // persists default configuration changes through spec bridge
      cy.origin('http://www.foobar.com:3500', () => {
        const crossOriginScreenshotDefaults = Cypress.Screenshot.defaults({})

        expect(crossOriginScreenshotDefaults).to.deep.include({
          blackout: ['foo'],
          overwrite: true,
        })
      })
    })
  })

  context('dom', () => {
    it('provides a sanity check that the dom API exists on Cypress.*', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('[data-cy="dom-check"]').then(($el) => {
          expect(Cypress.dom.isAttached($el)).to.be.true
        })
      })
    })
  })

  context('properties', () => {
    it('has arch property synced from primary', () => {
      cy.origin('http://www.foobar.com:3500', { args: Cypress.arch }, (theArch) => {
        expect(Cypress.arch).to.equal(theArch)
      })
    })

    it('has browser property synced from primary', () => {
      cy.origin('http://www.foobar.com:3500', { args: Cypress.browser }, (theBrowser) => {
        expect(Cypress.browser).to.deep.equal(theBrowser)
      })
    })

    it('has currentTest property synced from primary', () => {
      cy.origin('http://www.foobar.com:3500', { args: Cypress.currentTest }, (theCurrentTest) => {
        expect(Cypress.currentTest).to.deep.equal(theCurrentTest)
      })
    })

    it('has platform property synced from primary', () => {
      cy.origin('http://www.foobar.com:3500', { args: Cypress.platform }, (thePlatform) => {
        expect(Cypress.platform).to.equal(thePlatform)
      })
    })

    it('has testingType property synced from primary', () => {
      cy.origin('http://www.foobar.com:3500', { args: Cypress.testingType }, (theTestingType) => {
        expect(Cypress.testingType).to.deep.equal(theTestingType)
      })
    })

    it('has spec property synced from primary', () => {
      cy.origin('http://www.foobar.com:3500', { args: Cypress.spec }, (theSpec) => {
        expect(Cypress.spec).to.deep.equal(theSpec)
      })
    })
  })

  context('methods', () => {
    it('isCy()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        expect(Cypress.isCy(cy)).to.be.true
      })
    })

    it('isBrowser()', () => {
      cy.origin('http://www.foobar.com:3500', { args: Cypress.browser }, (theBrowser) => {
        expect(Cypress.isBrowser(theBrowser.name)).to.equal(true)
      })
    })

    it('log()', () => {
      const logs: Cypress.Log[] = []

      cy.on('log:added', (attrs, log: Cypress.Log) => {
        logs.push(log)
      })

      cy.origin('http://www.foobar.com:3500', () => {
        Cypress.log({
          name: 'log',
          message: 'test log',
        })
      })
      .then(() => {
        assertLogLength(logs, 2)
        expect(logs[1].get('name')).to.equal('log')
        expect(logs[1].get('message')).to.equal('test log')
      })
    })
  })

  context('not supported', () => {
    it('throws an error when a user attempts to call Cypress.session.clearAllSavedSessions() inside of cy.origin', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`Cypress.session.*` methods are not supported in the `cy.origin()` callback. Consider using them outside of the callback instead.')
        expect(err.docsUrl).to.equal('https://on.cypress.io/session-api')
        done()
      })

      cy.origin('http://www.foobar.com:3500', () => {
        // tslint:disable:no-floating-promises
        Cypress.session.clearAllSavedSessions()
      })
    })
  })
})
