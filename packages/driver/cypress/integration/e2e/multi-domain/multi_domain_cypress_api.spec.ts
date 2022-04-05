// @ts-ignore / session support is needed for visiting about:blank between tests+
describe('multi-domain Cypress API', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  context('Commands', () => {
    it('adds a custom command', () => {
      cy.origin('http://foobar.com:3500', () => {
        // @ts-ignore
        Cypress.Commands.add('foo', () => 'bar')

        // @ts-ignore
        cy.foo().should('equal', 'bar')
      })

      // persists added command through spec bridge
      cy.origin('http://foobar.com:3500', () => {
        // @ts-ignore
        cy.foo().should('equal', 'bar')
      })
    })

    it('overwrites an existing command in the spec bridge', () => {
      cy.origin('http://foobar.com:3500', () => {
        // @ts-ignore
        Cypress.Commands.overwrite('foo', () => 'baz')

        // @ts-ignore
        cy.foo().should('equal', 'baz')
      })

      // persists overwritten command through spec bridge
      cy.origin('http://foobar.com:3500', () => {
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

      cy.origin('http://foobar.com:3500', { args: defaults }, (primaryKeyboardDefaults) => {
        const multiDomainKeyboardDefaults = Cypress.Keyboard.defaults({})

        expect(multiDomainKeyboardDefaults).to.not.deep.equal(primaryKeyboardDefaults)
      })
    })

    it('allows a user to configure defaults', () => {
      cy.origin('http://foobar.com:3500', () => {
        const multiDomainKeyboardDefaults = Cypress.Keyboard.defaults({
          keystrokeDelay: 60,
        })

        expect(multiDomainKeyboardDefaults).to.deep.include({
          keystrokeDelay: 60,
        })
      })

      // persists default configuration changes through spec bridge
      cy.origin('http://foobar.com:3500', () => {
        const multiDomainKeyboardDefaults = Cypress.Keyboard.defaults({})

        expect(multiDomainKeyboardDefaults).to.deep.include({
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

      cy.origin('http://foobar.com:3500', () => {
        const multiDomainScreenshotDefaults = Cypress.Screenshot.defaults({})

        expect(multiDomainScreenshotDefaults).to.not.deep.include({
          blackout: ['foo'],
          overwrite: true,
          onBeforeScreenshot: () => undefined,
          onAfterScreenshot: () => undefined,
        })
      })
    })

    it('allows a user to configure defaults', () => {
      cy.origin('http://foobar.com:3500', () => {
        const multiDomainScreenshotDefaults = Cypress.Screenshot.defaults({
          blackout: ['foo'],
          overwrite: true,
        })

        expect(multiDomainScreenshotDefaults).to.deep.include({
          blackout: ['foo'],
          overwrite: true,
        })
      })

      // persists default configuration changes through spec bridge
      cy.origin('http://foobar.com:3500', () => {
        const multiDomainScreenshotDefaults = Cypress.Screenshot.defaults({})

        expect(multiDomainScreenshotDefaults).to.deep.include({
          blackout: ['foo'],
          overwrite: true,
        })
      })
    })
  })

  context('dom', () => {
    it('provides a sanity check that the dom API exists on Cypress.*', () => {
      cy.origin('http://foobar.com:3500', () => {
        cy.get('[data-cy="dom-check"]').then(($el) => {
          expect(Cypress.dom.isAttached($el)).to.be.true
        })
      })
    })
  })

  // TODO: Before implementing, understand how Cypress.session.* and cy.session() are supposed to function within the context of multi-domain
  context.skip('session', () => {
    it('clearAllSavedSessions() functions as expected', () => {
      cy.origin('http://foobar.com:3500', () => {
        Cypress.session.clearAllSavedSessions()
      })
    })
  })

  context('properties', () => {
    it('has arch property synced from primary', () => {
      cy.origin('http://foobar.com:3500', { args: Cypress.arch }, (theArch) => {
        expect(Cypress.arch).to.equal(theArch)
      })
    })

    it('has browser property synced from primary', () => {
      cy.origin('http://foobar.com:3500', { args: Cypress.browser }, (theBrowser) => {
        expect(Cypress.browser).to.deep.equal(theBrowser)
      })
    })

    it('has currentTest property synced from primary', () => {
      cy.origin('http://foobar.com:3500', { args: Cypress.currentTest }, (theCurrentTest) => {
        expect(Cypress.currentTest).to.deep.equal(theCurrentTest)
      })
    })

    it('has platform property synced from primary', () => {
      cy.origin('http://foobar.com:3500', { args: Cypress.platform }, (thePlatform) => {
        expect(Cypress.platform).to.equal(thePlatform)
      })
    })

    it('has testingType property synced from primary', () => {
      cy.origin('http://foobar.com:3500', { args: Cypress.testingType }, (theTestingType) => {
        expect(Cypress.testingType).to.deep.equal(theTestingType)
      })
    })

    it('has spec property synced from primary', () => {
      cy.origin('http://foobar.com:3500', { args: Cypress.spec }, (theSpec) => {
        expect(Cypress.spec).to.deep.equal(theSpec)
      })
    })
  })

  context('methods', () => {
    it('isCy()', () => {
      cy.origin('http://foobar.com:3500', () => {
        expect(Cypress.isCy(cy)).to.be.true
      })
    })

    it('isBrowser()', () => {
      cy.origin('http://foobar.com:3500', { args: Cypress.browser }, (theBrowser) => {
        expect(Cypress.isBrowser(theBrowser.name)).to.equal(true)
      })
    })

    // FIXME: convert to cypress-in-cypress tests once possible
    it('log()', () => {
      cy.origin('http://foobar.com:3500', () => {
        Cypress.log({
          message: 'test log',
        })
      })

      // logs in the secondary domain skip the primary driver, going through
      // the runner to the reporter, so we have to break out of the AUT and
      // test the actual command log.
      // this is a bit convoluted since otherwise the test could falsely pass
      // by finding its own log if we simply did `.contains('test log')`
      cy.wrap(Cypress.$(window.top!.document.body))
      .find('.reporter')
      .contains('.runnable-title', 'log()')
      .closest('.runnable')
      .find('.runnable-commands-region .hook-item')
      .eq(1)
      .contains('.command-number', '2')
      .closest('.command-wrapper-text')
      .contains('test log')
    })
  })

  context('not supported', () => {
    it('throws an error when a user attempts to configure Cypress.Server.defaults() inside of multi-domain', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`Cypress.Server.*` has been deprecated and use is not supported in the `cy.origin()` callback. Consider using `cy.intercept()` (outside of the callback) instead.')
        expect(err.docsUrl).to.equal('https://on.cypress.io/intercept')
        done()
      })

      cy.origin('http://foobar.com:3500', () => {
        Cypress.Server.defaults({})
      })
    })

    it('throws an error when a user attempts to configure Cypress.Cookies.preserveOnce() inside of multi-domain', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`Cypress.Cookies.preserveOnce` use is not supported in the `cy.origin()` callback. Consider using `cy.session()` (outside of the callback) instead.')
        expect(err.docsUrl).to.equal('https://on.cypress.io/session')
        done()
      })

      cy.origin('http://foobar.com:3500', () => {
        // @ts-ignore
        Cypress.Cookies.preserveOnce({})
      })
    })
  })
})
