// @ts-ignore / session support is needed for visiting about:blank between tests+
describe('multi-domain Cypress API', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  // FIXME: Commands adding/overwriting should be condensed into one test with two switchToDomain tests
  // once multiple switchToDomain calls are supported
  context('Commands', () => {
    context('add', () => {
      it('adds a custom command', () => {
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          Cypress.Commands.add('foo', () => 'bar')

          // @ts-ignore
          cy.foo().should('equal', 'bar')
        })
      })

      it('persists defined commands through spec bridge', () => {
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          cy.foo().should('equal', 'bar')
        })
      })
    })

    context('overwrite', () => {
      it('overwrites an existing command in the spec bridge', () => {
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          Cypress.Commands.overwrite('foo', () => 'baz')

          // @ts-ignore
          cy.foo().should('equal', 'baz')
        })
      })

      it('persists overwritten command through spec bridge', () => {
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          cy.foo().should('equal', 'baz')
        })
      })
    })
  })

  context('Keyboard', () => {
    it('does NOT sync defaults', () => {
      const defaults = Cypress.Keyboard.defaults({
        keystrokeDelay: 30,
      })

      cy.switchToDomain('foobar.com', [defaults], ([primaryKeyboardDefaults]) => {
        const multiDomainKeyboardDefaults = Cypress.Keyboard.defaults({})

        expect(multiDomainKeyboardDefaults).to.not.deep.equal(primaryKeyboardDefaults)
      })
    })

    // FIXME: Commands adding/overwriting should be condensed into one test with two switchToDomain tests
    // once multiple switchToDomain calls are supported
    it('allows a user to configure defaults', () => {
      cy.switchToDomain('foobar.com', () => {
        const multiDomainKeyboardDefaults = Cypress.Keyboard.defaults({
          keystrokeDelay: 60,
        })

        expect(multiDomainKeyboardDefaults).to.deep.include({
          keystrokeDelay: 60,
        })
      })
    })

    it('persists default configuration changes through spec bridge', () => {
      cy.switchToDomain('foobar.com', () => {
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

      cy.switchToDomain('foobar.com', () => {
        const multiDomainScreenshotDefaults = Cypress.Screenshot.defaults({})

        expect(multiDomainScreenshotDefaults).to.not.deep.include({
          blackout: ['foo'],
          overwrite: true,
          onBeforeScreenshot: () => undefined,
          onAfterScreenshot: () => undefined,
        })
      })
    })

    // FIXME: Commands adding/overwriting should be condensed into one test with two switchToDomain tests
    // once multiple switchToDomain calls are supported
    it('allows a user to configure defaults', () => {
      cy.switchToDomain('foobar.com', () => {
        const multiDomainScreenshotDefaults = Cypress.Screenshot.defaults({
          blackout: ['foo'],
          overwrite: true,
        })

        expect(multiDomainScreenshotDefaults).to.deep.include({
          blackout: ['foo'],
          overwrite: true,
        })
      })
    })

    it('persists default configuration changes through spec bridge', () => {
      cy.switchToDomain('foobar.com', () => {
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
      cy.switchToDomain('foobar.com', () => {
        cy.get('[data-cy="dom-check"]').then(($el) => {
          expect(Cypress.dom.isAttached($el)).to.be.true
        })
      })
    })
  })

  // TODO: Before implementing, understand how Cypress.session.* and cy.session() are supposed to function within the context of multi-domain
  context.skip('session', () => {
    it('clearAllSavedSessions() functions as expected', () => {
      cy.switchToDomain('foobar.com', () => {
        Cypress.session.clearAllSavedSessions()
      })
    })
  })

  context('properties', () => {
    it('has arch property synced from primary', () => {
      cy.switchToDomain('foobar.com', [Cypress.arch], ([theArch]) => {
        expect(Cypress.arch).to.equal(theArch)
      })
    })

    it('has browser property synced from primary', () => {
      cy.switchToDomain('foobar.com', [Cypress.browser], ([theBrowser]) => {
        expect(Cypress.browser).to.deep.equal(theBrowser)
      })
    })

    it('has currentTest property synced from primary', () => {
      cy.switchToDomain('foobar.com', [Cypress.currentTest], ([theCurrentTest]) => {
        expect(Cypress.currentTest).to.deep.equal(theCurrentTest)
      })
    })

    it('has platform property synced from primary', () => {
      cy.switchToDomain('foobar.com', [Cypress.platform], ([thePlatform]) => {
        expect(Cypress.platform).to.equal(thePlatform)
      })
    })

    it('has testingType property synced from primary', () => {
      cy.switchToDomain('foobar.com', [Cypress.testingType], ([theTestingType]) => {
        expect(Cypress.testingType).to.deep.equal(theTestingType)
      })
    })

    it('has spec property synced from primary', () => {
      cy.switchToDomain('foobar.com', [Cypress.spec], ([theSpec]) => {
        expect(Cypress.spec).to.deep.equal(theSpec)
      })
    })
  })

  context('methods', () => {
    it('isCy()', () => {
      cy.switchToDomain('foobar.com', () => {
        expect(Cypress.isCy(cy)).to.be.true
      })
    })

    it('isBrowser()', () => {
      cy.switchToDomain('foobar.com', [Cypress.browser], ([theBrowser]) => {
        expect(Cypress.isBrowser(theBrowser.name)).to.equal(true)
      })
    })

    // FIXME: convert to cypress-in-cypress tests once possible
    it('log()', () => {
      cy.switchToDomain('foobar.com', () => {
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
        expect(err.message).to.equal('`Cypress.Server.*` has been deprecated and use is not supported in `cy.switchToDomain()`. Consider using `cy.intercept()` instead.')
        done()
      })

      cy.switchToDomain('foobar.com', () => {
        Cypress.Server.defaults({})
      })
    })

    it('throws an error when a user attempts to configure Cypress.Cookies.preserveOnce() inside of multi-domain', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`Cypress.Cookies.preserveOnce` use is not supported in `cy.switchToDomain()`. Consider using `cy.session()` instead.')
        done()
      })

      cy.switchToDomain('foobar.com', () => {
        // @ts-ignore
        Cypress.Cookies.preserveOnce({})
      })
    })
  })
})
